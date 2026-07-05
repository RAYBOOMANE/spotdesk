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
} from "../src/lib/logic";
import { computeTopStats, equityPoints, periodTotals, managerSummaries, moneyHeldRemaining, moneyHeldStatus } from "../src/lib/stats";

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

console.log(`\nAll ${pass} checks passed.`);
