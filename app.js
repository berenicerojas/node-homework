const prisma = require("./db/prisma");
const express = require("express");
const pool = require("./db/pg-pool");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routers/taskRoutes");
const userRouter = require("./routers/userRoutes");

console.log("--- STARTUP DEBUG ---");
console.log("userRouter:", userRouter);
console.log("taskRouter:", taskRouter);
console.log("authMiddleware:", typeof authMiddleware);
console.log("--- END STARTUP DEBUG ---");

const app = express();
app.use(express.json());

global.user_id = null;

app.use("/api/users", userRouter); 
app.use("/api/tasks", authMiddleware, taskRouter);

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

app.get("/api/debug-user", (req, res) => {
  res.json({ 
    current_global_user_id: global.user_id,
    type: typeof global.user_id,
    total_tasks_stored: global.tasks ? global.tasks.length : 0,
    all_raw_tasks: global.tasks || []
  });
});

app.use((err, req, res, next) => {
  if (err.name === "PrismaClientInitializationError") {
    console.error("Couldn't connect to the database. Is it running?");
  }

  if (err.code === "ECONNREFUSED" && err.port === 5432) {
    console.log("The database connection was refused. Is your database service running?");
  }
  
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

const shutdown = async () => {
  console.log("Shutting down server...");
  try {
    await pool.end(); 
    await prisma.$disconnect(); 
    console.log("Database connections (Pool & Prisma) closed.");
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is officially running on port ${PORT}!`);
});

module.exports = app;