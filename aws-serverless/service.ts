/**
 * Swift-Mart Enterprise BI - Secure Client API Service Layer
 * 
 * Implements the "Zero-Trust Client-Side Security" pattern by routing all LLM-based 
 * schema alignments and strategic business analysis queries exclusively through the 
 * AWS API Gateway Proxy, protecting sensitive backend keys.
 */

// Retrieve gateway configs from environment variables or build parameters
const AWS_GATEWAY_URL = import.meta.env.VITE_AWS_GATEWAY_URL || "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod";
const HANDSHAKE_GATEWAY_KEY = import.meta.env.VITE_GATEWAY_KEY || "dev-gateway-key";

// Local proxy/parsing is maintained securely on our local server for non-AI tasks
const LOCAL_API_URL = "/api";

export interface ColumnMapping {
  Price?: string;
  Quantity?: string;
  Category?: string;
  Total_Revenue?: string;
  Date?: string;
}

export interface SchemaAlignmentResponse {
  success: boolean;
  mapping: ColumnMapping;
  headersAreSynthesized: boolean;
  synthesizedHeaders?: string[];
  mappingRationale: string;
}

export interface AIAnalysisReport {
  success: boolean;
  executiveSummary: string;
  keyInsights: string[];
  productRecommendations: string[];
  revenueAnomalyReport: string;
}

/**
 * Parses files locally using the FastAPI stream parser.
 * Keeping parsing server-side handles larger datasets without browser memory leaks.
 */
export async function parseUploadedFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${LOCAL_API_URL}/v1/bi/parse-file`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Failed to parse file." }));
    throw new Error(err.detail || `Parse failed with status code ${response.status}`);
  }

  return response.json();
}

/**
 * Intelligent Schema Alignment - Dispatched SECURELY to the AWS Serverless Gateway
 * Does not expose the Google Gemini API key to the client.
 */
export async function alignSchemaWithAI(
  headers: string[],
  dataSample: any[]
): Promise<SchemaAlignmentResponse> {
  const response = await fetch(`${AWS_GATEWAY_URL}/api/v1/bi/align-schema`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Key": HANDSHAKE_GATEWAY_KEY,
    },
    body: JSON.stringify({ headers, dataSample }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AWS Gateway Schema Alignment Failed: ${errText || response.statusText}`);
  }

  return response.json();
}

/**
 * Cleans data rows locally using our heuristic validation & auto-healing FastAPI parser.
 */
export async function cleanAndHealRecords(
  rawRows: any[],
  mapping: ColumnMapping,
  headersAreSynthesized: boolean = false
): Promise<any> {
  const response = await fetch(`${LOCAL_API_URL}/v1/bi/clean-records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rawRows, mapping, headersAreSynthesized }),
  });

  if (!response.ok) {
    throw new Error(`Local data-healing pipeline failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Executive Strategic Business Analysis - Dispatched SECURELY to the AWS Serverless Gateway
 * Leverages the full power of Gemini-2.5-Flash without client-side risk.
 */
export async function analyzeBusinessMetricsWithAI(
  metrics: any,
  qualityReport: any
): Promise<AIAnalysisReport> {
  const response = await fetch(`${AWS_GATEWAY_URL}/api/v1/bi/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Key": HANDSHAKE_GATEWAY_KEY,
    },
    body: JSON.stringify({ metrics, qualityReport }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AWS Gateway Business Analysis Failed: ${errText || response.statusText}`);
  }

  return response.json();
}
