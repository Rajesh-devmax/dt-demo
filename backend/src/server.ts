import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createRoutes } from "./routes";
import { startSimulator } from "./simulator";

const app = express();
app.use(cors());
app.use(express.json());

createRoutes(app);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

startSimulator(wss);

server.listen(8080, () => {
  console.log("Backend listening on http://localhost:8080");
  console.log("WS on ws://localhost:8080/ws");
});