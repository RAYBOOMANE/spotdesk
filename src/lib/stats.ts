// Derived, read-only stats — mirrors the math inside the reference render().

import { LADDER, PACKAGE_COLORS, type Zone } from "./ladder";
import { clusterOf, colorOf, fwdEV, gridDims, netOfLog, PhaseFilter } from "./logic";
import { N_CLUSTERS, ACCTS_PER_CLUSTER } from "./ladder";
import type { AppState, LogEntry } from "./types";

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
  monthPayouts += state.todayPayouts;

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
  const today = state.todayProfit + state.todayPayouts;
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
