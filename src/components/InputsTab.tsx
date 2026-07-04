import { useSim } from "../state";
import { marginalTaxAt, PayoutStrategy } from "../lib/model";
import { pctFmt } from "../lib/format";
import { Card, NumberField, SectionTitle, ToggleField } from "./ui";

const strategies: { id: PayoutStrategy; label: string; hint: string }[] = [
  { id: "salary", label: "Lön", hint: "Ta ut så mycket som möjligt som lön" },
  {
    id: "dividend",
    label: "Utdelning",
    hint: "Ingen lön, dela ut hela vinsten",
  },
  { id: "retain", label: "Behåll i bolaget", hint: "Ingen lön, ingen utdelning" },
  { id: "mix", label: "Egen mix", hint: "Använd beloppen du anger nedan" },
];

export default function InputsTab() {
  const { inputs, setPersonal, setRental, setAssumptions, resetInputs } =
    useSim();
  const p = inputs.personal;
  const r = inputs.rental;
  const a = inputs.assumptions;
  const autoMarginal = marginalTaxAt({ ...p, marginalTaxOverride: null });

  return (
    <div className="space-y-4">
      {/* Min ekonomi */}
      <Card>
        <SectionTitle sub="Din befintliga anställning och skattesituation">
          Min ekonomi
        </SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberField
            label="Månadslön från anställning"
            value={p.monthlySalary}
            onChange={(v) => setPersonal({ monthlySalary: v })}
            suffix="kr/mån"
            step={1000}
          />
          <NumberField
            label="Kommunalskatt"
            value={p.municipalTaxRate}
            onChange={(v) => setPersonal({ municipalTaxRate: v })}
            suffix="%"
            step={0.1}
          />
          <NumberField
            label="Brytpunkt statlig skatt (årslön)"
            value={p.stateTaxThresholdYear}
            onChange={(v) => setPersonal({ stateTaxThresholdYear: v })}
            suffix="kr/år"
            step={1000}
            hint="Redigerbart antagande, 643 100 kr för 2025"
          />
          <NumberField
            label="Statlig inkomstskatt"
            value={p.stateTaxRate}
            onChange={(v) => setPersonal({ stateTaxRate: v })}
            suffix="%"
            step={1}
          />
          <NumberField
            label="Marginalskatt på extra inkomst"
            value={p.marginalTaxOverride ?? autoMarginal}
            onChange={(v) => setPersonal({ marginalTaxOverride: v })}
            suffix="%"
            step={0.5}
            hint={
              p.marginalTaxOverride == null
                ? `Beräknas automatiskt till ${pctFmt(autoMarginal)} – skriv för att låsa`
                : "Manuellt värde – klicka Återställ auto nedan"
            }
          />
          {p.marginalTaxOverride != null && (
            <div className="flex items-end">
              <button
                className="text-sm text-accent underline underline-offset-2"
                onClick={() => setPersonal({ marginalTaxOverride: null })}
              >
                Återställ automatisk marginalskatt
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Uttag från AB */}
      <Card>
        <SectionTitle sub="Hur du vill ta ut pengar ur aktiebolaget">
          Uttag från AB
        </SectionTitle>
        <div
          className="flex flex-wrap gap-2 mb-4"
          role="radiogroup"
          aria-label="Uttagsstrategi"
        >
          {strategies.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={p.payoutStrategy === s.id}
              title={s.hint}
              onClick={() => setPersonal({ payoutStrategy: s.id })}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                p.payoutStrategy === s.id
                  ? "border-accent bg-accent text-white"
                  : "border-hairline text-ink-2 hover:border-accent/50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-3 mb-4">
          {strategies.find((s) => s.id === p.payoutStrategy)?.hint}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberField
            label="Önskad egen lön från AB"
            value={p.desiredSalaryFromAB}
            onChange={(v) => setPersonal({ desiredSalaryFromAB: v })}
            suffix="kr/år"
            step={1000}
            hint={p.payoutStrategy !== "mix" ? "Används i läget Egen mix" : undefined}
          />
          <NumberField
            label="Önskad utdelning från AB"
            value={p.desiredDividend}
            onChange={(v) => setPersonal({ desiredDividend: v })}
            suffix="kr/år"
            step={1000}
            hint={p.payoutStrategy !== "mix" ? "Används i läget Egen mix" : undefined}
          />
          <NumberField
            label="Ägarandel i AB"
            value={p.ownershipSharePct}
            onChange={(v) => setPersonal({ ownershipSharePct: v })}
            suffix="%"
            step={1}
          />
          <NumberField
            label="Gränsbelopp enligt förenklingsregeln"
            value={p.simplificationAmount}
            onChange={(v) => setPersonal({ simplificationAmount: v })}
            suffix="kr/år"
            step={1000}
            hint="209 550 kr för 2025 (2,75 IBB), fördelas på ägarandel"
          />
          <NumberField
            label="Sparat utdelningsutrymme"
            value={p.savedDividendAllowance}
            onChange={(v) => setPersonal({ savedDividendAllowance: v })}
            suffix="kr"
            step={1000}
          />
        </div>
      </Card>

      {/* Uthyrningsverksamheten */}
      <Card>
        <SectionTitle sub="Intäkter och kostnader för prylarna (belopp inkl. moms)">
          Uthyrningsverksamheten
        </SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberField
            label="Årliga uthyrningsintäkter"
            value={r.annualRevenueInclVat}
            onChange={(v) => setRental({ annualRevenueInclVat: v })}
            suffix="kr/år"
            step={1000}
            hint={`≈ ${Math.round(r.annualRevenueInclVat / 12).toLocaleString(
              "sv-SE"
            )} kr/mån`}
          />
          <NumberField
            label="Plattformsavgift (Hygglo m.fl.)"
            value={r.platformFeePct}
            onChange={(v) => setRental({ platformFeePct: v })}
            suffix="%"
            step={1}
          />
          <NumberField
            label="Reparationer"
            value={r.repairs}
            onChange={(v) => setRental({ repairs: v })}
            suffix="kr/år"
          />
          <NumberField
            label="Förvaring"
            value={r.storage}
            onChange={(v) => setRental({ storage: v })}
            suffix="kr/år"
          />
          <NumberField
            label="Transport"
            value={r.transport}
            onChange={(v) => setRental({ transport: v })}
            suffix="kr/år"
          />
          <NumberField
            label="Försäkring"
            value={r.insurance}
            onChange={(v) => setRental({ insurance: v })}
            suffix="kr/år"
            hint="Momsfri kostnad"
          />
          <NumberField
            label="Övriga fasta kostnader"
            value={r.otherFixed}
            onChange={(v) => setRental({ otherFixed: v })}
            suffix="kr/år"
          />
          <NumberField
            label="Övriga rörliga kostnader"
            value={r.otherVariablePct}
            onChange={(v) => setRental({ otherVariablePct: v })}
            suffix="% av intäkt"
            step={1}
          />
        </div>
      </Card>

      {/* Endast AB */}
      <Card>
        <SectionTitle sub="Kostnader som bara finns i AB-scenariot">
          Administration (endast AB)
        </SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberField
            label="Bokföring/redovisning"
            value={r.accounting}
            onChange={(v) => setRental({ accounting: v })}
            suffix="kr/år"
          />
          <NumberField
            label="Företagskonto/bank"
            value={r.bank}
            onChange={(v) => setRental({ bank: v })}
            suffix="kr/år"
            hint="Momsfri kostnad"
          />
          <NumberField
            label="Övriga bolagskostnader"
            value={r.companyCosts}
            onChange={(v) => setRental({ companyCosts: v })}
            suffix="kr/år"
            hint="T.ex. årsredovisning, deklaration, avgifter"
          />
        </div>
      </Card>

      {/* Inköp & avskrivning */}
      <Card>
        <SectionTitle sub="Investeringar i nya prylar och hur de skrivs av">
          Inköp & avskrivning
        </SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberField
            label="Inköp av nya prylar per år"
            value={r.purchasesPerYear}
            onChange={(v) => setRental({ purchasesPerYear: v })}
            suffix="kr/år"
            step={500}
          />
          <NumberField
            label="Andel inköp med avdragsgill moms"
            value={r.purchasesVatDeductiblePct}
            onChange={(v) => setRental({ purchasesVatDeductiblePct: v })}
            suffix="%"
            step={5}
            hint="Begagnat från privatperson saknar avdragsgill moms"
          />
          <NumberField
            label="Avskrivningstid per pryl"
            value={r.depreciationYears}
            onChange={(v) => setRental({ depreciationYears: v })}
            suffix="år"
            step={1}
            min={1}
          />
          <NumberField
            label="Restvärde/försäljningsvärde"
            value={r.residualValuePct}
            onChange={(v) => setRental({ residualValuePct: v })}
            suffix="%"
            step={5}
          />
          <NumberField
            label="Antal prylar"
            value={r.numItems}
            onChange={(v) =>
              setRental({
                numItems: v,
                annualRevenueInclVat: Math.round(v * r.avgRevenuePerItem),
              })
            }
            suffix="st"
            step={1}
            min={0}
          />
          <NumberField
            label="Genomsnittlig intäkt per pryl"
            value={r.avgRevenuePerItem}
            onChange={(v) =>
              setRental({
                avgRevenuePerItem: v,
                annualRevenueInclVat: Math.round(r.numItems * v),
              })
            }
            suffix="kr/år"
            step={100}
            hint="Antal × intäkt/pryl uppdaterar årsintäkten"
          />
        </div>
        <div className="mt-4 space-y-3">
          <ToggleField
            label="Momsregistrerat AB"
            hint="Under 120 000 kr i omsättning är momsregistrering frivillig"
            checked={r.vatRegistered}
            onChange={(v) => setRental({ vatRegistered: v })}
          />
          <ToggleField
            label="Skala inköp med intäkterna i scenarier"
            hint="När intäkter sveps i grafer/scenarier växer inköpen proportionellt"
            checked={r.scalePurchasesWithRevenue}
            onChange={(v) => setRental({ scalePurchasesWithRevenue: v })}
          />
        </div>
      </Card>

      {/* Antaganden */}
      <Card>
        <SectionTitle sub="Skattesatser – redigerbara antaganden (2025 års nivåer)">
          Antaganden
        </SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberField
            label="Moms"
            value={a.vatRate}
            onChange={(v) => setAssumptions({ vatRate: v })}
            suffix="%"
            step={1}
          />
          <NumberField
            label="Bolagsskatt"
            value={a.corpTaxRate}
            onChange={(v) => setAssumptions({ corpTaxRate: v })}
            suffix="%"
            step={0.1}
          />
          <NumberField
            label="Arbetsgivaravgifter"
            value={a.employerContribRate}
            onChange={(v) => setAssumptions({ employerContribRate: v })}
            suffix="%"
            step={0.01}
          />
          <NumberField
            label="Utdelningsskatt (inom gränsbelopp)"
            value={a.dividendTaxRate}
            onChange={(v) => setAssumptions({ dividendTaxRate: v })}
            suffix="%"
            step={1}
          />
          <NumberField
            label="Egenavgifter (hobby)"
            value={a.egenavgifterRate}
            onChange={(v) => setAssumptions({ egenavgifterRate: v })}
            suffix="%"
            step={0.01}
          />
          <NumberField
            label="Schablonavdrag egenavgifter"
            value={a.hobbySchablonAvdragPct}
            onChange={(v) => setAssumptions({ hobbySchablonAvdragPct: v })}
            suffix="%"
            step={1}
          />
        </div>
        <div className="mt-4">
          <ToggleField
            label="Räkna egenavgifter på hobbyöverskott"
            hint="Gäller när överskottet överstiger 1 000 kr/år"
            checked={a.includeEgenavgifter}
            onChange={(v) => setAssumptions({ includeEgenavgifter: v })}
          />
        </div>
        <div className="mt-5 pt-4 border-t border-hairline">
          <button
            className="text-sm text-crit underline underline-offset-2"
            onClick={() => {
              if (confirm("Återställ alla fält till standardvärden?"))
                resetInputs();
            }}
          >
            Återställ allt till standardvärden
          </button>
        </div>
      </Card>
    </div>
  );
}
