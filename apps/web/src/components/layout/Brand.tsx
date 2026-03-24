type BrandProps = {
  className?: string;
  compact?: boolean;
};

export default function Brand({ className = "", compact = false }: BrandProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`.trim()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="VoidLAB"
          className="h-10 w-10 rounded-2xl"
          src="/assets/logo-icon.svg"
        />
        <span className="display-font text-2xl font-semibold tracking-[-0.05em] text-white">
          VoidLAB
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="VoidLAB"
        className="h-12 w-auto sm:h-14"
        src="/assets/logo-full.svg"
      />
    </div>
  );
}
