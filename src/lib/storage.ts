import { ModelInputs, defaultInputs } from "./model";

const INPUTS_KEY = "ab-sim:inputs:v1";
const SAVED_KEY = "ab-sim:saved:v1";

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: string; // ISO
  inputs: ModelInputs;
}

/** Djup merge mot defaults så att nya fält får vettiga värden efter uppdateringar. */
function mergeWithDefaults(stored: Partial<ModelInputs>): ModelInputs {
  return {
    personal: { ...defaultInputs.personal, ...stored.personal },
    rental: { ...defaultInputs.rental, ...stored.rental },
    assumptions: { ...defaultInputs.assumptions, ...stored.assumptions },
  };
}

export function loadInputs(): ModelInputs {
  try {
    const raw = localStorage.getItem(INPUTS_KEY);
    if (!raw) return defaultInputs;
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return defaultInputs;
  }
}

export function saveInputs(inputs: ModelInputs): void {
  try {
    localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs));
  } catch {
    // localStorage kan vara avstängd – simulatorn fungerar ändå, utan persistens
  }
}

export function loadSavedScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SavedScenario[];
    return list.map((s) => ({ ...s, inputs: mergeWithDefaults(s.inputs) }));
  } catch {
    return [];
  }
}

export function persistSavedScenarios(list: SavedScenario[]): void {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  } catch {
    // se ovan
  }
}
