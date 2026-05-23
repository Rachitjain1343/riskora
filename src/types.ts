export type ProfileType = 'Individual' | 'Business';

export interface FinancialImpact {
  minLoss: number;
  maxLoss: number;
  mitigationCost: number;
  roiMultiplier: number;
  currencySymbol: string;
}

export interface RiskItem {
  id: string;
  title: string;
  level: 'high' | 'medium' | 'low';
  description: string;
  timeframe: string;
  score: number; // 1-100 severity indicator
  mitigationStrategy: string;
  financialImpact: FinancialImpact;
}

export interface FinancialSummary {
  totalEstimatedLossMin: number;
  totalEstimatedLossMax: number;
  totalMitigationCost: number;
  overallHealthScore: number; // 0-100 indicating health posture
  currencySymbol: string;
}

export interface RiskReport {
  id?: string;
  profileType: ProfileType;
  domain: string;
  scaleEstimate: string; // e.g. "Startup with $500k ARR"
  region?: string;       // e.g. "India"
  geopoliticalScenario?: string; // e.g. "Iran-USA Conflict"
  isDeepAnalysis?: boolean;
  risks: RiskItem[];
  summary: string;
  financialSummary: FinancialSummary;
}
