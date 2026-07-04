import { useMemo } from "react";
import { useSim } from "../state";
import { compare, findBreakEven, recommend } from "../lib/model";
import { buildInsights } from "../lib/insights";
import { kr, krSigned, pctFmt } from "../lib/format";
import { Badge, Card, Disclaimer, SectionTitle, Stat } from "./ui";
import { BreakEvenChart, BreakEvenPoint } from "./charts";

export default function Dashboard() {
  const { inputs, result: c } = useSim();

  const breakEven = useMemo(() => findBreakEven(inputs), [inputs]);
  const sweep = useMemo<BreakEvenPoint[]>(() => {
    const max = Math.max(inputs.rental.annualRevenueInclVat * 2, 400000);
    const points: BreakEvenPoint[] = [];
    const step = Math.ceil(max / 40 / 1000) * 1000;
    for (let rev = 0; rev <= max; rev += step) {
      const pc = compare(inputs, rev);
      points.push({
        revenue: rev,
        totalt: Math.round(pc.diffTotal),
        utbetalt: Math.round(pc.diffPaidOut),
      });
    }
    return points;
  }, [inputs]);

  const rec = recommend(c);
  const insights = useMemo(() => buildInsights(inputs, c), [inputs, c]);
  const recTone =
    rec === "AB kan vara ekonomiskt motiverat"
      ? "good"
      : rec === "AB börjar bli intressant"
        ? "warn"
        : "neutral";

  return (
    <div className="space-y-4">
      {/* Hero */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Stat
            hero
            label={`Skillnad AB vs privat vid ${kr(
              inputs.rental.annualRevenueInclVat
            )} i årsintäkter`}
            value={krSigned(c.diffTotal)}
            hint="Totalt ekonomiskt värde per år: netto i fickan + vinst kvar i bolaget"
          />
          <Badge tone={recTone}>{rec}</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-hairline">
          <Stat label="Privat: netto efter skatt" value={kr(c.priv.netPrivate)} />
          <Stat
            label="AB: netto via lön + utdelning"
            value={kr(c.ab.netPrivate)}
            delta={c.diffPaidOut}
            hint="Skillnad mot privat, utbetalt"
          />
          <Stat
            label="Skillnad i procent"
            value={c.priv.netPrivate > 0 ? pctFmt(c.diffPct, 0) : "–"}
            hint="Totalt värde relativt privat netto"
          />
          <Stat
            label="Break-even för AB"
            value={breakEven != null ? kr(breakEven) : "> 1 mkr"}
            hint="Årsintäkt där AB börjar löna sig totalt"
          />
        </div>
      </Card>

      {/* Bolaget */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <SectionTitle sub="Pengar som stannar i AB efter skatt och utdelning">
            Kvar i bolaget
          </SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Kvarhållen vinst" value={kr(c.ab.retainedInCompany)} />
            <Stat
              label="Kan återinvesteras"
              value={kr(c.ab.reinvestmentCapacity)}
              hint="Kvarhållen vinst + årets avskrivningar (kassaflöde)"
            />
          </div>
        </Card>
        <Card>
          <SectionTitle sub="Två poster som ofta avgör hela kalkylen">
            Moms & administration
          </SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Stat
              label="Momseffekt netto"
              value={krSigned(c.vatEffect)}
              hint={
                c.vatEffect >= 0
                  ? "Momsavdrag på inköp överstiger utgående moms"
                  : "Utgående moms på hyran överstiger momsavdraget"
              }
            />
            <Stat
              label="Administrationskostnad"
              value={kr(c.adminEffect)}
              hint="Bokföring, bank och bolagskostnader – finns bara i AB"
            />
          </div>
        </Card>
      </div>

      {/* Break-even-graf */}
      <Card>
        <SectionTitle sub="Positivt värde = AB är bättre. Linjen korsar noll vid break-even.">
          Nettofördel AB vs privat över intäktsnivåer
        </SectionTitle>
        <BreakEvenChart
          data={sweep}
          breakEven={breakEven}
          currentRevenue={inputs.rental.annualRevenueInclVat}
        />
      </Card>

      {/* AI-insikt */}
      <Card>
        <SectionTitle>💡 AI-insikt</SectionTitle>
        <ul className="space-y-2">
          {insights.map((t, i) => (
            <li key={i} className="text-sm text-ink-2 flex gap-2">
              <span className="text-accent shrink-0">→</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Disclaimer />
    </div>
  );
}
