const express = require("express");
const app = express();
const {v4 : uuidv4} = require ('uuid');
const path = require ("path");

app.use((req, res, next) => {
    req.requestId = uuidv4();
    res.setHeader('X-Request-Id', req.requestId);
    next();
});

app.use ((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log (`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
    next();
});

app.use ((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use ('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.json({ limit: '1mb'}));

app.use ((req, res, next) => {
    if(req.method === 'POST') {
        const contentType = req.get('Content-Type');
        if (!contentType || !contentType.includes ('application/json')) {
            return res.status(400).json({ 
                error: "Content-Type must be application/json", 
                requestId: req.requestId
            }); 
        } 
    }
    next();
});


app.use("/", require ("./routes/dogs"));

app.get("/error", (req, res, next) => {
    next (new Error ("Internal Server Error"));
});


app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = status === 500 ? "Internal Server Error": err.message;

    if (status >= 500 ){
        console.error (`ERROR: Error ${err.message || message}`);
    } else {
        console.warn(`WARN: ${err.name} ${err.message}`);
    }

    res.status(status).json({
        error : message,
        requestId : req.requestId
    });
});


app.use((req, res, next) =>{
    res.status(404).json({
        error: "Route not found",
        requestId : req.requestId
    });
});

module.exports = app;