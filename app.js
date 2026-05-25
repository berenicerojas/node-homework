const express = require("express");
const prisma = require("./db/prisma");
const userRouter = require("./routers/userRoutes");
const taskRouter = require("./routers/taskRoutes");
const analyticsRouter = require("./routers/analyticsRoutes");
const authMiddleware = require("./middleware/auth");

const app = express();
app.use(express.json());

global.user_id = null;

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: "UP", database: "CONNECTED" });
  } catch (err) {
    return res.status(500).json({ status: "DOWN", error: err.message });
  }
});

app.use("/api/users", userRouter);
app.use("/api/tasks", authMiddleware, taskRouter);
app.use("/api/analytics", authMiddleware, analyticsRouter);

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

module.exports = app;