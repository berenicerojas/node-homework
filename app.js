global.user_id = null;
global.users = [];
global.tasks = [];

const express = require("express");
const app = express();
app.use(express.json());

// Global data stores (as per assignment)
global.users = [];
global.tasks = [];
global.user_id = null;

const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routers/taskRoutes");
const userRouter = require("./routers/userRoutes"); // Your existing user router

app.use("/api/users", userRouter); // Unprotected
app.use("/api/tasks", authMiddleware, taskRouter); // Protected!


module.exports = app;