import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase config for server-side use
const firebaseConfigPath = path.resolve(__dirname, "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes for OpenClaw data ingestion
  app.post("/api/openclaw/data", async (req, res) => {
    const { type, data } = req.body;
    console.log(`Received ${type} data from OpenClaw:`, data);
    
    try {
      if (type === "trend") {
        // Update or add a trend
        const trendId = `trend_${data.rank}`;
        await setDoc(doc(db, "trends", trendId), {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else if (type === "report") {
        // Add a new report node
        await addDoc(collection(db, "reports"), {
          ...data,
          timestamp: serverTimestamp()
        });
      } else if (type === "agent") {
        // Update agent status
        const agentId = `agent_${data.id}`;
        await setDoc(doc(db, "agents", agentId), {
          ...data,
          lastActive: serverTimestamp()
        });
      } else if (type === "tokenUsage") {
        // Add token usage entry
        await addDoc(collection(db, "tokenUsage"), {
          ...data,
          timestamp: serverTimestamp()
        });
      }
      
      res.json({ status: "ok", message: "Data synchronized to Firestore" });
    } catch (error) {
      console.error("Error writing to Firestore:", error);
      res.status(500).json({ status: "error", message: "Failed to sync to Firestore" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
