import {
  DispensingTray,
  DrugSpec,
  PrescriptionItem,
  UnlockedAlmanac,
} from '../types/game';

const ALMANAC_STORAGE_KEY = 'before_your_hands_pharmacy_almanac_v1';

export const DEFAULT_ALMANAC: UnlockedAlmanac = {
  endings: { A: false, '1B': false, B: false, C: false, D: false, E: false },
  completedModes: { normal: false, hard: false },
};

export interface ResolvedTrayEntry {
  drug: DrugSpec;
  entry: { packs: number; loose: number };
  total: number;
}

/** O(1) lookup map from drug id to DrugSpec */
export function buildDrugMap(drugs: readonly DrugSpec[]): Map<string, DrugSpec> {
  return new Map(drugs.map((drug) => [drug.id, drug]));
}

/** Resolve non-empty tray items with computed pill totals */
export function resolveTrayEntries(
  drugs: readonly DrugSpec[],
  tray: DispensingTray
): ResolvedTrayEntry[] {
  const drugMap = buildDrugMap(drugs);
  const resolved: ResolvedTrayEntry[] = [];

  for (const [drugId, entry] of Object.entries(tray)) {
    const drug = drugMap.get(drugId);
    if (!drug) continue;
    const total = entry.packs * drug.packSize + entry.loose;
    if (total > 0) {
      resolved.push({ drug, entry, total });
    }
  }

  return resolved;
}

/** Single source of truth for auditing dispensing tray against prescription items */
export function validateTrayAgainstRx(
  drugs: readonly DrugSpec[],
  prescriptionItems: readonly PrescriptionItem[],
  tray: DispensingTray
): string[] {
  const drugMap = buildDrugMap(drugs);
  const prescribedIds = new Set(prescriptionItems.map((item) => item.targetDrugId));
  const errors: string[] = [];

  for (const req of prescriptionItems) {
    const drug = drugMap.get(req.targetDrugId);
    const entry = tray[req.targetDrugId];
    const total = drug && entry ? entry.packs * drug.packSize + entry.loose : 0;

    if (total === 0) {
      errors.push(`漏拿處方藥：${req.displayName} ${req.strength}（應給 ${req.requiredQty} 顆）`);
    } else if (total !== req.requiredQty) {
      errors.push(
        `顆數不符：${req.displayName} ${req.strength} 實拿 ${total} 顆（應給 ${req.requiredQty} 顆）`
      );
    }
  }

  for (const [drugId, entry] of Object.entries(tray)) {
    const drug = drugMap.get(drugId);
    if (!drug) continue;
    const total = entry.packs * drug.packSize + entry.loose;
    if (total > 0 && !prescribedIds.has(drugId)) {
      errors.push(`誤拿非處方藥：${drug.name} ${drug.strength}（${total} 顆）`);
    }
  }

  return errors;
}

/** Build an exact dispensing tray matching every prescribed drug and quantity */
export function buildExactTray(
  drugs: readonly DrugSpec[],
  prescriptionItems: readonly PrescriptionItem[]
): DispensingTray {
  const drugMap = buildDrugMap(drugs);
  const exact: DispensingTray = {};

  for (const req of prescriptionItems) {
    const drug = drugMap.get(req.targetDrugId);
    if (!drug) continue;
    exact[drug.id] = {
      packs: Math.floor(req.requiredQty / drug.packSize),
      loose: req.requiredQty % drug.packSize,
    };
  }

  return exact;
}

export function loadAlmanac(): UnlockedAlmanac {
  try {
    const raw = window.localStorage.getItem(ALMANAC_STORAGE_KEY);
    if (!raw) return DEFAULT_ALMANAC;
    const parsed = JSON.parse(raw) as Partial<UnlockedAlmanac>;
    return {
      endings: {
        A: Boolean(parsed.endings?.A),
        '1B': Boolean(parsed.endings?.['1B']),
        B: Boolean(parsed.endings?.B),
        C: Boolean(parsed.endings?.C),
        D: Boolean(parsed.endings?.D),
        E: Boolean(parsed.endings?.E),
      },
      completedModes: {
        normal: Boolean(parsed.completedModes?.normal),
        hard: Boolean(parsed.completedModes?.hard),
      },
    };
  } catch {
    return DEFAULT_ALMANAC;
  }
}

export function saveAlmanac(next: UnlockedAlmanac): void {
  try {
    window.localStorage.setItem(ALMANAC_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors in restricted iframes
  }
}
