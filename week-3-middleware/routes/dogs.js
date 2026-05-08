const express = require("express");
const router = express.Router();
const dogData = require("../dogData");
const { ValidationError, NotFoundError } = require ("../errors");

router.post("/adopt", (req, res, next) => {
    try{
    const { name, email, dogName } = req.body;
    if (!name || !email || !dogName) {
        throw new ValidationError( "Missing required fields" );
    }
    const dog = dogData.find( d => d.name === dogName);
    
    if (!dog || dog.status !== "available") {
        throw new NotFoundError ("Dog not found or not available");
    }

    res.status(201).json({
        message: `Adoption request received. We will contact you at ${email} for further details.`,
        dogName : dog.name
    });
} catch (err){
    next(err);
    }
});

router.get ("/dogs", ( req, res) => {
    res.status(200).json(dogData);
});


module.exports = router;
