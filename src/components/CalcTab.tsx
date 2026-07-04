import { useSim } from "../state";
import { kr, pctFmt } from "../lib/format";
import { CalcRow, Card, Disclaimer, SectionTitle } from "./ui";

/** Detaljerade beräkningskedjor för båda scenarierna – hela modellen synlig. */
export default function CalcTab() {
  const { inputs, result: c } = useSim();
  const { priv, ab } = c;
  const a = inputs.assumptions;

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Privat */}
        <Card>
          <SectionTitle sub="Beskattas som inkomst av tjänst (hobbyverksamhet)">
            Privat scenario
          </SectionTitle>
          <CalcRow label="Bruttointäkter" value={priv.grossRevenue} />
          <CalcRow
            label="− Avdragsgilla kostnader"
            value={-priv.deductibleCosts}
            signed
          />
          <CalcRow
            label="− Förslitningsavdrag (avskrivning prylar)"
            value={-priv.depreciation}
            signed
          />
          <CalcRow label="Överskott" value={priv.surplus} strong />
          {a.includeEgenavgifter && (
            <>
              <CalcRow
                label={`− Schablonavdrag egenavgifter (${pctFmt(
                  a.hobbySchablonAvdragPct,
                  0
                )})`}
                value={-priv.schablonAvdrag}
                signed
                indent
              />
              <CalcRow
                label="Skattepliktigt överskott"
                value={priv.taxableIncome}
                strong
              />
              <CalcRow
                label={`− Egenavgifter (${pctFmt(a.egenavgifterRate)})`}
                value={-priv.egenavgifter}
                signed
                indent
              />
            </>
          )}
          <CalcRow
            label={`− Inkomstskatt (marginalskatt ${pctFmt(
              priv.marginalTaxRate
            )})`}
            value={-priv.incomeTax}
            signed
            indent
          />
          <CalcRow label="Netto kvar privat" value={priv.netPrivate} strong />
          <div className="mt-3 space-y-2">
            <p className="text-xs text-ink-3">
              Med {kr(inputs.personal.monthlySalary * 12)} i årslön ligger du{" "}
              {inputs.personal.monthlySalary * 12 >
              inputs.personal.stateTaxThresholdYear
                ? "över"
                : "under"}{" "}
              brytpunkten för statlig skatt – varje extra intjänad krona
              beskattas med cirka {pctFmt(priv.marginalTaxRate)}.
            </p>
            {priv.crossesStateTax && (
              <p className="text-xs text-warn">
                ⚠️ Extrainkomsten gör att du passerar brytpunkten för statlig
                skatt.
              </p>
            )}
            <p className="text-xs text-warn">
              ⚠️ Exakt klassificering (hobby, tjänst eller näringsverksamhet)
              beror på Skatteverkets bedömning av bl.a. vinstsyfte och
              varaktighet.
            </p>
          </div>
        </Card>

        {/* AB */}
        <Card>
          <SectionTitle sub="Momsregistrerat aktiebolag, bolagsskatt och 3:12-utdelning">
            Aktiebolagsscenario
          </SectionTitle>
          <CalcRow label="Intäkter exkl. moms" value={ab.revenueExclVat} />
          <CalcRow label="− Kostnader exkl. moms" value={-ab.costsExclVat} signed />
          <CalcRow
            label="− Avskrivningar på prylar"
            value={-ab.depreciation}
            signed
          />
          <CalcRow label="Resultat före lön" value={ab.resultBeforeSalary} strong />
          <CalcRow label="− Lön till dig" value={-ab.salary} signed indent />
          <CalcRow
            label={`− Arbetsgivaravgifter (${pctFmt(a.employerContribRate)})`}
            value={-ab.employerContrib}
            signed
            indent
          />
          <CalcRow label="Resultat efter lön" value={ab.resultAfterSalary} strong />
          <CalcRow
            label={`− Bolagsskatt (${pctFmt(a.corpTaxRate)})`}
            value={-ab.corpTax}
            signed
            indent
          />
          <CalcRow label="Vinst efter skatt" value={ab.profitAfterTax} strong />
          <CalcRow label="− Utdelning" value={-ab.dividend} signed indent />
          <CalcRow
            label="Kvar i bolaget"
            value={ab.retainedInCompany}
            strong
          />

          <div className="mt-4 pt-3 border-t border-hairline">
            <h3 className="text-sm font-semibold text-ink mb-1">Moms</h3>
            <CalcRow label="Utgående moms på hyra" value={ab.outputVat} />
            <CalcRow
              label="− Ingående moms på kostnader"
              value={-ab.inputVatCosts}
              signed
            />
            <CalcRow
              label="− Ingående moms på inköp av prylar"
              value={-ab.inputVatPurchases}
              signed
            />
            <CalcRow
              label={
                ab.netVat >= 0 ? "Nettomoms att betala" : "Nettomoms att få tillbaka"
              }
              value={Math.abs(ab.netVat)}
              strong
            />
          </div>

          <div className="mt-4 pt-3 border-t border-hairline">
            <h3 className="text-sm font-semibold text-ink mb-1">
              Till dig privat
            </h3>
            <CalcRow
              label={`Lön efter skatt (${pctFmt(ab.marginalTaxRate)})`}
              value={ab.netSalary}
            />
            <CalcRow
              label={`Utdelning inom gränsbelopp (${kr(ab.gransbelopp)})`}
              value={ab.dividendWithinAllowance}
            />
            {ab.dividendExcess > 0 && (
              <CalcRow
                label="Utdelning över gränsbelopp (beskattas som tjänst)"
                value={ab.dividendExcess}
                indent
              />
            )}
            <CalcRow label="− Utdelningsskatt" value={-ab.dividendTax} signed />
            <CalcRow
              label="Netto privat: lön + utdelning"
              value={ab.netPrivate}
              strong
            />
            <CalcRow
              label="Återinvesteringskapacitet i bolaget"
              value={ab.reinvestmentCapacity}
            />
          </div>
        </Card>
      </div>
      <Disclaimer />
    </div>
  );
}
