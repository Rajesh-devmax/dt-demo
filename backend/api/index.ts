import express from "express";
import cors from "cors";
import { createRoutes } from "../src/routes";

const app = express();

app.use(cors());
app.use(express.json());

createRoutes(app);

export default app;