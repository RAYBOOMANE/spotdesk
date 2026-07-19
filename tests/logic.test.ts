// Acceptance checks from the brief (§7). Run with: npm run test:logic
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { LADDER, FWD, PHASE2_AVG } from "../src/lib/ladder";
import {
  freshState,
  logOutcomeSingle,
  setDaySingle,
  rollDay,
  cumInvest,
  fwdEV,
  selectionError,
  normalizeImport,
  multiOutcome,
  deleteLog,
  editHistoryDay,
  setObjectives,
  colorOf,
  managerOf,
  setManagerSplit,
  setManagerName,
  addMoneyHeld,
  updateMoneyHeld,
  deleteMoneyHeld,
  addSettlement,
  clientProfileOf,
  setClientProfileField,
  setVpsInfo,
  addAppLogin,
  updateAppLogin,
  removeAppLogin,
  addPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
  addWithdrawalMethod,
  updateWithdrawalMethod,
  removeWithdrawalMethod,
  todayTotals,
  editTodayLogEntry,
  addTask,
  updateTask,
  deleteTask,
  addStep,
  updateStep,
  toggleStep,
  deleteStep,
  setTaskProgressManual,
  resetTaskProgressToAuto,
  taskProgress,
  copyTradeOutcome,
  copyTradeInvest,
} from "../src/lib/logic";
import {
  computeTopStats,
  equityPoints,
  periodTotals,
  managerSummaries,
  moneyHeldRemaining,
  moneyHeldStatus,
  packageGroups,
  ledgerAuthoritativeTotals,
  secretaryTasks,
  allTimeAverages,
  openSessionCapital,
  tradingWeekOf,
} from "../src/lib/stats";

let pass = 0;
function check(name: string, fn: () => void) {
  fn();
  pass++;
  console.log("  ✓ " + name);
}

console.log("SPOTDESK acceptance checks\n");

check("FWD table constants", () => {
  assert.equal(FWD[1], 11.25);
  assert.equal(FWD[2], 11.25);
  assert.ok(Math.abs(FWD[3] - 23.2) < 1e-9);
  assert.equal(FWD[4], 150);
  assert.ok(Math.abs(PHASE2_AVG - 728.52) < 0.01);
  assert.equal(FWD[8], PHASE2_AVG);
  assert.equal(FWD[13], PHASE2_AVG);
  assert.equal(FWD[14], 750);
});

check("Phase-aware cumulative investment", () => {
  assert.equal(cumInvest(3), 95 + 190 + 388); // 673
  assert.equal(cumInvest(9), 85);
  assert.equal(cumInvest(11), 85 + 190 + 280); // 555
  assert.equal(cumInvest(8), 95 + 190 + 388 + 1400 + 1450 + 1520 + 1600 + 0);
});

check("Blow $700 on D3 with default costs → net +$27", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 3, null, null);
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  assert.equal(st.todayProfit, 27);
  assert.deepEqual(st.spots["1-1"], { day: 0, cost: 0, extra: 0 });
  assert.equal(st.todayLog[0].sunk, 673);
});

check("Blow $900 on D9 → net +$815 (phase-aware)", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "2-1", 9, "blew", null, null, 900);
  assert.equal(st.todayProfit, 815);
});

check("Payout $900 on D11 with $280 invested → +$620, account stays D11 at $0", () => {
  let st = freshState();
  st = setDaySingle(st, "3-1", 11, 280, null);
  st = logOutcomeSingle(st, "3-1", 11, "payout", 280, null, 900);
  assert.equal(st.todayPayouts, 620);
  assert.deepEqual(st.spots["3-1"], { day: 11, cost: 0, extra: 0 });
});

check("New Day: traded D5 → D6 with extra folded into cost; untraded D3 stays D3", () => {
  let st = freshState();
  st = setDaySingle(st, "4-1", 5, 1450, 200); // extra > 0 → traded
  st = setDaySingle(st, "5-1", 3, 388, null); // no extra → NOT traded
  assert.ok(st.tradedToday.includes("4-1"));
  assert.ok(!st.tradedToday.includes("5-1"));
  st = rollDay(st, "2026-07-03T12:00:00.000Z");
  assert.deepEqual(st.spots["4-1"], { day: 6, cost: 1650, extra: 0 }); // 1450+200, advanced
  assert.deepEqual(st.spots["5-1"], { day: 3, cost: 388, extra: 0 }); // stayed
  assert.equal(st.tradedToday.length, 0);
  assert.equal(st.todayLog.length, 0);
});

check("Advance caps at D14", () => {
  let st = freshState();
  st = setDaySingle(st, "4-1", 14, 0, 50);
  st = rollDay(st);
  assert.equal(st.spots["4-1"].day, 14);
});

check("Setting a day without extra → NOT traded, Deployed Today unchanged", () => {
  let st = freshState();
  st = setDaySingle(st, "6-1", 4, 1400, null);
  assert.equal(st.tradedToday.length, 0);
  assert.equal(st.deployedToday, 0);
  // fixing cost later still doesn't mark traded
  st = setDaySingle(st, "6-1", 4, 1425, null);
  assert.equal(st.tradedToday.length, 0);
  // re-saving the SAME extra doesn't double count
  st = setDaySingle(st, "6-1", 4, 1425, 100);
  assert.equal(st.deployedToday, 100);
  st = setDaySingle(st, "6-1", 4, 1425, 100);
  assert.equal(st.deployedToday, 100);
});

check("Multi-select rejects mixing clusters / days / empty+occupied", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 3, null, null);
  st = setDaySingle(st, "1-2", 3, null, null);
  st = setDaySingle(st, "1-3", 5, null, null);
  st = setDaySingle(st, "2-1", 3, null, null);
  assert.equal(selectionError(st, ["1-1"], "1-2"), null); // same cluster, same day OK
  assert.ok(selectionError(st, ["1-1"], "2-1")); // different cluster
  assert.ok(selectionError(st, ["1-1"], "1-3")); // different day
  assert.ok(selectionError(st, ["1-1"], "1-4")); // empty + occupied
  assert.equal(selectionError(st, ["1-4"], "1-5"), null); // both empty, same cluster
});

check("Total profit = blow profit + payout profit (gross payout excluded)", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // +27
  st = logOutcomeSingle(st, "1-2", 11, "payout", 280, null, 900); // +620 payout profit, gross 900
  st = rollDay(st, "2026-07-03T12:00:00.000Z");
  const d = st.history[0];
  assert.equal(d.profit, 27);
  assert.equal(d.payouts, 620);
  assert.equal(d.payoutGross, 900);
  assert.equal(d.total, 647); // NOT 927
});

check("Forward EV per occupied account matches FWD; top stat sums them", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 3, null, null);
  st = setDaySingle(st, "1-2", 5, null, null);
  st = setDaySingle(st, "1-3", 10, null, null);
  const s = computeTopStats(st);
  assert.ok(Math.abs(s.fwdTotal - (23.2 + 150 + PHASE2_AVG)) < 1e-9);
  assert.equal(fwdEV(14), 750);
  assert.equal(fwdEV(0), 0);
});

check("Traded-today marking: blow/payout mark, Set Day (no extra) doesn't", () => {
  let st = freshState();
  st = setDaySingle(st, "7-1", 2, 190, null);
  st = setDaySingle(st, "7-2", 2, 190, null);
  const s0 = computeTopStats(st);
  assert.equal(s0.leftToTrade, 2);
  st = logOutcomeSingle(st, "7-1", 2, "blew", null, null, 300);
  const s1 = computeTopStats(st);
  assert.equal(s1.blewCount, 1);
  // blown spot is freed so it leaves the occupied pool; 7-2 still left to trade
  assert.equal(s1.leftToTrade, 1);
});

check("Multi outcome uses flat day benchmark on blank cost (reference behavior)", () => {
  let st = freshState();
  st = multiOutcome(st, ["1-1", "1-2"], 3, "blew", null, null, 700);
  // reference multi fallback = LADDER[3].inv = 388, NOT cumInvest(3)=673
  assert.equal(st.todayLog[0].sunk, 388);
  assert.equal(st.todayProfit, (700 - 388) * 2);
});

check("Delete log entry reverses today totals", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  st = logOutcomeSingle(st, "1-2", 11, "payout", 280, null, 900);
  st = deleteLog(st, 0);
  assert.equal(st.todayProfit, 0);
  assert.equal(st.todayPayouts, 620);
  st = deleteLog(st, 0);
  assert.equal(st.todayPayouts, 0);
});

check("History day edit recomputes total = blows + payout profit", () => {
  let st = freshState();
  st = rollDay(st, "2026-07-01T12:00:00.000Z");
  st = editHistoryDay(st, 0, { profit: 500, payouts: 120, payoutGross: 2000, deployed: 3000, blownOverride: 4 });
  const d = st.history[0];
  assert.equal(d.total, 620);
  assert.equal(d.payoutGross, 2000);
  assert.equal(d.blownOverride, 4);
});

check("setObjectives merges a partial patch, leaves other fields untouched", () => {
  let st = freshState();
  st = setObjectives(st, { dailyTarget: 200, notes: "push hard" });
  assert.equal(st.objectives.dailyTarget, 200);
  assert.equal(st.objectives.notes, "push hard");
  assert.equal(st.objectives.weeklyTarget, 0); // untouched default
  st = setObjectives(st, { weeklyTarget: 1000 });
  assert.equal(st.objectives.dailyTarget, 200); // survives a second, unrelated patch
  assert.equal(st.objectives.weeklyTarget, 1000);
  assert.equal(st.dayCount, 1); // unrelated state untouched
  assert.equal(st.capitalLimit, 0);
});

check("periodTotals: today/week/month/allTime sum archived + live totals", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // +27 today
  st = rollDay(st, "2026-07-01T12:00:00.000Z"); // archives day1 total=27, today resets
  st = logOutcomeSingle(st, "1-2", 11, "payout", 280, null, 900); // +620 live today
  const p = periodTotals(st, new Date("2026-07-03T12:00:00Z"));
  assert.equal(p.today, 620);
  assert.equal(p.week, 27 + 620);
  assert.equal(p.month, 27 + 620);
  assert.equal(p.allTime, 27 + 620);
});

check("tradingWeekOf: fixed 5-day operational blocks (Week 1 = Days 1-5, Week 2 = 6-10, ...)", () => {
  assert.equal(tradingWeekOf(1), 1);
  assert.equal(tradingWeekOf(3), 1);
  assert.equal(tradingWeekOf(5), 1);
  assert.equal(tradingWeekOf(6), 2);
  assert.equal(tradingWeekOf(8), 2);
  assert.equal(tradingWeekOf(10), 2);
  assert.equal(tradingWeekOf(11), 3);
  assert.equal(tradingWeekOf(15), 3);
  assert.equal(tradingWeekOf(16), 4);
  assert.equal(tradingWeekOf(17), 4);
  assert.equal(tradingWeekOf(20), 4);
  assert.equal(tradingWeekOf(21), 5);
});

// Helper: roll N operational days in a row, each with a fixed, distinct
// total (via editHistoryDay so the exact figure is deterministic and not
// dependent on ladder math). Returns the state positioned with day N+1
// in progress (today).
function rollDaysWithTotals(totals: number[]): ReturnType<typeof freshState> {
  let st = freshState();
  totals.forEach((total, i) => {
    st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // any nonzero log so rollDay has something to archive
    st = rollDay(st, `2026-07-${String(i + 1).padStart(2, "0")}T12:00:00.000Z`);
    st = editHistoryDay(st, i, { profit: total, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 });
  });
  return st;
}

check("periodTotals.week: fixed trading-week block excludes days outside the current block (old trailing-7 window would have leaked in days 1-5)", () => {
  const st = rollDaysWithTotals([10, 20, 30, 40, 50, 60, 70]); // days 1-7 archived, day 8 in progress
  assert.equal(st.dayCount, 8);
  assert.equal(tradingWeekOf(st.dayCount), 2); // week 2 = days 6-10
  const p = periodTotals(st, new Date("2026-07-10T12:00:00Z"));
  assert.equal(p.week, 60 + 70); // only days 6 & 7 -- NOT the old slice(-7) sum of 280
  assert.equal(p.allTime, 10 + 20 + 30 + 40 + 50 + 60 + 70);
});

check("periodTotals.week: partial current week includes only the days actually archived so far in that block", () => {
  let st = rollDaysWithTotals([100, 200]); // days 1-2 archived, day 3 in progress (week 1 = days 1-5)
  assert.equal(tradingWeekOf(st.dayCount), 1);
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // some live total today
  const p = periodTotals(st, new Date("2026-07-10T12:00:00Z"));
  assert.equal(p.week, 100 + 200 + p.today); // whole week is still open, so week === allTime here
  assert.equal(p.week, p.allTime);
});

check("trading week totals stay fixed forever once the block is archived, even as later weeks accumulate", () => {
  const weekOneTotal = (st: ReturnType<typeof freshState>) =>
    st.history.filter((d) => tradingWeekOf(d.day) === 1).reduce((s, d) => s + (d.total || 0), 0);

  let st = rollDaysWithTotals([1, 2, 3, 4, 5]); // exactly fills week 1 (days 1-5), day 6 in progress
  const afterWeekOne = weekOneTotal(st);
  assert.equal(afterWeekOne, 15);

  st = rollDaysWithTotals([1, 2, 3, 4, 5, 6, 7, 8]); // week 1 archived + into week 2/3
  assert.equal(weekOneTotal(st), afterWeekOne); // unchanged by later weeks being archived
});

check("periodTotals.week and packageGroups week stay consistent for the current trading-week window", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  st = logOutcomeSingle(st, "2-1", 3, "blew", null, null, 700);
  st = rollDay(st, "2026-07-01T12:00:00.000Z"); // day 1 archived
  st = logOutcomeSingle(st, "1-2", 11, "payout", 280, null, 900);
  st = rollDay(st, "2026-07-02T12:00:00.000Z"); // day 2 archived
  st = logOutcomeSingle(st, "3-1", 1, "blew", null, null, 500); // live today

  const p = periodTotals(st, new Date("2026-07-05T12:00:00Z"));
  const pkgWeekSum = packageGroups(st).reduce((sum, g) => sum + g.week, 0);
  assert.equal(p.week, pkgWeekSum); // no editHistoryDay override in this scenario, so d.total === sum(netOfLog)
});

check("periodTotals.month: only archived days dated within the current calendar month count", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  st = rollDay(st, "2026-06-30T23:00:00.000Z"); // June -- must NOT count toward July's month total
  st = editHistoryDay(st, 0, { profit: 999, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 });
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  st = rollDay(st, "2026-07-05T12:00:00.000Z"); // July -- must count
  st = editHistoryDay(st, 1, { profit: 111, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 });

  const p = periodTotals(st, new Date("2026-07-10T12:00:00Z"));
  assert.equal(p.month, 111); // excludes June's 999
  assert.equal(p.allTime, 999 + 111); // allTime is unaffected by the month window
});

check("periodTotals.month: a row dated in the NEXT month is excluded (upper bound) -- matters once multi-month history is imported", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  st = rollDay(st, new Date(2026, 6, 15, 12, 0).toISOString()); // July 15 -- the month being viewed
  st = editHistoryDay(st, 0, { profit: 111, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 });
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  st = rollDay(st, new Date(2026, 7, 1, 0, 5).toISOString()); // Aug 1, just past midnight -- next month
  st = editHistoryDay(st, 1, { profit: 999, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 });

  const p = periodTotals(st, new Date(2026, 6, 20, 12, 0)); // viewed from within July
  assert.equal(p.month, 111); // August's 999 must NOT leak into July's total
  assert.equal(p.allTime, 111 + 999); // allTime still sees everything
});

check("rollDay archives the exact click instant -- no hidden midnight/day-rollover cutoff (explicit product decision)", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  // Local wall-clock construction (not a hand-picked UTC string) so this
  // test is deterministic regardless of the machine's timezone -- rollDay's
  // real default (`new Date().toISOString()`) is likewise always a local
  // click moment, just serialized to UTC.
  const rolledAt = new Date(2026, 7, 1, 0, 5); // Aug 1, 00:05 local -- 5 minutes after local midnight
  st = rollDay(st, rolledAt.toISOString());
  st = editHistoryDay(st, 0, { profit: 42, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 });

  // Viewed later the same local day, the late-night session counts toward
  // August -- the calendar month it was literally stamped in, with no
  // attempt to infer "the trading day really meant to be July 31".
  const august = periodTotals(st, new Date(2026, 7, 1, 9, 0));
  assert.equal(august.month, 42);
  // And it's scoped to August specifically, not "whatever's most recent":
  // a later month no longer counts it.
  const september = periodTotals(st, new Date(2026, 8, 1, 9, 0));
  assert.equal(september.month, 0);
});

check("legacy imports with a missing history date: excluded from month totals, but week/allTime are unaffected (they key off day #, not date)", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  st = rollDay(st, "2026-07-01T12:00:00.000Z");
  st = editHistoryDay(st, 0, { profit: 250, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 });
  delete st.history[0].date; // simulate a legacy backup that never recorded a date

  const p = periodTotals(st, new Date("2026-07-10T12:00:00Z"));
  assert.equal(p.month, 0); // dateless day excluded from calendar-month math (unchanged, pre-existing behavior)
  assert.equal(p.week, 250); // week math is day-number based, unaffected by the missing date
  assert.equal(p.allTime, 250); // allTime never filters by date
});

check("setManagerSplit/setManagerName: roundtrip, clamped 0-100, defaults from palette", () => {
  let st = freshState();
  const hex = colorOf(st, 1);
  assert.equal(managerOf(st, hex).name, "Teal");
  assert.equal(managerOf(st, hex).splitPct, 0);
  st = setManagerSplit(st, hex, 150);
  assert.equal(st.managers[hex].splitPct, 100); // clamped
  st = setManagerSplit(st, hex, -10);
  assert.equal(st.managers[hex].splitPct, 0); // clamped
  st = setManagerSplit(st, hex, 25);
  st = setManagerName(st, hex, "Alex");
  assert.equal(st.managers[hex].name, "Alex");
  assert.equal(st.managers[hex].splitPct, 25); // renaming doesn't clobber split
});

check("Money Held: add/update/delete roundtrip", () => {
  let st = freshState();
  st = addMoneyHeld(
    st,
    {
      itemType: "owed_to_me",
      counterparty: { type: "client", key: "1" },
      amount: 500,
      currency: "USD",
      purpose: "loan",
      dateIssued: "2026-07-01",
      settlements: [],
    },
    "mh1"
  );
  assert.equal(st.moneyHeld.length, 1);
  assert.equal(st.moneyHeld[0].id, "mh1");
  st = updateMoneyHeld(st, "mh1", { purpose: "loan (updated)" });
  assert.equal(st.moneyHeld[0].purpose, "loan (updated)");
  assert.equal(st.moneyHeld[0].amount, 500); // untouched by the patch
  st = deleteMoneyHeld(st, "mh1");
  assert.equal(st.moneyHeld.length, 0);
});

check("Money Held: settlements drive computed status (open/partial/settled)", () => {
  let st = freshState();
  st = addMoneyHeld(
    st,
    {
      itemType: "they_hold_for_me",
      counterparty: { type: "custom", customName: "Sam" },
      amount: 1000,
      currency: "USD",
      purpose: "liquidity routing",
      dateIssued: "2026-07-01",
      settlements: [],
    },
    "mh2"
  );
  let entry = st.moneyHeld[0];
  assert.equal(moneyHeldRemaining(entry), 1000);
  assert.equal(moneyHeldStatus(entry), "open");

  st = addSettlement(st, "mh2", { date: "2026-07-02", amount: 400, isFull: false, note: "first chunk" });
  entry = st.moneyHeld[0];
  assert.equal(moneyHeldRemaining(entry), 600);
  assert.equal(moneyHeldStatus(entry), "partially_settled");

  st = addSettlement(st, "mh2", { date: "2026-07-05", amount: 600, isFull: true, note: "rest", destination: "bank transfer" });
  entry = st.moneyHeld[0];
  assert.equal(moneyHeldRemaining(entry), 0);
  assert.equal(moneyHeldStatus(entry), "settled");
  assert.equal(entry.settlements.length, 2);
});

check("Client profile: field set + appLogin/paymentMethod CRUD, other clusters untouched", () => {
  let st = freshState();
  st = setClientProfileField(st, 2, { firstName: "Jane", familyName: "Doe" });
  assert.equal(st.clientProfiles["2"].firstName, "Jane");
  st = addAppLogin(st, 2, { label: "MT5", username: "u1", password: "p1" }, "login1");
  assert.equal(st.clientProfiles["2"].appLogins.length, 1);
  st = updateAppLogin(st, 2, "login1", { password: "p2" });
  assert.equal(st.clientProfiles["2"].appLogins[0].password, "p2");
  assert.equal(st.clientProfiles["2"].appLogins[0].username, "u1"); // untouched
  st = addPaymentMethod(st, 2, { type: "crypto", label: "USDT", details: "addr" }, "pm1");
  assert.equal(st.clientProfiles["2"].paymentMethods.length, 1);
  st = removePaymentMethod(st, 2, "pm1");
  assert.equal(st.clientProfiles["2"].paymentMethods.length, 0);
  st = removeAppLogin(st, 2, "login1");
  assert.equal(st.clientProfiles["2"].appLogins.length, 0);
  assert.deepEqual(clientProfileOf(st, 3), {
    firstName: "",
    familyName: "",
    address: "",
    vpsLocation: "",
    vpsInfo: { ipAddress: "", username: "", password: "" },
    paymentMethods: [],
    withdrawalMethods: [],
    appLogins: [],
  });
});

check("setVpsInfo: merges a partial patch without touching other fields", () => {
  let st = freshState();
  st = setVpsInfo(st, 4, { ipAddress: "1.2.3.4" });
  assert.equal(st.clientProfiles["4"].vpsInfo.ipAddress, "1.2.3.4");
  assert.equal(st.clientProfiles["4"].vpsInfo.username, "");
  st = setVpsInfo(st, 4, { username: "admin", password: "hunter2" });
  assert.equal(st.clientProfiles["4"].vpsInfo.ipAddress, "1.2.3.4"); // survives
  assert.equal(st.clientProfiles["4"].vpsInfo.username, "admin");
  assert.equal(st.clientProfiles["4"].vpsInfo.password, "hunter2");
});

check("Payment method: card type carries card fields + optional linked wallet, no CVV field exists", () => {
  let st = freshState();
  st = addPaymentMethod(
    st,
    5,
    { type: "card", label: "Visa", details: "", cardNumber: "4242", cardExpiry: "12/29", cardholderName: "J Doe" },
    "card1"
  );
  const pm: any = st.clientProfiles["5"].paymentMethods[0];
  assert.equal(pm.cardNumber, "4242");
  assert.equal(pm.cardholderName, "J Doe");
  assert.ok(!("cvv" in pm) && !("cardCvv" in pm)); // CVV is never stored
  st = updatePaymentMethod(st, 5, "card1", { linkedWallet: { network: "USDT TRC20", address: "Txyz" } });
  assert.equal(st.clientProfiles["5"].paymentMethods[0].linkedWallet?.network, "USDT TRC20");
});

check("Withdrawal method: add/update/remove roundtrip", () => {
  let st = freshState();
  st = addWithdrawalMethod(st, 6, { type: "iban", label: "Main bank", iban: "DE89...", bankName: "N26" }, "wm1");
  assert.equal(st.clientProfiles["6"].withdrawalMethods.length, 1);
  st = updateWithdrawalMethod(st, 6, "wm1", { bankName: "Revolut" });
  assert.equal(st.clientProfiles["6"].withdrawalMethods[0].bankName, "Revolut");
  assert.equal(st.clientProfiles["6"].withdrawalMethods[0].iban, "DE89..."); // untouched
  st = removeWithdrawalMethod(st, 6, "wm1");
  assert.equal(st.clientProfiles["6"].withdrawalMethods.length, 0);
});

check("managerSummaries: capitalInvested/allTimePL/weeklyOwed math", () => {
  let st = freshState();
  const hex = colorOf(st, 1);
  st = setDaySingle(st, "1-1", 3, null, null);
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // +27, frees 1-1
  st = rollDay(st, "2026-07-01T12:00:00.000Z"); // archives day1 total=27
  st = setDaySingle(st, "1-2", 5, null, null); // occupied again
  st = setManagerSplit(st, hex, 50);
  const teal = managerSummaries(st).find((m) => m.hex === hex)!;
  assert.equal(teal.allTimePL, 27);
  assert.ok(teal.capitalInvested > 0);
  assert.equal(teal.weeklyOwed, (teal.weekNet * 50) / 100);
});

check("Import spotdesk_day4_repaired.json → day 4, 28 live, 20 named clusters, colors, sheets", () => {
  const raw = JSON.parse(readFileSync(new URL("./fixture_day4.json", import.meta.url), "utf8"));
  const st = normalizeImport(raw);
  assert.equal(st.dayCount, 4);
  const live = Object.values(st.spots).filter((s) => s.day >= 1).length;
  assert.equal(live, 28);
  assert.equal(Object.keys(st.names).length, 20);
  assert.equal(st.names["1"], "RAYAN LC");
  assert.equal(st.colors["10"], "#4aa8ff");
  assert.ok(st.sheets["1"].startsWith("https://docs.google.com/"));
  assert.equal(st.capClusters, 20);
  assert.equal(st.capAccts, 5);
  const s = computeTopStats(st, new Date("2026-07-03T12:00:00Z"));
  assert.equal(s.liveCount, 28); // grid is 20×5 so all 28 fall inside it
  assert.equal(s.capDenom, 100);
  // equity from the 3 archived days: 0 + 1581 + 2044.67
  const eq = equityPoints(st);
  assert.ok(Math.abs(eq.total - 3625.67) < 1e-9);
  assert.equal(eq.points.length, 4);
});

check("Import rejects non-SPOTDESK files", () => {
  assert.throws(() => normalizeImport({ foo: 1 }));
});

check("Import backfills missing objectives for older backups", () => {
  const raw = JSON.parse(readFileSync(new URL("./fixture_day4.json", import.meta.url), "utf8"));
  assert.ok(!("objectives" in raw)); // confirms this fixture predates the field
  const st = normalizeImport(raw);
  assert.deepEqual(st.objectives, { dailyTarget: 0, weeklyTarget: 0, monthlyTarget: 0, maxAccounts: 0, notes: "" });
});

check("Import backfills missing managers/moneyHeld/clientProfiles for older backups", () => {
  const raw = JSON.parse(readFileSync(new URL("./fixture_day4.json", import.meta.url), "utf8"));
  assert.ok(!("managers" in raw) && !("moneyHeld" in raw) && !("clientProfiles" in raw));
  const st = normalizeImport(raw);
  assert.deepEqual(st.managers, {});
  assert.deepEqual(st.moneyHeld, []);
  assert.deepEqual(st.clientProfiles, {});
});

check("Import migrates the old flat Money Held shape into the new ledger model", () => {
  const raw = JSON.parse(readFileSync(new URL("./fixture_day4.json", import.meta.url), "utf8"));
  raw.moneyHeld = [
    { id: "old1", targetType: "client", targetKey: "1", amount: 300, direction: "owed_by_me", note: "advance", dateIssued: "2026-07-01", dateSettled: null },
    { id: "old2", targetType: "manager", targetKey: "#00e2a0", amount: 200, direction: "owed_to_me", note: "split", dateIssued: "2026-07-01", dateSettled: "2026-07-04" },
  ];
  const st = normalizeImport(raw);
  const [a, b] = st.moneyHeld;
  assert.equal(a.itemType, "owed_by_me");
  assert.deepEqual(a.counterparty, { type: "client", key: "1" });
  assert.equal(a.settlements.length, 0);
  assert.equal(moneyHeldStatus(a), "open");
  assert.equal(b.itemType, "owed_to_me");
  assert.deepEqual(b.counterparty, { type: "manager", key: "#00e2a0" });
  assert.equal(b.settlements.length, 1);
  assert.equal(b.settlements[0].isFull, true);
  assert.equal(moneyHeldStatus(b), "settled");
});

check("Import migrates old-shape client profiles: string vpsInfo, untyped payment methods", () => {
  const raw = JSON.parse(readFileSync(new URL("./fixture_day4.json", import.meta.url), "utf8"));
  raw.clientProfiles = {
    "1": { firstName: "Old", familyName: "Data", address: "", vpsLocation: "", vpsInfo: "1.2.3.4 / admin / pw", paymentMethods: [{ id: "pm1", label: "USDT", details: "addr" }], appLogins: [] },
  };
  const st = normalizeImport(raw);
  const profile = st.clientProfiles["1"];
  assert.deepEqual(profile.vpsInfo, { ipAddress: "", username: "", password: "" });
  assert.equal(profile.paymentMethods[0].type, "other");
  assert.deepEqual(profile.withdrawalMethods, []);
});

check("Delete-then-relog fully reverses/reapplies today's log (no double count)", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 3, null, null);
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // wrong entry: net +27
  assert.equal(st.todayProfit, 27);
  st = deleteLog(st, 0); // reverse the wrong entry
  assert.equal(st.todayProfit, 0);
  assert.equal(st.todayLog.length, 0);
  st = setDaySingle(st, "1-1", 3, null, null);
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 900); // corrected entry: net +227
  assert.equal(st.todayProfit, 227); // NOT 27 + 227 -- old effect was fully removed first
  assert.equal(st.todayLog.length, 1);
});

check("todayTotals derives live from todayLog, matching the incremental counters under correct operation", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // +27
  st = logOutcomeSingle(st, "1-2", 11, "payout", 280, null, 900); // +620
  let tt = todayTotals(st);
  assert.equal(tt.profit, st.todayProfit);
  assert.equal(tt.payouts, st.todayPayouts);
  assert.equal(tt.total, st.todayProfit + st.todayPayouts);
  st = deleteLog(st, 0); // remove the blew entry
  tt = todayTotals(st);
  assert.equal(tt.profit, 0);
  assert.equal(tt.payouts, 620);
  assert.equal(tt.total, st.todayProfit + st.todayPayouts);
});

check("editHistoryDay override is reflected in equityPoints/periodTotals/computeTopStats/ledgerAuthoritativeTotals", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // +27
  st = rollDay(st, "2026-07-01T12:00:00.000Z"); // banks day1 total=27
  st = editHistoryDay(st, 0, { profit: 500, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 });
  const d = st.history[0];
  assert.equal(d.total, 500);

  const eq = equityPoints(st);
  assert.equal(eq.total, 500); // reflects the override, not the raw log's 27

  const pt = periodTotals(st, new Date("2026-07-03T12:00:00Z"));
  assert.equal(pt.allTime, 500);

  const ts = computeTopStats(st, new Date("2026-07-03T12:00:00Z"));
  assert.equal(ts.monthPayouts, 0); // payouts overridden to 0

  const auth = ledgerAuthoritativeTotals(st, { dateFrom: "", dateTo: "", type: "all" });
  assert.equal(auth.netPnl, 500); // reflects the override, not the raw log's 27
});

check("packageGroups/managerSummaries intentionally reflect raw log entries, not an editHistoryDay override (known, tested characteristic -- no auto-redistribution across clients/managers)", () => {
  let st = freshState();
  const hex = colorOf(st, 1);
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // +27
  st = rollDay(st, "2026-07-01T12:00:00.000Z");
  st = editHistoryDay(st, 0, { profit: 500, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 });
  const pkg = packageGroups(st).find((p) => p.hex === hex)!;
  assert.equal(pkg.week, 27); // NOT 500 -- deliberately unaffected by the day-level override
  const mgr = managerSummaries(st).find((m) => m.hex === hex)!;
  assert.equal(mgr.allTimePL, 27); // same
});

check("editTodayLogEntry: reverses old net, applies edited entry, recomputes profit and today totals", () => {
  let st = freshState();
  st = setDaySingle(st, "3-1", 11, 280, null);
  st = logOutcomeSingle(st, "3-1", 11, "payout", 280, null, 900); // net = 900-280 = +620
  assert.equal(st.todayPayouts, 620);
  // correct the entry: actual payout was 850, invested was really 300
  st = editTodayLogEntry(st, 0, { amount: 850, invested: 300 });
  const w = st.todayLog[0];
  assert.equal(w.amount, 850);
  assert.equal(w.invested, 300);
  assert.equal(w.profit, 550); // 850-300
  assert.equal(st.todayPayouts, 550); // NOT 620+550 -- old effect was fully removed first
  assert.equal(st.todayProfit, 0);
});

check("editTodayLogEntry never touches state.spots -- account state stays whatever it currently is", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // blew -> spots["1-1"] freed (day:0)
  st = setDaySingle(st, "1-1", 5, null, null); // re-deployed on a NEW day since then
  const spotBefore = { ...st.spots["1-1"] };
  st = editTodayLogEntry(st, 0, { amount: 900, invested: 673 });
  assert.deepEqual(st.spots["1-1"], spotBefore); // completely unchanged by the edit
});

check("editTodayLogEntry: note/time patch, and blew-type entries edit `sunk` not `invested`", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "2-1", 9, "blew", null, null, 900); // net = 900-85 = +815 (phase-aware)
  assert.equal(st.todayProfit, 815);
  st = editTodayLogEntry(st, 0, { amount: 950, invested: 100, note: "typo fix", time: "14:30" });
  const w = st.todayLog[0];
  assert.equal(w.sunk, 100);
  assert.equal(w.invested, undefined); // blew entries use sunk, not invested
  assert.equal(w.profit, 850); // 950-100
  assert.equal(st.todayProfit, 850);
  assert.equal(w.note, "typo fix");
  assert.equal(w.time, "14:30");
});

check("addTask creates a not_started, 0% task in auto mode", () => {
  let st = freshState();
  st = addTask(st, { title: "Buy 4 phones" });
  assert.equal(st.tasks.length, 1);
  const t = st.tasks[0];
  assert.equal(t.title, "Buy 4 phones");
  assert.equal(t.status, "not_started");
  assert.equal(t.progressPercent, 0);
  assert.equal(t.progressMode, "auto");
  assert.deepEqual(t.steps, []);
});

check("taskProgress from boolean steps: 2/4 completed -> 50%, matching the stored auto progressPercent", () => {
  let st = freshState();
  st = addTask(st, { title: "Ship release" });
  const id = st.tasks[0].id;
  st = addStep(st, id, { title: "step 1", completed: false });
  st = addStep(st, id, { title: "step 2", completed: false });
  st = addStep(st, id, { title: "step 3", completed: false });
  st = addStep(st, id, { title: "step 4", completed: false });
  const stepIds = st.tasks[0].steps.map((s) => s.id);
  st = toggleStep(st, id, stepIds[0]);
  st = toggleStep(st, id, stepIds[1]);
  assert.equal(taskProgress(st.tasks[0]), 50);
  assert.equal(st.tasks[0].progressPercent, 50); // auto mode rewrites it on every step mutation
  assert.equal(st.tasks[0].status, "in_progress");
});

check("taskProgress from a quantity step: bought 2/4 phones -> 50% (the brief's example)", () => {
  let st = freshState();
  st = addTask(st, { title: "Buy 4 phones" });
  const id = st.tasks[0].id;
  st = addStep(st, id, { title: "phones", completed: false, qtyTarget: 4, qtyDone: 0 });
  const stepId = st.tasks[0].steps[0].id;
  st = updateStep(st, id, stepId, { qtyDone: 2 });
  assert.equal(taskProgress(st.tasks[0]), 50);
  assert.equal(st.tasks[0].progressPercent, 50);
});

check("Completing the last step syncs status to completed at 100%; unchecking reverts it", () => {
  let st = freshState();
  st = addTask(st, { title: "Two-step task" });
  const id = st.tasks[0].id;
  st = addStep(st, id, { title: "a", completed: false });
  st = addStep(st, id, { title: "b", completed: false });
  const [a, b] = st.tasks[0].steps.map((s) => s.id);
  st = toggleStep(st, id, a);
  assert.equal(st.tasks[0].status, "in_progress");
  st = toggleStep(st, id, b);
  assert.equal(st.tasks[0].progressPercent, 100);
  assert.equal(st.tasks[0].status, "completed");
  assert.ok(st.tasks[0].completedAt);
  st = toggleStep(st, id, b); // uncheck -> back below 100%
  assert.equal(st.tasks[0].progressPercent, 50);
  assert.equal(st.tasks[0].status, "in_progress");
  assert.equal(st.tasks[0].completedAt, undefined);
});

check("setTaskProgressManual pins progress and switches mode; resetTaskProgressToAuto recomputes from steps", () => {
  let st = freshState();
  st = addTask(st, { title: "Pinned project" });
  const id = st.tasks[0].id;
  st = addStep(st, id, { title: "a", completed: true });
  st = addStep(st, id, { title: "b", completed: false });
  assert.equal(st.tasks[0].progressPercent, 50); // auto: 1/2 steps

  st = setTaskProgressManual(st, id, 90);
  assert.equal(st.tasks[0].progressPercent, 90);
  assert.equal(st.tasks[0].progressMode, "manual");
  // steps still editable, but no longer drive the number while pinned
  st = toggleStep(st, id, st.tasks[0].steps[1].id);
  assert.equal(st.tasks[0].progressPercent, 90);

  st = resetTaskProgressToAuto(st, id);
  assert.equal(st.tasks[0].progressMode, "auto");
  assert.equal(st.tasks[0].progressPercent, 100); // both steps now complete
  assert.equal(st.tasks[0].status, "completed");
});

check("deleteStep and deleteTask remove records and recompute; simple no-step task uses progressPercent directly", () => {
  let st = freshState();
  st = addTask(st, { title: "Simple task" });
  const id = st.tasks[0].id;
  st = setTaskProgressManual(st, id, 40);
  assert.equal(taskProgress(st.tasks[0]), 40); // no steps -> progressPercent IS the source of truth

  st = addTask(st, { title: "To delete" });
  assert.equal(st.tasks.length, 2);
  const deadId = st.tasks[1].id;
  st = deleteTask(st, deadId);
  assert.equal(st.tasks.length, 1);

  st = addStep(st, id, { title: "x", completed: false });
  st = addStep(st, id, { title: "y", completed: true });
  st = deleteStep(st, id, st.tasks[0].steps[0].id);
  assert.equal(st.tasks[0].steps.length, 1);
});

check("updateTask patches fields and marking completed directly (ahead of steps) pins progress to 100", () => {
  let st = freshState();
  st = addTask(st, { title: "Task", urgency: "low", importance: "low" });
  const id = st.tasks[0].id;
  st = updateTask(st, id, { urgency: "high", importance: "high", deadline: "2026-08-01" });
  assert.equal(st.tasks[0].urgency, "high");
  assert.equal(st.tasks[0].importance, "high");
  assert.equal(st.tasks[0].deadline, "2026-08-01");

  st = addStep(st, id, { title: "a", completed: false });
  st = addStep(st, id, { title: "b", completed: false });
  st = updateTask(st, id, { status: "completed" }); // manual override ahead of steps
  assert.equal(st.tasks[0].progressPercent, 100);
  assert.equal(st.tasks[0].progressMode, "manual");
  assert.equal(st.tasks[0].status, "completed");
});

check("Import backfills missing tasks for older backups", () => {
  const raw = JSON.parse(readFileSync(new URL("./fixture_day4.json", import.meta.url), "utf8"));
  assert.ok(!("tasks" in raw)); // confirms this fixture predates the field
  const st = normalizeImport(raw);
  assert.deepEqual(st.tasks, []);
});

check("addTask with initial steps creates the task and its steps atomically -- progress reflects them immediately", () => {
  let st = freshState();
  st = addTask(st, {
    title: "Ship release",
    steps: [
      { title: "a", completed: true },
      { title: "b", completed: true },
      { title: "c", completed: false },
      { title: "d", completed: false },
    ],
  });
  const t = st.tasks[0];
  assert.equal(t.steps.length, 4);
  assert.equal(taskProgress(t), 50); // 2/4 already-completed steps, no separate addStep calls needed
  assert.equal(t.progressPercent, 50);
  assert.equal(t.status, "in_progress");
});

check("secretaryTasks 'today': exact deadline match only -- excludes overdue, no-deadline, and completed", () => {
  let st = freshState();
  const now = new Date("2026-07-15T12:00:00.000Z");
  st = addTask(st, { title: "Due today", deadline: "2026-07-15" });
  st = addTask(st, { title: "Overdue", deadline: "2026-07-10" });
  st = addTask(st, { title: "No deadline" });
  st = addTask(st, { title: "Completed today" });
  st = updateTask(st, st.tasks[3].id, { status: "completed" });

  const today = secretaryTasks(st, "today", now);
  assert.equal(today.length, 1);
  assert.equal(today[0].title, "Due today");
});

check("secretaryTasks 'upcoming': bounded to the current calendar month -- next month's deadlines don't show", () => {
  let st = freshState();
  const now = new Date("2026-07-15T12:00:00.000Z");
  st = addTask(st, { title: "Later this month", deadline: "2026-07-25" });
  st = addTask(st, { title: "Next month", deadline: "2026-08-02" });
  st = addTask(st, { title: "Overdue", deadline: "2026-07-10" });
  st = addTask(st, { title: "Due today", deadline: "2026-07-15" });

  const upcoming = secretaryTasks(st, "upcoming", now);
  assert.equal(upcoming.length, 1);
  assert.equal(upcoming[0].title, "Later this month");
});

check("secretaryTasks 'all' includes everything; 'completed' includes only completed", () => {
  let st = freshState();
  st = addTask(st, { title: "A" });
  st = addTask(st, { title: "B" });
  st = updateTask(st, st.tasks[1].id, { status: "completed" });

  assert.equal(secretaryTasks(st, "all").length, 2);
  const completed = secretaryTasks(st, "completed");
  assert.equal(completed.length, 1);
  assert.equal(completed[0].title, "B");
});

check("Single-account blow nets against total invested (base cost + extra), not just base cost", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, 95, 60); // base 95 + extra 60 = 155 total invested
  assert.deepEqual(st.spots["1-1"], { day: 1, cost: 95, extra: 60 });
  st = logOutcomeSingle(st, "1-1", 1, "blew", 95, 60, 900); // UI passes the account's real stored cost+extra
  assert.equal(st.todayLog[0].sunk, 155);
  assert.equal(st.todayProfit, 900 - 155); // 745, NOT 900-95=805
});

check("copyTradeOutcome nets each account against its OWN real invested capital, not a flat benchmark", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 3, 95, 60); // 155 total invested
  st = setDaySingle(st, "1-2", 3, 95, 0); // 95 total invested
  st = copyTradeOutcome(st, ["1-1", "1-2"], "blew", 200); // same 200 gross per account
  const logA = st.todayLog.find((l) => l.id === "1-1")!;
  const logB = st.todayLog.find((l) => l.id === "1-2")!;
  assert.equal(logA.sunk, 155);
  assert.equal(logA.profit, 45); // 200-155
  assert.equal(logB.sunk, 95);
  assert.equal(logB.profit, 105); // 200-95 -- different net despite the same gross, correctly per-account
  assert.equal(st.todayProfit, 45 + 105);
  assert.deepEqual(st.spots["1-1"], { day: 0, cost: 0, extra: 0 });
  assert.deepEqual(st.spots["1-2"], { day: 0, cost: 0, extra: 0 });
});

check("copyTradeOutcome payout variant keeps the day, resets cost/extra, nets per account", () => {
  let st = freshState();
  st = setDaySingle(st, "2-1", 5, 150, 40); // 190 total invested
  st = copyTradeOutcome(st, ["2-1"], "payout", 300);
  const log = st.todayLog[0];
  assert.equal(log.invested, 190);
  assert.equal(log.profit, 110); // 300-190
  assert.equal(st.todayPayouts, 110);
  assert.deepEqual(st.spots["2-1"], { day: 5, cost: 0, extra: 0 });
});

check("copyTradeOutcome: blank gross falls back to that day's LADDER profit, still nets against real invested capital", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 3, 95, 60); // 155 invested
  st = copyTradeOutcome(st, ["1-1"], "blew", null);
  assert.equal(st.todayLog[0].amount, LADDER[3].prof);
  assert.equal(st.todayProfit, LADDER[3].prof - 155);
});

check("Adding extra investment as a SEPARATE later step (not at initial deploy) still nets against the combined 155 on blow — single account, Now Trading, and copy-trade", () => {
  // Step 1: deploy at base cost 95 (blank cost -> benchmark), no extra yet.
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, null, null);
  assert.deepEqual(st.spots["1-1"], { day: 1, cost: 95, extra: 0 });

  // Step 2: a SEPARATE, later action adds extra investment 60 on top of the
  // account's own current extra (exactly how NowTradingCard's +Invest and
  // MultiLogModal/NowTradingCopyTradeModal's +Invest all do it).
  const sp = st.spots["1-1"];
  st = setDaySingle(st, "1-1", sp.day, sp.cost, (sp.extra || 0) + 60);
  assert.deepEqual(st.spots["1-1"], { day: 1, cost: 95, extra: 60 }); // 155 total invested

  // Step 3: blow, reading the account's CURRENT real state (as every caller does).
  const sp2 = st.spots["1-1"];
  st = logOutcomeSingle(st, "1-1", sp2.day, "blew", sp2.cost, sp2.extra, 900);
  assert.equal(st.todayLog[0].sunk, 155);
  assert.equal(st.todayProfit, 900 - 155); // 745, NOT 900-95=805

  // Same 3-step sequence through copyTradeOutcome (Now Trading copy-trade /
  // Clients tab copy-trade both funnel into this one function).
  let st2 = freshState();
  st2 = setDaySingle(st2, "2-1", 4, null, null);
  const spA = st2.spots["2-1"];
  st2 = setDaySingle(st2, "2-1", spA.day, spA.cost, (spA.extra || 0) + 60);
  assert.equal(st2.spots["2-1"].cost + st2.spots["2-1"].extra, spA.cost + 60);
  st2 = copyTradeOutcome(st2, ["2-1"], "blew", 500);
  assert.equal(st2.todayLog[0].sunk, spA.cost + 60);
  assert.equal(st2.todayProfit, 500 - (spA.cost + 60));
});

check("allTimeAverages: simple per-day average over banked days, scaled for week/month", () => {
  let st = freshState();
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  st = rollDay(st, "2026-07-01T12:00:00.000Z");
  st = editHistoryDay(st, 0, { profit: 100, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 }); // day1 total=100
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700);
  st = rollDay(st, "2026-07-02T12:00:00.000Z");
  st = editHistoryDay(st, 1, { profit: 200, payouts: 0, payoutGross: 0, deployed: 0, blownOverride: 1 }); // day2 total=200

  const avg = allTimeAverages(st);
  assert.equal(avg.dayCount, 2);
  assert.equal(avg.avgDaily, 150); // (100+200)/2
  assert.equal(avg.avgWeekly, 1050); // 150*7
  assert.equal(avg.avgMonthly, 4500); // 150*30
});

check("allTimeAverages: today's live (unbanked) log counts as a day; no data at all returns zeros", () => {
  let st = freshState();
  assert.deepEqual(allTimeAverages(st), { avgDaily: 0, avgWeekly: 0, avgMonthly: 0, dayCount: 0 });
  st = logOutcomeSingle(st, "1-1", 3, "blew", null, null, 700); // +27, still today, not banked
  const avg = allTimeAverages(st);
  assert.equal(avg.dayCount, 1);
  assert.equal(avg.avgDaily, 27);
});

check("copyTradeInvest: $100 split across 2 accounts -> +$50 each (the reported bug's exact scenario)", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, null, null); // fresh deploy, benchmark cost 95
  st = setDaySingle(st, "1-2", 1, null, null);
  st = copyTradeInvest(st, ["1-1", "1-2"], 100);
  assert.equal(st.spots["1-1"].extra, 50);
  assert.equal(st.spots["1-2"].extra, 50); // NOT 0 -- this was the exact bug
  assert.equal(st.spots["1-1"].cost + st.spots["1-1"].extra, 145);
  assert.equal(st.spots["1-2"].cost + st.spots["1-2"].extra, 145);
});

check("copyTradeInvest: $100 split across 4 accounts -> +$25 each", () => {
  let st = freshState();
  const ids = ["1-1", "1-2", "1-3", "1-4"];
  ids.forEach((id) => (st = setDaySingle(st, id, 1, null, null)));
  st = copyTradeInvest(st, ids, 100);
  ids.forEach((id) => assert.equal(st.spots[id].extra, 25));
});

check("copyTradeInvest: adding a split onto accounts with DIFFERENT existing invested amounts adds on top of each", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, 95, 0); // 95 total invested
  st = setDaySingle(st, "1-2", 1, 95, 60); // 155 total invested
  st = copyTradeInvest(st, ["1-1", "1-2"], 100); // +50 each
  assert.equal(st.spots["1-1"].cost + st.spots["1-1"].extra, 145); // 95 -> 145
  assert.equal(st.spots["1-2"].cost + st.spots["1-2"].extra, 205); // 155 -> 205 (the brief's exact example)
});

check("copyTradeInvest: every selected account receives exactly one update, regardless of array position", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, 95, 0);
  st = setDaySingle(st, "1-2", 1, 95, 20);
  st = setDaySingle(st, "1-3", 1, 95, 40);
  st = copyTradeInvest(st, ["1-1", "1-2", "1-3"], 90); // +30 each
  assert.equal(st.spots["1-1"].extra, 30); // first in array
  assert.equal(st.spots["1-2"].extra, 50); // middle
  assert.equal(st.spots["1-3"].extra, 70); // last in array -- none dropped
});

check("copyTradeInvest is the ONE shared calculation path -- identical inputs always produce identical results", () => {
  // Now Trading's and the Clients tab's copy-trade modals both call this
  // same exported function (see NowTradingCopyTradeModal.tsx / MultiLogModal.tsx);
  // this locks in that it's pure/deterministic, so there's no way for the
  // two UI surfaces to diverge now that neither loops separate store calls.
  let stateA = freshState();
  stateA = setDaySingle(stateA, "1-1", 1, 95, 0);
  stateA = setDaySingle(stateA, "1-2", 1, 95, 60);
  let stateB = freshState();
  stateB = setDaySingle(stateB, "1-1", 1, 95, 0);
  stateB = setDaySingle(stateB, "1-2", 1, 95, 60);
  const resultA = copyTradeInvest(stateA, ["1-1", "1-2"], 100);
  const resultB = copyTradeInvest(stateB, ["1-1", "1-2"], 100);
  assert.deepEqual(resultA.spots, resultB.spots);
});

check("copyTradeOutcome after copyTradeInvest nets against each account's FULL current invested amount", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, 95, 0);
  st = setDaySingle(st, "1-2", 1, 95, 60);
  st = copyTradeInvest(st, ["1-1", "1-2"], 100); // -> 145 and 205 invested
  st = copyTradeOutcome(st, ["1-1", "1-2"], "blew", 200); // 200 gross each
  const logA = st.todayLog.find((l) => l.id === "1-1")!;
  const logB = st.todayLog.find((l) => l.id === "1-2")!;
  assert.equal(logA.sunk, 145);
  assert.equal(logA.profit, 55); // 200-145, NOT 200-95=105
  assert.equal(logB.sunk, 205);
  assert.equal(logB.profit, -5); // 200-205, NOT 200-155=45
});

check("openSessionCapital: deploying two fresh accounts (no extra) counts each one's base cost -- $95+$95=$190", () => {
  let st = freshState();
  assert.equal(openSessionCapital(st), 0);
  st = setDaySingle(st, "1-1", 1, null, null); // benchmark deploy, blank extra -- NOT "traded", but still open capital
  st = setDaySingle(st, "1-2", 1, null, null);
  assert.equal(openSessionCapital(st), 190);
});

check("openSessionCapital: adding $60 extra to one of the two deployed accounts -> $250", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, null, null);
  st = setDaySingle(st, "1-2", 1, null, null);
  st = setDaySingle(st, "1-1", 1, st.spots["1-1"].cost, 60);
  assert.equal(openSessionCapital(st), 250); // (95+60) + 95
});

check("openSessionCapital: blowing one account subtracts its full invested amount, the other remains", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, null, null);
  st = setDaySingle(st, "1-2", 1, null, null);
  st = setDaySingle(st, "1-1", 1, st.spots["1-1"].cost, 60);
  assert.equal(openSessionCapital(st), 250);
  st = logOutcomeSingle(st, "1-1", 1, "blew", st.spots["1-1"].cost, st.spots["1-1"].extra, 900);
  assert.equal(openSessionCapital(st), 95); // only account 2's base cost remains
});

check("openSessionCapital: blowing both accounts -> $0", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, null, null);
  st = setDaySingle(st, "1-2", 1, null, null);
  st = logOutcomeSingle(st, "1-1", 1, "blew", null, null, 900);
  st = logOutcomeSingle(st, "1-2", 1, "blew", null, null, 900);
  assert.equal(openSessionCapital(st), 0);
});

check("openSessionCapital falls to 0 after a payout, even though the account stays occupied on the same day", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, 95, 60);
  st = logOutcomeSingle(st, "1-1", 1, "payout", 95, 60, 900); // keeps day, cost/extra reset to 0
  assert.equal(st.spots["1-1"].day, 1); // still occupied
  assert.equal(openSessionCapital(st), 0); // no benchmark fallback -- a true reset reads as exactly $0
});

check("openSessionCapital sums correctly across multiple accounts after a copy-trade invest", () => {
  let st = freshState();
  st = setDaySingle(st, "1-1", 1, null, null);
  st = setDaySingle(st, "1-2", 1, null, null);
  st = copyTradeInvest(st, ["1-1", "1-2"], 100); // +50 each
  assert.equal(openSessionCapital(st), 290); // (95+50) * 2
});

console.log(`\nAll ${pass} checks passed.`);
