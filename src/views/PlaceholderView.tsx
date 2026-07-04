export function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
      <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
      <p className="max-w-sm text-sm text-dim">{description}</p>
      <p className="mt-2 font-mono text-data-xs uppercase tracking-[0.14em] text-faint">Coming soon</p>
    </div>
  );
}
