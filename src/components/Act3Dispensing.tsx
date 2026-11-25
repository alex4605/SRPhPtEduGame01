import { memo, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Clock, FileText, Minus, Pause, Plus, Scissors, Trash2, X } from 'lucide-react';
import { SHELF_SLOTS_BY_MODE, ShelfTier } from '../data/storyScript';
import { DispensingTray, DrugSpec, GameMode, PackSize, PrescriptionItem } from '../types/game';
import { buildDrugMap, resolveTrayEntries } from '../utils/pharmacy';
import { MedicineBoxCard } from './MedicineBoxCard';

interface Act3DispensingProps {
  mode: GameMode;
  drugs: readonly DrugSpec[];
  prescriptionItems: readonly PrescriptionItem[];
  shortageNote?: string;
  outOfStockDrugIds?: readonly string[];
  tray: DispensingTray;
  timerActive: boolean;
  isPaused: boolean;
  remainingSec: number;
  totalSec: number;
  onTogglePause: () => void;
  onUpdateTray: (drugId: string, packs: number, loose: number) => void;
  onRemoveFromTray: (drugId: string) => void;
  onFinishDispensing: () => void;
}

const ALL_TIERS: readonly ShelfTier[] = ['A', 'B', 'C', 'D'];

const SilverBlisterPack = memo(function SilverBlisterPack({
  packSize,
  filledCount,
  isPartial = false,
}: {
  packSize: PackSize;
  filledCount: number;
  isPartial?: boolean;
}) {
  const cols = packSize === 14 ? 7 : 5;
  const slots = Array.from({ length: packSize }, (_, idx) => idx < filledCount);

  return (
    <div
      className={`blister-foil inline-flex flex-col gap-1 p-2 rounded-xl border ${
        isPartial
          ? 'border-dashed border-[var(--accent-primary)]'
          : 'border-[#AEBAC8]'
      }`}
    >
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {slots.map((filled, idx) => (
          <span
            key={idx}
            className={`w-3.5 h-3.5 rounded-full border transition-colors ${
              filled
                ? 'bg-[var(--accent-primary)] border-black/20 shadow-[inset_0_2px_2px_rgba(255,255,255,0.45)]'
                : 'bg-white/70 border-[#BCC6D2] shadow-inner'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

export const Act3Dispensing = memo(function Act3Dispensing({
  mode,
  drugs,
  prescriptionItems,
  shortageNote,
  outOfStockDrugIds,
  tray,
  timerActive,
  isPaused,
  remainingSec,
  totalSec,
  onTogglePause,
  onUpdateTray,
  onRemoveFromTray,
  onFinishDispensing,
}: Act3DispensingProps) {
  const shelfSlots = SHELF_SLOTS_BY_MODE[mode];
  const [drawerDrugId, setDrawerDrugId] = useState<string | null>(null);
  const [draftEntry, setDraftEntry] = useState<{ packs: number; loose: number }>({
    packs: 0,
    loose: 0,
  });

  const openDrawer = (drugId: string) => {
    const existing = tray[drugId];
    setDraftEntry(existing ? { packs: existing.packs, loose: existing.loose } : { packs: 0, loose: 0 });
    setDrawerDrugId(drugId);
  };

  const closeDrawerCancel = () => {
    setDrawerDrugId(null);
  };

  useEffect(() => {
    if (!drawerDrugId || isPaused) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerDrugId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerDrugId, isPaused]);

  const timePct = totalSec > 0 ? Math.max(0, Math.min(100, (remainingSec / totalSec) * 100)) : 0;
  const isUrgent = remainingSec <= 15;
  const warnThreshold = Math.min(30, Math.floor(totalSec * 0.45));
  const isWarn = remainingSec <= warnThreshold && !isUrgent;

  const drugMap = useMemo(() => buildDrugMap(drugs), [drugs]);
  const trayEntries = useMemo(() => resolveTrayEntries(drugs, tray), [drugs, tray]);
  const activeTiers = useMemo(
    () => ALL_TIERS.filter((tier) => shelfSlots.some((slot) => slot.tier === tier)),
    [shelfSlots]
  );

  const drawerDrug = drawerDrugId ? drugMap.get(drawerDrugId) ?? null : null;
  const existingEntry = drawerDrug ? tray[drawerDrug.id] ?? { packs: 0, loose: 0 } : { packs: 0, loose: 0 };
  const existingTotal = drawerDrug ? existingEntry.packs * drawerDrug.packSize + existingEntry.loose : 0;
  const drawerTotal = drawerDrug ? draftEntry.packs * drawerDrug.packSize + draftEntry.loose : 0;

  const adjustPacks = (delta: number) => {
    if (!drawerDrug) return;
    setDraftEntry((prev) => ({
      packs: Math.max(0, Math.min(6, prev.packs + delta)),
      loose: prev.loose,
    }));
  };

  const adjustLoose = (delta: number) => {
    if (!drawerDrug) return;
    setDraftEntry((prev) => {
      let nextPacks = prev.packs;
      let nextLoose = prev.loose + delta;
      if (nextLoose >= drawerDrug.packSize) {
        nextPacks += 1;
        nextLoose -= drawerDrug.packSize;
      } else if (nextLoose < 0) {
        if (nextPacks > 0) {
          nextPacks -= 1;
          nextLoose = drawerDrug.packSize - 1;
        } else {
          nextLoose = 0;
        }
      }
      return { packs: nextPacks, loose: nextLoose };
    });
  };

  const handleConfirmDrawer = () => {
    if (!drawerDrug) return;
    if (drawerTotal > 0) {
      onUpdateTray(drawerDrug.id, draftEntry.packs, draftEntry.loose);
    } else if (existingTotal > 0) {
      onRemoveFromTray(drawerDrug.id);
    }
    setDrawerDrugId(null);
  };

  return (
    <div className="space-y-3.5 animate-stage-fade">
      {/* 1. Compact Pinned Rx Strip (Mobile) */}
      <section className="lg:hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-paper)] px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--accent-primary)] mb-1.5">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>本次處方箋</span>
          </span>
          <span className="text-xs font-normal text-[var(--text-secondary)]">請核對劑量與顆數</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {prescriptionItems.map((item) => (
            <div
              key={item.targetDrugId}
              className="flex items-baseline justify-between gap-2 text-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5"
            >
              <span className="font-bold text-[var(--text-primary)] truncate">
                {item.displayName}{' '}
                <span className="font-mono-num text-[var(--accent-primary)]">{item.strength}</span>
              </span>
              <span className="font-mono-num font-bold text-[var(--text-primary)] shrink-0">
                {item.requiredQty} 顆
              </span>
            </div>
          ))}
        </div>
        {shortageNote && (
          <p className="mt-2 text-xs font-medium text-[var(--status-warn)] leading-relaxed">
            {shortageNote}
          </p>
        )}
      </section>

      {/* 2. Multi-Tier Pharmacy Dispensing Shelf Rack (Zero right/wrong alerts) */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--shelf-frame)] p-3 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)]">調劑藥櫃 · 點藥盒拿藥</p>
            <p className="text-xs text-[var(--text-secondary)]">不會提示對錯，請仔細核對</p>
          </div>
          {trayEntries.length > 0 && (
            <button
              type="button"
              onClick={onFinishDispensing}
              className="min-h-[44px] px-3.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>
                去給藥（<span className="font-mono-num">{trayEntries.length}</span>）
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {activeTiers.map((tier) => {
            const tierSlots = shelfSlots.filter((s) => s.tier === tier);
            const tierHeaderLabel = tierSlots[0]?.tierLabel ?? `${tier} 層`;
            return (
              <div
                key={tier}
                className="rounded-xl bg-[var(--shelf-ledge)] p-2 sm:p-2.5 border-b-[5px] border-[var(--shelf-shadow)]"
              >
                <div className="flex items-center justify-between px-1 mb-1.5 text-xs font-bold text-[var(--text-secondary)]">
                  <span>{tierHeaderLabel}</span>
                  <span className="font-mono-num">{tierSlots.map((s) => s.code).join(' / ')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {tierSlots.map((slot) => {
                    const drug = drugMap.get(slot.expectedDrugId);
                    if (!drug) return null;

                    const entry = tray[drug.id];
                    const pickedTotal = entry ? entry.packs * drug.packSize + entry.loose : 0;
                    const isOutOfStock = Boolean(outOfStockDrugIds?.includes(drug.id));

                    return (
                      <div key={slot.code} className="flex flex-col gap-1.5">
                        <MedicineBoxCard
                          drug={drug}
                          compact={true}
                          selected={!isOutOfStock && drawerDrugId === drug.id}
                          pickedCount={pickedTotal}
                          outOfStock={isOutOfStock}
                          onClick={() => {
                            if (!isOutOfStock) openDrawer(drug.id);
                          }}
                        />
                        <div className="rounded-md bg-[var(--bg-surface)]/95 border border-[var(--border-subtle)] px-2 py-1 flex items-center justify-between gap-1 text-xs">
                          <span className="font-mono-num font-bold text-[var(--text-secondary)]">
                            {slot.code}
                          </span>
                          <span
                            className={`truncate ${
                              isOutOfStock ? 'font-bold text-[var(--status-warn)]' : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {isOutOfStock ? '缺貨 · 已開欠藥單' : slot.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Stainless-Style Dispensing Tray Summary + Submit */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <h4 className="font-bold text-[var(--text-primary)]">
            配藥盤（<span className="font-mono-num">{trayEntries.length}</span> 項）
          </h4>
          {trayEntries.length > 0 && (
            <span className="text-xs text-[var(--text-secondary)]">點項目可重新調整數量</span>
          )}
        </div>

        {trayEntries.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-1">
            配藥盤還是空的，請點上方藥櫃的藥盒拿藥。
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
            {trayEntries.map(({ drug, entry, total }) => (
              <div key={drug.id} className="py-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openDrawer(drug.id)}
                  className="min-w-0 flex-1 text-left py-1 hover:opacity-80"
                >
                  <span className="text-[17px] font-bold text-[var(--text-primary)]">
                    {drug.name}{' '}
                    <span className="font-mono-num text-[var(--accent-primary)]">
                      {drug.strength}
                    </span>
                  </span>
                  <span className="block text-xs text-[var(--text-secondary)] font-mono-num mt-0.5">
                    {entry.packs} 排 ＋ 剪 {entry.loose} 顆 = {total} 顆
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveFromTray(drug.id)}
                  aria-label={`移除 ${drug.name} ${drug.strength}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-[var(--text-secondary)] hover:text-[var(--status-danger)] hover:bg-[var(--bg-muted)] flex items-center justify-center shrink-0"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={trayEntries.length === 0}
          onClick={onFinishDispensing}
          className="w-full min-h-[52px] px-5 py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-40 active:scale-[0.99] text-white text-base font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <span>前往櫃檯給藥</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </section>

      {/* Slide-Up Metallic Silver Foil Blister Pack Bottom Sheet */}
      {drawerDrug && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${drawerDrug.name} ${drawerDrug.strength} 排裝抽屜`}
          onClick={closeDrawerCancel}
        >
          <div
            className="animate-sheet-up w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-[var(--border-strong)]" />
            </div>

            {/* Live Countdown Bar inside Drawer so counting pills never hides remaining time */}
            {timerActive && (
              <div className="px-4 sm:px-5 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-1 shrink-0">
                  <Clock
                    className={`w-3.5 h-3.5 ${
                      isUrgent
                        ? 'text-[var(--status-danger)]'
                        : isWarn
                          ? 'text-[var(--status-warn)]'
                          : 'text-[var(--accent-primary)]'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`font-mono-num text-xs sm:text-sm font-bold whitespace-nowrap ${
                      isUrgent
                        ? 'text-[var(--status-danger)]'
                        : isWarn
                          ? 'text-[var(--status-warn)]'
                          : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {Math.ceil(remainingSec)}s
                  </span>
                </div>
                <div className="flex-1 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                  <div
                    className={`h-full rounded-full origin-left transition-transform duration-1000 ease-linear ${
                      isUrgent
                        ? 'bg-[var(--status-danger)]'
                        : isWarn
                          ? 'bg-[var(--status-warn)]'
                          : 'bg-[var(--accent-primary)]'
                    }`}
                    style={{ transform: `scaleX(${timePct / 100})` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={onTogglePause}
                  aria-label="暫停計時"
                  className="min-h-[44px] -my-2 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)] text-xs font-bold text-[var(--text-primary)] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Pause className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
                  <span>暫停</span>
                </button>
              </div>
            )}

            {/* Compact Prescription Reference Strip inside Drawer */}
            <div className="px-4 sm:px-5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-paper)] shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" aria-hidden="true" />
                <span>對照處方箋</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {prescriptionItems.map((item) => (
                  <div
                    key={item.targetDrugId}
                    className="inline-flex items-baseline gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs sm:text-[15px]"
                  >
                    <span className="font-bold text-[var(--text-primary)]">
                      {item.displayName}{' '}
                      <span className="font-mono-num text-[var(--accent-primary)]">
                        {item.strength}
                      </span>
                    </span>
                    <span className="font-mono-num font-bold text-[var(--text-primary)]">
                      {item.requiredQty} 顆
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0 border border-black/10"
                    style={{ backgroundColor: drawerDrug.bandColor }}
                  />
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                    每排 <strong className="font-mono-num text-[var(--text-primary)]">{drawerDrug.packSize}</strong> 顆裝
                  </span>
                </div>
                <h4 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                  {drawerDrug.name}{' '}
                  <span className="font-mono-num text-[var(--accent-primary)]">
                    {drawerDrug.strength}
                  </span>
                </h4>
              </div>

              <button
                type="button"
                onClick={closeDrawerCancel}
                aria-label="取消並關閉抽屜"
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="rounded-xl bg-[var(--bg-muted)]/70 border border-[var(--border-subtle)] p-3.5 space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs sm:text-sm font-mono-num text-[var(--text-secondary)]">
                    {draftEntry.packs} 排 ＋ 剪 {draftEntry.loose} 顆
                  </span>
                  <div className="flex items-baseline gap-2.5">
                    {drawerTotal > 0 && (
                      <button
                        type="button"
                        onClick={() => setDraftEntry({ packs: 0, loose: 0 })}
                        className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--status-danger)] underline underline-offset-2"
                      >
                        歸零
                      </button>
                    )}
                    <span className="font-mono-num text-2xl font-bold text-[var(--text-primary)]">
                      {drawerTotal} 顆
                    </span>
                  </div>
                </div>

                {draftEntry.loose > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--status-warn)]">
                    <Scissors className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      這排剪完剩下 {drawerDrug.packSize - draftEntry.loose} 顆放回藥盒
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {Array.from({ length: Math.min(draftEntry.packs, 3) }).map((_, i) => (
                    <SilverBlisterPack
                      key={`full-${i}`}
                      packSize={drawerDrug.packSize}
                      filledCount={drawerDrug.packSize}
                    />
                  ))}
                  {draftEntry.packs > 3 && (
                    <span className="font-mono-num text-xs font-bold text-[var(--text-secondary)]">
                      +{draftEntry.packs - 3} 排
                    </span>
                  )}
                  {draftEntry.loose > 0 && (
                    <SilverBlisterPack
                      packSize={drawerDrug.packSize}
                      filledCount={draftEntry.loose}
                      isPartial={true}
                    />
                  )}
                  {drawerTotal === 0 && (
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                      點下方按鈕拿整排，或用剪刀剪出零星顆數
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => adjustPacks(-1)}
                    disabled={draftEntry.packs <= 0}
                    className="min-h-[52px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)] active:scale-[0.98] disabled:opacity-40 text-sm sm:text-base font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                    <span>-1 排</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustPacks(1)}
                    className="min-h-[52px] rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] active:scale-[0.98] text-white text-sm sm:text-base font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>+1 排（{drawerDrug.packSize}顆）</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => adjustLoose(-1)}
                    disabled={drawerTotal <= 0}
                    className="min-h-[52px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)] active:scale-[0.98] disabled:opacity-40 text-sm sm:text-base font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                    <span>-1 顆</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustLoose(1)}
                    className="min-h-[52px] rounded-xl border border-[var(--accent-primary)] bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)]/80 active:scale-[0.98] text-[var(--accent-primary)] text-sm sm:text-base font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>剪 +1 顆</span>
                  </button>
                </div>

                <p className="text-xs text-[var(--text-secondary)] text-center pt-0.5">
                  小技巧：差 1～2 顆滿排時，可先多拿 1 排再按「-1 顆」倒扣
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={closeDrawerCancel}
                  className="min-h-[52px] px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)] text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={drawerTotal === 0 && existingTotal === 0}
                  onClick={handleConfirmDrawer}
                  className={`flex-1 min-h-[52px] px-5 rounded-xl active:scale-[0.99] disabled:opacity-40 text-white text-base font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                    drawerTotal === 0 && existingTotal > 0
                      ? 'bg-[var(--status-danger)] hover:opacity-95'
                      : 'bg-[var(--text-primary)] hover:opacity-90'
                  }`}
                >
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {drawerTotal > 0
                      ? `放進配藥盤（${drawerTotal} 顆）`
                      : existingTotal > 0
                        ? '從配藥盤移除'
                        : '放進配藥盤'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
