const express = require("express");
const app = express();

app.use ((req, res, next) => {
    console.log (`Method: ${req.method}, Path: ${req.path}, Query:`, req.query);
    next();
});

const notFound = require ("./middleware/not-found");
const errorHandler = require ("./middleware/error-handler");

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/testpost", (req, res) => {
    res.json({message: "POST request received successfully!"});
});

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );

server.on('error',(err) => {
    if(err.code === 'EADDRINUSE'){
        console.error(`Port ${port} is already in use.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0){
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log ('Shutting down gracefully...');
    try {
        await new Promise(resolve => server.close(resolve));
        console.log('HTTP sever closed.');
    } catch(err){
        console.error('Error during shutdown:', err);
        code = 1;
    } finally {
        console.log('Exiciting process...');
        process.exit(code);
    }
}

process.on ('SIGINT', () => shutdown(0));
process.on ('SIGTERM', () => shutdown(0));
process.on ('uncaughtException',(err)=>{
    console.error('uncaught exeception:', err);
    shutdown(1);
});

process.on('unhandledRejection',(reason) => {
    console.error('Unhandled rejection:', reason);
    shutdown(1);
});

module.exports = { app, server} ;