import {
  DrugSpec,
  EndingDefinition,
  EndingId,
  GameMode,
  NormalProcurementPlan,
  PatientCase,
  SlowMovingItem,
} from '../types/game';

import pharmacyWarmImg from '../assets/images/pharmacy_interior_warm.webp';
import pharmacyHardImg from '../assets/images/pharmacy_interior_hard.webp';
import patientWarmImg from '../assets/images/character_patient_warm.webp';
import patient2WarmImg from '../assets/images/character_patient2_warm.webp';
import uncleHardImg from '../assets/images/character_uncle_hard.webp';
import patient2HardImg from '../assets/images/character_patient2_hard.webp';

export const GAME_ASSETS = {
  pharmacyWarm: pharmacyWarmImg,
  pharmacyHard: pharmacyHardImg,
  patientWarm: patientWarmImg,
  patient2Warm: patient2WarmImg,
  uncleHard: uncleHardImg,
  patient2Hard: patient2HardImg,
} as const;

export const MAX_MONEY_SCALE = 600;
export const MAX_CAPITAL_SCALE = 600;
export const FREE_SHIPPING_THRESHOLD = 150;
export const SHIPPING_FEE = 60;
export const HARD_FIXED_COST = 15;
export const HARD_BULK_CASH_FLOOR = 80;
export const LOW_CASH_FLEXIBILITY_THRESHOLD = 120;
export const HARD_WAIT_AFFECTION_PENALTY = 15;
export const HARD_REFUSE_FREEBIE_AFFECTION_PENALTY = 10;
export const HARD_MISSING_STRIP_PENALTY_MONEY = 45;
export const HARD_MISSING_STRIP_PENALTY_AFFECTION = 35;
export const NORMAL_P2_COUNSEL_AFFECTION = 10;
export const NORMAL_SHORTAGE_DRUG_ID = 'haoyajiang_160';
export const DISPENSE_CAPITAL_COST = 10;

export const INITIAL_STATS = {
  money: 300,
  capital: 300,
  affection: 50,
} as const;

/** Standard opening stats when launching Hard Mode directly from TitleMenu (equivalent to a clean balanced Normal Mode clear) */
export const HARD_STANDALONE_STATS = {
  money: 210,
  capital: 400,
  affection: 70,
} as const;

/** Dispensing + delivery countdown duration by mode (Hard mode adds tighter time pressure) */
export const DISPENSING_TIME_LIMIT_BY_MODE: Record<GameMode, number> = {
  normal: 65,
  hard: 45,
};

export type ShelfTier = 'A' | 'B' | 'C' | 'D';

export interface ShelfSlotDef {
  code: string;
  tier: ShelfTier;
  tierLabel: string;
  expectedDrugId: string;
  label: string;
}

const BASE_SHELF_SLOTS: readonly ShelfSlotDef[] = [
  { code: 'A-01', tier: 'A', tierLabel: 'A 層 · 降血脂', expectedDrugId: 'haohuijiang_5', label: '好會降 5 mg' },
  { code: 'A-02', tier: 'A', tierLabel: 'A 層 · 降血脂', expectedDrugId: 'haohuijiang_10', label: '好會降 10 mg' },
  { code: 'B-01', tier: 'B', tierLabel: 'B 層 · 降血壓', expectedDrugId: 'haoyajiang_80', label: '好壓降 80 mg' },
  { code: 'B-02', tier: 'B', tierLabel: 'B 層 · 降血壓', expectedDrugId: 'haoyajiang_160', label: '好壓降 160 mg' },
  { code: 'C-01', tier: 'C', tierLabel: 'C 層 · 甲狀腺藥', expectedDrugId: 'hujianing_50', label: '護甲寧 50 mcg' },
  { code: 'C-02', tier: 'C', tierLabel: 'C 層 · 甲狀腺藥', expectedDrugId: 'hujianing_100', label: '護甲寧 100 mcg' },
];

const MENGYA_SHELF_SLOT: ShelfSlotDef = {
  code: 'D-01',
  tier: 'D',
  tierLabel: 'D 層 · 特別叫貨',
  expectedDrugId: 'mengya_5_80',
  label: '猛壓降 5/80',
};

export const SHELF_SLOTS_BY_MODE: Record<GameMode, readonly ShelfSlotDef[]> = {
  normal: BASE_SHELF_SLOTS,
  hard: [...BASE_SHELF_SLOTS, MENGYA_SHELF_SLOT],
};

export const NORMAL_PROCUREMENT_PLANS: readonly NormalProcurementPlan[] = [
  {
    id: 'conservative',
    code: '方案 A · 少進一點',
    title: '小量備貨',
    cost: 80,
    capitalGain: 80,
    dispenseIncomePerPatient: 12,
    summary: '只補基本缺口、留下最多現金；小量拿貨進價偏高。',
    tradeoffNote: '藥量偏緊，有可能會因此缺藥',
    triggersShortage: true,
  },
  {
    id: 'balanced',
    code: '方案 B · 照平常叫貨',
    title: '適量備貨',
    cost: 120,
    capitalGain: 120,
    dispenseIncomePerPatient: 15,
    summary: '照平常客人的領藥量補貨，現金跟架上藥量都剛剛好。',
    tradeoffNote: '手頭現金與備藥量最平衡',
    triggersShortage: false,
  },
  {
    id: 'bulk',
    code: '方案 C · 大量囤貨',
    title: '多量備貨',
    cost: 240,
    capitalGain: 240,
    dispenseIncomePerPatient: 25,
    summary: '一次多叫一點，進貨價便宜不少，每發一張處方賺得更多！',
    tradeoffNote: '手頭現金只剩 60 元，大多押在架上',
    triggersShortage: false,
  },
];

export function getDispenseIncomeByPlan(planId?: NormalProcurementPlan['id']): number {
  const matched = NORMAL_PROCUREMENT_PLANS.find((plan) => plan.id === planId);
  return matched ? matched.dispenseIncomePerPatient : 15;
}

export function getNetProfitByPlan(planId?: NormalProcurementPlan['id']): number {
  return getDispenseIncomeByPlan(planId) - DISPENSE_CAPITAL_COST;
}

const BASE_DRUGS: readonly DrugSpec[] = [
  {
    id: 'haohuijiang_5',
    name: '好會降',
    strength: '5 mg',
    genericHint: '降血脂藥',
    packSize: 14,
    boxQty: 28,
    unitBoxPrice: 35,
    bandColor: '#2B6CB0',
    bandAccent: '#EBF4FF',
    defaultShelfCode: 'A-01',
    monthlyForecastBoxes: 2,
    usageNote: '14 顆/排',
  },
  {
    id: 'haohuijiang_10',
    name: '好會降',
    strength: '10 mg',
    genericHint: '降血脂藥（高劑量）',
    packSize: 14,
    boxQty: 28,
    unitBoxPrice: 45,
    bandColor: '#2C5282',
    bandAccent: '#E2ECFA',
    defaultShelfCode: 'A-02',
    monthlyForecastBoxes: 1,
    usageNote: '容易跟 5 mg 搞混',
  },
  {
    id: 'haoyajiang_80',
    name: '好壓降',
    strength: '80 mg',
    genericHint: '降血壓藥',
    packSize: 15,
    boxQty: 30,
    unitBoxPrice: 40,
    bandColor: '#B7791F',
    bandAccent: '#FEF8EC',
    defaultShelfCode: 'B-01',
    monthlyForecastBoxes: 2,
    usageNote: '15 顆/排',
  },
  {
    id: 'haoyajiang_160',
    name: '好壓降',
    strength: '160 mg',
    genericHint: '降血壓藥（高劑量）',
    packSize: 15,
    boxQty: 30,
    unitBoxPrice: 50,
    bandColor: '#975A16',
    bandAccent: '#FBF1DF',
    defaultShelfCode: 'B-02',
    monthlyForecastBoxes: 1,
    usageNote: '容易跟 80 mg 搞混',
  },
  {
    id: 'hujianing_50',
    name: '護甲寧',
    strength: '50 mcg',
    genericHint: '甲狀腺藥（低劑量）',
    packSize: 10,
    boxQty: 30,
    unitBoxPrice: 42,
    bandColor: '#2F855A',
    bandAccent: '#EDF7F1',
    defaultShelfCode: 'C-01',
    monthlyForecastBoxes: 1,
    usageNote: '10 顆/排，容易跟 100 mcg 搞混',
  },
  {
    id: 'hujianing_100',
    name: '護甲寧',
    strength: '100 mcg',
    genericHint: '甲狀腺藥',
    packSize: 10,
    boxQty: 30,
    unitBoxPrice: 45,
    bandColor: '#276749',
    bandAccent: '#E2F3E9',
    defaultShelfCode: 'C-02',
    monthlyForecastBoxes: 1,
    usageNote: '10 顆/排',
  },
];

const MENGYA_5_80_DRUG: DrugSpec = {
  id: 'mengya_5_80',
  name: '猛壓降',
  strength: '5/80',
  genericHint: '複方降血壓藥',
  packSize: 15,
  boxQty: 30,
  unitBoxPrice: 30,
  bandColor: '#6B46C1',
  bandAccent: '#F3EEFD',
  defaultShelfCode: 'D-01',
  monthlyForecastBoxes: 1,
  usageNote: '15 顆/排',
};

export const DRUG_CATALOG_BY_MODE: Record<GameMode, readonly DrugSpec[]> = {
  normal: BASE_DRUGS,
  hard: [...BASE_DRUGS, MENGYA_5_80_DRUG],
};

export const PATIENTS_BY_MODE: Record<GameMode, readonly [PatientCase, PatientCase]> = {
  normal: [
    {
      patientIndex: 1,
      patientName: '林陳秀蘭 阿姨',
      shortName: '林阿姨',
      pronoun: '她',
      patientMeta: '第 1 位客人 · 慢性病處方箋',
      rxNumber: 'RX-0418',
      portraitAsset: GAME_ASSETS.patientWarm,
      dispenseSubtitle: '開始計時，照著處方箋點藥盒拿藥',
      dispenseDialogue: '「藥師早安！這張是醫院開的藥單，麻煩你慢慢確認沒關係。」',
      deliverDialogue: '藥都拿好了，林阿姨拿著健保卡在櫃檯前等著。',
      consultSubtitle: '林阿姨接過藥袋準備離開',
      consultDialogue: '「謝謝喔！明早我就照平常習慣一起配水吞。」',
      consultBehavior: 'calcium_catch',
      items: [
        {
          targetDrugId: 'haohuijiang_5',
          displayName: '好會降',
          strength: '5 mg',
          requiredQty: 14,
          dosageInstruction: '每天 1 顆，共 14 天',
        },
        {
          targetDrugId: 'haoyajiang_80',
          displayName: '好壓降',
          strength: '80 mg',
          requiredQty: 28,
          dosageInstruction: '每天 1 顆，共 28 天',
        },
        {
          targetDrugId: 'hujianing_50',
          displayName: '護甲寧',
          strength: '50 mcg',
          requiredQty: 14,
          dosageInstruction: '每天早上空腹 1 顆，共 14 天',
        },
      ],
    },
    {
      patientIndex: 2,
      patientName: '王明德 阿北',
      shortName: '王阿北',
      pronoun: '他',
      patientMeta: '第 2 位客人 · 附近熟客',
      rxNumber: 'RX-0419',
      portraitAsset: GAME_ASSETS.patient2Warm,
      dispenseSubtitle: '留意這張處方的劑量跟上一位不一樣',
      dispenseDialogue: '「藥師你好，辛苦了！這張是我的高劑量處方，再麻煩你。」',
      deliverDialogue: '這張處方的劑量跟上一位不同，交給王阿北前要特別留意。',
      consultSubtitle: '王阿北接過藥袋親切詢問',
      consultDialogue: '「請問這次吃藥有沒有要特別注意的地方？」',
      consultBehavior: 'polite_ok',
      items: [
        {
          targetDrugId: 'haohuijiang_10',
          displayName: '好會降',
          strength: '10 mg',
          requiredQty: 14,
          dosageInstruction: '睡前 1 顆，共 14 天',
        },
        {
          targetDrugId: 'haoyajiang_160',
          displayName: '好壓降',
          strength: '160 mg',
          requiredQty: 14,
          dosageInstruction: '每天 1 顆，共 14 天',
        },
      ],
    },
  ],
  hard: [
    {
      patientIndex: 1,
      patientName: '張國雄 阿北',
      shortName: '張阿北',
      pronoun: '他',
      patientMeta: '第 1 位客人 · 醫院處方箋',
      rxNumber: 'NHI-093',
      portraitAsset: GAME_ASSETS.uncleHard,
      dispenseSubtitle: '客人正在催促，別拿錯藥名、劑量跟顆數',
      dispenseDialogue: '「快一點啦！機車停紅線，猛壓降 5/80 趕快包一包！」',
      deliverDialogue: '阿北一直在催，手指不停敲著櫃檯。',
      consultSubtitle: '阿北拿著藥袋準備轉身',
      consultDialogue: '「總算拿到了！明天照平常一起吞，我先走囉？」',
      consultBehavior: 'calcium_catch',
      items: [
        {
          targetDrugId: 'mengya_5_80',
          displayName: '猛壓降',
          strength: '5/80',
          requiredQty: 28,
          dosageInstruction: '每天 1 顆，共 28 天',
        },
        {
          targetDrugId: 'haoyajiang_80',
          displayName: '好壓降',
          strength: '80 mg',
          requiredQty: 28,
          dosageInstruction: '每天 1 顆，共 28 天',
        },
        {
          targetDrugId: 'hujianing_100',
          displayName: '護甲寧',
          strength: '100 mcg',
          requiredQty: 14,
          dosageInstruction: '每天早上空腹 1 顆，共 14 天',
        },
      ],
    },
    {
      patientIndex: 2,
      patientName: '陳美鳳 阿姨',
      shortName: '陳阿姨',
      pronoun: '她',
      patientMeta: '第 2 位客人 · 趕時間領藥',
      rxNumber: 'NHI-094',
      portraitAsset: GAME_ASSETS.patient2Hard,
      dispenseSubtitle: '兩種都是高劑量，記得仔細看清楚數字',
      dispenseDialogue: '「藥師快喔，我要接孫子下課！包好刷卡就好。」',
      deliverDialogue: '陳阿姨伸手催著要拿藥，眼睛一直看著門外。',
      consultSubtitle: '阿姨拿了藥袋往門口走',
      consultDialogue: '「卡刷完了吧？我要走囉！」',
      consultBehavior: 'impatient_dismiss',
      items: [
        {
          targetDrugId: 'haohuijiang_10',
          displayName: '好會降',
          strength: '10 mg',
          requiredQty: 14,
          dosageInstruction: '睡前 1 顆，共 14 天',
        },
        {
          targetDrugId: 'haoyajiang_160',
          displayName: '好壓降',
          strength: '160 mg',
          requiredQty: 14,
          dosageInstruction: '每天 1 顆，共 14 天',
        },
      ],
    },
  ],
};

/** 3 slow-moving items totaling 120 NTD + 30 NTD target drug = 150 NTD free shipping */
export const HARD_SLOW_MOVING_ITEMS: readonly SlowMovingItem[] = [
  {
    id: 'slow_ear_drops',
    name: '冷門耳道滴劑（2 瓶）',
    subtitle: '半年賣不到 1 瓶',
    price: 40,
  },
  {
    id: 'slow_gummy',
    name: '過季葉黃素軟糖組',
    subtitle: '效期剩 9 個月，架上還很多',
    price: 40,
  },
  {
    id: 'slow_cream',
    name: '生疏廠牌修護霜（2 條）',
    subtitle: '客人不認識這牌，不好賣',
    price: 40,
  },
];

export const INTRO_STAGE_COPY = {
  normalProcure: {
    title: '第 1 步 · 開門叫貨',
    subtitle: '先決定今天要花多少錢進貨',
    speaker: '藥師筆記',
    dialogue: '今天開門手頭有現金 300 元、架上已有 300 元的藥。先決定怎麼叫貨吧！',
  },
  hardProcure: {
    title: '第 1 步 · 找藥的阿北',
    subtitle: '雨天傍晚，阿北拿著醫院藥單走進來',
    speaker: '張國雄 阿北',
    dialogue: '「這張『猛壓降 5/80』我問三間都沒貨！醫師開 28 顆，明天就要吃，能幫我拿嗎？」',
  },
  hardTrap: {
    title: '第 2 步 · 湊免運的兩難',
    subtitle: '這盒藥進價 30 元，但藥商要滿 150 才免運',
    speaker: '藥師的算盤',
    dialogue: '沒滿 150 元要多付 60 元運費，而且打烊還要扣今日房租與電費分攤 15 元……',
  },
} as const;

/** 結局 C（普通模式）：藥師自己發現錯誤、主動承擔，名字與代名詞依拿錯藥的客人而定 */
export function buildNormalEndingCSummary(name: string, pronoun: '她' | '他'): string {
  return `打烊前核對今天的處方時，你發現下午給${name}的藥拿錯了。你心一沉，立刻打電話過去。${name}已經吃了一顆，覺得有點頭暈。你請${pronoun}先別再吃，親自把正確的藥送到${pronoun}家，並陪${pronoun}聯絡醫師確認。所幸及時發現，沒有造成大礙。但掛上電話後，你在空蕩蕩的藥局裡坐了很久：${name}那麼信任你，你卻差點讓${pronoun}受傷。對藥師來說，「拿對藥」從來不是 99 分就可以，因為那一顆錯的藥，就落在一個真實的人身上。`;
}

export const ENDINGS: Record<EndingId, EndingDefinition> = {
  A: {
    id: 'A',
    codeLabel: '結局 A · 圓滿過關',
    titleNormal: '讓人安心的社區好藥師',
    titleHard: '在現實夾縫裡守住專業',
    tone: 'good',
    summaryNormal:
      '好壓降 80／160 mg、護甲寧 50／100 mcg，這些長得很像的藥盒，加上每排 10、14、15 顆不同的包裝，你一顆都沒拿錯。你還多問了一句，幫林阿姨擋下鈣片影響吸收的風險，也讓王阿北安心地道謝。一袋藥「到你手上之前」，就是靠這份細心才能吃得安全。',
    summaryHard:
      '冷門藥「猛壓降 5/80」拆盒會剩藥、藥商滿 150 元才免運、阿北開口要贈品、趕時間的阿姨催著要走，打烊還要付今日房租與電費 15 元。即使如此，你仍零失誤撐過了這一天。用心提醒吃藥，有時只換來一句「上面不是都有寫」，但這份把關正是社區藥局最珍貴的價值。',
    knowledgeTitle: '藥局小知識｜為什麼藥師總要「當面點清」又「多問兩句」？',
    knowledgeBody:
      '藥師在櫃檯前跟您一起核對藥名、劑量和排數，可以避免拿錯劑量（例如 50 mcg 和 100 mcg 就差了一倍），也能避免回家後才覺得「好像少一排」卻說不清楚。多花幾十秒問您有沒有同時吃中藥、其他診所的西藥或保健食品，常能提早發現連您自己都不知道的「藥品打架」（交互作用）；就算確認沒問題，也能吃得更安心。',
    knowledgeSource: '社區藥局領藥核對與用藥諮詢實務',
  },
  '1B': {
    id: '1B',
    codeLabel: '結局 1B · 過關但現金吃緊',
    titleNormal: '看起來賺得多，手頭現金卻很緊',
    titleHard: '撐過了今天，但手頭現金很吃緊',
    tone: 'bad',
    summaryNormal:
      '你一顆不差地拿對所有藥，也提醒林阿姨避開鈣片的影響，帳面上看起來還多賺了一些。但早上一次進了太多貨，收銀機裡的現金所剩不多，錢幾乎都變成了架上的藥。接下來如果要臨時叫貨或遇到突發花費，就很難應變了。',
    summaryHard:
      '你零失誤配完每一顆藥，守住了用藥安全，也付清今天的房租與電費。但手頭現金只剩一點點，錢幾乎都壓在架上的藥裡。明天只要再多幾筆臨時叫貨或意外花費，小藥局就很難撐下去了。',
    knowledgeTitle: '藥局幕後｜為什麼看起來有賺錢，小藥局還是很有壓力？',
    knowledgeBody:
      '很多人以為一次多叫一點貨、壓低進價就能多賺，但對小藥局來說，把現金都換成架上的藥，就像把活錢鎖進櫃子裡：架上滿滿的，收銀機裡能馬上用的錢卻很少。萬一明天要幫客人急叫其他藥、付貨款，或有藥賣不掉放到過期，就很容易周轉不過來。',
    knowledgeSource: '社區藥局日常現金流與備藥經驗',
  },
  B: {
    id: 'B',
    codeLabel: '結局 B · 沒問出吃藥衝突',
    titleNormal: '藥都拿對了，藥效卻打了折',
    titleHard: '被忽略的鈣片，藥效白白流失',
    tone: 'bad',
    summaryNormal:
      '這次每一顆藥都拿對了，但因為趕時間沒有多問，你沒發現林阿姨每天早上都把高劑量鈣片和護甲寧一起吞。鈣片會在腸胃裡和藥品結合，讓身體吸收得變少。接下來幾個月，她的甲狀腺數值一直控制不好，常覺得疲倦、怕冷，血脂也跟著偏高。原來把藥拿對只是第一步，「配什麼吃、怎麼吃」同樣影響健康。',
    summaryHard:
      '在運費、催促和帳單的壓力下，你只想趕快把藥交給阿北，沒有停下來問他平常怎麼吃藥。阿北回家後，把兒子買的高劑量鈣片和護甲寧一起吞了好幾個月，藥品吸收變差，甲狀腺數值一直控制不好，整個人疲倦無力。省下幾秒鐘沒問的話，讓前面辛苦找藥、配藥的努力打了折扣。',
    knowledgeTitle: '用藥小知識｜保健食品、中藥、別科西藥，都可能跟處方藥打架',
    knowledgeBody:
      '很多長輩覺得保健食品是補身體的，中藥和西藥分開看也沒關係。但高劑量鈣片、鐵劑或制酸胃藥，可能和甲狀腺藥、骨質疏鬆藥或某些抗生素結合，讓藥效變弱；丹參、當歸等活血類中藥或銀杏，和抗凝血藥一起吃則可能增加出血風險。領藥時請主動告訴藥師您平常吃的保健食品、中藥和其他西藥。有些只要錯開時間吃就好，有些則不適合一起吃，讓藥師幫您看過最安心。',
    knowledgeSource: '日常用藥與保健食品、中藥併用安全指引',
  },
  C: {
    id: 'C',
    codeLabel: '結局 C · 拿錯藥了',
    titleNormal: '一顆藥的重量',
    titleHard: '壓垮小藥局的醫療賠償',
    tone: 'critical',
    summaryNormal:
      buildNormalEndingCSummary('林阿姨', '她'),
    summaryHard:
      '在催促、虧損與疲勞的層層壓力下，你看漏了藥盒上的劑量數字（像好壓降 80／160 mg、護甲寧 50／100 mcg），或是剪錯了每排的顆數。客人誤服後住院，醫療訴訟與賠償讓小藥局面臨停業危機。但比賠償更沉重的，是一想到自己拿錯藥傷害了一個人，那份內疚久久揮之不去。',
    knowledgeTitle: '用藥小知識｜領藥一起核對，回家發現不一樣先別吃',
    knowledgeBody:
      '領藥時可以跟藥師一起核對藥名和劑量；回家後如果發現藥的顏色、形狀跟平常不一樣，先別吃，打電話問藥局。',
    knowledgeSource: '台灣病人安全給藥錯誤防範整理',
  },
  D: {
    id: 'D',
    codeLabel: '結局 D · 失去信任',
    titleNormal: '等得不耐煩，客人走了',
    titleHard: '客訴與失望，鄰居不再來',
    tone: 'bad',
    summaryNormal:
      '配藥和確認花了太久，客人在櫃檯前越等越焦急，最後失去耐心，決定下次改去別家領藥。社區藥師每天都在「一顆都不能錯的細心」和「不讓客人久等的速度」之間拉扯，哪一邊沒拿捏好，都可能失去信任。',
    summaryHard:
      '等太久、依健保規定不能送贈品招徠，或是沒當面點清引發的「少給一排」爭執，讓鄰居對這間小藥局失去信任。客人轉身走向隔壁的連鎖藥局。你看著抽屜裡特地幫阿北叫貨、拆盒剩下的 2 顆「猛壓降 5/80」：既然沒人會再來領，它們只能放到過期報廢。',
    knowledgeTitle: '藥局幕後｜當面一起點清藥排，其實最省事也最安心',
    knowledgeBody:
      '社區藥局最常見的誤會，就是趕時間沒有當面點清，回家打開藥袋才覺得少了一排，雙方都說不清楚，藥師常只好自掏腰包補發。下次領藥時，不妨和藥師一起當面確認藥名和排數，短短十秒鐘，就能省下事後多跑一趟和不必要的誤會。',
    knowledgeSource: '社區藥局領藥現場實務觀察',
  },
  E: {
    id: 'E',
    codeLabel: '結局 E · 現金見底',
    titleNormal: '藥堆滿架上，口袋沒現金',
    titleHard: '錢全卡在藥架上，被迫關門',
    tone: 'critical',
    summaryNormal:
      '為了拿到更便宜的進貨價，或是怕缺藥，你一口氣囤了太多貨，原本夠用的現金全變成了架上還沒賣出的藥。要付貨款和房租時，收銀機卻拿不出錢。就算架上擺得滿滿的，小藥局還是只能拉下鐵門。',
    summaryHard:
      '架上本來就壓了不少藥，再加上為了省運費硬湊的冷門商品、為了留住客人自掏腰包送的贈品，或是沒當面核對而貼錢補發的藥，打烊扣完今日房租與電費 15 元後，現金見底了。「藥架滿滿的，口袋卻沒錢周轉」，正是許多獨立小藥局撐不下去的真實寫照。',
    knowledgeTitle: '藥局幕後｜為什麼有些冷門藥，小藥局不一定隨時有貨？',
    knowledgeBody:
      '醫院的慢性病處方常開 28 天份，但藥廠一盒常是 30 顆或 100 顆。冷門藥拆盒後剩下的幾顆（像這次的 2 顆猛壓降），如果沒有其他客人吃同一種藥，往往只能放到過期報廢。藥商叫貨又常有免運門檻，為了省運費硬湊賣不掉的商品，會讓現金卡在貨架上；再扣掉房租、電費和人事開銷，小藥局其實常常在賠本服務。如果藥局需要幫您特別叫貨、請您等一兩天，多一點體諒就是最大的支持。',
    knowledgeSource: '台灣獨立社區藥局經營現況觀察',
  },
};

export const ENDING_ORDER: readonly EndingId[] = ['A', '1B', 'B', 'C', 'D', 'E'];
