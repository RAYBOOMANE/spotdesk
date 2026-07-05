// Derived, read-only stats — mirrors the math inside the reference render().

import { LADDER, PACKAGE_COLORS, type Zone } from "./ladder";
import { clusterOf, colorOf, fwdEV, gridDims, managerOf, netOfLog, PhaseFilter, todayTotals } from "./logic";
import { N_CLUSTERS, ACCTS_PER_CLUSTER } from "./ladder";
import type { AppState, LogEntry, MoneyHeldEntry, OutcomeType, Task } from "./types";

export interface TopStats {
  deployed: number;
  liveCount: number;
  fwdTotal: number;
  deepCount: number; // day 4–7
  secondLegCount: number; // day >= 8
  blewCount: number;
  leftToTrade: number;
  monthPayouts: number;
  monthStartLabel: string;
  capPct: number;
  capDenom: number;
  capLabel: string;
  capitalLimit: number; // 0 = no limit set
  capitalPct: number; // deployed ÷ capitalLimit × 100; 0 when unset
}

export function computeTopStats(state: AppState, now: Date = new Date()): TopStats {
  const { nClusters, nAccts } = gridDims(state);
  let deployed = 0,
    liveCount = 0,
    fwdTotal = 0,
    deepCount = 0,
    secondLegCount = 0,
    leftToTrade = 0;
  for (let c = 1; c <= nClusters; c++)
    for (let a = 1; a <= nAccts; a++) {
      const id = `${c}-${a}`;
      const sp = state.spots[id];
      if (sp && sp.day >= 1) {
        const tied = (sp.cost || 0) + (sp.extra || 0) || LADDER[sp.day].inv;
        deployed += tied;
        liveCount++;
        if (sp.day >= 4 && sp.day <= 7) deepCount++;
        if (sp.day >= 8) secondLegCount++;
        fwdTotal += fwdEV(sp.day);
        if (!(state.tradedToday || []).includes(id)) leftToTrade++;
      }
    }

  const blewCount = state.todayLog.filter((l) => l.type === "blew").length;

  // Payouts THIS MONTH = archived days in current month + today
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let monthPayouts = 0;
  (state.history || []).forEach((d) => {
    if (d.date && new Date(d.date) >= monthStart) monthPayouts += d.payouts || 0;
  });
  monthPayouts += todayTotals(state).payouts;

  const totalSlots = N_CLUSTERS * ACCTS_PER_CLUSTER;
  const denom = state.capacityTarget && state.capacityTarget > 0 ? state.capacityTarget : totalSlots;
  const capPct = (liveCount / denom) * 100;
  const capLabel =
    state.capClusters && state.capAccts
      ? `${liveCount} / ${denom} (${state.capClusters}×${state.capAccts})`
      : `${liveCount} / ${denom} active`;

  const capitalLimit = state.capitalLimit || 0;
  const capitalPct = capitalLimit > 0 ? (deployed / capitalLimit) * 100 : 0;

  return {
    deployed,
    liveCount,
    fwdTotal,
    deepCount,
    secondLegCount,
    blewCount,
    leftToTrade,
    monthPayouts,
    monthStartLabel: monthStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    capPct,
    capDenom: denom,
    capLabel,
    capitalLimit,
    capitalPct,
  };
}

// Phase filter counts — over ALL spots in state (like the reference).
export function phaseCounts(state: AppState): Record<PhaseFilter, number> {
  const counts: Record<PhaseFilter, number> = { all: 0, "1": 0, "2": 0, "3": 0, "4-7": 0, "8-12": 0 };
  Object.values(state.spots).forEach((sp) => {
    if (sp.day < 1) return;
    counts.all++;
    if (sp.day === 1) counts["1"]++;
    else if (sp.day === 2) counts["2"]++;
    else if (sp.day === 3) counts["3"]++;
    else if (sp.day >= 4 && sp.day <= 7) counts["4-7"]++;
    else if (sp.day >= 8 && sp.day <= 12) counts["8-12"]++;
  });
  return counts;
}

// Live-account counts bucketed by ladder zone (live D1-3 / deep D4-7 / cool D9-13 /
// gold D8&14 gateway-payout). Informational, not P&L — used for the zone donut.
export function zoneCounts(state: AppState): Record<Zone, number> {
  const counts: Record<Zone, number> = { live: 0, deep: 0, cool: 0, gold: 0 };
  Object.values(state.spots).forEach((sp) => {
    if (sp.day < 1) return;
    counts[LADDER[sp.day].zone]++;
  });
  return counts;
}

// Today/week/month/all-time P&L, used by Objectives and CEO Office Overview.
// Week = last 7 archived days + today (matches packageGroups' "week" window).
// Month = archived days since the 1st of the current calendar month + today
// (matches computeTopStats' monthPayouts window, just on .total not .payouts).
export interface PeriodTotals {
  today: number;
  week: number;
  month: number;
  allTime: number;
}
export function periodTotals(state: AppState, now: Date = new Date()): PeriodTotals {
  const today = todayTotals(state).total;
  const week = state.history.slice(-7).reduce((sum, d) => sum + (d.total || 0), 0) + today;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const month =
    state.history.filter((d) => d.date && new Date(d.date) >= monthStart).reduce((sum, d) => sum + (d.total || 0), 0) +
    today;
  const allTime = state.history.reduce((sum, d) => sum + (d.total || 0), 0) + today;
  return { today, week, month, allTime };
}

// Equity curve: cumulative running total of each archived day's banked total.
export interface EquityPoint {
  day: number;
  label: string;
  val: number;
}
export function equityPoints(state: AppState): { points: EquityPoint[]; total: number } {
  let cum = 0;
  const points: EquityPoint[] = [{ day: 0, label: "", val: 0 }];
  (state.history || []).forEach((d) => {
    cum += d.total || 0;
    points.push({ day: d.day, label: "D" + d.day, val: cum });
  });
  return { points, total: cum };
}

// Active positions, sorted deepest-day first.
export interface PositionRow {
  id: string;
  c: number;
  a: number;
  day: number;
  tied: number;
  fwd: number;
  name: string;
}
export function positionRows(state: AppState): PositionRow[] {
  const { nClusters, nAccts } = gridDims(state);
  const rows: PositionRow[] = [];
  for (let c = 1; c <= nClusters; c++)
    for (let a = 1; a <= nAccts; a++) {
      const id = `${c}-${a}`;
      const sp = state.spots[id];
      if (sp && sp.day >= 1) {
        const tied = (sp.cost || 0) + (sp.extra || 0);
        const nm = state.names && state.names[c] ? state.names[c] : "C" + c;
        rows.push({ id, c, a, day: sp.day, tied, fwd: fwdEV(sp.day), name: nm });
      }
    }
  rows.sort((x, y) => y.day - x.day || x.c - y.c || x.a - y.a);
  return rows;
}

// Packages (clusters grouped by color). Week = last 7 archived days + today.
export interface PackageGroup {
  hex: string;
  name: string;
  clusters: number[];
  clusterLabels: string;
  today: number;
  week: number;
}
export function packageGroups(state: AppState): PackageGroup[] {
  const { nClusters } = gridDims(state);
  const groups: Record<string, { clusters: number[]; today: number; week: number }> = {};
  for (let c = 1; c <= nClusters; c++) {
    const hex = colorOf(state, c);
    if (!groups[hex]) groups[hex] = { clusters: [], today: 0, week: 0 };
    groups[hex].clusters.push(c);
  }
  state.todayLog.forEach((w: LogEntry) => {
    const hex = colorOf(state, clusterOf(w.id));
    if (groups[hex]) groups[hex].today += netOfLog(w);
  });
  const recent = state.history.slice(-7);
  recent.forEach((d) => {
    (d.log || []).forEach((w) => {
      const hex = colorOf(state, clusterOf(w.id));
      if (groups[hex]) groups[hex].week += netOfLog(w);
    });
  });
  Object.keys(groups).forEach((hex) => {
    groups[hex].week += groups[hex].today;
  });
  return Object.entries(groups).map(([hex, g]) => {
    const p = PACKAGE_COLORS.find((p) => p.hex === hex);
    return {
      hex,
      name: p ? p.name : "Custom",
      clusters: g.clusters,
      clusterLabels: g.clusters.map((c) => (state.names && state.names[c] ? state.names[c] : "C" + c)).join(", "),
      today: g.today,
      week: g.week,
    };
  });
}

// CEO Office → Managers. Managers ARE the color groups above — this reuses
// packageGroups' today/week (identical filtering, so it stays consistent
// with the Trading Floor Packages chart) and adds the all-time/capital/
// expected-payout/split figures that packageGroups doesn't compute.
export interface ManagerSummary {
  hex: string;
  name: string;
  splitPct: number;
  clusters: number[];
  clusterLabels: string;
  capitalInvested: number;
  allTimePL: number;
  expectedPayout: number;
  weekNet: number;
  weeklyOwed: number;
}
export function managerSummaries(state: AppState): ManagerSummary[] {
  const groups = packageGroups(state);
  const { nAccts } = gridDims(state);

  return groups.map((g) => {
    let capitalInvested = 0;
    let expectedPayout = 0;
    g.clusters.forEach((c) => {
      for (let a = 1; a <= nAccts; a++) {
        const sp = state.spots[`${c}-${a}`];
        if (sp && sp.day >= 1) {
          capitalInvested += (sp.cost || 0) + (sp.extra || 0) || LADDER[sp.day].inv;
          expectedPayout += fwdEV(sp.day);
        }
      }
    });

    let allTimePL = 0;
    state.history.forEach((d) => {
      (d.log || []).forEach((w) => {
        if (colorOf(state, clusterOf(w.id)) === g.hex) allTimePL += netOfLog(w);
      });
    });
    state.todayLog.forEach((w) => {
      if (colorOf(state, clusterOf(w.id)) === g.hex) allTimePL += netOfLog(w);
    });

    const meta = managerOf(state, g.hex);
    return {
      hex: g.hex,
      name: meta.name || g.name,
      splitPct: meta.splitPct || 0,
      clusters: g.clusters,
      clusterLabels: g.clusterLabels,
      capitalInvested,
      allTimePL,
      expectedPayout,
      weekNet: g.week,
      weeklyOwed: (g.week * (meta.splitPct || 0)) / 100,
    };
  });
}

// Money Held → status is DERIVED from the settlement history, never stored,
// so it can never disagree with the numbers underneath it.
export type MoneyHeldStatus = "open" | "partially_settled" | "settled";

export function moneyHeldRemaining(entry: MoneyHeldEntry): number {
  const settled = entry.settlements.reduce((sum, s) => sum + s.amount, 0);
  return entry.amount - settled;
}

export function moneyHeldStatus(entry: MoneyHeldEntry): MoneyHeldStatus {
  const remaining = moneyHeldRemaining(entry);
  if (remaining <= 0) return "settled";
  if (entry.settlements.length > 0) return "partially_settled";
  return "open";
}

// Accounting → Ledger. Every LogEntry that has ever been recorded, across
// today and every archived day — built entirely from existing todayLog/
// history[].log, nothing new is stored. "invested" reuses the sunk (blew) /
// invested (payout) field already recorded on the entry at the time it was
// logged; "net" reuses the same netOfLog already used everywhere else
// (packageGroups, managerSummaries). No new outcome types exist beyond
// "blew"/"payout" — the data model has never recorded "investment" as its
// own ledger event (Set Day doesn't log an entry), so there is nothing to
// show for it here without inventing data that was never captured.
export interface LedgerRow {
  key: string;
  isoDate: string; // YYYY-MM-DD, used for date-range filtering/sorting
  dateLabel: string;
  time: string;
  sourceLabel: string; // "Today" or "Day N"
  historyIndex: number | null; // index into state.history[] (open via DayDetailModal); null = today's log
  todayLogIndex: number | null; // index into state.todayLog[] (delete via deleteLog); null = an archived-day row
  id: string;
  cluster: number;
  clientName: string;
  color: string;
  type: OutcomeType;
  amount: number;
  invested: number;
  net: number;
}

export function ledgerRows(state: AppState): LedgerRow[] {
  const rows: LedgerRow[] = [];

  const push = (
    w: LogEntry,
    isoDate: string,
    dateLabel: string,
    sourceLabel: string,
    historyIndex: number | null,
    todayLogIndex: number | null
  ) => {
    const cluster = clusterOf(w.id);
    rows.push({
      key: `${sourceLabel}-${w.id}-${w.time}-${rows.length}`,
      isoDate,
      dateLabel,
      time: w.time,
      sourceLabel,
      historyIndex,
      todayLogIndex,
      id: w.id,
      cluster,
      clientName: state.names && state.names[cluster] ? state.names[cluster] : "C" + cluster,
      color: colorOf(state, cluster),
      type: w.type,
      amount: w.amount,
      invested: w.type === "blew" ? w.sunk || 0 : w.invested || 0,
      net: netOfLog(w),
    });
  };

  (state.history || []).forEach((d, historyIndex) => {
    const isoDate = d.date ? d.date.slice(0, 10) : "";
    const dateLabel = d.date
      ? new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
      : `Day ${d.day}`;
    (d.log || []).forEach((w) => push(w, isoDate, dateLabel, `Day ${d.day}`, historyIndex, null));
  });

  const todayIso = new Date().toISOString().slice(0, 10);
  state.todayLog.forEach((w, todayLogIndex) => push(w, todayIso, "Today", "Today", null, todayLogIndex));

  return rows.reverse(); // newest first
}

// Authoritative ledger totals — Net P&L and gross payouts derived from each
// day's OWN aggregate fields (d.total/d.profit/d.payouts/d.payoutGross for
// archived days, live todayLog for today), NOT by re-summing ledgerRows.
// This is what makes Accounting's headline numbers agree with Trading Floor
// Overview / CEO Office even after a manual editHistoryDay correction —
// unlike ledgerRows, which intentionally shows the raw, unedited entries.
// Only valid for the WHOLE ledger (no client/manager narrowing): a day-level
// total carries no per-client attribution, so a client/manager filter must
// fall back to summing the filtered rows instead (see AccountingLedgerView).
export interface AuthoritativeTotals {
  netPnl: number;
  grossPayouts: number;
}
export function ledgerAuthoritativeTotals(
  state: AppState,
  opts: { dateFrom: string; dateTo: string; type: "all" | "blew" | "payout" }
): AuthoritativeTotals {
  let netPnl = 0;
  let grossPayouts = 0;

  const dayNet = (profit: number, payouts: number) => {
    if (opts.type === "blew") return profit;
    if (opts.type === "payout") return payouts;
    return profit + payouts;
  };

  (state.history || []).forEach((d) => {
    const isoDate = d.date ? d.date.slice(0, 10) : "";
    if (opts.dateFrom && isoDate && isoDate < opts.dateFrom) return;
    if (opts.dateTo && isoDate && isoDate > opts.dateTo) return;
    netPnl += dayNet(d.profit || 0, d.payouts || 0);
    if (opts.type !== "blew") {
      const gross = d.payoutGross ?? (d.log || []).filter((l) => l.type === "payout").reduce((s, l) => s + (l.amount || 0), 0);
      grossPayouts += gross;
    }
  });

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayInRange = (!opts.dateFrom || todayIso >= opts.dateFrom) && (!opts.dateTo || todayIso <= opts.dateTo);
  if (todayInRange) {
    const tt = todayTotals(state);
    netPnl += dayNet(tt.profit, tt.payouts);
    if (opts.type !== "blew") {
      grossPayouts += state.todayLog.filter((l) => l.type === "payout").reduce((s, l) => s + (l.amount || 0), 0);
    }
  }

  return { netPnl, grossPayouts };
}

// ── Secretary → task views ────────────────────────────────────────────
export type SecretaryFilter = "today" | "upcoming" | "all" | "completed";

export function secretaryTasks(state: AppState, filter: SecretaryFilter, now: Date = new Date()): Task[] {
  const today = now.toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const tasks = state.tasks || [];

  let filtered: Task[];
  switch (filter) {
    case "today":
      // Exactly today's deadline only -- no overdue, no no-deadline tasks.
      filtered = tasks.filter((t) => t.status !== "completed" && t.deadline === today);
      break;
    case "upcoming":
      // Bounded to the current calendar month -- next month's deadlines don't show here.
      filtered = tasks.filter(
        (t) => t.status !== "completed" && !!t.deadline && t.deadline > today && t.deadline <= monthEnd
      );
      break;
    case "completed":
      filtered = tasks.filter((t) => t.status === "completed");
      break;
    case "all":
    default:
      filtered = tasks;
      break;
  }

  // Overdue first, then soonest deadline, then newest.
  return [...filtered].sort((a, b) => {
    const aOver = !!a.deadline && a.deadline < today && a.status !== "completed";
    const bOver = !!b.deadline && b.deadline < today && b.status !== "completed";
    if (aOver !== bOver) return aOver ? -1 : 1;
    if (a.deadline && b.deadline && a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1;
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}
