const prisma = require("../db/prisma");
const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().max(255).required(),
  isCompleted: Joi.boolean().default(false),
  priority: Joi.string().valid("low", "medium", "high").default("medium"),
});

const getUserId = (req) => {
  if (req.user && req.user.id) return req.user.id;
  if (global.user_id) return global.user_id;
  return null;
};

exports.index = async (req, res, next) => {
  try {
    const currentUserId = getUserId(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const whereClause = { userId: currentUserId };
    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: "insensitive",
      };
    }

    const validSortFields = ["title", "priority", "createdAt", "id", "isCompleted"];
    const sortBy = req.query.sortBy || "createdAt";
    const sortDirection = req.query.sortDirection === "asc" ? "asc" : "desc";
    const orderBy = validSortFields.includes(sortBy) ? { [sortBy]: sortDirection } : { createdAt: "desc" };

    const dbTasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: orderBy,
    });

    const tasks = dbTasks.map(task => {
      const { user, ...rest } = task;
      return { ...rest, User: user };
    });

    const totalTasks = await prisma.task.count({ where: whereClause });
    const pages = Math.ceil(totalTasks / limit);

    const pagination = {
      page,
      limit,
      total: totalTasks,
      pages,
      hasNext: page * limit < totalTasks,
      hasPrev: page > 1,
    };

    res.status(200).json({ tasks, pagination });
  } catch (err) {
    next(err);
  }
};

exports.bulkCreate = async (req, res, next) => {
  try {
    const currentUserId = getUserId(req);
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Invalid request data. Expected an array of tasks." });
    }

    const validTasks = [];
    for (const task of tasks) {
      const { error, value } = taskSchema.validate(task);
      if (error) {
        return res.status(400).json({ error: "Validation failed", details: error.details });
      }
      validTasks.push({
        title: value.title,
        isCompleted: value.isCompleted || false,
        priority: value.priority || "medium",
        userId: currentUserId,
      });
    }

    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const currentUserId = getUserId(req);
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: currentUserId,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: "The task was not found." });
    }

    const { user, ...rest } = task;
    res.status(200).json({ ...rest, User: user });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const currentUserId = getUserId(req);
    const { error, value } = taskSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        priority: value.priority,
        userId: currentUserId,
      },
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const currentUserId = getUserId(req);
    const updateSchema = taskSchema.fork(Object.keys(taskSchema.describe().keys), (schema) => schema.optional());
    
    const { error, value } = updateSchema.validate(req.body, { allowUnknown: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const existingTask = await prisma.task.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: currentUserId,
      }
    });

    if (!existingTask) {
      return res.status(404).json({ message: "The task was not found." });
    }

    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: value,
      include: {
        user: { select: { name: true, email: true } }
      },
    });

    const { user, ...rest } = task;
    res.status(200).json({ ...rest, User: user });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const currentUserId = getUserId(req);
    const existingTask = await prisma.task.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: currentUserId,
      }
    });

    if (!existingTask) {
      return res.status(404).json({ message: "The task was not found." });
    }

    await prisma.task.delete({
      where: { id: parseInt(req.params.id) },
    });
    
    res.status(200).json({ message: "The task has been deleted." }); 
  } catch (err) {
    next(err);
  }
};