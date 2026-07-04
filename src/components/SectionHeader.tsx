export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 mt-10 flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-dim">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-dim" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
