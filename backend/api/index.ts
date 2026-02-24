import express from "express";
import cors from "cors";
import { createRoutes } from "../src/routes";
import { startSimulator } from "../src/simulator";

const app = express();

app.use(cors());
app.use(express.json());

createRoutes(app);

const clients = new Set<(payload: string) => void>();

app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const send = (payload: string) => {
    res.write(`data: ${payload}\n\n`);
  };

  clients.add(send);
  send(JSON.stringify({ type: "info", data: { ts: Date.now(), msg: "connected" } }));

  req.on("close", () => {
    clients.delete(send);
    res.end();
  });
});

startSimulator((payload) => {
  for (const send of clients) {
    send(payload);
  }
});

export default app;