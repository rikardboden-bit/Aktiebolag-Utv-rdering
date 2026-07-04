import { useMemo } from "react";
import { useSim } from "../state";
import {
  ModelInputs,
  compare,
  computeAB,
  findBreakEven,
} from "../lib/model";
import { kr, krSigned } from "../lib/format";
import { Card, Disclaimer, SectionTitle } from "./ui";

/** Hur mycket admin (bokföring m.m.) kan kosta innan AB-fördelen är uppäten. */
function findAdminCeiling(inputs: ModelInputs): number | null {
  const base = compare(inputs);
  if (base.diffTotal <= 0) return null; // AB lönar sig inte ens nu
  for (let admin = 0; admin <= 100000; admin += 500) {
    const test: ModelInputs = {
      ...inputs,
      rental: { ...inputs.rental, accounting: admin, bank: 0, companyCosts: 0 },
    };
    if (compare(test).diffTotal <= 0) return admin;
  }
  return null;
}

interface Driver {
  label: string;
  value: number;
  explain: string;
}

export default function ConclusionTab() {
  const { inputs, result: c } = useSim();
  const { ab, priv } = c;
  const a = inputs.assumptions;

  const breakEven = useMemo(() => findBreakEven(inputs), [inputs]);
  const adminCeiling = useMemo(() => findAdminCeiling(inputs), [inputs]);

  // Varifrån kommer AB-fördelen?
  const drivers = useMemo<Driver[]>(() => {
    const list: Driver[] = [
      {
        label: "Momsavdrag",
        value: c.vatEffect,
        explain:
          "Nettoeffekten av momsregistrering: momsavdrag på inköp och kostnader minus utgående moms på hyran.",
      },
      {
        label: "Lägre skatt på utdelning",
        value:
          ab.dividendWithinAllowance *
          ((priv.marginalTaxRate + (a.includeEgenavgifter ? 10 : 0) -
            a.dividendTaxRate) /
            100),
        explain: `Utdelning inom gränsbeloppet beskattas med ${a.dividendTaxRate} % i stället för din marginalskatt på cirka ${Math.round(
          priv.marginalTaxRate
        )} %.`,
      },
      {
        label: "Återinvestering / kvarhållen vinst",
        value: ab.retainedInCompany,
        explain:
          "Vinst som stannar i bolaget har bara betalat 20,6 % bolagsskatt – jämfört med drygt 50 % om samma pengar tagits ut privat.",
      },
      {
        label: "Administrationskostnad",
        value: -c.adminEffect,
        explain:
          "Bokföring, bank och bolagskostnader finns bara i AB-scenariot och drar ner fördelen.",
      },
    ];
    return list.sort((x, y) => y.value - x.value);
  }, [c, ab, priv, a]);

  // Bästa uttagsstrategi vid nuvarande siffror
  const strategies = useMemo(() => {
    const mk = (label: string, salary: number, divShare: number) => {
      const res = computeAB(inputs, {
        salaryOverride: salary,
        dividendShareOverride: divShare,
      });
      return {
        label,
        net: res.netPrivate,
        retained: res.retainedInCompany,
        total: res.netPrivate + res.retainedInCompany,
      };
    };
    return [
      mk("Allt som lön", Number.MAX_SAFE_INTEGER, 0),
      mk("Allt som utdelning", 0, 1),
      mk("Behåll allt i bolaget", 0, 0),
    ].sort((x, y) => y.total - x.total);
  }, [inputs]);

  // Vilka antaganden driver resultatet mest? (±20 % på varje)
  const sensitivity = useMemo(() => {
    const test = (label: string, mutate: (m: ModelInputs, f: number) => ModelInputs) => {
      const hi = compare(mutate(structuredClone(inputs), 1.2)).diffTotal;
      const lo = compare(mutate(structuredClone(inputs), 0.8)).diffTotal;
      return { label, swing: Math.abs(hi - lo) };
    };
    return [
      test("Uthyrningsintäkter", (m, f) => {
        m.rental.annualRevenueInclVat *= f;
        return m;
      }),
      test("Inköp av prylar", (m, f) => {
        m.rental.purchasesPerYear *= f;
        return m;
      }),
      test("Administrationskostnad", (m, f) => {
        m.rental.accounting *= f;
        m.rental.bank *= f;
        m.rental.companyCosts *= f;
        return m;
      }),
      test("Marginalskatt", (m, f) => {
        m.personal.marginalTaxOverride =
          (m.personal.marginalTaxOverride ?? priv.marginalTaxRate) * f;
        return m;
      }),
      test("Plattformsavgift", (m, f) => {
        m.rental.platformFeePct *= f;
        return m;
      }),
      test("Egenavgifter (hobby)", (m, f) => {
        m.assumptions.egenavgifterRate *= f;
        return m;
      }),
    ].sort((x, y) => y.swing - x.swing);
  }, [inputs, priv.marginalTaxRate]);

  const maxSwing = Math.max(...sensitivity.map((s) => s.swing), 1);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Slutsats</SectionTitle>
        <div className="space-y-3 text-sm text-ink-2">
          <p>
            <span className="font-semibold text-ink">Break-even: </span>
            {breakEven != null
              ? `AB börjar löna sig totalt vid cirka ${kr(
                  breakEven
                )} i årsintäkter med dina antaganden.`
              : "AB når inte break-even under 1 mkr i årsintäkter med dina antaganden – privat är enklare och bättre i hela intervallet."}
            {breakEven != null &&
              (inputs.rental.annualRevenueInclVat >= breakEven
                ? " Du ligger över den nivån."
                : ` Du ligger i dag på ${kr(
                    inputs.rental.annualRevenueInclVat
                  )}, alltså under.`)}
          </p>
          {adminCeiling != null && (
            <p>
              <span className="font-semibold text-ink">
                Administrationens tak:{" "}
              </span>
              Vid nuvarande intäktsnivå äter administrationen upp hela
              AB-fördelen om den överstiger cirka {kr(adminCeiling)}/år (du har
              angett{" "}
              {kr(
                inputs.rental.accounting +
                  inputs.rental.bank +
                  inputs.rental.companyCosts
              )}
              ).
            </p>
          )}
          <p>
            <span className="font-semibold text-ink">Bästa uttag: </span>
            {strategies[0].label === "Behåll allt i bolaget"
              ? "Att behålla pengarna i bolaget ger störst totalt värde – men kom ihåg att de fortfarande är beskattade en gång till när de tas ut."
              : strategies[0].label === "Allt som utdelning"
                ? "Utdelning inom gränsbeloppet är det billigaste sättet att få ut pengarna privat med din höga marginalskatt."
                : "Lön är bäst här – ovanligt med hög befintlig lön, kontrollera antagandena."}
          </p>
        </div>
      </Card>

      <Card>
        <SectionTitle sub="Var kommer AB-fördelen (eller nackdelen) ifrån per år?">
          Vad driver resultatet
        </SectionTitle>
        <ul className="space-y-3">
          {drivers.map((d) => (
            <li key={d.label} className="text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-medium text-ink">{d.label}</span>
                <span
                  className={`tnum font-semibold ${
                    d.value >= 0 ? "text-good" : "text-crit"
                  }`}
                >
                  {krSigned(d.value)}
                </span>
              </div>
              <p className="text-xs text-ink-3 mt-0.5">{d.explain}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Card>
          <SectionTitle sub="Samma bolagsresultat, tre sätt att använda vinsten">
            Lön, utdelning eller behålla?
          </SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[380px]">
              <thead>
                <tr className="text-left text-ink-3 border-b border-hairline">
                  <th className="py-2 pr-3 font-medium">Strategi</th>
                  <th className="py-2 px-3 font-medium text-right">I fickan</th>
                  <th className="py-2 px-3 font-medium text-right">I bolaget</th>
                  <th className="py-2 pl-3 font-medium text-right">Totalt</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {strategies.map((s, i) => (
                  <tr key={s.label} className="border-b border-hairline">
                    <td className="py-2 pr-3 text-ink font-medium">
                      {i === 0 && <span className="text-good mr-1">★</span>}
                      {s.label}
                    </td>
                    <td className="py-2 px-3 text-right text-ink-2">
                      {kr(s.net)}
                    </td>
                    <td className="py-2 px-3 text-right text-ink-2">
                      {kr(s.retained)}
                    </td>
                    <td className="py-2 pl-3 text-right font-semibold text-ink">
                      {kr(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-3 mt-2">
            "Totalt" väger kvarhållen vinst lika högt som utbetalda pengar –
            justera efter hur mycket du faktiskt behöver ta ut.
          </p>
        </Card>

        <Card>
          <SectionTitle sub="Hur mycket slutresultatet svänger när varje antagande ändras ±20 %">
            Antaganden som driver resultatet mest
          </SectionTitle>
          <ul className="space-y-2.5">
            {sensitivity.map((s) => (
              <li key={s.label} className="text-sm">
                <div className="flex justify-between gap-3 mb-1">
                  <span className="text-ink">{s.label}</span>
                  <span className="tnum text-ink-2">±{kr(s.swing / 2)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-grid overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(s.swing / maxSwing) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Disclaimer />
    </div>
  );
}
