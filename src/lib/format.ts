const nf0 = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("sv-SE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 12345.6 -> "12 346 kr" */
export function kr(x: number): string {
  return `${nf0.format(Math.round(x))} kr`;
}

/** Signerad variant: "+12 346 kr" / "−1 200 kr" */
export function krSigned(x: number): string {
  const r = Math.round(x);
  if (r > 0) return `+${nf0.format(r)} kr`;
  if (r < 0) return `−${nf0.format(Math.abs(r))} kr`;
  return "0 kr";
}

export function pctFmt(x: number, decimals = 1): string {
  return `${(decimals === 0 ? nf0 : nf1).format(x)} %`;
}

/** Kompakt axelformat: 150000 -> "150 tkr", 4500 -> "4,5 tkr" */
export function tkr(x: number): string {
  const thousands = x / 1000;
  const wholeThousand = Math.abs(thousands - Math.round(thousands)) < 1e-9;
  return `${(Math.abs(x) < 10000 && !wholeThousand ? nf1 : nf0).format(
    thousands
  )} tkr`;
}
