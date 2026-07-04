// ─────────────────────────────────────────────────────────────────────
// SPOTDESK ladder model — ported VERBATIM from spot-tracker.html.
// Do not "improve" these numbers. They are the source of truth.
// ─────────────────────────────────────────────────────────────────────

export type Zone = "live" | "deep" | "cool" | "gold";

export interface LadderDay {
  inv: number; // benchmark investment/cost
  p: number; // win probability
  prof: number; // benchmark profit
  zone: Zone;
  gateway?: boolean;
  payout?: boolean;
}

export const LADDER: Record<number, LadderDay> = {
  1: { inv: 95, p: 0.45, prof: 25, zone: "live" },
  2: { inv: 190, p: 0.45, prof: 25, zone: "live" },
  3: { inv: 388, p: 0.58, prof: 40, zone: "live" },
  4: { inv: 1400, p: 0.05, prof: 50, zone: "deep" },
  5: { inv: 1450, p: 0.05, prof: 50, zone: "deep" },
  6: { inv: 1520, p: 0.05, prof: 50, zone: "deep" },
  7: { inv: 1600, p: 0.05, prof: 50, zone: "deep" },
  8: { inv: 0, p: 1.0, prof: 0, zone: "gold", gateway: true }, // gateway to second leg, no payout
  9: { inv: 85, p: 0.078, prof: 900, zone: "cool" },
  10: { inv: 190, p: 0.078, prof: 900, zone: "cool" },
  11: { inv: 280, p: 0.078, prof: 900, zone: "cool" },
  12: { inv: 390, p: 0.078, prof: 900, zone: "cool" },
  13: { inv: 480, p: 0.078, prof: 900, zone: "cool" },
  14: { inv: 0, p: 1.0, prof: 750, zone: "gold", payout: true }, // survivor payout, keep account
};

// Forward value per day — fixed lookup, NOT computed live.
// D1-3: profit-on-blow × probability of hitting
// D4-7: flat $150 expected end-of-cycle profit
// D8-13: phase-2 weighted average (14.2625%×900 + 85.7375%×700 = 728.52)
// D14: the $750 payout
export const PHASE2_AVG = (1 - Math.pow(0.95, 3)) * 900 + Math.pow(0.95, 3) * 700; // 728.52

export const FWD: Record<number, number> = {
  1: 25 * 0.45, // 11.25
  2: 25 * 0.45, // 11.25
  3: 40 * 0.58, // 23.20
  4: 150,
  5: 150,
  6: 150,
  7: 150,
  8: PHASE2_AVG,
  9: PHASE2_AVG,
  10: PHASE2_AVG,
  11: PHASE2_AVG,
  12: PHASE2_AVG,
  13: PHASE2_AVG,
  14: 750,
};

export const N_CLUSTERS = 17;
export const ACCTS_PER_CLUSTER = 5;

// Package colors — clusters sharing a color form a package
export const PACKAGE_COLORS = [
  { name: "Teal", hex: "#00e2a0" },
  { name: "Blue", hex: "#4aa8ff" },
  { name: "Purple", hex: "#b794ff" },
  { name: "Gold", hex: "#ffc857" },
  { name: "Rose", hex: "#ff5470" },
  { name: "Cyan", hex: "#22d3ee" },
  { name: "Lime", hex: "#a3e635" },
  { name: "Orange", hex: "#fb923c" },
] as const;
