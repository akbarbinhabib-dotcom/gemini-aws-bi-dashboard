export interface CleanedRecord {
  id: string;
  Date: string;
  Category: string;
  Price: number;
  Quantity: number;
  Total_Revenue: number;
  [key: string]: any; // Keep original columns for context
}

export interface ColumnMapping {
  Price: string | null;
  Quantity: string | null;
  Category: string | null;
  Total_Revenue: string | null;
  Date: string | null;
}

export interface SchemaAlignmentResponse {
  mapping: ColumnMapping;
  headersAreSynthesized: boolean;
  synthesizedHeaders: string[] | null;
  mappingRationale: string;
  dataSample: Record<string, any>[];
}

export interface DataQualityReport {
  totalRowsProcessed: number;
  successfulRows: number;
  healedRows: number;
  imputedValuesCount: {
    Price: number;
    Quantity: number;
    Category: number;
    Date: number;
    Total_Revenue: number;
  };
  anomaliesDetected: string[];
}

export interface BISummaryMetrics {
  totalRevenue: number;
  totalTransactions: number;
  avgOrderValue: number;
  totalItemsSold: number;
  categoryDistribution: Record<string, { revenue: number; quantity: number; share: number }>;
  dailyRevenueTrend: { date: string; revenue: number; transactions: number }[];
}

export interface AIAnalysisReport {
  executiveSummary: string;
  keyInsights: string[];
  productRecommendations: string[];
  revenueAnomalyReport: string;
  rawResponseText?: string;
}
