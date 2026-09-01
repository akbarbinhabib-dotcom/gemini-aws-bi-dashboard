# 📊 Swift-Mart: Enterprise Zero-Prep BI Dashboard & ETL Pipeline

An enterprise-grade Business Intelligence (BI) portal built with **Streamlit** and **Pandas** that solves a major real-world corporate problem: **Data Ingestion Friction**. 

This portal features an **Automated Schema Alignment Layer** that allows non-technical store managers to drag-and-drop raw Shopify/WooCommerce CSV exports directly without any manual column cleaning or renaming.

---

## 🚀 Key Architectural Features

### 1. Zero-Prep Data Ingestion & Sanitization
* **Automatic Header Normalization:** Converts chaotic raw columns (`  Unit Price  `, `Product line  `) into a clean standardized `snake_case` database schema on-the-fly.
* **Structural Schema Alignment Layer:** Translates dirty source columns directly into program standards (`Price`, `Category`, `Total_Revenue`) using a crash-proof mapping engine.
* **Dynamic Calculations Safety Net:** Recalculates total revenues automatically if the source file is missing calculations, preventing downstream execution crashes.

### 2. Live Executive Performance KPIs
* **Real-time Metrics:** Displays dynamic cards for **Total Sales Revenue**, **Average Unit Price**, and **Total Transactions**.
* **Failsafe Executions:** Handled memory management and explicit column type-coercion blocks to prevent `KeyError` or run-time script crashes during complex aggregation queries.

---

## 🛠️ Tech Stack & Concepts
* **Frontend:** Streamlit Web Engine (Wide responsive layout, custom CSS cards)
* **Data Engineering:** Pandas & NumPy (Advanced cleaning, median imputations, boundary clipping)
* **Design Philosophy:** Separation of Concerns (Backend ETL logic decoupled from UI display)

## 🌐 Live Demo
👉 **[Launch the Live BI Dashboard](https://bi-dashboard-app-u5xwiuq4i42suscngjnsh7.streamlit.app/)**

> 💡 **Note:** If the application is sleeping, please click **"Wake up"** to spin up the Streamlit container instantly.   
