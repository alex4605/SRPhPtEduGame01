import { ArrowRight, BookOpen, Flame, ShieldCheck } from 'lucide-react';
import { ENDING_ORDER, GAME_ASSETS, INITIAL_STATS } from '../data/storyScript';
import { GameMode, UnlockedAlmanac } from '../types/game';
import { IllustrationImage } from './IllustrationImage';

interface TitleMenuProps {
  almanac: UnlockedAlmanac;
  onStartMode: (mode: GameMode) => void;
  onOpenAlmanac: () => void;
}

export function TitleMenu({ almanac, onStartMode, onOpenAlmanac }: TitleMenuProps) {
  const unlockedCount = ENDING_ORDER.filter((id) => almanac.endings[id]).length;
  const hardUnlocked = almanac.completedModes.normal;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col">
      {/* Subtle Pharmacy Top Bar */}
      <header className="w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0">
            到你手上之前
          </span>
          <div className="hidden sm:flex items-center gap-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">
            <span>社區藥局互動體驗</span>
            <span aria-hidden="true">·</span>
            <span>全程靜音</span>
            <span aria-hidden="true">·</span>
            <span>等領藥隨時可玩</span>
          </div>
          <button
            type="button"
            onClick={onOpenAlmanac}
            className="min-h-[40px] px-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-xs sm:text-sm font-medium text-[var(--text-primary)] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-4 h-4 text-[var(--accent-primary)] shrink-0" aria-hidden="true" />
            <span>
              結局圖鑑 <span className="font-mono-num">({unlockedCount}/{ENDING_ORDER.length})</span>
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-stretch">
          {/* Left: Pharmacist-POV Interior Hero Illustration */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="mb-2.5 space-y-0.5 lg:hidden">
              <p className="text-xs font-medium text-[var(--accent-primary)]">
                社區藥局體驗小遊戲 · 全程靜音 · 約 3 分鐘
              </p>
              <h1 className="text-[26px] font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                到你手上之前
              </h1>
            </div>

            <figure className="relative flex-1 rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col">
              <div className="relative aspect-[16/9] lg:aspect-auto lg:flex-1 w-full overflow-hidden">
                <IllustrationImage
                  src={GAME_ASSETS.pharmacyWarm}
                  alt="從社區藥局調劑櫃檯內往外看的早晨室內場景"
                  className="w-full h-full object-cover"
                  fallbackLabel="社區藥局早班調劑台"
                  priority={true}
                />
                {/* Measured contrast scrim for ambient scene caption */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 px-4 py-3 text-white flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/90">上午 08:30 · 社區藥局調劑櫃檯內</p>
                    <p className="text-sm sm:text-base font-display font-bold leading-snug">
                      站進櫃檯後面，看看一袋藥交到你手上前都在忙什麼
                    </p>
                  </div>
                </figcaption>
              </div>
              <div className="px-4 py-2.5 sm:py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-paper)] flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                <span>開門資本</span>
                <span className="font-mono-num font-bold text-[var(--text-primary)] whitespace-nowrap">
                  現金 {INITIAL_STATS.money} 元 · 架上藥 {INITIAL_STATS.capital} 元 · 好感 {INITIAL_STATS.affection}
                </span>
              </div>
            </figure>
          </div>

          {/* Right: Mobile-First Primary Start Card + Editorial Story Brief */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-7">
            {/* Story & 3-Step Preview (below CTA on mobile for above-the-fold play, top on desktop) */}
            <div className="order-2 lg:order-1 space-y-4 pt-4 border-t border-[var(--border-subtle)] lg:pt-0 lg:border-t-0">
              <div className="hidden lg:block space-y-1.5">
                <p className="text-xs font-medium text-[var(--accent-primary)]">
                  第一人稱藥師體驗 · 全程靜音 · 約 3 分鐘
                </p>
                <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                  到你手上之前
                </h1>
              </div>

              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                走進台灣街角社區藥局的櫃檯後方當一天藥師，從開門叫貨、在長得很像的藥盒間細心數藥，到多問兩句替鄰居把關用藥安全。
              </p>

              {/* Clean unboxed 3-step preview list */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5">
                <div className="flex items-start gap-3 text-sm">
                  <span className="font-mono-num font-bold text-[var(--accent-primary)] shrink-0 mt-0.5">
                    01
                  </span>
                  <p className="text-[var(--text-primary)] leading-relaxed">
                    <strong>決定備貨</strong>：現金有限，叫太少怕缺藥、囤太多怕沒錢周轉。
                  </p>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="font-mono-num font-bold text-[var(--accent-primary)] shrink-0 mt-0.5">
                    02
                  </span>
                  <p className="text-[var(--text-primary)] leading-relaxed">
                    <strong>親手數藥</strong>：看清劑量與每排顆數，在倒數計時內一顆不差配齊。
                  </p>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="font-mono-num font-bold text-[var(--accent-primary)] shrink-0 mt-0.5">
                    03
                  </span>
                  <p className="text-[var(--text-primary)] leading-relaxed">
                    <strong>核對叮嚀</strong>：當面點清排數、多問一句日常吃藥習慣，幫客人避開風險。
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Action Block (first on mobile so CTA sits in first viewport, bottom on desktop) */}
            <div className="order-1 lg:order-2 space-y-2.5 lg:pt-3 lg:border-t lg:border-[var(--border-subtle)]">
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="font-medium text-[var(--accent-primary)] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    普通模式 · 接待 2 位客人{hardUnlocked ? ' · 已破關' : ''}
                  </span>
                </span>
                <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                  {hardUnlocked ? '困難模式已解鎖' : '破關解鎖困難模式'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onStartMode('normal')}
                className="w-full min-h-[52px] px-5 py-3.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] active:scale-[0.99] text-white text-base font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
              >
                <span>{hardUnlocked ? '開始上班（普通模式）' : '開始上班'}</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>

              {hardUnlocked && (
                <button
                  type="button"
                  onClick={() => onStartMode('hard')}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl border border-[#D8B4AE] bg-[#FAF6F5] hover:bg-[#F5EBE9] active:scale-[0.99] text-[#B44535] text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Flame className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>直接挑戰困難模式</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>
              )}

              <p className="text-xs text-[var(--text-secondary)]/90 leading-relaxed pt-0.5">
                ※ 本遊戲內的藥品名稱、規格與交互作用情境皆為衛教模擬虛構，實際用藥與併用安全請諮詢您的醫師或藥師。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
