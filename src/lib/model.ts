/**
 * Beräkningsmodell: Privat (hobby/tjänst) vs Aktiebolag för uthyrningsverksamhet.
 *
 * Modellen är avsiktligt transparent: varje steg exponeras som ett eget fält
 * så att UI:t kan visa hela kedjan. Alla skattesatser är redigerbara antaganden.
 *
 * OBS! Detta är en simuleringsmodell – ingen juridisk eller skattemässig rådgivning.
 */

// ---------- Input-typer ----------

export interface Assumptions {
  vatRate: number; // moms, % (25)
  corpTaxRate: number; // bolagsskatt, % (20.6)
  employerContribRate: number; // arbetsgivaravgifter, % (31.42)
  dividendTaxRate: number; // utdelningsskatt inom gränsbelopp, % (20)
  egenavgifterRate: number; // egenavgifter på hobbyöverskott, % (28.97)
  hobbySchablonAvdragPct: number; // schablonavdrag för egenavgifter, % (25)
  includeEgenavgifter: boolean; // om egenavgifter ska räknas på hobbyöverskott
}

export type PayoutStrategy = "salary" | "dividend" | "retain" | "mix";

export interface PersonalInputs {
  monthlySalary: number; // bruttolön från anställning, kr/mån
  municipalTaxRate: number; // kommunalskatt, %
  stateTaxThresholdYear: number; // brytpunkt för statlig skatt, kr/år (årslön)
  stateTaxRate: number; // statlig inkomstskatt, %
  marginalTaxOverride: number | null; // manuell marginalskatt, % (null = auto)
  desiredSalaryFromAB: number; // önskad egen lön från AB, kr/år (brutto)
  desiredDividend: number; // önskad utdelning, kr/år
  ownershipSharePct: number; // ägarandel i AB, %
  savedDividendAllowance: number; // sparat utdelningsutrymme, kr
  simplificationAmount: number; // gränsbelopp enligt förenklingsregeln, kr/år
  payoutStrategy: PayoutStrategy;
}

export interface RentalInputs {
  annualRevenueInclVat: number; // årliga uthyrningsintäkter inkl. moms, kr
  platformFeePct: number; // plattformsprovision, % av intäkt
  repairs: number; // kr/år (inkl. moms)
  storage: number; // förvaring, kr/år
  transport: number; // kr/år
  insurance: number; // försäkring, kr/år (momsfri)
  accounting: number; // bokföring/redovisning, kr/år – endast AB
  bank: number; // företagskonto, kr/år (momsfri) – endast AB
  companyCosts: number; // övriga bolagskostnader, kr/år – endast AB
  otherFixed: number; // övriga fasta kostnader, kr/år
  otherVariablePct: number; // övriga rörliga kostnader, % av intäkt
  purchasesPerYear: number; // inköp nya prylar, kr/år (inkl. moms)
  purchasesVatDeductiblePct: number; // andel av inköp med avdragsgill moms, %
  depreciationYears: number; // avskrivningstid per pryl, år
  residualValuePct: number; // restvärde vid avskrivningstidens slut, %
  vatRegistered: boolean; // momsplikt i AB (frivillig under 120 000 kr)
  scalePurchasesWithRevenue: boolean; // skala inköp när intäkter sveps i scenarier
  numItems: number; // antal prylar (för känslighetsanalys)
  avgRevenuePerItem: number; // genomsnittlig intäkt per pryl, kr/år
}

export interface ModelInputs {
  personal: PersonalInputs;
  rental: RentalInputs;
  assumptions: Assumptions;
}

// ---------- Standardvärden (2025 års nivåer, redigerbara) ----------

export const defaultInputs: ModelInputs = {
  personal: {
    monthlySalary: 58000,
    municipalTaxRate: 32.4,
    stateTaxThresholdYear: 643100,
    stateTaxRate: 20,
    marginalTaxOverride: null,
    desiredSalaryFromAB: 0,
    desiredDividend: 20000,
    ownershipSharePct: 100,
    savedDividendAllowance: 0,
    simplificationAmount: 209550,
    payoutStrategy: "dividend",
  },
  rental: {
    annualRevenueInclVat: 21000,
    platformFeePct: 20,
    repairs: 1500,
    storage: 0,
    transport: 1000,
    insurance: 1000,
    accounting: 6000,
    bank: 1500,
    companyCosts: 1500,
    otherFixed: 0,
    otherVariablePct: 0,
    purchasesPerYear: 8000,
    purchasesVatDeductiblePct: 100,
    depreciationYears: 5,
    residualValuePct: 10,
    vatRegistered: true,
    scalePurchasesWithRevenue: true,
    numItems: 8,
    avgRevenuePerItem: 2625,
  },
  assumptions: {
    vatRate: 25,
    corpTaxRate: 20.6,
    employerContribRate: 31.42,
    dividendTaxRate: 20,
    egenavgifterRate: 28.97,
    hobbySchablonAvdragPct: 25,
    includeEgenavgifter: true,
  },
};

// ---------- Resultattyper ----------

export interface PrivateResult {
  grossRevenue: number;
  deductibleCosts: number;
  depreciation: number;
  surplus: number; // skattepliktigt överskott före egenavgifter
  schablonAvdrag: number;
  taxableIncome: number;
  egenavgifter: number;
  marginalTaxRate: number; // %
  incomeTax: number;
  totalTax: number;
  netPrivate: number; // kvar i fickan
  crossesStateTax: boolean;
}

export interface ABResult {
  revenueExclVat: number;
  outputVat: number;
  inputVatCosts: number;
  inputVatPurchases: number;
  netVat: number; // att betala (+) / få tillbaka (-)
  costsExclVat: number;
  adminCosts: number; // bokföring + bank + bolagskostnader (exkl. moms)
  purchasesExclVat: number;
  depreciation: number;
  resultBeforeSalary: number;
  desiredSalary: number;
  salary: number; // faktisk lön (kan begränsas av resultatet)
  employerContrib: number;
  resultAfterSalary: number;
  corpTax: number;
  profitAfterTax: number;
  gransbelopp: number;
  dividend: number;
  dividendWithinAllowance: number;
  dividendExcess: number;
  dividendTax: number;
  netSalary: number;
  netDividend: number;
  netPrivate: number; // netto privat: lön + utdelning efter skatt
  retainedInCompany: number; // kvar i bolaget efter skatt & utdelning
  reinvestmentCapacity: number; // kassaflöde tillgängligt för återinvestering
  marginalTaxRate: number;
}

export interface Comparison {
  priv: PrivateResult;
  ab: ABResult;
  diffPaidOut: number; // AB netto privat - privat netto
  diffTotal: number; // inkl. kvarhållen vinst i bolaget
  diffPct: number; // relativt privat netto
  vatEffect: number; // nettoeffekt av momsregistrering
  adminEffect: number; // administrationskostnader (AB-specifika)
}

// ---------- Hjälpfunktioner ----------

const pct = (x: number) => x / 100;

/** Marginalskatt på nästa intjänade krona givet befintlig årslön. */
export function marginalTaxAt(p: PersonalInputs, extraIncome = 0): number {
  if (p.marginalTaxOverride != null) return p.marginalTaxOverride;
  const totalIncome = p.monthlySalary * 12 + extraIncome;
  return totalIncome > p.stateTaxThresholdYear
    ? p.municipalTaxRate + p.stateTaxRate
    : p.municipalTaxRate;
}

/** Gemensamma verksamhetskostnader (exkl. AB-specifik administration), inkl. moms. */
function sharedCostsInclVat(r: RentalInputs, revenue: number): number {
  return (
    revenue * pct(r.platformFeePct) +
    r.repairs +
    r.storage +
    r.transport +
    r.insurance +
    r.otherFixed +
    revenue * pct(r.otherVariablePct)
  );
}

// ---------- Privat scenario ----------

export function computePrivate(
  inputs: ModelInputs,
  revenueOverride?: number
): PrivateResult {
  const { personal: p, rental: r, assumptions: a } = inputs;
  const revenue = revenueOverride ?? r.annualRevenueInclVat;
  // Privatperson under momsgränsen: ingen moms, bruttobelopp rakt av.
  const scale =
    r.scalePurchasesWithRevenue && r.annualRevenueInclVat > 0
      ? revenue / r.annualRevenueInclVat
      : 1;
  const purchases = r.purchasesPerYear * (revenueOverride != null ? scale : 1);

  const costs = sharedCostsInclVat(r, revenue);
  // Förslitningsavdrag: samma avskrivningsmodell som i AB, på belopp inkl. moms
  // (privatperson får inte lyfta moms).
  const depreciation =
    r.depreciationYears > 0
      ? (purchases * (1 - pct(r.residualValuePct))) / r.depreciationYears
      : purchases;

  const surplus = Math.max(0, revenue - costs - depreciation);
  const schablonAvdrag = a.includeEgenavgifter
    ? surplus * pct(a.hobbySchablonAvdragPct)
    : 0;
  const taxableIncome = surplus - schablonAvdrag;
  const egenavgifter = a.includeEgenavgifter
    ? taxableIncome * pct(a.egenavgifterRate)
    : 0;

  const marginalTaxRate = marginalTaxAt(p, taxableIncome / 2);
  const incomeTax = taxableIncome * pct(marginalTaxRate);
  const totalTax = incomeTax + egenavgifter;
  const netPrivate = surplus - totalTax;

  const crossesStateTax =
    p.monthlySalary * 12 <= p.stateTaxThresholdYear &&
    p.monthlySalary * 12 + taxableIncome > p.stateTaxThresholdYear;

  return {
    grossRevenue: revenue,
    deductibleCosts: costs,
    depreciation,
    surplus,
    schablonAvdrag,
    taxableIncome,
    egenavgifter,
    marginalTaxRate,
    incomeTax,
    totalTax,
    netPrivate,
    crossesStateTax,
  };
}

// ---------- AB-scenario ----------

export interface ABOptions {
  revenueOverride?: number;
  salaryOverride?: number;
  dividendShareOverride?: number; // 0..1 av möjlig utdelning
  vatRegisteredOverride?: boolean;
}

export function computeAB(inputs: ModelInputs, opts: ABOptions = {}): ABResult {
  const { personal: p, rental: r, assumptions: a } = inputs;
  const vatOn = opts.vatRegisteredOverride ?? r.vatRegistered;
  const vatFactor = 1 + pct(a.vatRate);
  const revenue = opts.revenueOverride ?? r.annualRevenueInclVat;
  const scale =
    r.scalePurchasesWithRevenue && r.annualRevenueInclVat > 0
      ? revenue / r.annualRevenueInclVat
      : 1;
  const purchases =
    r.purchasesPerYear * (opts.revenueOverride != null ? scale : 1);

  // Moms på intäkter
  const revenueExclVat = vatOn ? revenue / vatFactor : revenue;
  const outputVat = revenue - revenueExclVat;

  // Kostnader: provision, reparationer, förvaring, transport, övrigt har moms;
  // försäkring och bankavgifter är momsfria.
  const costsWithVat =
    revenue * pct(r.platformFeePct) +
    r.repairs +
    r.storage +
    r.transport +
    r.otherFixed +
    revenue * pct(r.otherVariablePct) +
    r.accounting +
    r.companyCosts;
  const costsNoVat = r.insurance + r.bank;
  const costsWithVatExcl = vatOn ? costsWithVat / vatFactor : costsWithVat;
  const inputVatCosts = costsWithVat - costsWithVatExcl;
  const costsExclVat = costsWithVatExcl + costsNoVat;
  const adminCosts =
    (vatOn ? (r.accounting + r.companyCosts) / vatFactor : r.accounting + r.companyCosts) +
    r.bank;

  // Inköp av prylar: momsavdrag bara på andelen med avdragsgill moms.
  const deductibleShare = pct(r.purchasesVatDeductiblePct);
  const purchasesVatPart = purchases * deductibleShare;
  const purchasesNoVatPart = purchases * (1 - deductibleShare);
  const purchasesExclVat = vatOn
    ? purchasesVatPart / vatFactor + purchasesNoVatPart
    : purchases;
  const inputVatPurchases = purchases - purchasesExclVat;

  const netVat = outputVat - inputVatCosts - inputVatPurchases;

  // Avskrivningar (linjärt till restvärde)
  const depreciation =
    r.depreciationYears > 0
      ? (purchasesExclVat * (1 - pct(r.residualValuePct))) / r.depreciationYears
      : purchasesExclVat;

  const resultBeforeSalary = revenueExclVat - costsExclVat - depreciation;

  // Lön enligt strategi, begränsad så att lön + arbetsgivaravgifter ryms i resultatet.
  const agaFactor = 1 + pct(a.employerContribRate);
  let desiredSalary: number;
  switch (p.payoutStrategy) {
    case "salary":
      desiredSalary = Math.max(0, resultBeforeSalary) / agaFactor;
      break;
    case "dividend":
    case "retain":
      desiredSalary = 0;
      break;
    default:
      desiredSalary = p.desiredSalaryFromAB;
  }
  if (opts.salaryOverride != null) desiredSalary = opts.salaryOverride;
  const salary = Math.min(
    desiredSalary,
    Math.max(0, resultBeforeSalary) / agaFactor
  );
  const employerContrib = salary * pct(a.employerContribRate);
  const resultAfterSalary = resultBeforeSalary - salary - employerContrib;

  const corpTax = Math.max(0, resultAfterSalary) * pct(a.corpTaxRate);
  const profitAfterTax = resultAfterSalary - corpTax;

  // Utdelning
  const gransbelopp =
    p.simplificationAmount * pct(p.ownershipSharePct) +
    p.savedDividendAllowance;
  const maxDividend = Math.max(0, profitAfterTax);
  let desiredDividend: number;
  switch (p.payoutStrategy) {
    case "dividend":
    case "salary":
      desiredDividend = maxDividend;
      break;
    case "retain":
      desiredDividend = 0;
      break;
    default:
      desiredDividend = p.desiredDividend;
  }
  if (opts.dividendShareOverride != null)
    desiredDividend = maxDividend * opts.dividendShareOverride;
  const dividend = Math.min(desiredDividend, maxDividend);

  const dividendWithinAllowance = Math.min(dividend, gransbelopp);
  const dividendExcess = dividend - dividendWithinAllowance;
  const marginalTaxRate = marginalTaxAt(p, salary);
  // Utdelning över gränsbeloppet beskattas som tjänst (förenklat: marginalskatt).
  const dividendTax =
    dividendWithinAllowance * pct(a.dividendTaxRate) +
    dividendExcess * pct(marginalTaxRate);

  const netSalary = salary * (1 - pct(marginalTaxRate));
  const netDividend = dividend - dividendTax;
  const netPrivate = netSalary + netDividend;
  const retainedInCompany = profitAfterTax - dividend;
  // Avskrivningar är inte kassaflöde: pengar som kan återinvesteras =
  // kvarhållen vinst + årets avskrivningar - årets faktiska inköp (exkl. moms).
  const reinvestmentCapacity = retainedInCompany + depreciation;

  return {
    revenueExclVat,
    outputVat,
    inputVatCosts,
    inputVatPurchases,
    netVat,
    costsExclVat,
    adminCosts,
    purchasesExclVat,
    depreciation,
    resultBeforeSalary,
    desiredSalary,
    salary,
    employerContrib,
    resultAfterSalary,
    corpTax,
    profitAfterTax,
    gransbelopp,
    dividend,
    dividendWithinAllowance,
    dividendExcess,
    dividendTax,
    netSalary,
    netDividend,
    netPrivate,
    retainedInCompany,
    reinvestmentCapacity,
    marginalTaxRate,
  };
}

// ---------- Jämförelse ----------

export function compare(
  inputs: ModelInputs,
  revenueOverride?: number
): Comparison {
  const priv = computePrivate(inputs, revenueOverride);
  const ab = computeAB(inputs, { revenueOverride });
  const abNoVat = computeAB(inputs, {
    revenueOverride,
    vatRegisteredOverride: false,
  });

  const diffPaidOut = ab.netPrivate - priv.netPrivate;
  const diffTotal = ab.netPrivate + ab.retainedInCompany - priv.netPrivate;
  const diffPct =
    priv.netPrivate !== 0 ? (diffTotal / Math.abs(priv.netPrivate)) * 100 : 0;

  // Momseffekt: skillnad i totalt utfall med/utan momsregistrering.
  const vatEffect =
    ab.netPrivate +
    ab.retainedInCompany -
    (abNoVat.netPrivate + abNoVat.retainedInCompany);

  return {
    priv,
    ab,
    diffPaidOut,
    diffTotal,
    diffPct,
    vatEffect,
    adminEffect: ab.adminCosts,
  };
}

/** Break-even: lägsta årsintäkt där AB totalt sett slår privat. */
export function findBreakEven(inputs: ModelInputs, maxRevenue = 1000000): number | null {
  const step = 1000;
  for (let rev = 0; rev <= maxRevenue; rev += step) {
    const c = compare(inputs, rev);
    if (c.diffTotal > 0) return rev;
  }
  return null;
}

// ---------- Förmögenhet över tid ----------

export interface WealthPoint {
  year: number;
  privat: number;
  abPrivat: number; // ackumulerat privat netto från AB
  abTotal: number; // inkl. kvarhållet kapital i bolaget
}

export function wealthOverYears(inputs: ModelInputs, years = 5): WealthPoint[] {
  const c = compare(inputs);
  const points: WealthPoint[] = [];
  for (let y = 0; y <= years; y++) {
    points.push({
      year: y,
      privat: c.priv.netPrivate * y,
      abPrivat: c.ab.netPrivate * y,
      abTotal: (c.ab.netPrivate + c.ab.retainedInCompany) * y,
    });
  }
  return points;
}

// ---------- Scenariopresets ----------

export interface Preset {
  id: string;
  name: string;
  revenue: number;
}

export const presets: Preset[] = [
  { id: "hobby", name: "Hobby", revenue: 20000 },
  { id: "aktiv", name: "Aktiv sidoverksamhet", revenue: 75000 },
  { id: "serios", name: "Seriös sidoverksamhet", revenue: 150000 },
  { id: "mini", name: "Mini-business", revenue: 300000 },
  { id: "tillvaxt", name: "Tillväxtcase", revenue: 500000 },
];

export type Recommendation =
  | "Privat verkar enklare"
  | "AB börjar bli intressant"
  | "AB kan vara ekonomiskt motiverat";

export function recommend(c: Comparison): Recommendation {
  if (c.diffTotal <= 0) return "Privat verkar enklare";
  if (c.diffTotal < c.adminEffect || c.diffPaidOut <= 0)
    return "AB börjar bli intressant";
  return "AB kan vara ekonomiskt motiverat";
}
