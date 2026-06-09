const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().required(),
  isCompleted: Joi.boolean().default(false),
  priority: Joi.string().optional()
});

const patchTaskSchema = Joi.object({
  title: Joi.string().optional(),
  isCompleted: Joi.boolean().optional(),
  priority: Joi.string().optional()
});

const validateTask = (data) => {
  return taskSchema.validate(data, { abortEarly: false });
};

const validatePatchTask = (data) => {
  return patchTaskSchema.validate(data, { abortEarly: false });
};

module.exports = {
  taskSchema,
  patchTaskSchema,
  validateTask,
  validatePatchTask
};