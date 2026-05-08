const Joi = require ('joi');

const userSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const taskSchema = Joi.object({
    title: Joi.string().required(),
    isCompleted: Joi.boolean().default(false)
});

const patchTaskSchema = Joi.object({
    title: Joi.string().optional(),
    isCompleted: Joi.boolean().optional()
});

module.exports = {userSchema, taskSchema, patchTaskSchema};