import { memo } from 'react';
import { ArrowRight, PackageCheck, ShieldAlert, Sparkles } from 'lucide-react';
import {
  DISPENSE_CAPITAL_COST,
  HARD_FIXED_COST,
  NORMAL_PROCUREMENT_PLANS,
} from '../data/storyScript';
import { GameMode, NormalOrderPlanId } from '../types/game';

interface Act1ProcurementProps {
  mode: GameMode;
  currentMoney: number;
  onSelectNormalPlan: (planId: NormalOrderPlanId) => void;
  onCompleteHardIntro: () => void;
}

export const Act1Procurement = memo(function Act1Procurement({
  mode,
  currentMoney,
  onSelectNormalPlan,
  onCompleteHardIntro,
}: Act1ProcurementProps) {
  if (mode === 'hard') {
    return (
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6 space-y-4 animate-stage-fade">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[var(--accent-primary)]">查藥櫃 · 目前沒貨</p>
          <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            猛壓降 5/80 叫貨資訊
          </h3>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-paper)] px-4 divide-y divide-dashed divide-[var(--border-strong)] text-sm">
          <div className="py-3 flex items-center justify-between gap-2">
            <span className="text-[var(--text-secondary)]">處方需要</span>
            <span className="font-mono-num font-bold text-[var(--text-primary)]">
              猛壓降 5/80 · 28 顆
            </span>
          </div>
          <div className="py-3 flex items-center justify-between gap-2">
            <span className="text-[var(--text-secondary)]">一次最少叫貨</span>
            <span className="font-mono-num font-bold text-[var(--text-primary)]">
              1 盒（30 顆）
            </span>
          </div>
          <div className="py-3 flex items-center justify-between gap-2">
            <span className="text-[var(--text-secondary)]">一盒進價</span>
            <span className="font-mono-num font-bold text-[var(--text-primary)]">30 元</span>
          </div>
          <div className="py-3 flex items-center justify-between gap-2">
            <span className="text-[var(--text-secondary)]">今日房租＋電費分攤</span>
            <span className="font-mono-num font-bold text-[var(--status-warn)]">
              {HARD_FIXED_COST} 元
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/60 px-4 py-3 space-y-1.5 text-sm font-medium text-[var(--text-primary)] leading-relaxed">
          <p>
            你知道，<span className="font-mono-num font-bold text-[var(--accent-primary)]">猛壓降 5/80</span> 很少人在領，也難怪這個藥很難找。
          </p>
          <p>
            但你也清楚，張阿北已經跑了三間藥局都沒有藥，明天即將面臨斷藥的風險。
          </p>
        </div>

        <button
          type="button"
          onClick={onCompleteHardIntro}
          className="w-full min-h-[52px] px-5 py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] active:scale-[0.99] text-white text-base font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <span>查看藥商叫貨單</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6 space-y-4 animate-stage-fade">
      <div className="space-y-1">
        <p className="text-xs font-bold text-[var(--accent-primary)]">開門叫貨 · 三選一</p>
        <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
          選擇今天的備貨方式
        </h3>
      </div>

      <div className="space-y-3">
        {NORMAL_PROCUREMENT_PLANS.map((plan) => {
          const nextMoney = currentMoney - plan.cost;
          const netProfit = plan.dispenseIncomePerPatient - DISPENSE_CAPITAL_COST;
          const isBalanced = plan.id === 'balanced';
          const isBulk = plan.id === 'bulk';

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelectNormalPlan(plan.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all min-h-[68px] active:scale-[0.99] ${
                isBalanced
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]/55 hover:bg-[var(--accent-soft)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium">
                    <span className="text-[var(--accent-primary)]">{plan.code}</span>
                    <span className="text-[var(--border-strong)]" aria-hidden="true">·</span>
                    <span
                      className={`font-mono-num font-bold ${
                        isBulk ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      一張淨利 +{netProfit}
                    </span>
                  </div>
                  <div className="mt-0.5 text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    {plan.title}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                    {plan.summary}
                  </p>
                </div>
                {isBalanced ? (
                  <PackageCheck className="w-5 h-5 text-[var(--accent-primary)] shrink-0 mt-0.5" aria-hidden="true" />
                ) : isBulk ? (
                  <ShieldAlert className="w-5 h-5 text-[var(--status-warn)] shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[var(--text-secondary)] shrink-0 mt-0.5" aria-hidden="true" />
                )}
              </div>

              <div className="mt-3 pt-2.5 receipt-divider flex items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="font-mono-num font-bold text-[var(--text-primary)]">
                  需備貨資金 {plan.cost} 元（現金剩 {nextMoney}）
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--accent-primary)] shrink-0" aria-hidden="true" />
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {plan.tradeoffNote}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
});
