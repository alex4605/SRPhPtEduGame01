import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Home, PackageX, Pause, Play } from 'lucide-react';
import { Act1Procurement } from './components/Act1Procurement';
import { Act2ShelvingAndTrap } from './components/Act2ShelvingAndTrap';
import { Act3Dispensing } from './components/Act3Dispensing';
import { Act4Delivery } from './components/Act4Delivery';
import { Act5Consultation } from './components/Act5Consultation';
import { AlmanacModal } from './components/AlmanacModal';
import { EndingScreen } from './components/EndingScreen';
import { IllustrationImage } from './components/IllustrationImage';
import { PrescriptionCard } from './components/PrescriptionCard';
import { TitleMenu } from './components/TitleMenu';
import { TopHud } from './components/TopHud';
import {
  buildNormalEndingCSummary,
  DISPENSE_CAPITAL_COST,
  DISPENSING_TIME_LIMIT_BY_MODE,
  DRUG_CATALOG_BY_MODE,
  GAME_ASSETS,
  getDispenseIncomeByPlan,
  HARD_BULK_CASH_FLOOR,
  HARD_FIXED_COST,
  HARD_MISSING_STRIP_PENALTY_AFFECTION,
  HARD_MISSING_STRIP_PENALTY_MONEY,
  HARD_REFUSE_FREEBIE_AFFECTION_PENALTY,
  HARD_STANDALONE_STATS,
  HARD_WAIT_AFFECTION_PENALTY,
  INITIAL_STATS,
  INTRO_STAGE_COPY,
  LOW_CASH_FLEXIBILITY_THRESHOLD,
  MAX_CAPITAL_SCALE,
  NORMAL_P2_COUNSEL_AFFECTION,
  NORMAL_PROCUREMENT_PLANS,
  NORMAL_SHORTAGE_DRUG_ID,
  PATIENTS_BY_MODE,
} from './data/storyScript';
import {
  ActNumber,
  CoreStats,
  DispensingTray,
  EndingId,
  GameFlags,
  GameMode,
  NormalOrderPlanId,
  PatientCase,
  PatientIndex,
  ScreenState,
  StageId,
  StatDelta,
  UnlockedAlmanac,
} from './types/game';
import { useIdleReturn } from './hooks/useIdleReturn';
import {
  buildExactTray,
  DEFAULT_ALMANAC,
  loadAlmanac,
  saveAlmanac,
  validateTrayAgainstRx,
} from './utils/pharmacy';

const IDLE_RETURN_MS = 120_000;

function resolveActivePatient(
  mode: GameMode,
  patientIndex: PatientIndex,
  hadNormalShortage: boolean
): PatientCase {
  const base = PATIENTS_BY_MODE[mode][patientIndex - 1];
  if (mode === 'normal' && patientIndex === 2 && hadNormalShortage) {
    return {
      ...base,
      dispenseSubtitle: '好壓降 160 mg 已開欠藥單，本次僅先拿好會降 10 mg（14 顆）',
      dispenseDialogue: '「沒關係啦，好壓降我明天再來領，今天先幫我拿好會降 10 mg 就好！」',
      deliverDialogue: '本次僅先給好會降 10 mg（14 顆，好壓降 160 mg 欠藥明天補領）。要再確認一次嗎？',
      items: base.items.filter((item) => item.targetDrugId !== NORMAL_SHORTAGE_DRUG_ID),
    };
  }
  return base;
}

interface StageMeta {
  actNumber: ActNumber;
  title: string;
  subtitle: string;
  speaker: string;
  dialogue: string;
  portraitSrc: string;
}

function resolveStageMeta(
  mode: GameMode,
  stage: StageId,
  patientIndex: PatientIndex,
  activePatient: PatientCase
): StageMeta {
  switch (stage) {
    case 'PROCURE': {
      const copy = mode === 'normal' ? INTRO_STAGE_COPY.normalProcure : INTRO_STAGE_COPY.hardProcure;
      return {
        actNumber: 1,
        title: copy.title,
        subtitle: copy.subtitle,
        speaker: copy.speaker,
        dialogue: copy.dialogue,
        portraitSrc: mode === 'normal' ? GAME_ASSETS.patientWarm : GAME_ASSETS.uncleHard,
      };
    }
    case 'TRAP':
      return {
        actNumber: 2,
        title: INTRO_STAGE_COPY.hardTrap.title,
        subtitle: INTRO_STAGE_COPY.hardTrap.subtitle,
        speaker: INTRO_STAGE_COPY.hardTrap.speaker,
        dialogue: INTRO_STAGE_COPY.hardTrap.dialogue,
        portraitSrc: GAME_ASSETS.uncleHard,
      };
    case 'DISPENSE': {
      const actNumber: ActNumber = mode === 'normal' ? 2 : 3;
      return {
        actNumber,
        title: `第 ${actNumber} 步 · 幫客人拿藥（第 ${patientIndex}/2 位）`,
        subtitle: activePatient.dispenseSubtitle,
        speaker: activePatient.patientName,
        dialogue: activePatient.dispenseDialogue,
        portraitSrc: activePatient.portraitAsset,
      };
    }
    case 'DELIVER': {
      const actNumber: ActNumber = mode === 'normal' ? 3 : 4;
      return {
        actNumber,
        title: `第 ${actNumber} 步 · 櫃檯給藥（第 ${patientIndex}/2 位）`,
        subtitle: '倒數中，決定要不要跟客人當面再確認',
        speaker: '藥局櫃檯',
        dialogue: activePatient.deliverDialogue,
        portraitSrc: activePatient.portraitAsset,
      };
    }
    case 'SHORTAGE':
      return {
        actNumber: 2,
        title: '第 2 步 · 剛好缺藥（第 2/2 位）',
        subtitle: '翻遍藥櫃，高劑量的備藥已經用完了',
        speaker: activePatient.patientName,
        dialogue:
          '「喔……架上剛好沒藥喔？沒關係啦，謝謝藥師還特地幫我查，辛苦你了，我明天再來拿就好！」',
        portraitSrc: activePatient.portraitAsset,
      };
    case 'COMPLAINT':
      return {
        actNumber: 4,
        title: '第 4 步 · 客人回來反映少藥（第 2/2 位）',
        subtitle: '十分鐘後，陳阿姨氣沖沖走回來',
        speaker: activePatient.patientName,
        dialogue: '「你剛剛少給我一片藥啦！沒當面點清楚，現在你要補我！」',
        portraitSrc: activePatient.portraitAsset,
      };
    case 'CONSULT': {
      const actNumber: ActNumber = mode === 'normal' ? 4 : 5;
      return {
        actNumber,
        title: `第 ${actNumber} 步 · 用藥提醒（第 ${patientIndex}/2 位）`,
        subtitle: activePatient.consultSubtitle,
        speaker: activePatient.patientName,
        dialogue: activePatient.consultDialogue,
        portraitSrc: activePatient.portraitAsset,
      };
    }
  }
}

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('MENU');
  const [mode, setMode] = useState<GameMode>('normal');
  const [stage, setStage] = useState<StageId>('PROCURE');
  const [patientIndex, setPatientIndex] = useState<PatientIndex>(1);
  const [stats, setStats] = useState<CoreStats>({ ...INITIAL_STATS });
  const [latestDelta, setLatestDelta] = useState<StatDelta | null>(null);
  const [tray, setTray] = useState<DispensingTray>({});
  const [flags, setFlags] = useState<GameFlags>({
    inspectedInAct4: false,
    counseledCalcium: false,
  });
  const [endingId, setEndingId] = useState<EndingId | null>(null);

  // Cross-stage countdown timer (1s tick + linear CSS bar)
  const [timerActive, setTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [confirmReturnOpen, setConfirmReturnOpen] = useState(false);
  const [timerLimitSec, setTimerLimitSec] = useState<number>(DISPENSING_TIME_LIMIT_BY_MODE.normal);
  const [remainingSec, setRemainingSec] = useState<number>(DISPENSING_TIME_LIMIT_BY_MODE.normal);

  const [almanac, setAlmanac] = useState<UnlockedAlmanac>(loadAlmanac);
  const [almanacOpen, setAlmanacOpen] = useState(false);

  const deltaCounterRef = useRef(0);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const flagsRef = useRef(flags);
  flagsRef.current = flags;

  const trayRef = useRef(tray);
  trayRef.current = tray;

  // Snapshot of stats & procurement pricing tier carried over from Normal Mode clear into Hard Mode
  const hardCarryStatsRef = useRef<CoreStats>({ ...INITIAL_STATS });
  const hardCarryPlanRef = useRef<NormalOrderPlanId>('balanced');

  const unlockEnding = useCallback((id: EndingId, currentMode: GameMode) => {
    setAlmanac((prev) => {
      const next: UnlockedAlmanac = {
        endings: { ...prev.endings, [id]: true },
        completedModes: {
          ...prev.completedModes,
          [currentMode]: id === 'A' || id === '1B' ? true : prev.completedModes[currentMode],
        },
      };
      saveAlmanac(next);
      return next;
    });
  }, []);

  const triggerEnding = useCallback(
    (
      id: EndingId,
      currentMode: GameMode,
      extraFlags?: Partial<GameFlags>,
      finalStatsOverride?: CoreStats
    ) => {
      setTimerActive(false);
      setIsPaused(false);
      setConfirmReturnOpen(false);
      if (finalStatsOverride) {
        statsRef.current = finalStatsOverride;
        setStats(finalStatsOverride);
      }
      if (extraFlags) {
        setFlags((prev) => ({ ...prev, ...extraFlags }));
      }
      setEndingId(id);
      setScreen('ENDING');
      unlockEnding(id, currentMode);
      window.scrollTo(0, 0);
    },
    [unlockEnding]
  );

  // Auto-pause when patient locks phone, switches apps, or gets called to the counter
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && screen === 'PLAYING' && timerActive) {
        setIsPaused(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [screen, timerActive]);

  // Escape key closes return-confirm modal or resumes from pause
  useEffect(() => {
    if (!confirmReturnOpen && !isPaused) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (confirmReturnOpen) {
        setConfirmReturnOpen(false);
      } else if (isPaused) {
        setIsPaused(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmReturnOpen, isPaused]);

  const timerFrozen = isPaused || confirmReturnOpen;

  // 1-second timer tick across DISPENSE and DELIVER
  useEffect(() => {
    if (!timerActive || screen !== 'PLAYING' || timerFrozen) return;

    const intervalId = window.setInterval(() => {
      setRemainingSec((prev) => {
        const next = Math.max(0, prev - 1);
        if (next <= 0) window.clearInterval(intervalId);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerActive, screen, timerFrozen]);

  // Timeout -> Ending D
  useEffect(() => {
    if (!timerActive || screen !== 'PLAYING' || timerFrozen || remainingSec > 0) return;

    const activePatient = PATIENTS_BY_MODE[mode][patientIndex - 1];
    triggerEnding(
      'D',
      mode,
      {
        endingReason:
          mode === 'hard'
            ? `配藥跟確認超過時間了！${activePatient.patientName}徹底失去耐性，甩手說了句「下次不來了！」轉身就走。鄰居一旦失去信任，抽屜裡拆封剩下的冷門藥也再也沒有人會回來領。`
            : `配藥跟確認超過時間，${activePatient.patientName}在櫃檯前越等越焦慮，最後提早離開並對藥局留下不好的印象。速度跟細心之間的平衡，正是每位社區藥師每天面對的難題。`,
      },
      { ...statsRef.current, affection: 0 }
    );
  }, [timerActive, screen, timerFrozen, remainingSec, mode, patientIndex, triggerEnding]);

  const applyStatChange = useCallback(
    (delta: { money?: number; capital?: number; affection?: number }): CoreStats => {
      deltaCounterRef.current += 1;
      setLatestDelta({ id: deltaCounterRef.current, ...delta });

      const curr = statsRef.current;
      const nextStats: CoreStats = {
        money: Math.max(0, curr.money + (delta.money ?? 0)),
        capital: Math.max(0, Math.min(MAX_CAPITAL_SCALE, curr.capital + (delta.capital ?? 0))),
        affection: Math.max(0, Math.min(100, curr.affection + (delta.affection ?? 0))),
      };
      statsRef.current = nextStats;
      setStats(nextStats);
      return nextStats;
    },
    []
  );

  const startDispensingForPatient = useCallback(
    (nextPatient: PatientIndex, targetMode: GameMode) => {
      const duration = DISPENSING_TIME_LIMIT_BY_MODE[targetMode];
      setPatientIndex(nextPatient);
      setTray({});
      setStage('DISPENSE');
      setTimerLimitSec(duration);
      setRemainingSec(duration);
      setIsPaused(false);
      setTimerActive(true);
      window.scrollTo(0, 0);
    },
    []
  );

  const startGame = useCallback(
    (selectedMode: GameMode, carryFromCurrent = false, standaloneHard = false) => {
      if (selectedMode === 'hard' && !almanac.completedModes.normal) return;

      let nextInitialStats: CoreStats = { ...INITIAL_STATS };
      let carriedOrderPlan: NormalOrderPlanId | undefined;
      if (selectedMode === 'hard') {
        if (carryFromCurrent) {
          hardCarryStatsRef.current = { ...statsRef.current };
          hardCarryPlanRef.current = flagsRef.current.normalOrderPlan ?? 'balanced';
        } else if (standaloneHard) {
          hardCarryStatsRef.current = { ...HARD_STANDALONE_STATS };
          hardCarryPlanRef.current = 'balanced';
        }
        nextInitialStats = { ...hardCarryStatsRef.current };
        carriedOrderPlan = hardCarryPlanRef.current;
      }

      setMode(selectedMode);
      setStage('PROCURE');
      setPatientIndex(1);
      statsRef.current = nextInitialStats;
      setStats(nextInitialStats);
      setLatestDelta(null);
      setTray({});
      setFlags({
        normalOrderPlan: carriedOrderPlan,
        inspectedInAct4: false,
        counseledCalcium: false,
      });
      setEndingId(null);
      const initialDuration = DISPENSING_TIME_LIMIT_BY_MODE[selectedMode];
      setTimerActive(false);
      setIsPaused(false);
      setConfirmReturnOpen(false);
      setTimerLimitSec(initialDuration);
      setRemainingSec(initialDuration);
      setScreen('PLAYING');
      window.scrollTo(0, 0);
    },
    [almanac.completedModes.normal]
  );

  const handleReturnMenu = useCallback(() => {
    setTimerActive(false);
    setIsPaused(false);
    setConfirmReturnOpen(false);
    setScreen('MENU');
    window.scrollTo(0, 0);
  }, []);

  // Shared waiting-room tablet: return to the title screen after 2 idle minutes
  // whenever no countdown is running (ending screen, paused game, menus left open).
  useIdleReturn(screen !== 'MENU' && (!timerActive || isPaused), IDLE_RETURN_MS, () => {
    setAlmanacOpen(false);
    handleReturnMenu();
  });

  const handleRequestReturnMenu = useCallback(() => {
    setConfirmReturnOpen(true);
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleSelectNormalPlan = useCallback(
    (planId: NormalOrderPlanId) => {
      const plan = NORMAL_PROCUREMENT_PLANS.find((p) => p.id === planId);
      if (!plan) return;

      const nextStats = applyStatChange({ money: -plan.cost, capital: plan.capitalGain });
      setFlags((prev) => ({ ...prev, normalOrderPlan: planId }));

      if (nextStats.money <= 0) {
        triggerEnding(
          'E',
          'normal',
          {
            normalOrderPlan: planId,
            endingReason:
              '開門叫貨時把現金全拿去買藥了，收銀機一毛不剩，沒錢周轉只好關門。',
          },
          nextStats
        );
        return;
      }

      startDispensingForPatient(1, 'normal');
    },
    [applyStatChange, triggerEnding, startDispensingForPatient]
  );

  const handleCompleteHardIntro = useCallback(() => {
    setStage('TRAP');
    window.scrollTo(0, 0);
  }, []);

  const handleSelectHardOrderOption = useCallback(
    (choice: 'shipping' | 'bulk' | 'wait') => {
      setFlags((prev) => ({ ...prev, hardOrderChoice: choice }));

      const deltaByChoice = {
        bulk: { money: -150, capital: 150 },
        shipping: { money: -90, capital: 30 },
        wait: { money: -30, capital: 30, affection: -HARD_WAIT_AFFECTION_PENALTY },
      } as const;

      const nextStats = applyStatChange(deltaByChoice[choice]);

      if (nextStats.money <= 0) {
        triggerEnding(
          'E',
          'hard',
          {
            hardOrderChoice: choice,
            endingReason:
              choice === 'bulk'
                ? '為了省 60 元運費硬湊 150 元免運，加上之前就壓了不少藥在架上，一下單現金瞬間歸零，小藥局沒錢周轉只好關門。'
                : '之前剩下的現金已經見底，這筆叫貨費用一扣就付不出來，小藥局只好被迫關門。',
          },
          nextStats
        );
        return;
      }

      if (nextStats.affection <= 0) {
        triggerEnding('D', 'hard', { hardOrderChoice: choice }, nextStats);
        return;
      }

      startDispensingForPatient(1, 'hard');
    },
    [applyStatChange, triggerEnding, startDispensingForPatient]
  );

  const handleUpdateTray = useCallback((drugId: string, packs: number, loose: number) => {
    setTray((prev) => ({ ...prev, [drugId]: { packs, loose } }));
  }, []);

  const handleRemoveFromTray = useCallback((drugId: string) => {
    setTray((prev) => {
      const next = { ...prev };
      delete next[drugId];
      return next;
    });
  }, []);

  const handleFinishDispensing = useCallback(() => {
    setStage('DELIVER');
    window.scrollTo(0, 0);
  }, []);

  const handlePauseTimer = useCallback(() => {
    setTimerActive(false);
  }, []);

  const handleAutoFixTray = useCallback(() => {
    const targetPatient = resolveActivePatient(
      mode,
      patientIndex,
      Boolean(flagsRef.current.hadNormalShortage)
    );
    const correctedTray = buildExactTray(DRUG_CATALOG_BY_MODE[mode], targetPatient.items);
    trayRef.current = correctedTray;
    setTray(correctedTray);
    setFlags((prev) => ({ ...prev, inspectedInAct4: true }));
  }, [mode, patientIndex]);

  const handleDeliverMeds = useCallback(
    (didDoubleCheck: boolean) => {
      setTimerActive(false);

      const targetPatient = resolveActivePatient(
        mode,
        patientIndex,
        Boolean(flagsRef.current.hadNormalShortage)
      );
      const errors = validateTrayAgainstRx(
        DRUG_CATALOG_BY_MODE[mode],
        targetPatient.items,
        trayRef.current
      );

      if (errors.length > 0) {
        triggerEnding('C', mode, {
          endingReason:
            mode === 'normal'
              ? buildNormalEndingCSummary(targetPatient.shortName, targetPatient.pronoun)
              : undefined,
          inspectedInAct4: didDoubleCheck || flagsRef.current.inspectedInAct4,
          dispensingErrors: errors,
        });
        return;
      }

      // Award per-patient dispensing income (+12 / +15 / +25) and consume shelf capital (-10)
      const dispenseIncome = getDispenseIncomeByPlan(flagsRef.current.normalOrderPlan);
      applyStatChange({ money: dispenseIncome, capital: -DISPENSE_CAPITAL_COST });

      // Hard Mode P2: Skipped manual face-to-face double-check -> missing strip complaint
      if (mode === 'hard' && patientIndex === 2 && !didDoubleCheck) {
        setFlags((prev) => ({ ...prev, patient2ComplainedMissingStrip: true }));
        setStage('COMPLAINT');
        window.scrollTo(0, 0);
        return;
      }

      setFlags((prev) => ({ ...prev, inspectedInAct4: didDoubleCheck || prev.inspectedInAct4 }));
      setStage('CONSULT');
      window.scrollTo(0, 0);
    },
    [mode, patientIndex, applyStatChange, triggerEnding]
  );

  const handleAcceptMissingStripComplaint = useCallback(() => {
    const nextStats = applyStatChange({
      money: -HARD_MISSING_STRIP_PENALTY_MONEY,
      affection: -HARD_MISSING_STRIP_PENALTY_AFFECTION,
    });

    if (nextStats.money <= 0) {
      triggerEnding(
        'E',
        'hard',
        {
          patient2ComplainedMissingStrip: true,
          endingReason:
            '給藥時沒有當面一起點清排數，陳阿姨回來反映少給一片時百口莫辯；自己貼錢補發一片扣掉 45 元後，收銀機現金見底，小藥局沒辦法周轉只好關門。',
        },
        nextStats
      );
      return;
    }

    if (nextStats.affection <= 0) {
      triggerEnding(
        'D',
        'hard',
        {
          patient2ComplainedMissingStrip: true,
          endingReason:
            '給藥時沒有當面一起點清，陳阿姨氣沖沖跑回來大聲抱怨少給一片，旁邊等領藥的鄰居全都看在眼裡，大家對藥局失去信心，之後都改去別家領藥。',
        },
        nextStats
      );
      return;
    }

    setStage('CONSULT');
    window.scrollTo(0, 0);
  }, [applyStatChange, triggerEnding]);

  const handleNormalP1Complete = useCallback(
    (didCounsel: boolean) => {
      if (!didCounsel) {
        triggerEnding('B', 'normal', { counseledCalcium: false });
        return;
      }
      applyStatChange({ affection: 10 });
      setFlags((prev) => ({ ...prev, counseledCalcium: true }));

      const selectedPlan = NORMAL_PROCUREMENT_PLANS.find(
        (p) => p.id === flagsRef.current.normalOrderPlan
      );

      if (selectedPlan?.triggersShortage) {
        setPatientIndex(2);
        setTimerActive(false);
        setStage('SHORTAGE');
        window.scrollTo(0, 0);
        return;
      }

      startDispensingForPatient(2, 'normal');
    },
    [applyStatChange, triggerEnding, startDispensingForPatient]
  );

  const handleCompleteShortage = useCallback(() => {
    applyStatChange({ affection: -5 });
    const nextFlags: GameFlags = { ...flagsRef.current, hadNormalShortage: true };
    flagsRef.current = nextFlags;
    setFlags(nextFlags);
    startDispensingForPatient(2, 'normal');
  }, [applyStatChange, startDispensingForPatient]);

  const handleNormalP2Complete = useCallback(
    (didCounsel: boolean) => {
      const hadShortage = Boolean(flagsRef.current.hadNormalShortage);
      const nextStats = didCounsel
        ? applyStatChange({ affection: NORMAL_P2_COUNSEL_AFFECTION })
        : statsRef.current;

      const isTightCash = nextStats.money <= LOW_CASH_FLEXIBILITY_THRESHOLD;
      if (isTightCash) {
        const totalDiff = nextStats.money + nextStats.capital - (INITIAL_STATS.money + INITIAL_STATS.capital);
        triggerEnding(
          '1B',
          'normal',
          {
            endingReason: `你一顆不差地拿對了所有藥，也替林阿姨擋下鈣片跟藥打架的風險，算起來比剛開店時多了 +${totalDiff} 元；但因為早上一次進太多貨，你現在手頭現金只剩 ${nextStats.money} 元，有 ${nextStats.capital} 元全變成架上的藥——接下來遇到臨時叫貨或突發花費，能應變的空間就不大了。`,
          },
          nextStats
        );
        return;
      }

      if (didCounsel) {
        triggerEnding(
          'A',
          'normal',
          {
            endingReason: hadShortage
              ? '你細心幫林阿姨擋下鈣片跟護甲寧 50 mcg 打架的風險；雖然早上選了小量備貨，讓王阿北的「好壓降 160 mg」剛好沒貨（開立欠藥單、好感 -5），你仍零失誤先配好「好會降 10 mg（14 顆）」並細心確認他的用藥習慣，阿北依然笑著向你道謝、約好明天再來補領！'
              : '你在一堆長得很像的藥盒（好壓降 80／160 mg、護甲寧 50／100 mcg）與 10／14／15 顆排裝之間全部拿對，還主動幫林阿姨擋下鈣片跟藥打架的風險，也讓王阿北在確認沒同時吃中藥或其他西藥後安心禮貌道謝——你是讓人很放心的社區好藥師！',
          },
          nextStats
        );
      } else {
        triggerEnding(
          'A',
          'normal',
          {
            endingReason: hadShortage
              ? '你成功幫林阿姨擋下鈣片跟藥打架的風險，雖然王阿北的「好壓降 160 mg」缺貨先開欠藥單，你仍正確先發了「好會降 10 mg（14 顆）」讓他帶回家吃。'
              : '你成功幫林阿姨擋下鈣片跟藥打架的風險，也一顆不差地拿對了王阿北的高劑量藥品。雖然最後趕時間沒有多聊幾句，兩位鄰居都順利領到今天的藥。',
          },
          nextStats
        );
      }
    },
    [applyStatChange, triggerEnding]
  );

  const handleHardP1QuickSkip = useCallback(() => {
    triggerEnding('B', 'hard', { counseledCalcium: false });
  }, [triggerEnding]);

  const handleHardP1CounselSuccess = useCallback(() => {
    applyStatChange({ affection: 10 });
    setFlags((prev) => ({ ...prev, counseledCalcium: true }));
  }, [applyStatChange]);

  const handleHardP1FreebieDecision = useCallback(
    (choice: 'refuse' | 'patch') => {
      if (choice === 'refuse') {
        const nextStats = applyStatChange({ affection: -HARD_REFUSE_FREEBIE_AFFECTION_PENALTY });
        setFlags((prev) => ({ ...prev, gavePatch: false }));
        if (nextStats.affection <= 0) {
          triggerEnding(
            'D',
            'hard',
            {
              gavePatch: false,
              endingReason:
                '前面等太久累積的怨氣加上照規定不能送贈品，阿北冷回一句「下次去隔壁領啦！」轉身就走。你看著抽屜裡特地幫他叫貨、剪剩的 2 顆「猛壓降 5/80」——徹底變成了沒人會再回來領的過期呆藥。',
            },
            nextStats
          );
          return;
        }
        startDispensingForPatient(2, 'hard');
        return;
      }

      const nextStats = applyStatChange({ money: -20, affection: 10 });
      setFlags((prev) => ({ ...prev, gavePatch: true }));
      if (nextStats.money <= 0) {
        triggerEnding(
          'E',
          'hard',
          {
            gavePatch: true,
            endingReason:
              '為了留住客人自己貼錢送出 20 元痠痛貼布後，收銀機現金歸零，連下一位客人跟今日房租電費都撐不到只好關門。',
          },
          nextStats
        );
        return;
      }

      startDispensingForPatient(2, 'hard');
    },
    [applyStatChange, triggerEnding, startDispensingForPatient]
  );

  const handleHardP2Complete = useCallback(
    (didCounsel: boolean) => {
      const nextStats = applyStatChange({ money: -HARD_FIXED_COST });

      const frozenOnShelves =
        flagsRef.current.hardOrderChoice === 'bulk' && nextStats.money <= HARD_BULK_CASH_FLOOR;
      if (nextStats.money <= 0 || frozenOnShelves) {
        triggerEnding(
          'E',
          'hard',
          {
            endingReason: flagsRef.current.patient2ComplainedMissingStrip
              ? `給藥時沒當面點清，被迫貼錢補發一片（-45 元），打烊扣掉今日房租與電費分攤 ${HARD_FIXED_COST} 元後現金見底，小藥局只好關門。`
              : flagsRef.current.hardOrderChoice === 'bulk'
                ? `為了省 60 元運費硬湊 150 元免運，把太多現金卡在賣不掉的冷門商品裡，打烊扣掉今日房租與電費分攤 ${HARD_FIXED_COST} 元後手頭現金只剩 ${nextStats.money} 元、無力再叫常備藥周轉，只好關門。`
                : `打烊扣掉今日房租與電費分攤 ${HARD_FIXED_COST} 元後現金徹底見底——太多錢都壓在藥架上了，小藥局周轉不過來只好關門。`,
          },
          nextStats
        );
        return;
      }

      if (nextStats.affection <= 0) {
        triggerEnding('D', 'hard', undefined, nextStats);
        return;
      }

      const isTightCash = nextStats.money <= LOW_CASH_FLEXIBILITY_THRESHOLD;
      if (isTightCash) {
        const totalDiff = nextStats.money + nextStats.capital - (INITIAL_STATS.money + INITIAL_STATS.capital);
        const profitPrefix =
          totalDiff > 0
            ? `你一顆不差地撐過了這一天，算上架上的藥甚至比剛開店時多了 +${totalDiff} 元；`
            : '你一顆不差地拿對所有藥，也咬牙付清了今天的房租與電費；';

        triggerEnding(
          '1B',
          'hard',
          {
            endingReason: `${profitPrefix}但你現在手頭現金只剩 ${nextStats.money} 元（還有 ${nextStats.capital} 元全壓在藥架上）——明天只要再遇到臨時叫貨、運費或突發花費，小藥局能應變的空間就不大了。`,
          },
          nextStats
        );
        return;
      }

      const endingSummary = didCounsel
        ? flagsRef.current.patient2ComplainedMissingStrip
          ? `雖然沒當面點清被陳阿姨要求補一片（-45 元）、好心提醒吃藥還被嫌囉嗦回了一句「上面不是都有寫，不用講那麼多」，你依然咬牙扣完今日房租與電費分攤 ${HARD_FIXED_COST} 元，在各種現實壓力裡守住用藥安全撐過今天。`
          : `你幫阿北抓出鈣片跟護甲寧 100 mcg 會打架、當面點清陳阿姨的藥避開少片誤會；就算熱心提醒吃藥只換來一句「上面不是都有寫，不用講那麼多」，依然穩穩扣完今日房租與電費分攤 ${HARD_FIXED_COST} 元——在現實夾縫中守住了社區藥師的專業！`
        : `你一顆不差地拿對兩位客人的藥、擋下阿北的鈣片風險，並順利付完今日房租與電費分攤 ${HARD_FIXED_COST} 元，穩穩撐過這疲憊卻踏實的一天。`;

      triggerEnding('A', 'hard', { endingReason: endingSummary }, nextStats);
    },
    [applyStatChange, triggerEnding]
  );

  const handleResetAlmanac = useCallback(() => {
    setAlmanac(DEFAULT_ALMANAC);
    saveAlmanac(DEFAULT_ALMANAC);
  }, []);

  const themeAttr = screen !== 'MENU' && mode === 'hard' ? 'hard' : 'normal';
  const currentDrugs = useMemo(() => DRUG_CATALOG_BY_MODE[mode], [mode]);
  const activePatient = useMemo(
    () => resolveActivePatient(mode, patientIndex, Boolean(flags.hadNormalShortage)),
    [mode, patientIndex, flags.hadNormalShortage]
  );
  const totalActs = mode === 'normal' ? 4 : 5;
  const stageMeta = resolveStageMeta(mode, stage, patientIndex, activePatient);
  const showPatientCount = stage !== 'PROCURE' && stage !== 'TRAP';
  const currentDispenseIncome = getDispenseIncomeByPlan(flags.normalOrderPlan);
  const activeShortageNote =
    mode === 'normal' && patientIndex === 2 && flags.hadNormalShortage
      ? '好壓降 160 mg 已開欠藥單（明天補領），本次只需先拿好會降 10 mg（14 顆）'
      : undefined;
  const activeOutOfStockDrugIds = useMemo(
    () =>
      mode === 'normal' && patientIndex === 2 && flags.hadNormalShortage
        ? [NORMAL_SHORTAGE_DRUG_ID]
        : undefined,
    [mode, patientIndex, flags.hadNormalShortage]
  );

  return (
    <div data-theme={themeAttr} className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {screen === 'MENU' && (
        <TitleMenu
          almanac={almanac}
          onStartMode={(selected) => startGame(selected, false, selected === 'hard')}
          onOpenAlmanac={() => setAlmanacOpen(true)}
        />
      )}

      {screen === 'PLAYING' && (
        <div className="min-h-screen flex flex-col">
          <TopHud
            mode={mode}
            act={stageMeta.actNumber}
            totalActs={totalActs}
            patientIndex={patientIndex}
            showPatientCount={showPatientCount}
            stats={stats}
            latestDelta={latestDelta}
            timerActive={timerActive}
            isPaused={isPaused}
            remainingSec={remainingSec}
            totalSec={timerLimitSec}
            onTogglePause={handleTogglePause}
            onReturnMenu={handleRequestReturnMenu}
          />

          <main className="flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-7 items-start">
              {/* Left Column: Pharmacist-POV Interior Card, Dialogue & Prescription */}
              <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
                <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
                  {/* Show interior pharmacy illustration on desktop always, and on mobile during opening/intro stages */}
                  <div
                    className={`${
                      stage === 'PROCURE' || stage === 'TRAP' ? 'block' : 'hidden lg:block'
                    } relative aspect-[16/9] w-full overflow-hidden border-b border-[var(--border-subtle)]`}
                  >
                    <IllustrationImage
                      src={mode === 'normal' ? GAME_ASSETS.pharmacyWarm : GAME_ASSETS.pharmacyHard}
                      alt={
                        mode === 'normal'
                          ? '從社區藥局櫃檯內往外看的早晨場景'
                          : '從社區藥局櫃檯內往外看的雨天傍晚場景'
                      }
                      className="w-full h-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/65 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-[13px] font-medium text-white/95">
                      {mode === 'normal' ? '早班調劑櫃檯內' : '雨天傍晚調劑櫃檯內'}
                    </span>
                  </div>

                  <div className={stage === 'DISPENSE' ? 'p-3.5 sm:p-4 space-y-2.5' : 'p-4 sm:p-5 space-y-3'}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-muted)] shrink-0">
                        <IllustrationImage
                          src={stageMeta.portraitSrc}
                          alt={`${stageMeta.speaker}頭像`}
                          className="w-full h-full object-cover"
                          priority={true}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--accent-primary)]">
                          {stageMeta.title}
                        </p>
                        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
                          {stageMeta.speaker}
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {stageMeta.subtitle}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`text-sm sm:text-[17px] text-[var(--text-primary)] leading-relaxed pt-3 receipt-divider ${
                        stage === 'DISPENSE' ? 'hidden sm:block' : ''
                      }`}
                    >
                      {stageMeta.dialogue}
                    </p>
                  </div>
                </section>

                {(stage === 'DELIVER' || (mode === 'hard' && stage === 'PROCURE')) && (
                  <PrescriptionCard
                    patientName={activePatient.patientName}
                    patientMeta={activePatient.patientMeta}
                    rxNumber={activePatient.rxNumber}
                    items={activePatient.items}
                    shortageNote={activeShortageNote}
                    defaultOpen={stage !== 'DELIVER'}
                    compactToggleable={true}
                  />
                )}
                {stage === 'DISPENSE' && (
                  <div className="hidden lg:block">
                    <PrescriptionCard
                      patientName={activePatient.patientName}
                      patientMeta={activePatient.patientMeta}
                      rxNumber={activePatient.rxNumber}
                      items={activePatient.items}
                      shortageNote={activeShortageNote}
                      defaultOpen={true}
                      compactToggleable={false}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Pharmacy Workbench */}
              <div className="lg:col-span-7 pb-6">
                {stage === 'PROCURE' && (
                  <Act1Procurement
                    mode={mode}
                    currentMoney={stats.money}
                    onSelectNormalPlan={handleSelectNormalPlan}
                    onCompleteHardIntro={handleCompleteHardIntro}
                  />
                )}

                {stage === 'TRAP' && (
                  <Act2ShelvingAndTrap
                    currentMoney={stats.money}
                    currentCapital={stats.capital}
                    onSelectHardOrderOption={handleSelectHardOrderOption}
                  />
                )}

                {stage === 'SHORTAGE' && (
                  <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6 space-y-4 animate-stage-fade">
                    <div className="flex items-start justify-between gap-2.5">
                      <div>
                        <p className="text-xs font-bold text-[var(--status-warn)]">
                          小量補貨 · 備藥不足
                        </p>
                        <h3 className="mt-0.5 text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                          架上的「好壓降 160 mg」剛好缺藥了
                        </h3>
                      </div>
                      <PackageX
                        className="w-5 h-5 text-[var(--status-warn)] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-paper)] p-4 space-y-2.5 text-sm text-[var(--text-primary)] leading-relaxed">
                      <p>
                        你向王阿北致歉並立刻開立「欠藥單」約明天補領好壓降 160 mg。他眼神裡藏不住一絲失望，但仍努力維持禮貌、微笑著點頭道謝：
                      </p>
                      <p className="font-medium text-[var(--accent-primary)]">
                        「沒關係啦藥師，知道你們小藥局備貨也不容易，謝謝你幫我叫貨！今天先幫我拿架上有的好會降 10 mg 就好，好壓降我明天再來領！」
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCompleteShortage}
                      className="w-full min-h-[52px] px-4 sm:px-5 py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] active:scale-[0.99] text-white text-sm sm:text-base font-bold text-center leading-snug transition-all flex items-center justify-center gap-2"
                    >
                      <span>先拿「好會降 10 mg 14 顆」（好感 -5）</span>
                      <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </button>
                  </section>
                )}

                {stage === 'DISPENSE' && (
                  <Act3Dispensing
                    key={`disp-${mode}-${patientIndex}`}
                    mode={mode}
                    drugs={currentDrugs}
                    prescriptionItems={activePatient.items}
                    shortageNote={activeShortageNote}
                    outOfStockDrugIds={activeOutOfStockDrugIds}
                    tray={tray}
                    timerActive={timerActive}
                    isPaused={isPaused}
                    remainingSec={remainingSec}
                    totalSec={timerLimitSec}
                    onTogglePause={handleTogglePause}
                    onUpdateTray={handleUpdateTray}
                    onRemoveFromTray={handleRemoveFromTray}
                    onFinishDispensing={handleFinishDispensing}
                  />
                )}

                {stage === 'DELIVER' && (
                  <Act4Delivery
                    key={`deliv-${mode}-${patientIndex}`}
                    mode={mode}
                    patientIndex={patientIndex}
                    patientName={activePatient.patientName}
                    drugs={currentDrugs}
                    prescriptionItems={activePatient.items}
                    tray={tray}
                    dispenseIncome={currentDispenseIncome}
                    paused={timerFrozen}
                    onPauseTimer={handlePauseTimer}
                    onAutoFixTray={handleAutoFixTray}
                    onDeliverMeds={handleDeliverMeds}
                  />
                )}

                {stage === 'COMPLAINT' && (
                  <section className="rounded-2xl border border-[var(--status-danger)]/50 bg-[var(--bg-surface)] p-4 sm:p-6 space-y-4 animate-stage-fade">
                    <div className="flex items-start justify-between gap-2.5">
                      <div>
                        <p className="text-xs font-bold text-[var(--status-danger)]">
                          未當面核對 · 百口莫辯
                        </p>
                        <h3 className="mt-0.5 text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                          陳阿姨指控「少給她一片」！
                        </h3>
                      </div>
                      <AlertTriangle
                        className="w-5 h-5 text-[var(--status-danger)] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="rounded-xl bg-[#FDF3F2] border border-[var(--status-danger)]/25 p-4 text-sm text-[#7F1D1D] leading-relaxed">
                      給藥時沒按「當面再仔細核對一次」，死無對證只好自己貼錢補發一片（現金 -{HARD_MISSING_STRIP_PENALTY_MONEY}、好感 -{HARD_MISSING_STRIP_PENALTY_AFFECTION}）。
                    </div>

                    <button
                      type="button"
                      onClick={handleAcceptMissingStripComplaint}
                      className="w-full min-h-[52px] px-4 sm:px-5 py-3 rounded-xl bg-[var(--status-danger)] hover:opacity-95 active:scale-[0.99] text-white text-sm sm:text-base font-bold text-center leading-snug transition-all flex items-center justify-center gap-2"
                    >
                      <span>
                        貼錢補發一片（現金 -{HARD_MISSING_STRIP_PENALTY_MONEY} · 好感 -
                        {HARD_MISSING_STRIP_PENALTY_AFFECTION}）
                      </span>
                      <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </button>
                  </section>
                )}

                {stage === 'CONSULT' && (
                  <Act5Consultation
                    key={`consult-${mode}-${patientIndex}`}
                    mode={mode}
                    patientIndex={patientIndex}
                    patientName={activePatient.patientName}
                    consultBehavior={activePatient.consultBehavior}
                    currentMoney={stats.money}
                    currentCapital={stats.capital}
                    onNormalP1Complete={handleNormalP1Complete}
                    onNormalP2Complete={handleNormalP2Complete}
                    onHardP1QuickSkip={handleHardP1QuickSkip}
                    onHardP1CounselSuccess={handleHardP1CounselSuccess}
                    onHardP1FreebieDecision={handleHardP1FreebieDecision}
                    onHardP2Complete={handleHardP2Complete}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      )}

      {screen === 'ENDING' && endingId && (
        <EndingScreen
          mode={mode}
          endingId={endingId}
          stats={stats}
          flags={flags}
          almanac={almanac}
          onReplaySameMode={() => startGame(mode, false)}
          onSwitchMode={(nextMode) => startGame(nextMode, nextMode === 'hard')}
          onOpenAlmanac={() => setAlmanacOpen(true)}
          onReturnMenu={handleReturnMenu}
        />
      )}

      {/* Waiting-Room Pause Overlay (sits above dispensing drawer) */}
      {screen === 'PLAYING' && isPaused && !confirmReturnOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
        >
          <div className="animate-stage-fade w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[var(--accent-primary)]">
                  候藥倒數已暫停 · 剩餘 <span className="font-mono-num">{Math.ceil(remainingSec)}</span> 秒
                </p>
                <h2 id="pause-modal-title" className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                  先忙一下沒關係
                </h2>
              </div>
              <Pause className="w-5 h-5 text-[var(--accent-primary)] shrink-0 mt-1" aria-hidden="true" />
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              叫到號碼領藥、回訊息或放下手機都不會扣時間。準備好再回來接著配藥吧！
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="w-full min-h-[52px] px-5 py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] active:scale-[0.99] text-white text-base font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>繼續配藥</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmReturnOpen(true)}
                className="w-full min-h-[48px] px-5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)] text-sm font-medium text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>回主選單</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return-to-Menu Confirmation Modal (prevents accidental tap loss) */}
      {screen === 'PLAYING' && confirmReturnOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-return-title"
          onClick={() => setConfirmReturnOpen(false)}
        >
          <div
            className="animate-stage-fade w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-xs font-bold text-[var(--status-warn)]">確認離開這一輪</p>
              <h2 id="confirm-return-title" className="text-xl font-bold text-[var(--text-primary)]">
                要先回到主選單嗎？
              </h2>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              現在返回會結束這一輪的進度，不過已經收集到的結局圖鑑都會保留。
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmReturnOpen(false)}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm sm:text-base font-bold transition-colors whitespace-nowrap"
              >
                繼續遊戲
              </button>
              <button
                type="button"
                onClick={handleReturnMenu}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)] text-sm sm:text-base font-medium text-[var(--text-primary)] transition-colors whitespace-nowrap"
              >
                回主選單
              </button>
            </div>
          </div>
        </div>
      )}

      <AlmanacModal
        isOpen={almanacOpen}
        almanac={almanac}
        onClose={() => setAlmanacOpen(false)}
        onResetProgress={handleResetAlmanac}
      />
    </div>
  );
}
