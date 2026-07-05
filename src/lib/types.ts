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
  note?: string; // optional correction reason, set via Accounting's Edit Source Entry
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

// Managers are the existing client color groups, not a separate entity.
// Keyed by color hex (the same hex already in state.colors).
export interface ManagerMeta {
  name: string; // editable; defaults to the palette color name (e.g. "Teal")
  splitPct: number; // 0-100, % of NET weekly profit owed to this manager
}

// ── Money Held / liquidity ledger ────────────────────────────────────
// "owed_*" = a debt claim. "*_hold_*" = temporary liquidity routing (money
// parked with/by a third party, not an open-ended debt) — the distinction
// the tab exists to capture.
export type LedgerItemType = "owed_to_me" | "owed_by_me" | "they_hold_for_me" | "i_hold_for_them";
export type CounterpartyType = "client" | "manager" | "custom";

export interface LedgerCounterparty {
  type: CounterpartyType;
  key?: string; // cluster number (client) or color hex (manager); absent for "custom"
  customName?: string; // only when type === "custom"
}

export interface Settlement {
  id: string;
  date: string; // ISO
  amount: number;
  isFull: boolean;
  note: string;
  destination?: string; // how THIS settlement was paid (free text)
}

export interface MoneyHeldEntry {
  id: string;
  itemType: LedgerItemType;
  counterparty: LedgerCounterparty;
  amount: number;
  currency: string; // free text: "USD", "USDT", "EUR" — not a strict enum
  purpose: string;
  dateIssued: string; // ISO
  expectedReturnDate?: string; // ISO, mainly relevant for the "holding" types
  settlements: Settlement[]; // [] = fully open; status is DERIVED from this, never stored
}

export interface AppLogin {
  id: string;
  label: string;
  username: string;
  password: string;
  notes?: string;
}

export type PaymentMethodType = "card" | "bank" | "crypto" | "other";

export interface LinkedWallet {
  network: string; // e.g. "USDT TRC20", "BTC"
  address: string;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  details: string; // free text, used by bank/crypto/other
  cardNumber?: string; // type === "card"
  cardExpiry?: string;
  cardholderName?: string;
  linkedWallet?: LinkedWallet; // optional, only meaningful for "card"
}

export type WithdrawalMethodType = "iban" | "crypto";

export interface WithdrawalMethod {
  id: string;
  type: WithdrawalMethodType;
  label: string;
  iban?: string; // type === "iban"
  bankName?: string;
  accountHolder?: string;
  network?: string; // type === "crypto"
  address?: string;
}

export interface VpsInfo {
  ipAddress: string;
  username: string;
  password: string;
}

// Pure metadata — never read by any trading calculation.
export interface ClientProfile {
  firstName: string;
  familyName: string;
  address: string;
  vpsLocation: string;
  vpsInfo: VpsInfo;
  paymentMethods: PaymentMethod[];
  withdrawalMethods: WithdrawalMethod[];
  appLogins: AppLogin[];
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
  managers: Record<string, ManagerMeta>; // key = color hex
  moneyHeld: MoneyHeldEntry[];
  clientProfiles: Record<string, ClientProfile>; // key = cluster number
}

// null = field left blank → use the same fallback the original app used
export type Maybe = number | null;
