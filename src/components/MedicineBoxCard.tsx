import { memo } from 'react';
import { DrugSpec } from '../types/game';

interface MedicineBoxCardProps {
  drug: DrugSpec;
  selected?: boolean;
  pickedCount?: number;
  compact?: boolean;
  outOfStock?: boolean;
  onClick?: () => void;
}

export const MedicineBoxCard = memo(function MedicineBoxCard({
  drug,
  selected = false,
  pickedCount = 0,
  compact = false,
  outOfStock = false,
  onClick,
}: MedicineBoxCardProps) {
  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={outOfStock ? undefined : onClick}
      className={`group relative w-full text-left rounded-xl border transition-all duration-150 select-none overflow-hidden ${
        compact ? 'min-h-[84px]' : 'min-h-[92px]'
      } ${
        outOfStock
          ? 'border-dashed border-[var(--border-strong)] bg-[var(--bg-muted)]/75 opacity-70 cursor-not-allowed'
          : selected
            ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30 bg-[var(--bg-surface)] -translate-y-0.5 shadow-[0_5px_0_rgba(27,37,47,0.16)]'
            : 'border-[#CFC8BA] bg-[#FDFCF9] hover:bg-white hover:-translate-y-0.5 shadow-[0_3px_0_rgba(27,37,47,0.12)] active:translate-y-0.5 active:shadow-[0_1px_0_rgba(27,37,47,0.12)]'
      }`}
    >
      {/* Top folded cardboard box flap & color band */}
      <div
        className={`h-3 w-full flex items-center justify-between px-2.5 border-b border-black/10 ${
          outOfStock ? 'grayscale opacity-45' : ''
        }`}
        style={{ backgroundColor: drug.bandColor }}
      >
        <span className="w-7 h-0.5 rounded-full bg-white/55" />
        <span className="w-2 h-0.5 rounded-full bg-white/55" />
      </div>

      {/* Box front face */}
      <div className={compact ? 'px-2.5 py-2' : 'p-3'}>
        <div className="flex items-start justify-between gap-1.5">
          <span
            className={`text-[15px] font-bold leading-tight truncate ${
              outOfStock ? 'text-[#6B7280] line-through' : 'text-[#1B252F]'
            }`}
          >
            {drug.name}
          </span>
          <span className="font-mono-num text-xs text-[#3D4B59] whitespace-nowrap shrink-0">
            {outOfStock ? '缺貨中' : `${drug.packSize}顆/片`}
          </span>
        </div>

        {/* Distinct dosage imprint band */}
        <div
          className={`mt-2 px-2 py-1 rounded-md border border-black/8 flex items-center justify-between gap-1 ${
            outOfStock ? 'bg-[#DDD8CE]' : ''
          }`}
          style={outOfStock ? undefined : { backgroundColor: drug.bandAccent }}
        >
          <span
            className={`font-mono-num text-sm sm:text-[15px] font-bold ${
              outOfStock ? 'text-[#6B7280]' : 'text-[#161E28]'
            }`}
          >
            {drug.strength}
          </span>
          {outOfStock ? (
            <span className="text-xs font-bold text-[var(--status-warn)] whitespace-nowrap">
              已缺貨
            </span>
          ) : (
            pickedCount > 0 && (
              <span className="font-mono-num text-xs font-bold text-[var(--accent-primary)] whitespace-nowrap">
                盤中 {pickedCount}
              </span>
            )
          )}
        </div>
      </div>
    </button>
  );
});
