import { useMemo, useState } from "react";
import { useSim } from "../state";
import { compare, presets, recommend } from "../lib/model";
import { kr, krSigned } from "../lib/format";
import { Badge, Card, Disclaimer, SectionTitle } from "./ui";

/** Färdiga scenarionivåer + sparade egna scenarier. */
export default function PresetsTab() {
  const {
    inputs,
    setRental,
    saved,
    saveScenario,
    loadScenario,
    deleteScenario,
  } = useSim();
  const [name, setName] = useState("");

  const rows = useMemo(
    () =>
      presets.map((p) => {
        const c = compare(inputs, p.revenue);
        return { preset: p, c, rec: recommend(c) };
      }),
    [inputs]
  );

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle sub="Samma kostnadsantaganden som dina inställningar – bara intäktsnivån ändras. Klicka på en rad för att använda nivån.">
          Färdiga scenarier
        </SectionTitle>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-ink-3 border-b border-hairline">
                <th className="py-2 pl-4 sm:pl-0 pr-3 font-medium">Scenario</th>
                <th className="py-2 px-3 font-medium text-right">Intäkt/år</th>
                <th className="py-2 px-3 font-medium text-right">Privat netto</th>
                <th className="py-2 px-3 font-medium text-right">AB netto*</th>
                <th className="py-2 px-3 font-medium text-right">Skillnad</th>
                <th className="py-2 px-3 font-medium text-right">Momseffekt</th>
                <th className="py-2 px-3 font-medium text-right">Admin</th>
                <th className="py-2 pr-4 sm:pr-0 pl-3 font-medium">
                  Rekommendation
                </th>
              </tr>
            </thead>
            <tbody className="tnum">
              {rows.map(({ preset, c, rec }) => {
                const active =
                  inputs.rental.annualRevenueInclVat === preset.revenue;
                return (
                  <tr
                    key={preset.id}
                    onClick={() =>
                      setRental({ annualRevenueInclVat: preset.revenue })
                    }
                    className={`border-b border-hairline cursor-pointer transition-colors hover:bg-plane ${
                      active ? "bg-plane" : ""
                    }`}
                  >
                    <td className="py-2.5 pl-4 sm:pl-0 pr-3 font-medium text-ink whitespace-nowrap">
                      {preset.name}
                      {active && (
                        <span className="ml-2 text-xs text-accent">● vald</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-ink-2">
                      {kr(preset.revenue)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-ink">
                      {kr(c.priv.netPrivate)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-ink">
                      {kr(c.ab.netPrivate + c.ab.retainedInCompany)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right whitespace-nowrap font-medium ${
                        c.diffTotal >= 0 ? "text-good" : "text-crit"
                      }`}
                    >
                      {krSigned(c.diffTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-ink-2">
                      {krSigned(c.vatEffect)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-ink-2">
                      {kr(c.adminEffect)}
                    </td>
                    <td className="py-2.5 pr-4 sm:pr-0 pl-3">
                      <Badge
                        tone={
                          rec === "AB kan vara ekonomiskt motiverat"
                            ? "good"
                            : rec === "AB börjar bli intressant"
                              ? "warn"
                              : "neutral"
                        }
                      >
                        {rec}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-3 mt-2">
          * AB netto = utbetalt privat (lön + utdelning efter skatt) + vinst
          kvar i bolaget. Skillnad = AB netto − privat netto. Skatteeffekten
          syns i detalj under fliken Beräkning.
        </p>
      </Card>

      <Card>
        <SectionTitle sub="Spara dina nuvarande inställningar som ett eget scenario">
          Mina sparade scenarier
        </SectionTitle>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Namn, t.ex. 'Med släpkärra 2027'"
            className="flex-1 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button
            onClick={() => {
              saveScenario(name.trim());
              setName("");
            }}
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Spara
          </button>
        </div>
        {saved.length === 0 ? (
          <p className="text-sm text-ink-3">
            Inga sparade scenarier ännu. Ställ in siffrorna och spara här –
            allt lagras lokalt i din webbläsare.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--hairline)]">
            {saved.map((s) => {
              const c = compare(s.inputs);
              return (
                <li
                  key={s.id}
                  className="py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1"
                >
                  <div className="flex-1 min-w-[160px]">
                    <div className="text-sm font-medium text-ink">{s.name}</div>
                    <div className="text-xs text-ink-3">
                      {new Date(s.savedAt).toLocaleDateString("sv-SE")} ·{" "}
                      {kr(s.inputs.rental.annualRevenueInclVat)} i intäkter ·
                      skillnad {krSigned(c.diffTotal)}
                    </div>
                  </div>
                  <button
                    onClick={() => loadScenario(s.id)}
                    className="text-sm text-accent font-medium hover:underline"
                  >
                    Ladda
                  </button>
                  <button
                    onClick={() => deleteScenario(s.id)}
                    className="text-sm text-crit hover:underline"
                  >
                    Ta bort
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Disclaimer />
    </div>
  );
}
