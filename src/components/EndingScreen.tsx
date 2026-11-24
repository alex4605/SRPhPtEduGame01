import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Home,
  Info,
  RotateCcw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  DISPENSING_TIME_LIMIT_BY_MODE,
  ENDINGS,
  ENDING_ORDER,
  GAME_ASSETS,
  getNetProfitByPlan,
  HARD_FIXED_COST,
  INITIAL_STATS,
} from '../data/storyScript';
import { CoreStats, EndingId, GameFlags, GameMode, UnlockedAlmanac } from '../types/game';
import { IllustrationImage } from './IllustrationImage';

interface EndingScreenProps {
  mode: GameMode;
  endingId: EndingId;
  stats: CoreStats;
  flags: GameFlags;
  almanac: UnlockedAlmanac;
  onReplaySameMode: () => void;
  onSwitchMode: (nextMode: GameMode) => void;
  onOpenAlmanac: () => void;
  onReturnMenu: () => void;
}

export function EndingScreen({
  mode,
  endingId,
  stats,
  flags,
  almanac,
  onReplaySameMode,
  onSwitchMode,
  onOpenAlmanac,
  onReturnMenu,
}: EndingScreenProps) {
  const ending = ENDINGS[endingId];
  const unlockedCount = ENDING_ORDER.filter((id) => almanac.endings[id]).length;
  const title = mode === 'normal' ? ending.titleNormal : ending.titleHard;
  const summary = mode === 'normal' ? ending.summaryNormal : ending.summaryHard;
  const isClearEnding = endingId === 'A' || endingId === '1B';
  const clearedNormal = mode === 'normal' && isClearEnding;
  const carriedNetProfit = getNetProfitByPlan(flags.normalOrderPlan);

  const openingTotal = INITIAL_STATS.money + INITIAL_STATS.capital;
  const finalTotal = stats.money + stats.capital;
  const totalDiff = finalTotal - openingTotal;
  const cashDiff = stats.money - INITIAL_STATS.money;
  const shelfDiff = stats.capital - INITIAL_STATS.capital;
  const affectionDiff = stats.affection - INITIAL_STATS.affection;
  const affectionDiffText =
    affectionDiff > 0 ? `+${affectionDiff}` : affectionDiff < 0 ? `${affectionDiff}` : '不變';
  const lostCapital = totalDiff < 0;

  const toneColor =
    ending.tone === 'good'
      ? 'text-[var(--accent-primary)]'
      : ending.tone === 'critical'
        ? 'text-[var(--status-danger)]'
        : 'text-[var(--status-warn)]';

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] py-5 sm:py-10 px-4 sm:px-6">
      <main className="max-w-4xl mx-auto space-y-5 animate-stage-fade">
        {/* 1. Pharmacy Medicine Bag Style Main Ending Card */}
        <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          {/* Medicine Bag Top Header Strip */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-paper)] flex items-center justify-between gap-2">
            <span className={`text-xs sm:text-sm font-bold ${toneColor}`}>
              {ending.codeLabel} · {mode === 'normal' ? '普通模式' : '困難模式'}
            </span>
            <span className="text-xs font-mono-num text-[var(--text-secondary)]">
              到你手上之前 · 結算藥袋
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
            <div className="md:col-span-5 aspect-[16/10] md:aspect-auto bg-[var(--bg-muted)]">
              <IllustrationImage
                src={mode === 'normal' ? GAME_ASSETS.pharmacyWarm : GAME_ASSETS.pharmacyHard}
                alt={title}
                className="w-full h-full object-cover"
                priority={true}
              />
            </div>

            <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-snug">
                    {title}
                  </h1>
                  {ending.tone === 'good' ? (
                    <CheckCircle2 className={`w-6 h-6 ${toneColor} shrink-0 mt-1`} aria-hidden="true" />
                  ) : (
                    <AlertTriangle className={`w-6 h-6 ${toneColor} shrink-0 mt-1`} aria-hidden="true" />
                  )}
                </div>

                <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                  {flags.endingReason ?? summary}
                </p>

                {endingId === 'C' && flags.dispensingErrors && flags.dispensingErrors.length > 0 && (
                  <div className="rounded-xl border border-[var(--status-danger)]/35 bg-[#FDF3F2] p-3.5 space-y-1.5">
                    <div className="text-xs sm:text-sm font-bold text-[var(--status-danger)]">
                      這次拿錯的地方：
                    </div>
                    <ul className="space-y-1 text-xs sm:text-sm text-[#7F1D1D] font-mono-num">
                      {flags.dispensingErrors.map((err, idx) => (
                        <li key={idx}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Final 3 Core Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-3.5 receipt-divider">
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">剩餘現金</div>
                  <div className="font-mono-num text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                    {stats.money}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">架上藥品</div>
                  <div className="font-mono-num text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                    {stats.capital}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">鄰居好感</div>
                  <div className="font-mono-num text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                    {stats.affection}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* 2. Pharmacy Closing Receipt Ledger (Opening vs Final Capital Comparison) */}
        <section
          className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
            lostCapital
              ? 'border-[var(--status-danger)]/35 bg-[#FDF8F7]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-paper)]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  lostCapital ? 'text-[var(--status-danger)]' : 'text-[var(--accent-primary)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>打烊對帳單 · 跟剛開店時比起來</span>
              </p>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                {lostCapital
                  ? `你比剛開局時少了 ${Math.abs(totalDiff)} 元資本`
                  : totalDiff > 0
                    ? `你比剛開局時多了 +${totalDiff} 元資本`
                    : '你的總資本與剛開局時持平'}
              </h2>
            </div>
            {lostCapital ? (
              <TrendingDown className="w-6 h-6 text-[var(--status-danger)] shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <TrendingUp className="w-6 h-6 text-[var(--accent-primary)] shrink-0 mt-0.5" aria-hidden="true" />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 receipt-divider text-sm">
            <div>
              <div className="text-xs text-[var(--text-secondary)]">剛開局總資本</div>
              <div className="font-mono-num text-base font-bold text-[var(--text-primary)] mt-0.5">
                {openingTotal} 元
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-num">
                現金 {INITIAL_STATS.money}＋藥 {INITIAL_STATS.capital}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">現在總資本</div>
              <div className="font-mono-num text-base font-bold text-[var(--text-primary)] mt-0.5">
                {finalTotal} 元
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-num">
                現金 {stats.money}＋藥 {stats.capital}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">總資本差額</div>
              <div
                className={`font-mono-num text-base font-bold mt-0.5 ${
                  lostCapital
                    ? 'text-[var(--status-danger)]'
                    : totalDiff > 0
                      ? 'text-[var(--accent-primary)]'
                      : 'text-[var(--text-primary)]'
                }`}
              >
                {lostCapital ? `-${Math.abs(totalDiff)} 元` : totalDiff > 0 ? `+${totalDiff} 元` : '0 元'}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-num">
                現金 {cashDiff >= 0 ? `+${cashDiff}` : cashDiff} · 藥{' '}
                {shelfDiff >= 0 ? `+${shelfDiff}` : shelfDiff}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">好感度變化</div>
              <div
                className={`font-mono-num text-base font-bold mt-0.5 ${
                  affectionDiff < 0
                    ? 'text-[var(--status-danger)]'
                    : affectionDiff > 0
                      ? 'text-[var(--accent-primary)]'
                      : 'text-[var(--text-primary)]'
                }`}
              >
                {stats.affection}（{affectionDiffText}）
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono-num">
                開局 {INITIAL_STATS.affection}
              </div>
            </div>
          </div>

          <p className="pt-3 receipt-divider text-sm text-[var(--text-secondary)] leading-relaxed">
            {endingId === '1B'
              ? `雖然算上架上的藥，總資本${
                  totalDiff > 0
                    ? `比剛開店時多了 +${totalDiff} 元`
                    : totalDiff < 0
                      ? `比剛開店時少了 ${Math.abs(totalDiff)} 元`
                      : '跟剛開店時打平'
                }，但你現在手頭現金只剩 ${stats.money} 元，還有 ${stats.capital} 元壓在藥架上——遇到臨時叫貨、運費或意外支出時，能應變的空間就不大了。${
                  clearedNormal ? '帶著偏少的現金進困難模式要特別小心！' : ''
                }`
              : mode === 'hard' && lostCapital
                ? endingId === 'A'
                  ? `明明一顆藥都沒拿錯、也用心幫客人把關，結完帳卻發現總資本比剛開店時少了 ${Math.abs(totalDiff)} 元（手頭現金${cashDiff < 0 ? `少了 ${Math.abs(cashDiff)} 元` : `多了 ${cashDiff} 元`}）——這正是許多獨立社區小藥局每天面對的真實處境。`
                  : `扣除進貨、運費與今日開銷後，你的總資本比剛開局時整整少了 ${Math.abs(totalDiff)} 元。`
                : mode === 'hard' && endingId === 'A'
                  ? totalDiff === 0
                    ? `忙完一整天、一顆藥都沒拿錯，扣完單日房租與電費後總資本剛好打平、好感度落在 ${stats.affection}（相較開局${affectionDiffText}）——撐住社區藥局靠的從來不是暴利，而是日復一日的細心與堅持。`
                    : `忙完一整天、一顆藥都沒拿錯，扣完單日房租與電費後只${totalDiff <= 15 ? '微幅' : ''}多出 +${totalDiff} 元、好感度落在 ${stats.affection}（相較開局${affectionDiffText}）——撐住社區藥局靠的從來不是暴利，而是日復一日的細心與堅持。`
                  : clearedNormal
                    ? `目前總資本比開局多了 +${totalDiff} 元，不過這還沒算進冷門藥、運費跟每日房租電費——接下來的困難模式才是真正考驗！`
                    : lostCapital
                      ? `扣除今天所有花費後，總資本比剛開局時少了 ${Math.abs(totalDiff)} 元。`
                      : totalDiff === 0
                        ? `目前算上架上的藥與剛開店時持平（其中手頭現金${cashDiff < 0 ? `少了 ${Math.abs(cashDiff)} 元` : cashDiff > 0 ? `多了 ${cashDiff} 元` : '沒有變動'}）。`
                        : `目前算上架上的藥比剛開店多了 +${totalDiff} 元（其中手頭現金${cashDiff < 0 ? `少了 ${Math.abs(cashDiff)} 元` : `多了 ${cashDiff} 元`}）。`}
          </p>
        </section>

        {/* 3. Exclusive Hard Mode Challenge Entry Card — shown ONLY on Normal Mode Clear Screen */}
        {clearedNormal && (
          <section className="rounded-2xl border border-[#D8C5C1] bg-[#FAF6F5] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[#B44535]">
                普通模式過關 · 帶著現在的現金、架上藥跟好感度繼續挑戰
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-[#161E28]">
                困難模式｜社區小藥局的真實考驗
              </h2>
              <p className="text-sm text-[#435061] leading-relaxed">
                將延續現金 <strong className="font-mono-num text-[#161E28]">{stats.money} 元</strong>、架上藥{' '}
                <strong className="font-mono-num text-[#161E28]">{stats.capital} 元</strong>、好感{' '}
                <strong className="font-mono-num text-[#161E28]">{stats.affection}</strong>（每張處方淨利{' '}
                <strong className="font-mono-num text-[#161E28]">+{carriedNetProfit}</strong>），面對冷門藥湊免運、更緊迫的{' '}
                <strong className="font-mono-num text-[#161E28]">{DISPENSING_TIME_LIMIT_BY_MODE.hard} 秒</strong>配藥倒數與今日房租電費（{HARD_FIXED_COST} 元）。
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSwitchMode('hard')}
              className="min-h-[52px] px-6 py-3 rounded-xl bg-[#B44535] hover:bg-[#943628] active:scale-[0.99] text-white text-base font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>挑戰困難模式</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </section>
        )}

        {/* 4. Pharmacist Note Card (Community Pharmacy Knowledge) */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
            <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-bold">{ending.knowledgeTitle}</h2>
          </div>
          <p className="text-[15px] text-[var(--text-primary)]/90 leading-[1.75]">
            {ending.knowledgeBody}
          </p>
          <p className="text-xs text-[var(--text-secondary)] pt-2.5 receipt-divider">
            藥師叮嚀參考：{ending.knowledgeSource}
          </p>
        </section>

        {/* 5. Replay & Navigation Actions */}
        <div
          className={`grid grid-cols-1 gap-2.5 ${
            mode === 'hard' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'
          }`}
        >
          <button
            type="button"
            onClick={onReplaySameMode}
            className={`min-h-[52px] px-4 py-3 rounded-xl text-sm sm:text-base font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
              clearedNormal
                ? 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)]'
                : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{mode === 'hard' ? '再挑戰困難模式' : '再玩一次'}</span>
          </button>

          {mode === 'hard' && (
            <button
              type="button"
              onClick={() => onSwitchMode('normal')}
              className="min-h-[52px] px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-sm sm:text-base font-medium text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>回到普通模式</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAlmanac}
            className="min-h-[52px] px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-sm sm:text-base font-medium text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              結局圖鑑 <span className="font-mono-num">({unlockedCount}/{ENDING_ORDER.length})</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onReturnMenu}
            className="min-h-[52px] px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-sm sm:text-base font-medium text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>主選單</span>
          </button>
        </div>

        <p className="text-center text-xs sm:text-sm text-[var(--text-secondary)] pt-1 leading-relaxed">
          領藥時若對吃法、保健食品或中藥併用有任何疑問，歡迎直接向櫃檯前的藥師詢問。
        </p>
      </main>
    </div>
  );
}
