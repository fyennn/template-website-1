import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";

import apiRouter from "./routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", apiRouter);

export default app;
