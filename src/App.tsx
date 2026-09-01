import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  TrendingUp, 
  Coins, 
  BarChart3, 
  Layers, 
  Search, 
  ArrowDownToLine, 
  SlidersHorizontal, 
  Database,
  Calendar,
  Layers2,
  Trash2,
  Sparkles,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  ChevronRight,
  BrainCircuit,
  Cpu
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { CleanedRecord, ColumnMapping, DataQualityReport, BISummaryMetrics, AIAnalysisReport } from "./types";

// ==============================================================================
// SYNTHETIC GENERATOR ENGINE (Client-Side Backup / Demonstration)
// ==============================================================================
function generateMockData(count: number = 100): CleanedRecord[] {
  const categories = ["electronics", "accessories", "office-erp", "cloud-saas", "hardware"];
  const data: CleanedRecord[] = [];
  const start = new Date("2026-01-01").getTime();
  const end = new Date("2026-06-13").getTime();
  const step = (end - start) / (count - 1 || 1);

  for (let i = 0; i < count; i++) {
    const timestamp = start + step * i;
    const dateStr = new Date(timestamp).toISOString().split("T")[0];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const price = Math.round((Math.random() * (1200 - 45) + 45) * 100) / 100;
    const qty = Math.floor(Math.random() * 8) + 1;
    
    data.push({
      id: `mock-${i}`,
      Date: dateStr,
      Category: category,
      Price: price,
      Quantity: qty,
      Total_Revenue: Math.round((price * qty) * 100) / 100
    });
  }
  return data;
}

export default function App() {
  // ==============================================================================
  // REACT STATE INITIALIZATION
  // ==============================================================================
  const [activeSource, setActiveSource] = useState<"mock" | "uploaded">("mock");
  const [mockCount, setMockCount] = useState<number>(100);
  const [mockData, setMockData] = useState<CleanedRecord[]>([]);
  
  // File Upload and Raw States
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [rawUploadedData, setRawUploadedData] = useState<any[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  
  // Schema Alignment States
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    Price: null,
    Quantity: null,
    Category: null,
    Total_Revenue: null,
    Date: null
  });
  const [mappingRationale, setMappingRationale] = useState<string>("");
  const [headersAreSynthesized, setHeadersAreSynthesized] = useState<boolean>(false);
  const [alignmentMethod, setAlignmentMethod] = useState<string>("");

  // Cleaned and Processed Data States
  const [cleanedRecords, setCleanedRecords] = useState<CleanedRecord[]>([]);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);

  // AI Strategic Consulting Report
  const [aiReport, setAiReport] = useState<AIAnalysisReport | null>(null);

  // Workflow Loading Indicators
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isAligning, setIsAligning] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI Utilities
  const [searchQuery, setSearchQuery] = useState<string>(" ");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Initialize mock data on mount
  useEffect(() => {
    const backup = generateMockData(mockCount);
    setMockData(backup);
    setCleanedRecords(backup);
    setQualityReport({
      totalRowsProcessed: backup.length,
      successfulRows: backup.length,
      healedRows: 0,
      imputedValuesCount: { Price: 0, Quantity: 0, Category: 0, Date: 0, Total_Revenue: 0 },
      anomaliesDetected: []
    });
    setAiReport(null);
  }, [mockCount]);

  // ==============================================================================
  // FULL-STACK BACKEND API OPERATIONS
  // ==============================================================================

  /**
   * Step 1: Upload and Parse file via Backend
   */
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsParsing(true);
    setErrorMessage(null);
    setUploadedFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/v1/bi/parse-file", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || "Failed to parse uploaded file.");
      }

      const data = await response.json();
      setRawUploadedData(data.rawRows);
      setRawHeaders(data.headers);

      // Trigger automatic AI alignment immediately after success parse
      await handleIntelligentAlignment(data.headers, data.dataSample, data.rawRows);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to process database upload.");
      resetUploadedData();
    } finally {
      setIsParsing(false);
    }
  };

  /**
   * Step 2: Request AI Schema Alignment from Gemini
   */
  const handleIntelligentAlignment = async (headers: string[], sample: any[], rows: any[]) => {
    setIsAligning(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/v1/bi/align-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, dataSample: sample })
      });

      if (!response.ok) {
        throw new Error("Failed to align schemas using backend service.");
      }

      const data = await response.json();
      setColumnMapping(data.mapping);
      setMappingRationale(data.mappingRationale);
      setHeadersAreSynthesized(data.headersAreSynthesized);
      setAlignmentMethod(data.method || "Gemini AI Engine");

      // Trigger standard Data Healing / Cleaning on mapped columns immediately
      await handleDataCleaning(rows, data.mapping);

    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error choosing schema alignment parameters. Please check your columns mappings manually.");
    } finally {
      setIsAligning(false);
    }
  };

  /**
   * Step 3: Run Healing & Cleansing Pipeline
   */
  const handleDataCleaning = async (rawDataset: any[] = rawUploadedData, mappingToUse: ColumnMapping = columnMapping) => {
    setIsCleaning(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/v1/bi/clean-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawRows: rawDataset,
          mapping: mappingToUse,
          headersAreSynthesized
        })
      });

      if (!response.ok) {
        throw new Error("Backend data validation engine failed.");
      }

      const data = await response.json();
      setCleanedRecords(data.cleanedRecords);
      setQualityReport(data.qualityReport);
      setActiveSource("uploaded");
      setCurrentPage(1);
      // Reset older AI reports since data has changed
      setAiReport(null);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to sanitize raw records.");
    } finally {
      setIsCleaning(false);
    }
  };

  /**
   * Step 4: Request Strategic Executive Report via Gemini
   */
  const handleRequestAIReport = async () => {
    if (cleanedRecords.length === 0) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/v1/bi/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: summaryMetrics,
          qualityReport
        })
      });

      if (!response.ok) {
        throw new Error("Executive analysis generation failed.");
      }

      const data = await response.json();
      setAiReport(data);

    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to generate AI executive consulting insights.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ==============================================================================
  // USER WORKFLOW TRIGGERS
  // ==============================================================================
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv") || file.name.endsWith(".json")) {
        handleFileUpload(file);
      } else {
        setErrorMessage("Please drop a valid CSV or JSON document.");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const resetUploadedData = () => {
    setUploadedFileName("");
    setRawUploadedData([]);
    setRawHeaders([]);
    setColumnMapping({
      Price: null,
      Quantity: null,
      Category: null,
      Total_Revenue: null,
      Date: null
    });
    setMappingRationale("");
    setCleanedRecords(mockData);
    setQualityReport({
      totalRowsProcessed: mockData.length,
      successfulRows: mockData.length,
      healedRows: 0,
      imputedValuesCount: { Price: 0, Quantity: 0, Category: 0, Date: 0, Total_Revenue: 0 },
      anomaliesDetected: []
    });
    setAiReport(null);
    setActiveSource("mock");
    setCurrentPage(1);
    setErrorMessage(null);
  };

  const handleMappingChange = (key: keyof ColumnMapping, value: string) => {
    const updatedMapping = {
      ...columnMapping,
      [key]: value === "" ? null : value
    };
    setColumnMapping(updatedMapping);
    // Re-trigger cleaning pipeline using updated alignment mappings
    handleDataCleaning(rawUploadedData, updatedMapping);
  };

  // ==============================================================================
  // METRICS & ANALYSIS AGGREGATORS
  // ==============================================================================
  const activeDataset = useMemo(() => {
    return activeSource === "mock" ? mockData : cleanedRecords;
  }, [activeSource, mockData, cleanedRecords]);

  const summaryMetrics = useMemo<BISummaryMetrics>(() => {
    let totalRevenue = 0;
    let totalTransactions = activeDataset.length;
    let totalItemsSold = 0;
    const categoryGroups: Record<string, { revenue: number; quantity: number }> = {};
    const dailyGroups: Record<string, { revenue: number; transactions: number }> = {};

    activeDataset.forEach(item => {
      totalRevenue += item.Total_Revenue;
      totalItemsSold += item.Quantity;

      // Group Category
      const cat = item.Category || "uncategorized";
      if (!categoryGroups[cat]) {
        categoryGroups[cat] = { revenue: 0, quantity: 0 };
      }
      categoryGroups[cat].revenue += item.Total_Revenue;
      categoryGroups[cat].quantity += item.Quantity;

      // Group Daily Date
      const date = item.Date || "2026-01-01";
      if (!dailyGroups[date]) {
        dailyGroups[date] = { revenue: 0, transactions: 0 };
      }
      dailyGroups[date].revenue += item.Total_Revenue;
      dailyGroups[date].transactions += 1;
    });

    const categoryDistribution: Record<string, { revenue: number; quantity: number; share: number }> = {};
    Object.entries(categoryGroups).forEach(([cat, stats]) => {
      categoryDistribution[cat] = {
        revenue: Math.round(stats.revenue * 100) / 100,
        quantity: stats.quantity,
        share: totalRevenue > 0 ? Math.round((stats.revenue / totalRevenue) * 100) : 0
      };
    });

    const dailyRevenueTrend = Object.entries(dailyGroups)
      .map(([date, stats]) => ({
        date,
        revenue: Math.round(stats.revenue * 100) / 100,
        transactions: stats.transactions
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTransactions,
      avgOrderValue: totalTransactions > 0 ? Math.round((totalRevenue / totalTransactions) * 100) / 100 : 0,
      totalItemsSold,
      categoryDistribution,
      dailyRevenueTrend
    };
  }, [activeDataset]);

  // Unique categories list for filters
  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    activeDataset.forEach(item => {
      if (item.Category) list.add(item.Category);
    });
    return ["All", ...Array.from(list)];
  }, [activeDataset]);

  // ==============================================================================
  // SEARCH, FILTER, AND PAGINATION
  // ==============================================================================
  const filteredRecords = useMemo(() => {
    return activeDataset.filter(item => {
      const matchesCategory = selectedCategory === "All" || item.Category === selectedCategory;
      const cleanQuery = searchQuery.trim().toLowerCase();
      if (!cleanQuery) return matchesCategory;

      const matchesSearch = Object.entries(item).some(([key, val]) => {
        if (key === "id") return false;
        return String(val).toLowerCase().includes(cleanQuery);
      });
      return matchesCategory && matchesSearch;
    });
  }, [activeDataset, searchQuery, selectedCategory]);

  const paginatedRecords = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;

  // Chart Formatting Helpers
  const categoryChartData = useMemo(() => {
    return Object.entries(summaryMetrics.categoryDistribution).map(([category, stats]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: stats.revenue,
      volume: stats.quantity,
      share: stats.share
    }));
  }, [summaryMetrics]);

  const handleExportCSV = () => {
    const rows = activeDataset.map(({ id, ...rest }) => ({
      Date: rest.Date,
      Category: rest.Category,
      Price: rest.Price,
      Quantity: rest.Quantity,
      Total_Revenue: rest.Total_Revenue
    }));

    const csvHeaders = "Date,Category,Price,Quantity,Total_Revenue\n";
    const csvContent = csvHeaders + rows.map(r => `"${r.Date}","${r.Category}",${r.Price},${r.Quantity},${r.Total_Revenue}`).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `swift_mart_enterprise_${uploadedFileName || "aligned_dataset"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CHART_COLORS = ["#0284c7", "#4f46e5", "#0d9488", "#b45309", "#db2777", "#4b5563"];

  return (
    <div className="min-h-screen pb-16 flex flex-col font-sans bg-slate-50/50" id="app_root">
      
      {/* ENTERPRISE LOGISTICS HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex flex-wrap justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-950/10">
            <BarChart3 className="w-5.5 h-5.5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Swift-Mart BI Dashboard
              <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">
                Enterprise v2.0
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Real-Time Messy Schema Alignment & Strategic Business intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 mt-3 sm:mt-0">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100/80 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-700">
            <span className={`w-2 h-2 rounded-full ${activeSource === "mock" ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`}></span>
            <span>Dataset: {activeSource === "mock" ? "Failsafe Backup Simulator" : "Production Ingest"}</span>
          </div>
          {activeSource === "uploaded" && (
            <button
              onClick={resetUploadedData}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
              title="Reset file pipeline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Stream</span>
            </button>
          )}
        </div>
      </header>

      {/* DETECTED ERROR BAR */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-50 border-b border-rose-200/80 px-6 py-3 text-xs font-semibold text-rose-800 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 underline text-[10px]">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ==============================================================================
              LEFT COLUMN: DATA CONTROL STATION & SCHEMA ALIGNER
              ============================================================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* SOURCE SELECTOR & FILE INGEST */}
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-slate-700" />
                  <h2 className="font-bold text-slate-800 text-xs tracking-wider uppercase">Ingest Operations Control</h2>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Ingestion Mode</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveSource("mock")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                        activeSource === "mock" 
                          ? "bg-white text-slate-800 shadow-sm" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5 text-slate-500" />
                      <span>Backup Mock</span>
                    </button>
                    <button
                      onClick={() => {
                        if (rawUploadedData.length > 0) {
                          setActiveSource("uploaded");
                        } else {
                          triggerFileInput();
                        }
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                        activeSource === "uploaded" 
                          ? "bg-white text-slate-800 shadow-sm" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{rawUploadedData.length > 0 ? "Uploaded Data" : "Upload File"}</span>
                    </button>
                  </div>
                </div>

                {/* SYNTHETIC ADJUSTMENTS */}
                {activeSource === "mock" && (
                  <div className="space-y-4 pt-1">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-semibold text-slate-600">Mock Data Density</label>
                        <span className="text-[11px] font-bold text-slate-900">{mockCount} Records</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="300" 
                        step="10"
                        value={mockCount} 
                        onChange={(e) => setMockCount(parseInt(e.target.value))}
                        className="w-full accent-slate-900 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* FILE DRAG INGEST AREA */}
                <div className="pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Ingest Messy File (Stripe, Shopify, ERP)</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden ${
                      dragActive 
                        ? "border-slate-800 bg-slate-50" 
                        : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/40"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {isParsing ? (
                      <div className="space-y-2 py-4">
                        <Loader2 className="w-8 h-8 text-slate-900 animate-spin mx-auto" />
                        <p className="text-xs font-semibold text-slate-600">Parsing complex dataset...</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-slate-100 rounded-2xl text-slate-700 mb-2.5">
                          <FileSpreadsheet className="w-5 h-5 text-slate-900" />
                        </div>
                        {uploadedFileName ? (
                          <div className="px-2">
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">{uploadedFileName}</p>
                            <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> File Ingested Successfully
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-bold text-slate-800">Drag & drop raw CSV / JSON</p>
                            <p className="text-[10px] text-slate-400 mt-1">Cleans missing columns and synthesizes missing headers</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE SCHEMA MAPPING COORDINATOR */}
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                  <h2 className="font-bold text-slate-800 text-xs tracking-wider uppercase">ETL Schema Alignment Map</h2>
                </div>
                {isAligning && <Loader2 className="w-3.5 h-3.5 text-slate-900 animate-spin" />}
              </div>

              <div className="p-5 space-y-4">
                {activeSource === "mock" ? (
                  <div className="py-4 text-center">
                    <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                      Backup simulator utilizes pre-aligned schema structures. Ingest your custom file to override settings dynamically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Gemini Rationale Alert */}
                    {mappingRationale && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 bg-slate-900 text-white rounded-xl text-[11px] leading-relaxed relative overflow-hidden"
                      >
                        <div className="flex items-center space-x-1.5 mb-1.5 font-bold text-sky-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Ingestion Rationale ({alignmentMethod})</span>
                        </div>
                        <p className="text-slate-300 font-medium">{mappingRationale}</p>
                        {headersAreSynthesized && (
                          <div className="mt-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] px-2 py-0.5 rounded font-bold">
                            ⚠️ System detected missing headers. Automatically synthesized!
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* SELECT MENUS */}
                    <div className="space-y-3">
                      {[
                        { key: "Date", label: "Transaction Date", desc: "YYYY-MM-DD or standard time", dot: "bg-amber-500" },
                        { key: "Category", label: "Product/Item Category", desc: "Text value for grouping", dot: "bg-emerald-500" },
                        { key: "Price", label: "Item Unit Price", desc: "Decimal price value", dot: "bg-sky-500" },
                        { key: "Quantity", label: "Transaction Quantity", desc: "Integer value", dot: "bg-indigo-500" },
                        { key: "Total_Revenue", label: "Total Revenue Line", desc: "Calculated subtotal", dot: "bg-rose-500", canAuto: true }
                      ].map((field) => (
                        <div key={field.key} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${field.dot}`}></span>
                              {field.label}
                            </label>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wide font-semibold">{field.desc}</span>
                          </div>
                          <select
                            value={columnMapping[field.key as keyof ColumnMapping] || ""}
                            onChange={(e) => handleMappingChange(field.key as keyof ColumnMapping, e.target.value)}
                            disabled={isCleaning}
                            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 font-semibold outline-none focus:border-slate-800 focus:bg-white disabled:opacity-50 transition-all cursor-pointer"
                          >
                            {field.canAuto && <option value="">Auto-Calculate (Price * Qty)</option>}
                            {!field.canAuto && <option value="">-- Ignore / Unmapped Column --</option>}
                            {rawHeaders.map((header) => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==============================================================================
              RIGHT COLUMN: FINANCE CHARTS & AUDITS & CONSULTING REPORTS
              ============================================================================== */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* KPI HEADLINES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Total revenue */}
              <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                  <Coins className="w-4.5 h-4.5 text-sky-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Aggregate Revenue</span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  ${summaryMetrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <div className="mt-3.5 flex items-center space-x-1.5 text-[10px] font-semibold text-slate-500">
                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> Normalised
                  </span>
                  <span>Auto-net compliant</span>
                </div>
              </div>

              {/* Average Order Size */}
              <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                  <Layers className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Average Order Value (AOV)</span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  ${summaryMetrics.avgOrderValue.toFixed(2)}
                </h3>
                <div className="mt-3.5 flex items-center space-x-1.5 text-[10px] font-semibold text-slate-500">
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    Mean Formula
                  </span>
                  <span>Across orders</span>
                </div>
              </div>

              {/* Transactions count */}
              <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm relative overflow-hidden">
                <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Processed Stream Logs</span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {summaryMetrics.totalTransactions.toLocaleString()}
                </h3>
                <div className="mt-3.5 flex items-center space-x-1.5 text-[10px] font-semibold text-slate-500">
                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                    100% Integrity
                  </span>
                  <span>Cleaned & Validated</span>
                </div>
              </div>
            </div>

            {/* DYNAMIC METRIC INSIGHT CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* REVENUE TIMELINE */}
              <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Revenue Sales Trend</h3>
                    <p className="text-[10px] text-slate-400">Chronological pipeline transactions path</p>
                  </div>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div className="h-44 w-full">
                  {summaryMetrics.dailyRevenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={summaryMetrics.dailyRevenueTrend} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="chartRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 9, fill: "#64748b" }} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 9, fill: "#64748b" }} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip 
                          contentStyle={{ fontSize: 10, background: "#0f172a", border: "none", borderRadius: 8, color: "#fff" }} 
                          formatter={(value) => [`$${value}`, "Sales"]}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#chartRevenueGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No chronological data parsed</div>
                  )}
                </div>
              </div>

              {/* REVENUE BY CATEGORIES */}
              <div className="bg-white rounded-2xl p-5 border border-slate-150 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Category Ingestion Share</h3>
                    <p className="text-[10px] text-slate-400">Total gross revenue split</p>
                  </div>
                  <Layers2 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="h-44 w-full flex items-center justify-between">
                  {categoryChartData.length > 0 ? (
                    <>
                      <div className="h-full w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {categoryChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ fontSize: 10, background: "#0f172a", border: "none", borderRadius: 8, color: "#fff" }}
                              formatter={(value) => [`$${value}`, "Revenue"]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-1/2 space-y-1.5 pl-2 overflow-y-auto max-h-[150px] scrollbar-thin">
                        {categoryChartData.map((item, idx) => (
                          <div key={item.name} className="flex items-start justify-between text-[11px]">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                              <span className="text-slate-600 font-semibold truncate capitalize">{item.name}</span>
                            </div>
                            <span className="text-slate-900 font-bold ml-2 text-right shrink-0">
                              ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">No metrics data parsed</div>
                  )}
                </div>
              </div>
            </div>

            {/* AUTOMATED DATA HEALING & COMPLIANCE AUDIT PANEL */}
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-slate-800" />
                  <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase">Messy Data Validation & Compliance Audit</h3>
                </div>
                <span className="text-[10px] bg-slate-950 text-sky-400 font-bold px-2 py-0.5 rounded uppercase">Ingestion Engine Logs</span>
              </div>

              <div className="p-5 space-y-4">
                {qualityReport ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: "Prices Imputed", count: qualityReport.imputedValuesCount.Price, status: "Price" },
                        { label: "Quantities Imputed", count: qualityReport.imputedValuesCount.Quantity, status: "Quantity" },
                        { label: "Categories Imputed", count: qualityReport.imputedValuesCount.Category, status: "Category" },
                        { label: "Dates Normalised", count: qualityReport.imputedValuesCount.Date, status: "Date" },
                        { label: "Revenue Synthesized", count: qualityReport.imputedValuesCount.Total_Revenue, status: "Revenue" }
                      ].map((item) => (
                        <div key={item.label} className="p-3 border rounded-xl bg-slate-50/50 border-slate-150 text-center relative overflow-hidden">
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 leading-none">{item.label}</div>
                          <div className={`text-sm font-bold leading-none ${item.count > 0 ? "text-amber-600" : "text-slate-800"}`}>
                            {item.count > 0 ? `+${item.count}` : "0"}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Flags & anomalies list */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Anomalies & Compliance Flags</div>
                      {qualityReport.anomaliesDetected.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto border border-amber-100 bg-amber-50/40 rounded-xl p-3 scrollbar-thin">
                          {qualityReport.anomaliesDetected.map((anomaly, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[10.5px] text-amber-900 leading-relaxed font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span>{anomaly}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 border border-emerald-100 bg-emerald-50/30 rounded-xl flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="text-[11px] text-emerald-800 font-medium">
                            <strong>Zero data schema violations detected.</strong> All prices, dates, quantities, and revenue values aligned perfectly with compliant database rules.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Ingest a file or active mock dataset to observe live healing logs.</p>
                )}
              </div>
            </div>

            {/* AI STRATEGIC EXECUTIVE REPORT BOARD */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl"></div>
              
              <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-sky-400" />
                    AI Strategic Advisory Report
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Principal-level management consulting insights Powered by Gemini AI</p>
                </div>
                
                <button
                  onClick={handleRequestAIReport}
                  disabled={isAnalyzing || cleanedRecords.length === 0}
                  className="bg-white text-slate-900 hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg border border-slate-200"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Strategy...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-3.5 h-3.5 text-sky-500" />
                      <span>Generate Executive Summary</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-5">
                <AnimatePresence mode="wait">
                  {aiReport ? (
                    <motion.div
                      key="report_content"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Executive summary block */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Executive Overview</div>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                          {aiReport.executiveSummary}
                        </p>
                      </div>

                      {/* Split blocks */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        {/* Key Insights */}
                        <div className="space-y-2.5">
                          <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Strategic Performance Insights</div>
                          <div className="space-y-2">
                            {aiReport.keyInsights.map((insight, idx) => (
                              <div key={idx} className="flex gap-2 text-xs text-slate-300 bg-slate-950/20 p-2.5 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-all font-medium">
                                <ChevronRight className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                                <span>{insight}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Product / Inventory Recs */}
                        <div className="space-y-2.5">
                          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-sans">Productivity & Operational Actions</div>
                          <div className="space-y-2">
                            {aiReport.productRecommendations.map((rec, idx) => (
                              <div key={idx} className="flex gap-2 text-xs text-slate-300 bg-slate-950/20 p-2.5 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-all font-medium">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Revenue compliance report */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Audit Security & Revenue Compliance Check</div>
                        <p className="text-[11.5px] text-slate-300 leading-relaxed font-medium bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                          {aiReport.revenueAnomalyReport}
                        </p>
                      </div>

                    </motion.div>
                  ) : (
                    <motion.div
                      key="report_placeholder"
                      className="text-center py-8 text-slate-500 text-xs font-semibold max-w-sm mx-auto space-y-3"
                    >
                      <BrainCircuit className="w-9.5 h-9.5 text-slate-700 mx-auto" />
                      <p className="leading-relaxed">
                        Executive decision boards remain uncompiled. Select "Generate Executive Summary" to request immediate financial diagnoses.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* REAL-TIME PREVIEW DATA GRID TABLE */}
            <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div>
                  <h2 className="font-bold text-slate-800 text-xs tracking-wider uppercase">Aligned Transactional Records Inspector</h2>
                  <p className="text-[10px] text-slate-400">Total matched transactions in filter: {filteredRecords.length}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-slate-800 cursor-pointer min-w-[120px]"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === "All" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>

                  {/* Search query input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search record content..."
                      value={searchQuery === " " ? "" : searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value || " ");
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 font-semibold outline-none focus:border-slate-800 w-full sm:w-[170px]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Export Trigger */}
                  <button
                    onClick={handleExportCSV}
                    disabled={activeDataset.length === 0}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-slate-950/5 cursor-pointer"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Export Aligned</span>
                  </button>
                </div>
              </div>

              {/* TABLE COMPONENT */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Transaction Date</th>
                      <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Category Mapped</th>
                      <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 text-right">Unit Price</th>
                      <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 text-center">Qty</th>
                      <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 text-right">Standard Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paginatedRecords.length > 0 ? (
                      paginatedRecords.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3 text-slate-500 font-mono font-medium">{item.Date}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 capitalize border border-slate-200/50">
                              {item.Category}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-900 font-semibold text-right">${item.Price.toFixed(2)}</td>
                          <td className="px-6 py-3 text-slate-500 text-center font-semibold">{item.Quantity}</td>
                          <td className="px-6 py-3 text-slate-950 font-bold text-right">${item.Total_Revenue.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-semibold">
                          No matching normalized transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION PANEL */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-medium">
                    Showing <span className="font-bold text-slate-700">{Math.min(filteredRecords.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{" "}
                    <span className="font-bold text-slate-700">{Math.min(filteredRecords.length, currentPage * itemsPerPage)}</span> of{" "}
                    <span className="font-bold text-slate-700">{filteredRecords.length}</span> entries
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Prev
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          currentPage === i + 1
                            ? "bg-slate-900 text-white shadow-md shadow-slate-950/10 border border-slate-950"
                            : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
