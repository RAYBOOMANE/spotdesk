export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 mt-8 flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-dim">
      {children}
      <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
    </div>
  );
}
