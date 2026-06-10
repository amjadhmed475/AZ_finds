/* ── Yamari Group Intelligence Division — Shared Types ── */

export type AgentRole = "DIRECTOR" | "SCOUT" | "MAXIMUS" | "HERALD";
export type BuySignal = "STRONG" | "MODERATE" | "CAUTIOUS";

export interface AgentLogEntry {
  ts: string;
  agent: AgentRole;
  message: string;
  data?: unknown;
}

/* What Scout delivers to the Director */
export interface ScoutReport {
  batchDate: string;
  totalScanned: number;
  totalPassed: number;
  bestScore: number;
  highestRoi: number;
  averageMargin: number;
  ungatedCount: number;
  topProducts: ProductProfile[];
  mode: "live" | "sample";
}

/* Normalised product profile for agents */
export interface ProductProfile {
  rank: number;
  id: string;
  name: string;
  category: string;
  grade: string;
  score: number;
  roi: number;
  margin: number;
  netProfit: number;
  unitCost: number;
  landedCost: number;
  estimatedMonthlySales: number;
  risk: string;
  gating: string;
  decision: string;
  topSupplierName?: string;
  topSupplierCost?: number;
  keyInsight?: string;         // filled by MAXIMUS
}

/* What Maximus delivers */
export interface MaximusReport {
  marketPulse: string;          // 1 sentence market snapshot
  strategicInsights: string[];  // exactly 3 bullet points
  buySignal: BuySignal;
  focusCategory: string;
  weeklyOutlook: string;        // what to watch for next 7 days
  confidenceNote: string;       // honest uncertainty statement
}

/* What Herald builds and sends */
export interface BriefingPayload {
  scout: ScoutReport;
  maximus: MaximusReport;
  formattedMessage: string;
}

export interface BriefingResult {
  success: boolean;
  recipient?: string;
  sentAt?: string;
  dryRun: boolean;
  error?: string;
}

/* Final mission result logged by Director */
export interface MissionResult {
  date: string;
  success: boolean;
  scout: ScoutReport;
  maximus: MaximusReport;
  briefing: BriefingResult;
  durationMs: number;
  agentLog: AgentLogEntry[];
}
