import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  Assumptions,
  Comparison,
  ModelInputs,
  PersonalInputs,
  RentalInputs,
  compare,
  defaultInputs,
} from "./lib/model";
import {
  SavedScenario,
  loadInputs,
  loadSavedScenarios,
  persistSavedScenarios,
  saveInputs,
} from "./lib/storage";

interface SimState {
  inputs: ModelInputs;
  result: Comparison;
  setPersonal: (patch: Partial<PersonalInputs>) => void;
  setRental: (patch: Partial<RentalInputs>) => void;
  setAssumptions: (patch: Partial<Assumptions>) => void;
  resetInputs: () => void;
  saved: SavedScenario[];
  saveScenario: (name: string) => void;
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
}

const Ctx = createContext<SimState | null>(null);

export function SimProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<ModelInputs>(loadInputs);
  const [saved, setSaved] = useState<SavedScenario[]>(loadSavedScenarios);

  useEffect(() => saveInputs(inputs), [inputs]);
  useEffect(() => persistSavedScenarios(saved), [saved]);

  const result = useMemo(() => compare(inputs), [inputs]);

  const value: SimState = {
    inputs,
    result,
    setPersonal: (patch) =>
      setInputs((s) => ({ ...s, personal: { ...s.personal, ...patch } })),
    setRental: (patch) =>
      setInputs((s) => ({ ...s, rental: { ...s.rental, ...patch } })),
    setAssumptions: (patch) =>
      setInputs((s) => ({ ...s, assumptions: { ...s.assumptions, ...patch } })),
    resetInputs: () => setInputs(defaultInputs),
    saved,
    saveScenario: (name) =>
      setSaved((list) => [
        {
          id: crypto.randomUUID(),
          name: name || `Scenario ${list.length + 1}`,
          savedAt: new Date().toISOString(),
          inputs,
        },
        ...list,
      ]),
    loadScenario: (id) => {
      const s = saved.find((x) => x.id === id);
      if (s) setInputs(s.inputs);
    },
    deleteScenario: (id) => setSaved((list) => list.filter((x) => x.id !== id)),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSim(): SimState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSim måste användas inom SimProvider");
  return ctx;
}
