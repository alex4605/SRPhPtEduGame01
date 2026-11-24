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
    usageNote: '14 顆/片',
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
    usageNote: '15 顆/片',
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
    usageNote: '10 顆/片，容易跟 100 mcg 搞混',
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
    usageNote: '10 顆/片',
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
  usageNote: '15 顆/片',
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
      patientMeta: '第 1 位客人 · 慢性病處方箋',
      rxNumber: 'RX-0418',
      portraitAsset: GAME_ASSETS.patientWarm,
      dispenseSubtitle: '開始計時，照著處方箋點藥盒拿藥',
      dispenseDialogue: '「藥師早安！這張是醫院開的藥單，麻煩你慢慢確認沒關係。」',
      deliverDialogue: '藥拿好了。要跟客人當面再確認一次，還是直接刷卡給藥？',
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
      patientMeta: '第 2 位客人 · 附近熟客',
      rxNumber: 'RX-0419',
      portraitAsset: GAME_ASSETS.patient2Warm,
      dispenseSubtitle: '留意這張處方的劑量跟上一位不一樣',
      dispenseDialogue: '「藥師你好，辛苦了！這張是我的高劑量處方，再麻煩你。」',
      deliverDialogue: '這張藥單的劑量跟上一位不同，給藥前要再確認一次嗎？',
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
      patientMeta: '第 1 位客人 · 醫院處方箋',
      rxNumber: 'NHI-093',
      portraitAsset: GAME_ASSETS.uncleHard,
      dispenseSubtitle: '客人正在催促，別拿錯藥名、劑量跟顆數',
      dispenseDialogue: '「快一點啦！機車停紅線，猛壓降 5/80 趕快包一包！」',
      deliverDialogue: '阿北一直在催。確定藥名、劑量跟顆數都拿對了嗎？',
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
      patientMeta: '第 2 位客人 · 趕時間領藥',
      rxNumber: 'NHI-094',
      portraitAsset: GAME_ASSETS.patient2Hard,
      dispenseSubtitle: '兩種都是高劑量，記得仔細看清楚數字',
      dispenseDialogue: '「藥師快喔，我要接孫子下課！包好刷卡就好。」',
      deliverDialogue: '阿姨伸手催著要拿藥。要當面再核對，還是直接刷卡？',
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

export const ENDINGS: Record<EndingId, EndingDefinition> = {
  A: {
    id: 'A',
    codeLabel: '結局 A · 圓滿過關',
    titleNormal: '讓人安心的社區好藥師',
    titleHard: '在現實夾縫裡守住專業',
    tone: 'good',
    summaryNormal:
      '你在一堆長得很像的藥盒（像是好壓降 80／160 mg、護甲寧 50／100 mcg）與 10／14／15 顆一排的不同包裝之間，一顆不差地拿對所有藥；還主動多問一句，幫林阿姨擋下鈣片跟藥打架的風險，也讓王阿北安心笑著道謝。一袋藥「到你手上之前」，正是靠這份細心才能吃得安全。',
    summaryHard:
      '面對冷門藥「猛壓降 5/80」拆盒會剩藥、藥商滿 150 才免運、阿北開口要贈品、趕時間的阿姨又催著走，再加上今日房租與電費分攤 15 元，你依然零失誤撐過了這一天。即使熱心提醒怎麼吃藥有時只換來一句「上面不是都有寫，不用講那麼多」，這份把關仍是社區藥局最珍貴的價值。',
    knowledgeTitle: '藥局小知識｜為什麼藥師總要「當面點清」又「多問兩句」？',
    knowledgeBody:
      '藥師在櫃檯前跟您一起核對藥名、劑量和排數，不只是為了避免拿錯劑量（例如 50 mcg 跟 100 mcg 劑量就差了一倍），也是保護雙方避免回家後才覺得「少給一片」說不清楚。而多花幾十秒問您有沒有同時吃中藥、別家診所的西藥或保健食品，常常能提早抓出連自己都不知道的「藥品打架」——就算確認沒問題，也能讓長輩吃得更放心。',
    knowledgeSource: '社區藥局領藥核對與用藥諮詢實務',
  },
  '1B': {
    id: '1B',
    codeLabel: '結局 1B · 過關但現金吃緊',
    titleNormal: '看起來賺得多，手頭現金卻很緊',
    titleHard: '撐過了今天，但手頭現金很吃緊',
    tone: 'bad',
    summaryNormal:
      '你一顆不差地拿對所有藥，也細心提醒林阿姨避開鈣片衝突，看起來比平常多賺了一些；但因為開門一次進了太多貨，現在收銀機裡的現金剩沒多少，錢幾乎全變成架上的藥。接下來要是遇到臨時要叫貨或突發花費，手頭就沒什麼空間可以應變了。',
    summaryHard:
      '你零失誤配完每一顆藥、守住用藥安全，也付清了今天的房租與電費；但你現在手頭現金只剩一點點，錢幾乎全都壓在架上的藥裡。明天只要再多幾筆臨時叫貨或意外花費，小藥局能應變的空間就不大了。',
    knowledgeTitle: '藥局幕後｜為什麼看起來有賺錢，小藥局還是很有壓力？',
    knowledgeBody:
      '很多人以為藥局一次多叫一點貨、壓低進價就能多賺一點，但對小藥局來說，把現金全換成架上的藥，就像把活錢全鎖進櫃子裡——看起來架上滿滿的，收銀機裡能馬上拿出來用的現金卻變得很薄。萬一明天突然要幫客人急叫其他藥、付貨款，或遇到賣不掉放到過期的藥，手頭沒留夠現金，很容易一下子就週轉不過來。',
    knowledgeSource: '社區藥局日常現金流與備藥經驗',
  },
  B: {
    id: 'B',
    codeLabel: '結局 B · 沒問出吃藥衝突',
    titleNormal: '吃滿三個月，藥效卻大打折扣',
    titleHard: '被忽略的鈣片，白吃三個月',
    tone: 'bad',
    summaryNormal:
      '這一次你的藥每一顆都拿對了，但因為趕時間沒有多問幾句，沒發現林阿姨每天早上都把高劑量鈣片跟護甲寧一起吞。鈣片在腸胃裡抓住了藥品、大幅減少吸收，讓她連吃三個月甲狀腺數值都控制不好，不只常覺得疲倦怕冷，還連帶讓血脂偏高、增加身體負擔。原來把藥拿對只是第一步，「配什麼吃、怎麼吃」同樣關係到健康。',
    summaryHard:
      '在運費虧損、催促與帳單的壓力下，你只想趕快把藥交給阿北，沒停下來問他平常吃藥的習慣。阿北回家把兒子買的高劑量鈣片跟護甲寧一起吞了三個月，藥品吸收大幅減少，甲狀腺數值一直控制不好、整個人疲倦無力也加重心血管負擔。省下短短幾秒鐘的問話，卻讓前面千辛萬苦找藥、配藥的努力打了折扣。',
    knowledgeTitle: '用藥小知識｜保健食品、中藥、別科西藥，都可能跟處方藥打架',
    knowledgeBody:
      '很多長輩覺得「保健食品是補身體的、中藥跟西藥分開看診沒關係」，但高劑量鈣片、鐵劑或胃藥常會把甲狀腺藥、骨鬆藥或特定抗生素「抓住」不讓身體吸收，讓藥效變弱；部分活血中藥（如丹參、銀杏、當歸）跟抗凝血藥一起吃，更可能增加出血風險。下次領藥時，記得主動告訴藥師您平常有吃哪些保健品、中藥或其他西藥——有些藥品只要錯開時間吃，兩邊都能發揮原本的效果；但也有些藥品光靠隔開時間還是沒辦法恢復效果，先讓藥師幫您看過最安心！',
    knowledgeSource: '日常用藥與保健食品、中藥併用安全指引',
  },
  C: {
    id: 'C',
    codeLabel: '結局 C · 拿錯藥了',
    titleNormal: '無法重來的給藥失誤',
    titleHard: '壓垮小藥局的醫療賠償',
    tone: 'critical',
    summaryNormal:
      '你拿錯了長得太像的藥盒劑量，或是算錯了 10／14／15 顆一排的顆數，給藥前又沒停下來再看一眼。客人回家誤吃錯誤劑量後引發嚴重不適住院半個月，家屬隨即提告求償。然而比官司更折磨人的，是之後無數個睡不著的夜晚——你反覆想起櫃檯前那幾秒鐘，因為自己一時疏忽真的傷害了信任你的人，內心內疚不已、久久無法釋懷。',
    summaryHard:
      '在催促、虧損與疲勞的雙重壓力下，你終究看漏了藥盒上的劑量數字（像好壓降 80／160 mg、護甲寧 50／100 mcg），或是剪錯了 10／15 顆一排的顆數。客人誤服住院後引發醫療訴訟與巨額求償，讓小藥局面臨停業危機。比起賠償金額，腦海裡反覆浮現因為自己拿錯藥而傷害了一個人，那份沉重到喘不過氣的內疚久久揮之不去。',
    knowledgeTitle: '藥局小知識｜為什麼領藥時常要多等幾分鐘？',
    knowledgeBody:
      '台灣常見的慢性病用藥，常常同廠牌、盒子顏色幾乎一樣，但劑量差了整整兩倍（像是好壓降 80 mg 與 160 mg、護甲寧 50 mcg 與 100 mcg、好會降 5 mg 與 10 mg），一旦拿錯就可能讓人頭暈跌倒、心悸或血壓過低。加上醫師常開 14 天或 28 天份，偏偏藥廠包裝有 10 顆一排、14 顆一排、15 顆一排，藥師常常得一片片親手剪開細數。下次領藥時如果等得稍微久一點，其實藥師正在替您把關每一顆藥的安全！',
    knowledgeSource: '台灣病人安全給藥錯誤防範整理',
  },
  D: {
    id: 'D',
    codeLabel: '結局 D · 失去信任',
    titleNormal: '等得不耐煩，客人走了',
    titleHard: '客訴與失望，鄰居不再來',
    tone: 'bad',
    summaryNormal:
      '配藥跟確認花太久時間，客人在櫃檯前越看手錶越焦慮，最後失去耐心、對藥局留下不好的印象，決定下次改去別家領藥。社區藥師每天都在「一顆都不能錯的細心」和「不讓客人久等的速度」之間拉扯，哪一邊沒拿捏好都可能失去信任。',
    summaryHard:
      '等太久、依法不能送贈品，或是沒當面點清引爆的「少給一片」爭執，讓鄰居對這間小藥局失去信任。客人轉身走向隔壁連鎖藥局，你看著抽屜裡特地幫阿北叫貨、拆盒剪剩的那 2 顆冷門「猛壓降 5/80」——既然沒有人會再回來領，它們就只能放到過期報廢。',
    knowledgeTitle: '藥局幕後｜當面一起點清藥排，其實最省事也最安心',
    knowledgeBody:
      '在社區藥局裡，最容易發生的誤會就是「趕時間沒當面點清楚」，回家打開藥袋覺得少了一片時雙方都說不清，藥師為了平息爭執常只能自掏腰包補發。下次領藥時，不妨配合藥師當面一起確認藥名和排數，短短十秒鐘就能避免事後多跑一趟跟不必要的誤會！',
    knowledgeSource: '社區藥局領藥現場實務觀察',
  },
  E: {
    id: 'E',
    codeLabel: '結局 E · 現金見底',
    titleNormal: '藥堆滿架上，口袋沒現金',
    titleHard: '錢全卡在藥架上，被迫關門',
    tone: 'critical',
    summaryNormal:
      '為了拿更便宜的進貨價或怕缺藥而一口氣囤太多貨，把原本夠用的現金全變成了架上還沒賣掉的藥。當要付貨款跟房租、收銀機卻拿不出現金周轉時，就算架上擺得滿滿的，小藥局還是只能無奈拉下鐵門。',
    summaryHard:
      '原本架上就已經壓了不少藥，加上為了省運費硬湊的冷門商品、為了留客人自費送的贈品，或是沒當面核對自費補片的虧損，打烊扣完今日房租與電費分攤 15 元後手頭現金見底——「看起來藥架滿滿的，口袋裡卻沒錢再周轉」，正是許多獨立小藥局撐不下去的真實寫照。',
    knowledgeTitle: '藥局幕後｜為什麼有些冷門藥，小藥局不一定隨時有貨？',
    knowledgeBody:
      '醫院慢性病處方常開 28 天份，但藥廠原裝一盒常是 30 顆或 100 顆，冷門藥拆盒後剩下的零星幾顆（像這次剩下的 2 顆猛壓降）如果沒有其他客人吃同一款藥，往往只能放到過期變成「呆藥」直接虧掉；加上藥商叫貨常有免運門檻，為了省運費硬湊賣不掉的商品會把現金卡死在貨架上，再扣掉每月房租、電費與人事開銷，小藥局其實常常在賠本服務。下次如果藥局需要幫您特別叫貨等一兩天，多給一點體諒就是最大的支持！',
    knowledgeSource: '台灣獨立社區藥局經營現況觀察',
  },
};

export const ENDING_ORDER: readonly EndingId[] = ['A', '1B', 'B', 'C', 'D', 'E'];
