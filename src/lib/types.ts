// Data model — matches spotdesk_day4_repaired.json exactly.

export interface Spot {
  day: number; // 0 = free/empty, 1..14 = occupied on that ladder day
  cost: number; // ladder/account cost recorded on it
  extra: number; // additional investment currently placed
}

export type OutcomeType = "blew" | "payout";

export interface LogEntry {
  time: string;
  id: string; // "{cluster}-{account}"
  amount: number; // gross received
  sunk?: number; // (blew) investment deducted
  invested?: number; // (payout) investment deducted
  profit?: number; // net (may be absent in very old backups → fall back to amount)
  day: number;
  type: OutcomeType;
}

export interface HistoryDay {
  day: number;
  profit: number; // blow profit
  payouts: number; // payout PROFIT (contributes to total)
  payoutGross?: number; // gross payout received (does NOT hit total)
  total: number; // profit + payouts
  deployed?: number;
  log: LogEntry[];
  date?: string; // ISO
  blownOverride?: number;
}

export interface Objectives {
  dailyTarget: number; // 0 = unset
  weeklyTarget: number;
  monthlyTarget: number;
  maxAccounts: number; // 0 = unset
  notes: string;
}

export interface AppState {
  spots: Record<string, Spot>;
  names: Record<string, string>;
  colors: Record<string, string>;
  sheets: Record<string, string>;
  capacityTarget: number;
  capClusters: number | null;
  capAccts: number | null;
  accountPrice: number;
  capitalLimit: number; // 0 = no limit set; max $ willing to have deployed at once
  todayProfit: number;
  todayPayouts: number;
  todayLog: LogEntry[];
  tradedToday: string[];
  deployedToday: number;
  dayCount: number;
  history: HistoryDay[];
  objectives: Objectives;
}

// null = field left blank → use the same fallback the original app used
export type Maybe = number | null;
