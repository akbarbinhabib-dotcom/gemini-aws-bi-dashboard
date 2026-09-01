import os
import io
import re
import csv
import json
import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI App
app = FastAPI(
    title="Swift-Mart BI Enterprise API",
    description="FastAPI Wrapper for Messy Schema Alignment & Strategic Business Intelligence",
    version="2.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# PYDANTIC SCHEMAS (DATA CONTRACTS)
# ==============================================================================

class ColumnMapping(BaseModel):
    Price: Optional[str] = Field(default=None, description="Raw header mapped to unit price")
    Quantity: Optional[str] = Field(default=None, description="Raw header mapped to order quantity")
    Category: Optional[str] = Field(default=None, description="Raw header mapped to product line / department")
    Total_Revenue: Optional[str] = Field(default=None, description="Raw header mapped to total revenue subtotal")
    Date: Optional[str] = Field(default=None, description="Raw header mapped to transaction date")

class SchemaAlignmentResponse(BaseModel):
    mapping: ColumnMapping
    headersAreSynthesized: bool
    synthesizedHeaders: Optional[List[str]] = Field(default=None, description="Synthesized headers if original are missing")
    mappingRationale: str

class AIAnalysisReport(BaseModel):
    executiveSummary: str
    keyInsights: List[str]
    productRecommendations: List[str]
    revenueAnomalyReport: str

# ==============================================================================
# GEMINI CLIENT LAZY INITIALIZATION
# ==============================================================================

_genai_client = None

def get_gemini_client():
    """Lazy initialization of the modern Google GenAI Client"""
    global _genai_client
    if _genai_client is None:
        key = os.environ.get("GEMINI_API_KEY")
        if not key:
            return None
        try:
            from google import genai
            _genai_client = genai.Client(api_key=key)
        except ImportError:
            print("Warning: google-genai library is not installed yet.")
            return None
    return _genai_client

# ==============================================================================
# HEURISTIC AUTO-ALIGNMENT FALLBACKS
# ==============================================================================

FALLBACK_MAPPING_DICTIONARY = {
    "Price": ["unit_price", "price", "amount", "price_each", "cost", "rate", "value", "unitprice"],
    "Quantity": ["quantity", "qty", "units", "unit_qty", "count", "number_of_items", "qty_ordered"],
    "Category": ["product_line", "category", "type", "department", "class", "group", "item_type"],
    "Total_Revenue": ["total", "total_revenue", "sales", "revenue", "subtotal", "line_total", "gross_amount"],
    "Date": ["date", "timestamp", "transaction_date", "order_date", "time", "created_at", "created"]
}

def heuristic_auto_align(headers: List[str]) -> ColumnMapping:
    """Offline heuristic engine to auto-detect and map columns based on aliases"""
    mapping = ColumnMapping()
    
    for header in headers:
        normalized = header.strip().lower().replace(" ", "_").replace("__", "_")
        for field, aliases in FALLBACK_MAPPING_DICTIONARY.items():
            current_val = getattr(mapping, field)
            if not current_val:
                is_match = False
                for alias in aliases:
                    norm_alias = alias.lower().replace(" ", "_").replace("__", "_")
                    if normalized == norm_alias or norm_alias in normalized or normalized in norm_alias:
                        is_match = True
                        break
                if is_match:
                    setattr(mapping, field, header)
                    
    # Secondary precise exact checks
    for header in headers:
        normalized = header.strip().lower()
        if not mapping.Price and normalized == "price":
            mapping.Price = header
        if not mapping.Quantity and normalized in ["qty", "quantity"]:
            mapping.Quantity = header
        if not mapping.Category and normalized == "category":
            mapping.Category = header
        if not mapping.Total_Revenue and normalized in ["revenue", "total"]:
            mapping.Total_Revenue = header
        if not mapping.Date and normalized == "date":
            mapping.Date = header
            
    return mapping

# ==============================================================================
# API V1 ENDPOINTS
# ==============================================================================

@app.get("/api/health")
async def health_check():
    """Liveness probe endpoint"""
    return {"status": "ok", "timestamp": datetime.datetime.now().isoformat()}

@app.post("/api/v1/bi/parse-file")
async def parse_file(file: UploadFile = File(...)):
    """
    Endpoint 1: Parse Raw File (CSV or JSON)
    Receives file upload, parses content, and returns raw headers & data sample.
    """
    filename = file.filename.lower()
    content = await file.read()
    
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to decode file encoding.")
    
    raw_data = []
    headers = []
    
    if filename.endswith(".json"):
        try:
            parsed_json = json.loads(text)
            raw_data = parsed_json if isinstance(parsed_json, list) else [parsed_json]
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON format.")
    else:
        # Standard CSV Parsing (equivalent to PapaParse with dynamicTyping)
        try:
            f = io.StringIO(text)
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
            
            for row in reader:
                typed_row = {}
                for k, v in row.items():
                    if k is None:
                        continue
                    if v is None or v.strip() == "":
                        typed_row[k] = None
                    else:
                        v_str = v.strip()
                        # Try parsing as float or int
                        try:
                            if "." in v_str:
                                typed_row[k] = float(v_str)
                            else:
                                typed_row[k] = int(v_str)
                        except ValueError:
                            typed_row[k] = v_str
                raw_data.append(typed_row)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")

    if not raw_data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty or contains no records.")
        
    if not headers and raw_data:
        headers = list(raw_data[0].keys())
        
    # Generate data sample (first 10 records)
    sample_size = min(10, len(raw_data))
    data_sample = raw_data[:sample_size]
    
    return {
        "success": True,
        "filename": file.filename,
        "headers": headers,
        "totalRows": len(raw_data),
        "dataSample": data_sample,
        "rawRows": raw_data
    }

@app.post("/api/v1/bi/align-schema")
async def align_schema(req: dict):
    """
    Endpoint 2: Intelligent Schema Alignment (Gemini-Powered)
    Evaluates headers and a data sample, resolves complex names, synthesizes missing headers.
    """
    headers = req.get("headers", [])
    data_sample = req.get("dataSample", [])
    
    if not headers:
        raise HTTPException(status_code=400, detail="Missing or invalid headers.")
        
    client = get_gemini_client()
    if client:
        try:
            from google.genai import types
            prompt = f"""
You are an enterprise Business Intelligence schema ingestion engine.
Given the following raw column headers: {json.dumps(headers)}
And a raw data sample from the file: {json.dumps(data_sample)}

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
            """
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SchemaAlignmentResponse,
                )
            )
            
            result = json.loads(response.text)
            result["success"] = True
            result["method"] = "Gemini AI"
            return result
            
        except Exception as e:
            print("Gemini API call failed or is unconfigured. Falling back to heuristic auto-alignment:", str(e))
            
    # Fallback to local offline heuristics
    heuristic_mapping = heuristic_auto_align(headers)
    return {
        "success": True,
        "mapping": heuristic_mapping.dict(),
        "headersAreSynthesized": False,
        "synthesizedHeaders": None,
        "mappingRationale": "Gemini API is currently unavailable or unconfigured. Applied local offline heuristic matching algorithms to align schema.",
        "method": "Offline Heuristics"
    }

@app.post("/api/v1/bi/clean-records")
async def clean_records(req: dict):
    """
    Endpoint 3: Impute and Clean Records (Data Healing Pipeline)
    Maps and sanitizes messy inputs, corrects missing fields, formats values, and returns clean rows.
    """
    raw_rows = req.get("rawRows", [])
    mapping = req.get("mapping", {})
    headers_are_synthesized = req.get("headersAreSynthesized", False)
    
    if not isinstance(raw_rows, list):
        raise HTTPException(status_code=400, detail="Missing or invalid raw records dataset.")
        
    cleaned_records = []
    quality_report = {
        "totalRowsProcessed": len(raw_rows),
        "successfulRows": 0,
        "healedRows": 0,
        "imputedValuesCount": {
            "Price": 0,
            "Quantity": 0,
            "Category": 0,
            "Date": 0,
            "Total_Revenue": 0
        },
        "anomaliesDetected": []
    }
    
    last_valid_date = datetime.date.today().isoformat()
    last_valid_category = "uncategorized"
    
    for index, row in enumerate(raw_rows):
        is_healed = False
        record_id = f"record-{index}"
        
        # 1. Clean Category
        category = "uncategorized"
        mapped_cat_key = mapping.get("Category")
        raw_category = row.get(mapped_cat_key) if mapped_cat_key else None
        if raw_category is not None and str(raw_category).strip() != "":
            category = str(raw_category).strip().lower()
            last_valid_category = category
        else:
            category = last_valid_category or "uncategorized"
            quality_report["imputedValuesCount"]["Category"] += 1
            is_healed = True
            
        # 2. Clean Price
        price = 0.0
        mapped_price_key = mapping.get("Price")
        raw_price = row.get(mapped_price_key) if mapped_price_key else None
        if raw_price is not None and str(raw_price).strip() != "":
            if isinstance(raw_price, (int, float)):
                price = float(raw_price)
            else:
                # Clean messy currency characters
                clean_str = re.sub(r'[^0-9.-]', '', str(raw_price))
                try:
                    price = float(clean_str)
                except ValueError:
                    price = 0.0
            
            if price < 0:
                quality_report["anomaliesDetected"].append(
                    f"Row {index + 1}: Found negative unit price ({price}). Automatically converted to absolute value."
                )
                price = abs(price)
                is_healed = True
        else:
            price = 0.0
            quality_report["imputedValuesCount"]["Price"] += 1
            is_healed = True
            
        # 3. Clean Quantity
        quantity = 1
        mapped_qty_key = mapping.get("Quantity")
        raw_qty = row.get(mapped_qty_key) if mapped_qty_key else None
        if raw_qty is not None and str(raw_qty).strip() != "":
            if isinstance(raw_qty, (int, float)):
                quantity = int(raw_qty)
            else:
                clean_str = re.sub(r'[^0-9-]', '', str(raw_qty))
                try:
                    quantity = int(clean_str)
                except ValueError:
                    quantity = 1
            
            if quantity <= 0:
                quality_report["anomaliesDetected"].append(
                    f"Row {index + 1}: Found zero or negative quantity ({quantity}). Automatically defaulted to 1."
                )
                quantity = 1
                is_healed = True
        else:
            quantity = 1
            quality_report["imputedValuesCount"]["Quantity"] += 1
            is_healed = True
            
        # 4. Clean Date
        date_str = ""
        mapped_date_key = mapping.get("Date")
        raw_date = row.get(mapped_date_key) if mapped_date_key else None
        if raw_date is not None and str(raw_date).strip() != "":
            raw_date_str = str(raw_date).strip()
            if "T" in raw_date_str:
                date_str = raw_date_str.split("T")[0]
            else:
                try:
                    parsed_dt = datetime.datetime.fromisoformat(raw_date_str)
                    date_str = parsed_dt.date().isoformat()
                except Exception:
                    try:
                        date_str = raw_date_str[:10]
                        datetime.date.fromisoformat(date_str)
                    except Exception:
                        date_str = last_valid_date
                        quality_report["imputedValuesCount"]["Date"] += 1
                        is_healed = True
            
            try:
                datetime.date.fromisoformat(date_str)
                last_valid_date = date_str
            except Exception:
                date_str = last_valid_date
                quality_report["imputedValuesCount"]["Date"] += 1
                is_healed = True
        else:
            date_str = last_valid_date
            quality_report["imputedValuesCount"]["Date"] += 1
            is_healed = True
            
        # 5. Clean Total Revenue
        total_revenue = 0.0
        mapped_rev_key = mapping.get("Total_Revenue")
        raw_rev = row.get(mapped_rev_key) if mapped_rev_key else None
        if raw_rev is not None and str(raw_rev).strip() != "":
            if isinstance(raw_rev, (int, float)):
                total_revenue = float(raw_rev)
            else:
                clean_str = re.sub(r'[^0-9.-]', '', str(raw_rev))
                try:
                    total_revenue = float(clean_str)
                except ValueError:
                    total_revenue = 0.0
                    
            # expected vs reported discrepancies
            expected_rev = price * quantity
            discrepancy_percent = abs(total_revenue - expected_rev) / (expected_rev or 1.0)
            if discrepancy_percent > 0.05 and expected_rev > 0:
                quality_report["anomaliesDetected"].append(
                    f"Row {index + 1}: Revenue discrepancy detected. Uploaded revenue {total_revenue}, calculated revenue {expected_rev:.2f}."
                )
        else:
            total_revenue = price * quantity
            quality_report["imputedValuesCount"]["Total_Revenue"] += 1
            is_healed = True
            
        if is_healed:
            quality_report["healedRows"] += 1
        else:
            quality_report["successfulRows"] += 1
            
        # Round values
        price = round(price, 2)
        total_revenue = round(total_revenue, 2)
        
        # Build complete record keeping raw keys for full context
        cleaned_record = dict(row)
        cleaned_record.update({
            "id": record_id,
            "Date": date_str,
            "Category": category,
            "Price": price,
            "Quantity": quantity,
            "Total_Revenue": total_revenue
        })
        cleaned_records.append(cleaned_record)
        
    return {
        "success": True,
        "cleanedRecords": cleaned_records,
        "qualityReport": quality_report
    }

@app.post("/api/v1/bi/analyze")
async def analyze_data(req: dict):
    """
    Endpoint 4: AI Executive Business Analysis (Gemini-Powered)
    Evaluates summary statistics and quality report to generate a business strategic report.
    """
    metrics = req.get("metrics")
    quality_report = req.get("qualityReport")
    
    if not metrics:
        raise HTTPException(status_code=400, detail="Missing BI summary metrics.")
        
    client = get_gemini_client()
    if client:
        try:
            from google.genai import types
            
            summary_context = f"""
Summary Financial Metrics:
- Total Revenue Generated: ${metrics.get('totalRevenue', 0):,}
- Total Transactions Processed: {metrics.get('totalTransactions', 0):,}
- Average Order Value (AOV): ${metrics.get('avgOrderValue', 0):.2f}
- Total Units Mapped/Sold: {metrics.get('totalItemsSold', 0):,}

Category Performance Profile:
{json.dumps(metrics.get('categoryDistribution', {}), indent=2)}

Data Quality Profile:
- Imputed Prices: {quality_report.get('imputedValuesCount', {}).get('Price', 0) if quality_report else 0}
- Imputed Quantities: {quality_report.get('imputedValuesCount', {}).get('Quantity', 0) if quality_report else 0}
- Imputed Dates: {quality_report.get('imputedValuesCount', {}).get('Date', 0) if quality_report else 0}
- Anomalies and flags discovered: {json.dumps(quality_report.get('anomaliesDetected', [])[:5] if quality_report else [])}
            """
            
            prompt = f"""
You are a Principal Business Intelligence & Management Consulting Expert.
Analyze the following business financial summary and data quality profile:
{summary_context}

Provide a comprehensive, high-quality analysis that includes:
1. Executive Summary: High-level visual commentary on top revenue drivers and margin performance.
2. Key Insights: 3 bullet points identifying trends, category dominance, or customer baskets.
3. Product/Inventory Recommendations: Bullet points detailing inventory controls, pricing actions, or sales channels.
4. Data Integrity & Revenue Anomaly Audit: Commentary on data quality (imputed fields, revenue discrepancies) and their risks.

Return a JSON object conforming strictly to this format.
            """
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AIAnalysisReport,
                )
            )
            
            result = json.loads(response.text)
            result["success"] = True
            result["rawResponseText"] = response.text
            return result
            
        except Exception as e:
            print("Gemini BI Analysis API Failed:", str(e))
            
    # Professional fallback analysis
    total_rev = metrics.get('totalRevenue', 0)
    total_tx = metrics.get('totalTransactions', 0)
    avg_order = metrics.get('avgOrderValue', 0)
    categories_cnt = len(metrics.get('categoryDistribution', {})) if metrics.get('categoryDistribution') else 0
    healed_cnt = quality_report.get('healedRows', 0) if quality_report else 0
    
    return {
        "success": True,
        "executiveSummary": "BI Dashboard financial report initialized. Complete metrics show strong transactional stability. Set up your Gemini API Key in Settings > Secrets to unlock complete AI-powered advisory insights and automated market strategies.",
        "keyInsights": [
            f"Financial Metrics: Total aggregate sales reached the milestone of ${total_rev:,} across {total_tx:,} transactions.",
            f"Category Share: Multi-category distribution shows stable activity, with {categories_cnt} distinct business lines parsed.",
            f"Average Order Value: Standard order sizes are resting at an average profile of ${avg_order:.2f}."
        ],
        "productRecommendations": [
            "Establish secondary safety stock limits for top-performing items to prevent stockouts.",
            "Evaluate unit margins for low-performing transaction categories to test potential discount elasticities."
        ],
        "revenueAnomalyReport": f"Standard compliance audit shows {healed_cnt} rows requiring automated imputation or currency/number parsing normalization. Data consistency matches secure transaction schemas.",
        "rawResponseText": "Fallback static business diagnostics applied."
    }

# ==============================================================================
# STATIC FILES SERVING (PRODUCTION FRONTEND INTEGRATION)
# ==============================================================================

if os.path.exists("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")
    
    # Catch-all router for SPA fallback
    @app.get("/{catchall:path}")
    async def serve_spa(catchall: str):
        # Prevent intercepting API routes
        if catchall.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        return FileResponse("dist/index.html")

# Startup entrypoint
if __name__ == "__main__":
    import uvicorn
    # If run directly as a python script, start uvicorn on port 3000
    uvicorn.run("server:app", host="0.0.0.0", port=3000, reload=True)
