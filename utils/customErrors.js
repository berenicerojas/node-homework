class ValidationError extends Error {
    constructor(message){
        super(message);
        this.name = "ValidationError";
        this.statusCode = 400;
    }
}

class NotFoundError extends Error {
    constructor(message){
        super(message);
        this.name = "NotFoundError";
        this.statusCode = 401;
    }
}

module.exports = {ValidationError, NotFoundError};