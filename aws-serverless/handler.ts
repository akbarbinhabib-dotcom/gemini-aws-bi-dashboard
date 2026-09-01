import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client lazily to conserve runtime boot cycles
let aiClient: GoogleGenAI | null = null;

const getAIClient = (): GoogleGenAI => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable in Lambda configuration.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

// CORS configuration utility to protect and satisfy pre-flight browser handshakes
const getCorsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Gateway-Key,Authorization",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json"
});

/**
 * AWS Lambda secure proxy handler
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // 1. Handle Pre-flight OPTIONS Requests gracefully
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: getCorsHeaders(),
      body: ""
    };
  }

  try {
    // 2. Validate Gateway Key (X-Gateway-Key Custom Handshake)
    const clientGatewayKey = event.headers["X-Gateway-Key"] || event.headers["x-gateway-key"];
    const expectedGatewayKey = process.env.GATEWAY_API_KEY;

    if (!expectedGatewayKey || clientGatewayKey !== expectedGatewayKey) {
      return {
        statusCode: 401,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          success: false,
          error: "Unauthorized: Invalid or missing secure gatekeeping credentials (X-Gateway-Key)."
        })
      };
    }

    // 3. Parse Body and Validate Path
    if (!event.body) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ success: false, error: "Empty request payload." })
      };
    }

    const payload = JSON.parse(event.body);
    const apiPath = event.path;
    const ai = getAIClient();

    // 4. Route Routing & Model Invocations
    if (apiPath.endsWith("/align-schema")) {
      const { headers, dataSample } = payload;
      if (!headers || !Array.isArray(headers)) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(),
          body: JSON.stringify({ success: false, error: "Invalid headers format in request payload." })
        };
      }

      // Safe schema alignment prompt and schema constraint mapping
      const prompt = `
        You are an enterprise Business Intelligence schema ingestion engine.
        Given the following raw column headers: ${JSON.stringify(headers)}
        And a raw data sample from the file: ${JSON.stringify(dataSample || [])}

        Analyze this dataset and perform the following tasks:
        1. Determine if the file is missing headers (e.g., if columns are named generic things like 'col_0', 'field_1', 'A', 'B', 'C', or if the first row of data contains actual columns).
        2. Map the most appropriate headers to the standard target fields:
           - "Date" (e.g. order time, creation date, timestamp)
           - "Category" (e.g. product line, tag, item type, department)
           - "Price" (e.g. unit price, rate, charge, amount)
           - "Quantity" (e.g. count, quantity ordered, units)
           - "Total_Revenue" (e.g. total cost, order total, net sales, charge total)
        3. If headers are completely missing, synthesize the correct headers for the mapped positions.
        4. Provide a professional, concise rationale explaining how you mapped the messy source headers to standard business definitions.

        Respond in strict JSON format mapping your analysis.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // Strongly enforce schemas to maintain programmatic stability
          responseSchema: {
            type: "OBJECT",
            properties: {
              mapping: {
                type: "OBJECT",
                properties: {
                  Price: { type: "STRING" },
                  Quantity: { type: "STRING" },
                  Category: { type: "STRING" },
                  Total_Revenue: { type: "STRING" },
                  Date: { type: "STRING" }
                }
              },
              headersAreSynthesized: { type: "BOOLEAN" },
              synthesizedHeaders: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              mappingRationale: { type: "STRING" }
            },
            required: ["mapping", "headersAreSynthesized", "mappingRationale"]
          }
        }
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: response.text || "{}"
      };
    } 
    
    if (apiPath.endsWith("/analyze")) {
      const { metrics, qualityReport } = payload;
      if (!metrics) {
        return {
          statusCode: 400,
          headers: getCorsHeaders(),
          body: JSON.stringify({ success: false, error: "Missing summary metrics for executive analysis." })
        };
      }

      const summaryContext = `
        Summary Financial Metrics:
        - Total Revenue Generated: $${(metrics.totalRevenue || 0).toLocaleString()}
        - Total Transactions Processed: ${(metrics.totalTransactions || 0).toLocaleString()}
        - Average Order Value (AOV): $${(metrics.avgOrderValue || 0).toFixed(2)}
        - Total Units Mapped/Sold: ${(metrics.totalItemsSold || 0).toLocaleString()}

        Category Performance Profile:
        ${JSON.stringify(metrics.categoryDistribution || {}, null, 2)}

        Data Quality Profile:
        - Imputed Prices: ${qualityReport?.imputedValuesCount?.Price || 0}
        - Imputed Quantities: ${qualityReport?.imputedValuesCount?.Quantity || 0}
        - Imputed Dates: ${qualityReport?.imputedValuesCount?.Date || 0}
        - Anomalies and flags discovered: ${JSON.stringify(qualityReport?.anomaliesDetected || [])}
      `;

      const prompt = `
        You are a Principal Business Intelligence & Management Consulting Expert.
        Analyze the following business financial summary and data quality profile:
        ${summaryContext}

        Provide a comprehensive, high-quality analysis that includes:
        1. Executive Summary: High-level visual commentary on top revenue drivers and margin performance.
        2. Key Insights: 3 bullet points identifying trends, category dominance, or customer baskets.
        3. Product/Inventory Recommendations: Bullet points detailing inventory controls, pricing actions, or sales channels.
        4. Data Integrity & Revenue Anomaly Audit: Commentary on data quality (imputed fields, revenue discrepancies) and their risks.

        Return a JSON object conforming strictly to this format.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              executiveSummary: { type: "STRING" },
              keyInsights: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              productRecommendations: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              revenueAnomalyReport: { type: "STRING" }
            },
            required: ["executiveSummary", "keyInsights", "productRecommendations", "revenueAnomalyReport"]
          }
        }
      });

      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: response.text || "{}"
      };
    }

    return {
      statusCode: 404,
      headers: getCorsHeaders(),
      body: JSON.stringify({ success: false, error: `Endpoint ${apiPath} not found on this serverless route.` })
    };

  } catch (error: any) {
    console.error("Critical serverless proxy error:", error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        success: false,
        error: "Internal Server Error",
        message: error.message || String(error)
      })
    };
  }
};
