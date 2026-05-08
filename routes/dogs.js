const express = require ("express");
const router = express.Router();
const {ValidationError} = require ('./utils/customErrors');


router.post ('/adopt',(req, res, next) => {
    const {name, email, dogName} = req.body;

    if (!name || !email || !dogName){
        return next(new ValidationError("Missing required fields: name, email, or dogName"));
    }

    res.status(201).json({
        message: `Adoption request received. We will contact you at ${email} for further details.`,
        dogName
    });
});

module.exports = router;