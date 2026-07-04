import { LADDER, PACKAGE_COLORS } from "@/lib/ladder";
import { colorOf, fwdEV, gridDims, matchesPhase, type PhaseFilter } from "@/lib/logic";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "./ConfirmProvider";
import { openExternal } from "@/lib/backup";
import { cn } from "@/lib/utils";

const ZONE_DOT: Record<string, string> = {
  live: "bg-live shadow-[0_0_8px_var(--live)]",
  deep: "bg-deepz shadow-[0_0_8px_var(--deep)]",
  cool: "bg-cool shadow-[0_0_8px_var(--cool)]",
  gold: "bg-gold shadow-[0_0_8px_var(--gold)]",
};

export function ClusterGrid({
  phaseFilter,
  selected,
  onToggleSelect,
  onOpenSpot,
}: {
  phaseFilter: PhaseFilter;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenSpot: (id: string) => void;
}) {
  const store = useStore();
  const { state } = store;
  const dialogs = useDialogs();
  const { nClusters, nAccts } = gridDims(state);

  const renameCluster = async (c: number) => {
    const cur = state.names?.[c] ?? "C" + c;
    const name = await dialogs.prompt("Name for this cluster", cur, "C" + c);
    if (name === null) return;
    store.renameCluster(c, name);
  };

  const editSheet = async (c: number) => {
    const cur = state.sheets?.[c] ?? "";
    const url = await dialogs.prompt(
      `Google Sheets URL for ${state.names?.[c] ?? "C" + c}`,
      cur,
      "https://docs.google.com/…"
    );
    if (url === null) return;
    store.setSheet(c, url);
  };

  const clusters = [];
  for (let c = 1; c <= nClusters; c++) {
    let clusterLive = 0,
      clusterInv = 0,
      clusterMatches = 0;
    const slots = [];
    for (let a = 1; a <= nAccts; a++) {
      const id = `${c}-${a}`;
      const sp = state.spots[id] ?? { day: 0, cost: 0, extra: 0 };
      const occupied = sp.day >= 1;
      let zone = "";
      let tied = 0,
        fwd = 0;
      if (occupied) {
        const L = LADDER[sp.day];
        zone = L.zone;
        tied = (sp.cost || 0) + (sp.extra || 0) || L.inv;
        clusterLive++;
        clusterInv += tied;
        fwd = fwdEV(sp.day);
      }
      const traded = (state.tradedToday || []).includes(id);
      const dim = phaseFilter !== "all" && !matchesPhase(phaseFilter, sp.day);
      if (phaseFilter !== "all" && matchesPhase(phaseFilter, sp.day)) clusterMatches++;
      const isSel = selected.has(id);
      slots.push(
        <div
          key={id}
          className={cn(
            "flex select-none items-center gap-2 rounded-[9px] border bg-panel2 px-2 py-1.5 transition-all",
            occupied ? "border-line2" : "border-line",
            isSel && "border-live bg-[rgba(0,226,160,0.08)]",
            traded && "border-l-2 border-l-live",
            dim && "opacity-20 grayscale",
            "hover:border-line2 hover:bg-[#19212f]"
          )}
        >
          <input
            type="checkbox"
            checked={isSel}
            onChange={() => onToggleSelect(id)}
            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-live"
            title="select for multi-log"
          />
          <button className="flex flex-1 items-center gap-2 text-left" onClick={() => onOpenSpot(id)}>
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full transition-all",
                occupied ? ZONE_DOT[zone] : "bg-free"
              )}
            />
            <span className={cn("w-5 shrink-0 font-mono text-[0.62rem]", traded ? "font-bold text-live" : "text-dim")}>
              {a}
            </span>
            <span className="flex-1 font-mono text-[0.64rem]">
              {occupied ? (
                <>
                  <span className="font-semibold text-ink">D{sp.day}</span>{" "}
                  <span className="text-faint">${tied.toLocaleString()}</span>
                </>
              ) : (
                <span className="text-faint">free</span>
              )}
            </span>
            {occupied && <span className="font-mono text-[0.6rem] text-gold">~${fwd.toFixed(0)}</span>}
          </button>
        </div>
      );
    }
    const cColor = colorOf(state, c);
    const cSheet = state.sheets?.[c] ?? "";
    const allDim = phaseFilter !== "all" && clusterMatches === 0;
    clusters.push(
      <div
        key={c}
        className={cn(
          "rounded-card border border-line bg-panel p-3 shadow-card transition-all hover:-translate-y-px hover:shadow-cardHover",
          clusterLive > 0 && "border-line2",
          allDim && "opacity-40"
        )}
        style={{ borderTop: `2px solid ${cColor}` }}
      >
        <div className="mb-2.5 flex items-center justify-between gap-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="h-[11px] w-[11px] shrink-0 rounded-[3px] shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-transform hover:scale-125"
              style={{ background: cColor }}
              onClick={() => store.cycleColor(c)}
              title="click to change package color"
            />
            <button
              className="truncate text-[0.75rem] font-bold tracking-[-0.01em] hover:text-live"
              onClick={() => renameCluster(c)}
              title="click to rename"
            >
              {state.names?.[c] ?? "C" + c}
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              className={cn(
                "flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border border-line2 bg-panel2 text-[0.8rem] transition-all hover:border-cool hover:brightness-125",
                cSheet ? "text-cool" : "text-faint"
              )}
              onClick={() => (cSheet ? openExternal(cSheet) : editSheet(c))}
              onContextMenu={(e) => {
                e.preventDefault();
                editSheet(c);
              }}
              title={cSheet ? "open Google Sheet (right-click to edit link)" : "add Google Sheet link"}
            >
              ⊞
            </button>
            <span className="font-mono text-[0.58rem] text-dim">
              {clusterLive}/{nAccts} · ${clusterInv.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">{slots}</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">{clusters}</div>
      <div className="mt-3.5 flex flex-wrap gap-3.5 font-mono text-[0.58rem] text-dim">
        {[
          ["var(--free)", "free"],
          ["var(--live)", "D1–3"],
          ["var(--deep)", "D4–7 deep"],
          ["var(--gold)", "D8 / D14"],
          ["var(--cool)", "D9–13"],
        ].map(([col, lbl]) => (
          <span key={lbl} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: col }} />
            {lbl}
          </span>
        ))}
      </div>
    </>
  );
}
