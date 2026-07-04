import { Comparison, ModelInputs, presets, compare, recommend } from "./model";

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV med semikolon som separator (svensk Excel-standard). */
export function buildCsv(inputs: ModelInputs, c: Comparison): string {
  const rows: (string | number)[][] = [
    ["AB eller privat? – simulering", new Date().toLocaleDateString("sv-SE")],
    [],
    ["INPUT"],
    ["Årsintäkter (inkl. moms)", inputs.rental.annualRevenueInclVat],
    ["Inköp prylar per år", inputs.rental.purchasesPerYear],
    ["Månadslön anställning", inputs.personal.monthlySalary],
    ["Kommunalskatt %", inputs.personal.municipalTaxRate],
    ["Momsregistrerad", inputs.rental.vatRegistered ? "Ja" : "Nej"],
    [],
    ["PRIVAT SCENARIO"],
    ["Bruttointäkter", Math.round(c.priv.grossRevenue)],
    ["Avdragsgilla kostnader", Math.round(c.priv.deductibleCosts)],
    ["Förslitningsavdrag", Math.round(c.priv.depreciation)],
    ["Skattepliktigt överskott", Math.round(c.priv.taxableIncome)],
    ["Egenavgifter", Math.round(c.priv.egenavgifter)],
    ["Inkomstskatt", Math.round(c.priv.incomeTax)],
    ["Netto privat", Math.round(c.priv.netPrivate)],
    [],
    ["AB-SCENARIO"],
    ["Intäkter exkl. moms", Math.round(c.ab.revenueExclVat)],
    ["Utgående moms", Math.round(c.ab.outputVat)],
    ["Ingående moms", Math.round(c.ab.inputVatCosts + c.ab.inputVatPurchases)],
    ["Nettomoms", Math.round(c.ab.netVat)],
    ["Kostnader exkl. moms", Math.round(c.ab.costsExclVat)],
    ["Avskrivningar", Math.round(c.ab.depreciation)],
    ["Resultat före lön", Math.round(c.ab.resultBeforeSalary)],
    ["Lön", Math.round(c.ab.salary)],
    ["Arbetsgivaravgifter", Math.round(c.ab.employerContrib)],
    ["Bolagsskatt", Math.round(c.ab.corpTax)],
    ["Vinst efter skatt", Math.round(c.ab.profitAfterTax)],
    ["Utdelning", Math.round(c.ab.dividend)],
    ["Utdelningsskatt", Math.round(c.ab.dividendTax)],
    ["Netto privat (lön + utdelning)", Math.round(c.ab.netPrivate)],
    ["Kvar i bolaget", Math.round(c.ab.retainedInCompany)],
    [],
    ["JÄMFÖRELSE"],
    ["Skillnad utbetalt (AB − privat)", Math.round(c.diffPaidOut)],
    ["Skillnad totalt inkl. kvar i bolag", Math.round(c.diffTotal)],
    ["Momseffekt", Math.round(c.vatEffect)],
    ["Administrationskostnad", Math.round(c.adminEffect)],
    [],
    ["SCENARIER (årsintäkt; privat netto; AB netto privat; AB totalt; rekommendation)"],
    ...presets.map((pr) => {
      const pc = compare(inputs, pr.revenue);
      return [
        pr.name,
        pr.revenue,
        Math.round(pc.priv.netPrivate),
        Math.round(pc.ab.netPrivate),
        Math.round(pc.ab.netPrivate + pc.ab.retainedInCompany),
        recommend(pc),
      ];
    }),
    [],
    [
      "Detta är en simuleringsmodell. Kontrollera med redovisningskonsult eller Skatteverket innan beslut.",
    ],
  ];
  return rows.map((r) => r.map(csvEscape).join(";")).join("\n");
}

export function downloadCsv(inputs: ModelInputs, c: Comparison): void {
  // ﻿ (BOM) gör att Excel tolkar filen som UTF-8 med å/ä/ö intakta
  const blob = new Blob(["﻿" + buildCsv(inputs, c)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ab-eller-privat-simulering.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** PDF-export via webbläsarens utskriftsdialog (Spara som PDF). */
export function exportPdf(): void {
  window.print();
}
