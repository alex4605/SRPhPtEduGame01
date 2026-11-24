import { memo, useEffect, useState } from 'react';
import { Store } from 'lucide-react';

interface IllustrationImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  priority?: boolean;
}

export const IllustrationImage = memo(function IllustrationImage({
  src,
  alt,
  className = '',
  fallbackLabel,
  priority = false,
}: IllustrationImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[var(--bg-muted)] text-[var(--text-secondary)] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Store className="w-7 h-7 mb-1.5 opacity-60" aria-hidden="true" />
        <span className="text-xs font-medium">{fallbackLabel ?? alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
});
