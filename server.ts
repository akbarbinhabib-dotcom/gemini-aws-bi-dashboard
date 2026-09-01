import express, { Request, Response } from "express";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import http from "http";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const PYTHON_PORT = 8000;

let pythonProcess: ChildProcess | null = null;

function startPythonBackend() {
  console.log(`[Backend] Starting Python FastAPI backend on port ${PYTHON_PORT}...`);
  
  pythonProcess = spawn(
    "python3",
    ["-m", "uvicorn", "server:app", "--port", String(PYTHON_PORT), "--host", "127.0.0.1"],
    {
      env: { ...process.env, PYTHONUNBUFFERED: "1" }
    }
  );

  pythonProcess.stdout?.on("data", (data) => {
    process.stdout.write(`[Python] ${data}`);
  });

  pythonProcess.stderr?.on("data", (data) => {
    process.stderr.write(`[Python Error] ${data}`);
  });

  pythonProcess.on("exit", (code, signal) => {
    console.log(`[Python] Process exited with code ${code} and signal ${signal}`);
  });
}

// Start Python FastAPI backend service
startPythonBackend();

// Proxy API requests to Python FastAPI service on port 8000
// Placed BEFORE body parsers to preserve the streaming payload for multipart/form-data and JSON
app.use("/api", (req: Request, res: Response) => {
  const options: http.RequestOptions = {
    hostname: "127.0.0.1",
    port: PYTHON_PORT,
    path: `/api${req.url}`,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${PYTHON_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("[Proxy Error]", err.message);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: "FastAPI Backend is initializing or offline. Please retry in a few seconds.",
        details: err.message
      });
    }
  });

  req.pipe(proxyReq, { end: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise BI App Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup error:", err);
});
