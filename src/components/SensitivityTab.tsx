import { useMemo } from "react";
import { useSim } from "../state";
import {
  compare,
  computeAB,
  findBreakEven,
  marginalTaxAt,
  wealthOverYears,
} from "../lib/model";
import { kr, tkr } from "../lib/format";
import { Card, Disclaimer, SectionTitle, SliderField, ToggleField } from "./ui";
import {
  BreakEvenChart,
  BreakEvenPoint,
  CashFlowChart,
  WealthChart,
} from "./charts";

/** Känslighetsanalys: dra i reglagen och se alla grafer uppdateras direkt. */
export default function SensitivityTab() {
  const { inputs, setRental, setPersonal, result: c } = useSim();
  const r = inputs.rental;
  const p = inputs.personal;

  const breakEven = useMemo(() => findBreakEven(inputs), [inputs]);
  const sweep = useMemo<BreakEvenPoint[]>(() => {
    const max = Math.max(r.annualRevenueInclVat * 2, 400000);
    const step = Math.ceil(max / 40 / 1000) * 1000;
    const pts: BreakEvenPoint[] = [];
    for (let rev = 0; rev <= max; rev += step) {
      const pc = compare(inputs, rev);
      pts.push({
        revenue: rev,
        totalt: Math.round(pc.diffTotal),
        utbetalt: Math.round(pc.diffPaidOut),
      });
    }
    return pts;
  }, [inputs, r.annualRevenueInclVat]);

  const wealth = useMemo(() => wealthOverYears(inputs, 5), [inputs]);

  const totalAdmin = r.accounting + r.bank + r.companyCosts;
  const dividendShare =
    c.ab.profitAfterTax > 0
      ? Math.round((c.ab.dividend / c.ab.profitAfterTax) * 100)
      : 0;
  const marginal = marginalTaxAt(p);

  // Utdelningsandel styrs genom att sätta önskad utdelning i kr (läge Egen mix)
  const setDividendShare = (sharePct: number) => {
    const profit = computeAB(inputs).profitAfterTax;
    setPersonal({
      payoutStrategy: "mix",
      desiredDividend: Math.max(0, Math.round(profit * (sharePct / 100))),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle sub="Reglagen ändrar samma värden som fliken Mina siffror – allt räknas om direkt">
          Dra och testa
        </SectionTitle>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          <SliderField
            label="Uthyrningsintäkter per år"
            value={r.annualRevenueInclVat}
            min={0}
            max={600000}
            step={5000}
            format={kr}
            onChange={(v) => setRental({ annualRevenueInclVat: v })}
          />
          <SliderField
            label="Inköp av prylar per år"
            value={r.purchasesPerYear}
            min={0}
            max={200000}
            step={1000}
            format={kr}
            onChange={(v) => setRental({ purchasesPerYear: v })}
          />
          <SliderField
            label="Administrationskostnad (bokföring m.m.)"
            value={totalAdmin}
            min={0}
            max={30000}
            step={500}
            format={kr}
            onChange={(v) =>
              setRental({
                accounting: Math.max(0, v - r.bank - r.companyCosts),
              })
            }
          />
          <SliderField
            label="Marginalskatt på extra inkomst"
            value={Math.round(marginal * 10) / 10}
            min={25}
            max={60}
            step={0.5}
            format={(v) => `${v.toLocaleString("sv-SE")} %`}
            onChange={(v) => setPersonal({ marginalTaxOverride: v })}
          />
          <SliderField
            label="Andel av vinsten som delas ut"
            value={dividendShare}
            min={0}
            max={100}
            step={5}
            format={(v) => `${v} %`}
            onChange={setDividendShare}
          />
          <SliderField
            label="Andel av vinsten som återinvesteras"
            value={100 - dividendShare}
            min={0}
            max={100}
            step={5}
            format={(v) => `${v} %`}
            onChange={(v) => setDividendShare(100 - v)}
          />
          <SliderField
            label="Antal prylar"
            value={r.numItems}
            min={0}
            max={100}
            step={1}
            format={(v) => `${v} st`}
            onChange={(v) =>
              setRental({
                numItems: v,
                annualRevenueInclVat: Math.round(v * r.avgRevenuePerItem),
              })
            }
          />
          <SliderField
            label="Genomsnittlig intäkt per pryl"
            value={r.avgRevenuePerItem}
            min={0}
            max={20000}
            step={250}
            format={kr}
            onChange={(v) =>
              setRental({
                avgRevenuePerItem: v,
                annualRevenueInclVat: Math.round(r.numItems * v),
              })
            }
          />
        </div>
        <div className="mt-5 pt-4 border-t border-hairline max-w-md">
          <ToggleField
            label="Momsplikt i AB"
            hint="Testa effekten av att vara momsregistrerad eller inte"
            checked={r.vatRegistered}
            onChange={(v) => setRental({ vatRegistered: v })}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle sub="Positivt värde = AB är bättre. Linjen korsar noll vid break-even.">
          Nettofördel AB vs privat över intäktsnivåer
        </SectionTitle>
        <BreakEvenChart
          data={sweep}
          breakEven={breakEven}
          currentRevenue={r.annualRevenueInclVat}
        />
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle sub="Vad varje scenario ger per år vid nuvarande intäktsnivå">
            Kassaflöde per år
          </SectionTitle>
          <CashFlowChart
            data={[
              {
                name: "Privat",
                fickan: Math.round(c.priv.netPrivate),
                bolaget: 0,
              },
              {
                name: "Aktiebolag",
                fickan: Math.round(c.ab.netPrivate),
                bolaget: Math.round(c.ab.retainedInCompany),
              },
            ]}
          />
        </Card>
        <Card>
          <SectionTitle sub="Ackumulerat efter 1, 3 och 5 år med oförändrade siffror">
            Förmögenhet över tid
          </SectionTitle>
          <WealthChart data={wealth} />
          <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            {[1, 3, 5].map((y) => {
              const w = wealth[y];
              const diff = w.abTotal - w.privat;
              return (
                <div key={y} className="rounded-lg bg-plane px-2 py-2">
                  <div className="text-xs text-ink-3">Efter {y} år</div>
                  <div
                    className={`text-sm font-semibold tnum ${
                      diff >= 0 ? "text-good" : "text-crit"
                    }`}
                  >
                    {diff >= 0 ? "+" : "−"}
                    {tkr(Math.abs(diff))}
                  </div>
                  <div className="text-xs text-ink-3">AB vs privat</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Disclaimer />
    </div>
  );
}
