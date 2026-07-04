import { ReactNode, useId } from "react";
import { kr, krSigned } from "../lib/format";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface rounded-card shadow-card border border-hairline p-4 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  sub,
}: {
  children: ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-ink">{children}</h2>
      {sub && <p className="text-sm text-ink-2 mt-0.5">{sub}</p>}
    </div>
  );
}

/** Stat-tile: label + värde + (valfritt) delta */
export function Stat({
  label,
  value,
  delta,
  deltaGoodWhenPositive = true,
  hint,
  hero = false,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaGoodWhenPositive?: boolean;
  hint?: string;
  hero?: boolean;
}) {
  const good = delta != null && (deltaGoodWhenPositive ? delta >= 0 : delta < 0);
  return (
    <div className="min-w-0">
      <div className="text-sm text-ink-2">{label}</div>
      <div
        className={`font-semibold text-ink ${
          hero ? "text-4xl sm:text-5xl mt-1" : "text-xl sm:text-2xl"
        }`}
      >
        {value}
      </div>
      {delta != null && (
        <div
          className={`text-sm font-medium mt-0.5 ${
            good ? "text-good" : "text-crit"
          }`}
        >
          {krSigned(delta)}
        </div>
      )}
      {hint && <div className="text-xs text-ink-3 mt-0.5">{hint}</div>}
    </div>
  );
}

/** Rad i en beräkningskedja (resultaträkning) */
export function CalcRow({
  label,
  value,
  strong = false,
  indent = false,
  signed = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
  indent?: boolean;
  signed?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-3 py-1.5 text-sm ${
        strong ? "font-semibold text-ink border-t border-hairline mt-1 pt-2" : "text-ink-2"
      } ${indent ? "pl-4" : ""}`}
    >
      <span>{label}</span>
      <span className="tnum whitespace-nowrap">
        {signed ? krSigned(value) : kr(value)}
      </span>
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  suffix = "kr",
  step = 100,
  min = 0,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-ink-2 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className="w-full rounded-lg border border-hairline bg-surface px-3 py-2 pr-12 text-ink tnum focus:outline-none focus:ring-2 focus:ring-accent/50"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">
          {suffix}
        </span>
      </div>
      {hint && <p className="text-xs text-ink-3 mt-1">{hint}</p>}
    </div>
  );
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v: number) => String(v),
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  const id = useId();
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <label htmlFor={id} className="text-sm text-ink-2">
          {label}
        </label>
        <span className="text-sm font-semibold text-ink tnum">
          {format(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--fill" as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm text-ink">{label}</div>
        {hint && <div className="text-xs text-ink-3">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? "bg-accent" : "bg-grid"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
          style={{ left: 0 }}
        />
      </button>
    </div>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "good" | "warn" | "neutral";
  children: ReactNode;
}) {
  const cls =
    tone === "good"
      ? "text-good border-good/40 bg-good/5"
      : tone === "warn"
        ? "text-warn border-warn/40 bg-warn/5"
        : "text-ink-2 border-hairline bg-plane";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

export function Disclaimer() {
  return (
    <p className="text-xs text-ink-3 border border-hairline rounded-lg px-3 py-2 bg-plane">
      ⚠️ Detta är en simuleringsmodell – inte juridisk eller skattemässig
      rådgivning. Exakt klassificering (hobby, tjänst eller näringsverksamhet)
      beror på Skatteverkets bedömning. Kontrollera med redovisningskonsult
      eller Skatteverket innan beslut.
    </p>
  );
}
