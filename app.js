global.user_id = null;
global.users = [];
global.tasks = [];

const express = require("express");
const app = express();

app.use(express.json({ limit : "1kb"}));

const userRouter = require ("./routes/userRoutes");
app.use("/api/users", userRouter);

app.use((req, res) => {
    res.status(404).json({ message : "Route not found"});
});

if (process.env.NODE_ENV !== 'test'){
    app.listen(3000, () => console.log("Main App Listening on port 3000"));
}

module.exports = app;