// ─────────────────────────────────────────────────────────────────────
// SPOTDESK core logic — ported VERBATIM from spot-tracker.html.
// Every function mirrors the original behavior, including fallbacks:
//  • single blow with blank cost  → phase-aware cumInvest(day)
//  • single payout with blank cost→ LADDER[day].inv
//  • multi ops with blank cost    → LADDER[day].inv (yes, even for blow —
//    that is what the reference does; do not change it)
//  • blank gross                  → LADDER[day].prof
// All functions are pure: they clone state and return the next state.
// ─────────────────────────────────────────────────────────────────────

import { LADDER, FWD, N_CLUSTERS, ACCTS_PER_CLUSTER, PACKAGE_COLORS } from "./ladder";
import type {
  AppLogin,
  AppState,
  ClientProfile,
  HistoryDay,
  LogEntry,
  ManagerMeta,
  Maybe,
  MoneyHeldEntry,
  Objectives,
  OutcomeType,
  PaymentMethod,
  Settlement,
  Spot,
  VpsInfo,
  WithdrawalMethod,
} from "./types";

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function fwdEV(day: number): number {
  if (day < 1 || day > 14) return 0;
  return FWD[day] || 0;
}

// Cumulative invested climbing the ladder, PHASE-AWARE.
// Phase 1 (D1–8): sum from D1. Phase 2 (D9–14): sum from D9 only, because the
// second leg uses fresh cheap accounts — phase-1 costs belonged to a different
// account life.
export function cumInvest(day: number): number {
  let sum = 0;
  const start = day >= 9 ? 9 : 1;
  for (let d = start; d <= day && d <= 14; d++) sum += LADDER[d].inv;
  return sum;
}

export function gridDims(state: AppState): { nClusters: number; nAccts: number } {
  return {
    nClusters: state.capClusters && state.capClusters > 0 ? state.capClusters : N_CLUSTERS,
    nAccts: state.capAccts && state.capAccts > 0 ? state.capAccts : ACCTS_PER_CLUSTER,
  };
}

function defaultObjectives(): Objectives {
  return { dailyTarget: 0, weeklyTarget: 0, monthlyTarget: 0, maxAccounts: 0, notes: "" };
}

function defaultVpsInfo(): VpsInfo {
  return { ipAddress: "", username: "", password: "" };
}

function defaultClientProfile(): ClientProfile {
  return {
    firstName: "",
    familyName: "",
    address: "",
    vpsLocation: "",
    vpsInfo: defaultVpsInfo(),
    paymentMethods: [],
    withdrawalMethods: [],
    appLogins: [],
  };
}

export function freshState(): AppState {
  const spots: Record<string, Spot> = {};
  const names: Record<string, string> = {};
  const colors: Record<string, string> = {};
  const sheets: Record<string, string> = {};
  for (let c = 1; c <= N_CLUSTERS; c++) {
    names[c] = "C" + c;
    colors[c] = PACKAGE_COLORS[0].hex; // default first color
    sheets[c] = "";
    for (let a = 1; a <= ACCTS_PER_CLUSTER; a++) spots[`${c}-${a}`] = { day: 0, cost: 0, extra: 0 };
  }
  return {
    spots,
    names,
    colors,
    sheets,
    capacityTarget: 0,
    capClusters: null,
    capAccts: null,
    accountPrice: 95,
    capitalLimit: 0,
    todayProfit: 0,
    todayPayouts: 0,
    todayLog: [],
    tradedToday: [],
    deployedToday: 0,
    dayCount: 1,
    history: [],
    objectives: defaultObjectives(),
    managers: {},
    moneyHeld: [],
    clientProfiles: {},
  };
}

function clone(state: AppState): AppState {
  return JSON.parse(JSON.stringify(state));
}

function markTraded(st: AppState, id: string) {
  if (!st.tradedToday) st.tradedToday = [];
  if (!st.tradedToday.includes(id)) st.tradedToday.push(id);
}

export function nowTime(): string {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function colorOf(state: AppState, c: number): string {
  return state.colors && state.colors[c] ? state.colors[c] : PACKAGE_COLORS[0].hex;
}

export function clusterOf(id: string): number {
  return parseInt(id.split("-")[0], 10);
}

export function netOfLog(w: LogEntry): number {
  return w.profit != null ? w.profit : w.amount;
}

// ── Set Day (saveContinue) ───────────────────────────────────────────
// Only counts as "traded" / new deployment if extra investment was
// actually added (extra > 0 AND changed). Recording/correcting cost does not.
export function setDaySingle(state: AppState, id: string, day: number, costRaw: Maybe, extraRaw: Maybe): AppState {
  const st = clone(state);
  const extra = extraRaw == null ? 0 : extraRaw;
  const cost = costRaw == null ? LADDER[day].inv : costRaw;
  const prevExtra = (st.spots[id] && st.spots[id].extra) || 0;
  const addedExtra = extra > 0 && extra !== prevExtra;
  if (addedExtra) {
    markTraded(st, id);
    st.deployedToday = (st.deployedToday || 0) + extra;
  }
  st.spots[id] = { day, cost, extra };
  return st;
}

// ── Log outcome for one account (blew / payout) ──────────────────────
export function logOutcomeSingle(
  state: AppState,
  id: string,
  day: number,
  type: OutcomeType,
  costRaw: Maybe,
  extraRaw: Maybe,
  amountRaw: Maybe,
  time?: string
): AppState {
  const st = clone(state);
  const amt = amountRaw == null ? LADDER[day].prof : amountRaw;
  const now = time ?? nowTime();
  markTraded(st, id);
  if (type === "blew") {
    // GROSS total profit received. Deduct the ACTUAL investment typed
    // (cost + extra). Blank cost → phase-aware benchmark cumInvest(day).
    const invested = (costRaw == null ? cumInvest(day) : costRaw) + (extraRaw == null ? 0 : extraRaw);
    const net = amt - invested;
    st.todayLog.push({ time: now, id, amount: amt, sunk: invested, profit: net, day, type: "blew" });
    st.todayProfit += net;
    st.spots[id] = { day: 0, cost: 0, extra: 0 };
  } else {
    // payout: profit = payout amount − investment put in.
    // Account KEPT, stays SAME day, 0 invested.
    const invested = (costRaw == null ? LADDER[day].inv : costRaw) + (extraRaw == null ? 0 : extraRaw);
    const netProfit = amt - invested;
    st.todayLog.push({ time: now, id, amount: amt, invested, profit: netProfit, day, type: "payout" });
    st.todayPayouts += netProfit;
    st.spots[id] = { day, cost: 0, extra: 0 };
  }
  return st;
}

export function freeSpotSingle(state: AppState, id: string): AppState {
  const st = clone(state);
  st.spots[id] = { day: 0, cost: 0, extra: 0 };
  return st;
}

// ── Multi-select (copy trade) ────────────────────────────────────────
// Validation: same cluster; can't mix empty+occupied; occupied must share day.
// Returns an error message (to show the user) or null if selectable.
export function selectionError(state: AppState, selected: string[], id: string): string | null {
  const sp = state.spots[id];
  const thisCluster = id.split("-")[0];
  const thisOccupied = !!(sp && sp.day >= 1);
  if (selected.length > 0) {
    const firstId = selected[0];
    const firstCluster = firstId.split("-")[0];
    const firstSp = state.spots[firstId];
    const firstOccupied = !!(firstSp && firstSp.day >= 1);
    if (thisCluster !== firstCluster)
      return "Copy-trade only within the SAME cluster. Currently selecting from C" + firstCluster + ".";
    if (thisOccupied !== firstOccupied)
      return "Select either all empty spots (to open together) OR all occupied spots on the same day.";
    if (thisOccupied && firstOccupied && sp.day !== firstSp.day)
      return "Copy-trade only accounts on the SAME day. Currently selecting D" + firstSp.day + ", this one is D" + sp.day + ".";
  }
  return null;
}

export function multiSetDay(state: AppState, ids: string[], day: number, costRaw: Maybe, extraRaw: Maybe): AppState {
  const st = clone(state);
  const cost = costRaw == null ? LADDER[day].inv : costRaw;
  const extra = extraRaw == null ? 0 : extraRaw;
  ids.forEach((id) => {
    const prevExtra = (st.spots[id] && st.spots[id].extra) || 0;
    const addedExtra = extra > 0 && extra !== prevExtra;
    if (addedExtra) {
      markTraded(st, id);
      st.deployedToday = (st.deployedToday || 0) + extra;
    }
    st.spots[id] = { day, cost, extra };
  });
  return st;
}

export function multiFree(state: AppState, ids: string[]): AppState {
  const st = clone(state);
  ids.forEach((id) => {
    st.spots[id] = { day: 0, cost: 0, extra: 0 };
  });
  return st;
}

export function multiOutcome(
  state: AppState,
  ids: string[],
  day: number,
  type: OutcomeType,
  costRaw: Maybe,
  extraRaw: Maybe,
  amountRaw: Maybe,
  time?: string
): AppState {
  const st = clone(state);
  const amt = amountRaw == null ? LADDER[day].prof : amountRaw;
  // NOTE: multi uses the flat day benchmark (LADDER[day].inv), not cumInvest —
  // exactly like the reference implementation.
  const invested = (costRaw == null ? LADDER[day].inv : costRaw) + (extraRaw == null ? 0 : extraRaw);
  const now = time ?? nowTime();
  ids.forEach((id) => {
    markTraded(st, id);
    if (type === "blew") {
      const net = amt - invested;
      st.todayLog.push({ time: now, id, amount: amt, sunk: invested, profit: net, day, type: "blew" });
      st.todayProfit += net;
      st.spots[id] = { day: 0, cost: 0, extra: 0 };
    } else {
      const net = amt - invested;
      st.todayLog.push({ time: now, id, amount: amt, invested, profit: net, day, type: "payout" });
      st.todayPayouts += net;
      st.spots[id] = { day, cost: 0, extra: 0 };
    }
  });
  return st;
}

// ── Delete / undo a logged entry ─────────────────────────────────────
export function deleteLog(state: AppState, idx: number): AppState {
  const st = clone(state);
  const w = st.todayLog[idx];
  if (!w) return st;
  const net = w.profit != null ? w.profit : w.amount;
  if (w.type === "payout") st.todayPayouts -= net;
  else st.todayProfit -= net;
  st.todayLog.splice(idx, 1);
  return st;
}

// ── Total money currently deployed (grid-scoped, with benchmark fallback
//    when cost+extra is 0 — exactly like the reference render loop) ────
export function deployedNow(state: AppState): number {
  const { nClusters, nAccts } = gridDims(state);
  let deployed = 0;
  for (let c = 1; c <= nClusters; c++)
    for (let a = 1; a <= nAccts; a++) {
      const sp = state.spots[`${c}-${a}`];
      if (sp && sp.day >= 1) {
        const tied = (sp.cost || 0) + (sp.extra || 0) || LADDER[sp.day].inv;
        deployed += tied;
      }
    }
  return deployed;
}

// Today's P&L, derived live from todayLog rather than trusted from the
// incrementally-patched todayProfit/todayPayouts counters. Those counters
// stay in the schema (setDaySingle/logOutcomeSingle/deleteLog still
// maintain them, unchanged) and are provably correct as long as every
// mutation goes through this file's own functions -- but anything that
// BAKES a number permanently (rollDay writing to history) or DISPLAYS a
// headline figure should read the authoritative source (the log entries
// themselves) directly, so a future gap in that invariant can't silently
// corrupt history or drift a displayed total.
export function todayTotals(state: AppState): { profit: number; payouts: number; total: number } {
  const profit = state.todayLog.filter((l) => l.type === "blew").reduce((s, l) => s + netOfLog(l), 0);
  const payouts = state.todayLog.filter((l) => l.type === "payout").reduce((s, l) => s + netOfLog(l), 0);
  return { profit, payouts, total: profit + payouts };
}

// ── New Day (the roll) ───────────────────────────────────────────────
// 1) archive today  2) fold extra into cost for every occupied account
// 3) advance ONLY accounts traded today by +1 (cap 14)  4) reset counters.
export function rollDay(state: AppState, dateIso?: string): AppState {
  const st = clone(state);
  const { profit, payouts, total } = todayTotals(st);
  const deployed = deployedNow(st);
  const payoutGross = st.todayLog.filter((l) => l.type === "payout").reduce((s, l) => s + (l.amount || 0), 0);
  st.history.push({
    day: st.dayCount,
    profit,
    payouts,
    payoutGross,
    total,
    deployed,
    log: st.todayLog.slice(),
    date: dateIso ?? new Date().toISOString(),
  });

  const traded = new Set(st.tradedToday || []);
  Object.keys(st.spots).forEach((id) => {
    const sp = st.spots[id];
    if (sp.day >= 1) {
      sp.cost = (sp.cost || 0) + (sp.extra || 0);
      sp.extra = 0;
      if (traded.has(id) && sp.day < 14) sp.day = sp.day + 1;
    }
  });

  st.dayCount++;
  st.todayProfit = 0;
  st.todayPayouts = 0;
  st.todayLog = [];
  st.tradedToday = [];
  st.deployedToday = 0;
  return st;
}

// ── Edit an archived day ─────────────────────────────────────────────
export interface DayEditFields {
  profit?: number;
  payoutGross?: number;
  payouts?: number;
  deployed?: number;
  blownOverride?: number;
}
export function editHistoryDay(state: AppState, idx: number, f: DayEditFields): AppState {
  const st = clone(state);
  const d = st.history[idx];
  if (!d) return st;
  if (f.profit != null && !isNaN(f.profit)) d.profit = f.profit;
  if (f.payoutGross != null && !isNaN(f.payoutGross)) d.payoutGross = f.payoutGross; // gross (does NOT hit total)
  if (f.payouts != null && !isNaN(f.payouts)) d.payouts = f.payouts; // payout PROFIT (contributes to total)
  if (f.deployed != null && !isNaN(f.deployed)) d.deployed = f.deployed;
  if (f.blownOverride != null && !isNaN(f.blownOverride)) d.blownOverride = f.blownOverride;
  // total profit = blow profit + payout profit (gross payout excluded)
  d.total = (d.profit || 0) + (d.payouts || 0);
  return st;
}

// ── Cluster meta ─────────────────────────────────────────────────────
export function renameCluster(state: AppState, c: number, name: string): AppState {
  const st = clone(state);
  if (!st.names) st.names = {};
  st.names[c] = name.trim() || "C" + c;
  return st;
}
export function setColor(state: AppState, c: number, hex: string): AppState {
  const st = clone(state);
  if (!st.colors) st.colors = {};
  st.colors[c] = hex;
  return st;
}
export function cycleColor(state: AppState, c: number): AppState {
  const cur = colorOf(state, c);
  const idx = PACKAGE_COLORS.findIndex((p) => p.hex === cur);
  const next = PACKAGE_COLORS[(idx + 1) % PACKAGE_COLORS.length];
  return setColor(state, c, next.hex);
}
export function setSheet(state: AppState, c: number, url: string): AppState {
  const st = clone(state);
  if (!st.sheets) st.sheets = {};
  st.sheets[c] = url.trim();
  return st;
}

export function saveCapacity(state: AppState, cc: number, ca: number, names: Record<string, string>): AppState {
  const st = clone(state);
  st.capClusters = cc;
  st.capAccts = ca;
  st.capacityTarget = cc * ca;
  if (!st.names) st.names = {};
  Object.entries(names).forEach(([c, v]) => {
    st.names[c] = (v || "").trim() || "C" + c;
  });
  return st;
}
export function clearCapacity(state: AppState): AppState {
  const st = clone(state);
  st.capClusters = N_CLUSTERS;
  st.capAccts = ACCTS_PER_CLUSTER;
  st.capacityTarget = 0;
  return st;
}

// Max capital the trader is willing to have deployed at once. 0 = no limit set.
export function setCapitalLimit(state: AppState, limit: number): AppState {
  const st = clone(state);
  st.capitalLimit = Math.max(0, limit || 0);
  return st;
}

// CEO Office → Objectives. Merges a partial patch into the existing
// objectives; untouched fields keep their current value.
export function setObjectives(state: AppState, patch: Partial<Objectives>): AppState {
  const st = clone(state);
  st.objectives = { ...(st.objectives || defaultObjectives()), ...patch };
  return st;
}

// ── CEO Office → Managers (the existing color groups, not a new entity) ──
export function managerOf(state: AppState, hex: string): ManagerMeta {
  return state.managers?.[hex] ?? { name: PACKAGE_COLORS.find((p) => p.hex === hex)?.name ?? "Custom", splitPct: 0 };
}
export function setManagerSplit(state: AppState, hex: string, pct: number): AppState {
  const st = clone(state);
  if (!st.managers) st.managers = {};
  st.managers[hex] = { ...managerOf(st, hex), splitPct: Math.max(0, Math.min(100, pct || 0)) };
  return st;
}
export function setManagerName(state: AppState, hex: string, name: string): AppState {
  const st = clone(state);
  if (!st.managers) st.managers = {};
  const fallback = PACKAGE_COLORS.find((p) => p.hex === hex)?.name ?? "Custom";
  st.managers[hex] = { ...managerOf(st, hex), name: name.trim() || fallback };
  return st;
}

// ── CEO Office → Money Held (a flat ledger, independent of trading calc) ─
export function addMoneyHeld(state: AppState, entry: Omit<MoneyHeldEntry, "id">, id?: string): AppState {
  const st = clone(state);
  if (!st.moneyHeld) st.moneyHeld = [];
  st.moneyHeld.push({ ...entry, id: id ?? genId() });
  return st;
}
export function updateMoneyHeld(state: AppState, id: string, patch: Partial<MoneyHeldEntry>): AppState {
  const st = clone(state);
  const idx = (st.moneyHeld || []).findIndex((e) => e.id === id);
  if (idx < 0) return st;
  st.moneyHeld[idx] = { ...st.moneyHeld[idx], ...patch, id };
  return st;
}
export function deleteMoneyHeld(state: AppState, id: string): AppState {
  const st = clone(state);
  st.moneyHeld = (st.moneyHeld || []).filter((e) => e.id !== id);
  return st;
}
// Settlements are an append-only history — no update/remove, matching a
// ledger/audit-trail model. Status is derived from this list (see stats.ts),
// never stored, so it can't drift out of sync.
export function addSettlement(
  state: AppState,
  entryId: string,
  settlement: Omit<Settlement, "id">,
  id?: string
): AppState {
  const st = clone(state);
  const idx = (st.moneyHeld || []).findIndex((e) => e.id === entryId);
  if (idx < 0) return st;
  st.moneyHeld[idx] = {
    ...st.moneyHeld[idx],
    settlements: [...st.moneyHeld[idx].settlements, { ...settlement, id: id ?? genId() }],
  };
  return st;
}

// ── CEO Office → Clients (pure metadata, never read by trading logic) ───
export function clientProfileOf(state: AppState, cluster: number): ClientProfile {
  return state.clientProfiles?.[cluster] ?? defaultClientProfile();
}
export function setClientProfileField(
  state: AppState,
  cluster: number,
  patch: Partial<Pick<ClientProfile, "firstName" | "familyName" | "address" | "vpsLocation">>
): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  st.clientProfiles[cluster] = { ...clientProfileOf(st, cluster), ...patch };
  return st;
}
export function setVpsInfo(state: AppState, cluster: number, patch: Partial<VpsInfo>): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  const profile = clientProfileOf(st, cluster);
  st.clientProfiles[cluster] = { ...profile, vpsInfo: { ...profile.vpsInfo, ...patch } };
  return st;
}
export function addAppLogin(state: AppState, cluster: number, login: Omit<AppLogin, "id">, id?: string): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  const profile = clientProfileOf(st, cluster);
  st.clientProfiles[cluster] = { ...profile, appLogins: [...profile.appLogins, { ...login, id: id ?? genId() }] };
  return st;
}
export function updateAppLogin(state: AppState, cluster: number, id: string, patch: Partial<AppLogin>): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  const profile = clientProfileOf(st, cluster);
  st.clientProfiles[cluster] = {
    ...profile,
    appLogins: profile.appLogins.map((l) => (l.id === id ? { ...l, ...patch, id } : l)),
  };
  return st;
}
export function removeAppLogin(state: AppState, cluster: number, id: string): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  const profile = clientProfileOf(st, cluster);
  st.clientProfiles[cluster] = { ...profile, appLogins: profile.appLogins.filter((l) => l.id !== id) };
  return st;
}
export function addPaymentMethod(state: AppState, cluster: number, pm: Omit<PaymentMethod, "id">, id?: string): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  const profile = clientProfileOf(st, cluster);
  st.clientProfiles[cluster] = {
    ...profile,
    paymentMethods: [...profile.paymentMethods, { ...pm, id: id ?? genId() }],
  };
  return st;
}
export function updatePaymentMethod(state: AppState, cluster: number, id: string, patch: Partial<PaymentMethod>): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  const profile = clientProfileOf(st, cluster);
  st.clientProfiles[cluster] = {
    ...profile,
    paymentMethods: profile.paymentMethods.map((m) => (m.id === id ? { ...m, ...patch, id } : m)),
  };
  return st;
}
export function removePaymentMethod(state: AppState, cluster: number, id: string): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  const profile = clientProfileOf(st, cluster);
  st.clientProfiles[cluster] = { ...profile, paymentMethods: profile.paymentMethods.filter((m) => m.id !== id) };
  return st;
}
export function addWithdrawalMethod(
  state: AppState,
  cluster: number,
  wm: Omit<WithdrawalMethod, "id">,
  id?: string
): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  const profile = clientProfileOf(st, cluster);
  st.clientProfiles[cluster] = {
    ...profile,
    withdrawalMethods: [...profile.withdrawalMethods, { ...wm, id: id ?? genId() }],
  };
  return st;
}
export function updateWithdrawalMethod(
  state: AppState,
  cluster: number,
  id: string,
  patch: Partial<WithdrawalMethod>
): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  const profile = clientProfileOf(st, cluster);
  st.clientProfiles[cluster] = {
    ...profile,
    withdrawalMethods: profile.withdrawalMethods.map((m) => (m.id === id ? { ...m, ...patch, id } : m)),
  };
  return st;
}
export function removeWithdrawalMethod(state: AppState, cluster: number, id: string): AppState {
  const st = clone(state);
  if (!st.clientProfiles) st.clientProfiles = {};
  const profile = clientProfileOf(st, cluster);
  st.clientProfiles[cluster] = {
    ...profile,
    withdrawalMethods: profile.withdrawalMethods.filter((m) => m.id !== id),
  };
  return st;
}

// ── Import (reads spotdesk_*.json backups) ───────────────────────────
export function normalizeImport(data: any): AppState {
  if (!data || typeof data !== "object" || !data.spots || !data.history)
    throw new Error("This does not look like a SPOTDESK backup file.");
  const st: AppState = data as AppState;
  // ensure new fields exist for older backups
  if (!st.tradedToday) st.tradedToday = [];
  if (st.deployedToday == null) st.deployedToday = 0;
  if (!st.names) st.names = {};
  if (!st.colors) st.colors = {};
  if (!st.sheets) st.sheets = {};
  if (st.capacityTarget == null) st.capacityTarget = 0;
  if (st.capClusters === undefined) st.capClusters = null;
  if (st.capAccts === undefined) st.capAccts = null;
  if (st.accountPrice == null) st.accountPrice = 95;
  if (st.capitalLimit == null) st.capitalLimit = 0;
  if (st.todayProfit == null) st.todayProfit = 0;
  if (st.todayPayouts == null) st.todayPayouts = 0;
  if (!st.todayLog) st.todayLog = [];
  if (st.dayCount == null) st.dayCount = 1;
  if (!st.objectives) st.objectives = defaultObjectives();
  if (!st.managers) st.managers = {};
  if (!st.clientProfiles) st.clientProfiles = {};

  // Client profiles: migrate the old free-text vpsInfo string into the
  // structured object (no data to preserve — the field held nothing before
  // this schema existed), backfill withdrawalMethods, and default any
  // untyped payment method (created before "type" existed) to "other".
  Object.keys(st.clientProfiles).forEach((c) => {
    const p: any = st.clientProfiles[c];
    if (typeof p.vpsInfo === "string" || !p.vpsInfo) p.vpsInfo = defaultVpsInfo();
    if (!p.withdrawalMethods) p.withdrawalMethods = [];
    if (!p.paymentMethods) p.paymentMethods = [];
    p.paymentMethods.forEach((pm: any) => {
      if (!pm.type) pm.type = "other";
    });
  });

  // Money Held: migrate the old flat direction/targetType+targetKey/
  // dateSettled shape into the new 4-type ledger + settlement history.
  if (!st.moneyHeld) st.moneyHeld = [];
  st.moneyHeld = st.moneyHeld.map((e: any) => {
    if (e.itemType) return e; // already the new shape
    const counterparty =
      e.targetType && e.targetKey != null ? { type: e.targetType, key: String(e.targetKey) } : { type: "custom" as const };
    const settlements: Settlement[] = e.dateSettled
      ? [{ id: genId(), date: e.dateSettled, amount: e.amount, isFull: true, note: "migrated" }]
      : [];
    return {
      id: e.id,
      itemType: e.direction === "owed_by_me" ? "owed_by_me" : "owed_to_me",
      counterparty,
      amount: e.amount,
      currency: "USD",
      purpose: e.note || "",
      dateIssued: e.dateIssued,
      settlements,
    };
  });

  return st;
}

// ── Phase filter ─────────────────────────────────────────────────────
export type PhaseFilter = "all" | "1" | "2" | "3" | "4-7" | "8-12";
export function matchesPhase(filter: PhaseFilter, day: number): boolean {
  if (filter === "all") return true;
  if (day < 1) return false; // free spots never match a specific phase
  if (filter === "1") return day === 1;
  if (filter === "2") return day === 2;
  if (filter === "3") return day === 3;
  if (filter === "4-7") return day >= 4 && day <= 7;
  if (filter === "8-12") return day >= 8 && day <= 12;
  return true;
}
