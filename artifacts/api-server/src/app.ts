import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "legazpi-market-secret-2025",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  },
}));

app.use("/api", router);
app.use("/uploads", express.static(path.resolve(process.cwd(), "data/uploads")));

export default app;
