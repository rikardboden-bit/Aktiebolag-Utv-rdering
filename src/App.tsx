import { useState } from "react";
import { SimProvider, useSim } from "./state";
import Dashboard from "./components/Dashboard";
import InputsTab from "./components/InputsTab";
import CalcTab from "./components/CalcTab";
import PresetsTab from "./components/PresetsTab";
import SensitivityTab from "./components/SensitivityTab";
import ConclusionTab from "./components/ConclusionTab";
import { downloadCsv, exportPdf } from "./lib/export";

type TabId =
  | "dashboard"
  | "inputs"
  | "calc"
  | "presets"
  | "sensitivity"
  | "conclusion";

const tabs: { id: TabId; label: string; short: string }[] = [
  { id: "dashboard", label: "Översikt", short: "Översikt" },
  { id: "inputs", label: "Mina siffror", short: "Siffror" },
  { id: "calc", label: "Beräkning", short: "Beräkning" },
  { id: "presets", label: "Scenarier", short: "Scenarier" },
  { id: "sensitivity", label: "Känslighet", short: "Känslighet" },
  { id: "conclusion", label: "Slutsats", short: "Slutsats" },
];

function Shell() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const { inputs, result } = useSim();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-plane/90 backdrop-blur border-b border-hairline no-print">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-accent text-white grid place-items-center font-bold text-sm shrink-0">
                AB
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-semibold text-ink truncate">
                  AB eller privat?
                </h1>
                <p className="text-xs text-ink-3 hidden sm:block">
                  Simulator för din uthyrningsverksamhet
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => downloadCsv(inputs, result)}
                className="rounded-lg border border-hairline px-3 py-1.5 text-xs sm:text-sm font-medium text-ink-2 hover:border-accent/50"
              >
                CSV
              </button>
              <button
                onClick={exportPdf}
                className="rounded-lg border border-hairline px-3 py-1.5 text-xs sm:text-sm font-medium text-ink-2 hover:border-accent/50"
              >
                PDF
              </button>
            </div>
          </div>
          <nav
            className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-2"
            aria-label="Flikar"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "bg-accent text-white"
                    : "text-ink-2 hover:bg-surface"
                }`}
              >
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {tab === "dashboard" && <Dashboard />}
        {tab === "inputs" && <InputsTab />}
        {tab === "calc" && <CalcTab />}
        {tab === "presets" && <PresetsTab />}
        {tab === "sensitivity" && <SensitivityTab />}
        {tab === "conclusion" && <ConclusionTab />}
      </main>

      <footer className="max-w-5xl mx-auto px-4 pb-8 text-xs text-ink-3">
        Alla värden sparas lokalt i din webbläsare. Skattesatser är 2025 års
        nivåer och kan redigeras under Mina siffror → Antaganden.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SimProvider>
      <Shell />
    </SimProvider>
  );
}
