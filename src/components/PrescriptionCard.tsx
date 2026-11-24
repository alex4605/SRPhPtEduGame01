import { memo, useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { PrescriptionItem } from '../types/game';

interface PrescriptionCardProps {
  patientName: string;
  patientMeta: string;
  rxNumber: string;
  items: readonly PrescriptionItem[];
  shortageNote?: string;
  defaultOpen?: boolean;
  compactToggleable?: boolean;
}

export const PrescriptionCard = memo(function PrescriptionCard({
  patientName,
  patientMeta,
  rxNumber,
  items,
  shortageNote,
  defaultOpen = true,
  compactToggleable = false,
}: PrescriptionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-paper)] overflow-hidden">
      {/* Prescription Slip Top Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-4 h-4 text-[var(--accent-primary)] shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-[17px] font-bold text-[var(--text-primary)] truncate">
              處方箋 · {patientName}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] truncate font-mono-num">
              {rxNumber} · {patientMeta}
            </p>
          </div>
        </div>
        {compactToggleable && (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>{isOpen ? '收合' : '展開'}</span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="p-4 space-y-3">
          <div className="divide-y divide-dashed divide-[var(--border-strong)]">
            {items.map((item) => (
              <div key={item.targetDrugId} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-bold text-[17px] text-[var(--text-primary)]">
                    <span>{item.displayName}</span>
                    <span className="font-mono-num font-bold ml-1.5 text-[var(--accent-primary)]">
                      {item.strength}
                    </span>
                  </div>
                  <span className="font-mono-num text-base font-bold text-[var(--text-primary)] whitespace-nowrap shrink-0">
                    共 {item.requiredQty} 顆
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  {item.dosageInstruction}
                </p>
              </div>
            ))}
          </div>
          {shortageNote && (
            <p className="pt-2.5 receipt-divider text-xs font-medium text-[var(--status-warn)] leading-relaxed">
              {shortageNote}
            </p>
          )}
        </div>
      )}
    </section>
  );
});
