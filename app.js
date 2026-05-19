const prisma = require("./db/prisma");
const express = require("express");
const taskRouter = require("./routers/taskRoutes");
const userRouter = require("./routers/userRoutes");

const app = express();
app.use(express.json());

global.user_id = null;


app.use("/users", userRouter); 
app.use("/tasks", taskRouter);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

module.exports = app;