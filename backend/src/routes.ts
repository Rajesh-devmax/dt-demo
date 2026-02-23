import { Express } from "express";

const assets = [
  { id: "CNC-01", name: "CNC Mill #1", area: "CNC Cell", x: 120, y: 140 },
  { id: "CNC-02", name: "CNC Mill #2", area: "CNC Cell", x: 220, y: 140 },
  { id: "ASM-ROB-01", name: "Assembly Robot", area: "Assembly", x: 420, y: 180 },
  { id: "OVEN-01", name: "Paint Oven", area: "Paint", x: 520, y: 90 },
  { id: "CONV-01", name: "Main Conveyor", area: "Packaging", x: 360, y: 260 },
  { id: "PACK-01", name: "Case Packer", area: "Packaging", x: 520, y: 260 },
];

let workOrders: any[] = [];

export function createRoutes(app: Express) {
  app.get("/api/assets", (_req, res) => res.json(assets));

  app.get("/api/workorders", (_req, res) => res.json(workOrders));

  app.post("/api/workorders", (req, res) => {
    const wo = {
      id: `WO-${String(workOrders.length + 1).padStart(4, "0")}`,
      createdAt: Date.now(),
      status: "OPEN",
      ...req.body,
    };
    workOrders.unshift(wo);
    res.status(201).json(wo);
  });

  app.patch("/api/workorders/:id", (req, res) => {
    const idx = workOrders.findIndex(w => w.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: "Not found" });
    workOrders[idx] = { ...workOrders[idx], ...req.body };
    res.json(workOrders[idx]);
  });
}