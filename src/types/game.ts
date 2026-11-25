export type GameMode = 'normal' | 'hard';

export type ScreenState = 'MENU' | 'PLAYING' | 'ENDING';

export type ActNumber = 1 | 2 | 3 | 4 | 5;

export type StageId =
  | 'PROCURE'
  | 'TRAP'
  | 'DISPENSE'
  | 'DELIVER'
  | 'COMPLAINT'
  | 'SHORTAGE'
  | 'CONSULT';

export type PatientIndex = 1 | 2;

export type ConsultBehavior = 'calcium_catch' | 'polite_ok' | 'impatient_dismiss';

export type NormalOrderPlanId = 'conservative' | 'balanced' | 'bulk';

export type EndingId = 'A' | '1B' | 'B' | 'C' | 'D' | 'E';

export interface CoreStats {
  money: number; // 0-600 scale (starts at 300)
  capital: number; // 0-600 scale (starts at 300)
  affection: number; // 0-100 scale (starts at 50)
}

export interface StatDelta {
  id: number;
  money?: number;
  capital?: number;
  affection?: number;
}

export type PackSize = 10 | 14 | 15;

export interface DrugSpec {
  id: string;
  name: string;
  strength: string;
  genericHint: string;
  packSize: PackSize;
  boxQty: number;
  unitBoxPrice: number;
  bandColor: string;
  bandAccent: string;
  defaultShelfCode: string;
  monthlyForecastBoxes: number;
  usageNote: string;
}

export interface PrescriptionItem {
  targetDrugId: string;
  displayName: string;
  strength: string;
  requiredQty: number;
  dosageInstruction: string;
}

export interface PatientCase {
  patientIndex: PatientIndex;
  patientName: string;
  /** Short form used in narrative text, e.g. 林阿姨 */
  shortName: string;
  pronoun: '她' | '他';
  patientMeta: string;
  rxNumber: string;
  portraitAsset: string;
  dispenseSubtitle: string;
  dispenseDialogue: string;
  deliverDialogue: string;
  consultSubtitle: string;
  consultDialogue: string;
  consultBehavior: ConsultBehavior;
  items: PrescriptionItem[];
}

export interface NormalProcurementPlan {
  id: NormalOrderPlanId;
  code: string;
  title: string;
  cost: number;
  capitalGain: number;
  dispenseIncomePerPatient: number;
  summary: string;
  tradeoffNote: string;
  triggersShortage: boolean;
}

export interface TrayEntry {
  packs: number;
  loose: number;
}

export type DispensingTray = Record<string, TrayEntry>;

export interface SlowMovingItem {
  id: string;
  name: string;
  subtitle: string;
  price: number;
}

export interface GameFlags {
  normalOrderPlan?: NormalOrderPlanId;
  hadNormalShortage?: boolean;
  hardOrderChoice?: 'shipping' | 'bulk' | 'wait';
  inspectedInAct4: boolean;
  patient2ComplainedMissingStrip?: boolean;
  counseledCalcium: boolean;
  gavePatch?: boolean;
  dispensingErrors?: string[];
  endingReason?: string;
}

export interface EndingDefinition {
  id: EndingId;
  codeLabel: string;
  titleNormal: string;
  titleHard: string;
  tone: 'good' | 'bad' | 'critical';
  summaryNormal: string;
  summaryHard: string;
  knowledgeTitle: string;
  knowledgeBody: string;
  knowledgeSource: string;
}

export interface UnlockedAlmanac {
  endings: Record<EndingId, boolean>;
  completedModes: Record<GameMode, boolean>;
}
