import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { kr, tkr } from "../lib/format";

// Färgroller: blå = AB, aqua = Privat (fast tilldelning, byts aldrig om)
const AB_COLOR = "var(--series-1)";
const PRIV_COLOR = "var(--series-2)";
const RETAINED_COLOR = "var(--series-3)";

const axisTick = { fill: "var(--text-muted)", fontSize: 12 };
const gridStroke = "var(--gridline)";

function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: {
  active?: boolean;
  payload?: {
    name?: string;
    value?: number | string;
    color?: string;
    type?: string;
  }[];
  label?: string | number;
  labelFormatter?: (l: string | number) => string;
}) {
  const rows = payload?.filter((p) => p.type !== "none") ?? [];
  if (!active || !rows.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 shadow-card text-sm">
      <div className="text-ink-3 text-xs mb-1">
        {labelFormatter && label != null ? labelFormatter(label) : label}
      </div>
      {rows.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-ink">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-ink-2">{p.name}:</span>
          <span className="font-medium tnum">{kr(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

const legendStyle = { fontSize: 13, color: "var(--text-secondary)" };

export interface BreakEvenPoint {
  revenue: number;
  totalt: number;
  utbetalt: number;
}

/** Nettofördel AB vs privat över intäktsnivåer, med break-even-markering. */
export function BreakEvenChart({
  data,
  breakEven,
  currentRevenue,
}: {
  data: BreakEvenPoint[];
  breakEven: number | null;
  currentRevenue: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="revenue"
          tickFormatter={tkr}
          tick={axisTick}
          stroke="var(--baseline)"
          tickLine={false}
        />
        <YAxis
          tickFormatter={tkr}
          tick={axisTick}
          stroke="transparent"
          tickLine={false}
          width={52}
        />
        <Tooltip
          content={
            <ChartTooltip
              labelFormatter={(l) => `Årsintäkt ${kr(Number(l))}`}
            />
          }
        />
        <Legend
          wrapperStyle={legendStyle}
          payload={[
            {
              value: "Fördel AB, totalt (inkl. kvar i bolag)",
              type: "plainline",
              color: AB_COLOR,
              payload: { strokeDasharray: "0" },
            },
            {
              value: "Fördel AB, utbetalt privat",
              type: "plainline",
              color: RETAINED_COLOR,
              payload: { strokeDasharray: "0" },
            },
          ]}
        />
        <ReferenceLine y={0} stroke="var(--baseline)" strokeWidth={1} />
        {breakEven != null && (
          <ReferenceLine
            x={breakEven}
            stroke="var(--text-muted)"
            strokeDasharray="4 3"
            label={{
              value: `Break-even ${tkr(breakEven)}`,
              position: "top",
              fill: "var(--text-secondary)",
              fontSize: 12,
            }}
          />
        )}
        <ReferenceLine
          x={currentRevenue}
          stroke={PRIV_COLOR}
          strokeDasharray="2 3"
          label={{
            value: "Din nivå",
            position: "insideTopLeft",
            fill: "var(--text-secondary)",
            fontSize: 12,
          }}
        />
        <Area
          dataKey="totalt"
          stroke="none"
          fill="var(--area-wash)"
          legendType="none"
          tooltipType="none"
          isAnimationActive={false}
        />
        <Line
          dataKey="totalt"
          name="Fördel AB, totalt (inkl. kvar i bolag)"
          stroke={AB_COLOR}
          strokeWidth={2}
          dot={false}
          strokeLinecap="round"
          legendType="plainline"
          isAnimationActive={false}
        />
        <Line
          dataKey="utbetalt"
          name="Fördel AB, utbetalt privat"
          stroke={RETAINED_COLOR}
          strokeWidth={2}
          dot={false}
          strokeLinecap="round"
          legendType="plainline"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export interface CashFlowPoint {
  name: string;
  fickan: number;
  bolaget: number;
}

/** Kassaflöde per år: vad som hamnar i fickan respektive stannar i bolaget. */
export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barSize={24}>
        <CartesianGrid stroke={gridStroke} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ ...axisTick, fill: "var(--text-secondary)" }}
          stroke="var(--baseline)"
          tickLine={false}
        />
        <YAxis
          tickFormatter={tkr}
          tick={axisTick}
          stroke="transparent"
          tickLine={false}
          width={52}
        />
        <Tooltip cursor={{ fill: "var(--area-wash)" }} content={<ChartTooltip />} />
        <Legend wrapperStyle={legendStyle} />
        <Bar
          dataKey="fickan"
          name="I fickan (netto privat)"
          stackId="a"
          fill={AB_COLOR}
          stroke="var(--surface-1)"
          strokeWidth={2}
          radius={[0, 0, 0, 0]}
          isAnimationActive={false}
        />
        <Bar
          dataKey="bolaget"
          name="Kvar i bolaget"
          stackId="a"
          fill={RETAINED_COLOR}
          stroke="var(--surface-1)"
          strokeWidth={2}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface WealthChartPoint {
  year: number;
  privat: number;
  abPrivat: number;
  abTotal: number;
}

/** Ackumulerad förmögenhet över åren. */
export function WealthChart({ data }: { data: WealthChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="year"
          tickFormatter={(y) => `År ${y}`}
          tick={axisTick}
          stroke="var(--baseline)"
          tickLine={false}
        />
        <YAxis
          tickFormatter={tkr}
          tick={axisTick}
          stroke="transparent"
          tickLine={false}
          width={52}
        />
        <Tooltip
          content={<ChartTooltip labelFormatter={(l) => `Efter år ${l}`} />}
        />
        <Legend wrapperStyle={legendStyle} iconType="plainline" />
        <Line
          dataKey="abTotal"
          name="AB totalt (privat + bolag)"
          stroke={AB_COLOR}
          strokeWidth={2}
          strokeLinecap="round"
          dot={{ r: 4, fill: AB_COLOR, stroke: "var(--surface-1)", strokeWidth: 2 }}
          isAnimationActive={false}
        />
        <Line
          dataKey="abPrivat"
          name="AB, utbetalt privat"
          stroke={RETAINED_COLOR}
          strokeWidth={2}
          strokeLinecap="round"
          dot={{ r: 4, fill: RETAINED_COLOR, stroke: "var(--surface-1)", strokeWidth: 2 }}
          isAnimationActive={false}
        />
        <Line
          dataKey="privat"
          name="Privat"
          stroke={PRIV_COLOR}
          strokeWidth={2}
          strokeLinecap="round"
          dot={{ r: 4, fill: PRIV_COLOR, stroke: "var(--surface-1)", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
