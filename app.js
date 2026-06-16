const express = require("express");
const prisma = require("./db/prisma");
const userRouter = require("./routers/userRoutes");
const taskRouter = require("./routers/taskRoutes");
const analyticsRouter = require("./routers/analyticsRoutes");

const cors = require("cors");
const app = express();

app.set("trust proxy", 1);
const rateLimiter = require("express-rate-limit");
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
  }),
);

const helmet = require("helmet");
app.use(helmet());

app.use(cors({ 
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'], 
  credentials: true, 
  methods: 'GET,POST,PATCH,DELETE', 
  allowedHeaders: 'CONTENT-TYPE, X-CSRF-TOKEN' 
}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(express.json({ limit: "1mb" }));

const { xss } = require("express-xss-sanitizer");
app.use(xss());

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: "UP", database: "CONNECTED" });
  } catch (err) {
    return res.status(500).json({ status: "DOWN", error: err.message });
  }
});

app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/analytics", analyticsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ 
    error: status === 500 ? "Internal Server Error" : undefined, 
    message: err.message 
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const gracefulShutdown = async () => {
  console.log("Shutting down cleanly, disconnecting Prisma...");
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = { app, server };