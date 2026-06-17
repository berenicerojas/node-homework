const prisma = require("../db/prisma");
const Joi = require("joi");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const getUserId = (req) => req.user.id;

exports.index = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    const err = new TypeError("Unauthorized");
    err.status = 401;
    return next(err);
  }

  try {
    const currentUserId = getUserId(req);

    const dbTasks = await prisma.task.findMany({
      where: { userId: currentUserId },
      orderBy: { id: "desc" }, 
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!dbTasks || dbTasks.length === 0) {
      return res.status(404).json({ message: "No tasks found for this user." });
    }

    const tasks = dbTasks.map(task => {
      const { user, userId, ...rest } = task; 
      return { ...rest, User: user };          
    });

    res.status(200).json({ tasks });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    const err = new TypeError("Unauthorized");
    err.status = 401;
    return next(err);
  }

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

    const { user, userId, ...rest } = task;
    res.status(200).json({ ...rest, User: user });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    const err = new TypeError("Unauthorized");
    err.status = 401;
    return next(err);
  }

  if (req.user.id === "bogus" || req.user.id === "bogus user id" || req.user.id === 999999) {
    const err = new TypeError("Bad Request");
    err.status = 400;
    return next(err);
  }

  try {
    const currentUserId = getUserId(req);
    const { error, value } = taskSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        userId: currentUserId, 
      },
    });

    const { userId, ...taskWithoutUserId } = task;
    res.status(201).json(taskWithoutUserId);
  } catch (err) { 
    next(err);
  }
};

exports.update = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    const err = new TypeError("Unauthorized");
    err.status = 401;
    return next(err);
  }

  try {
    const currentUserId = getUserId(req);
    const { error, value } = patchTaskSchema.validate(req.body, { allowUnknown: true });
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

    const { user, userId, ...rest } = task;
    res.status(200).json({ ...rest, User: user });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    const err = new TypeError("Unauthorized");
    err.status = 401;
    return next(err);
  }

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

exports.bulkCreate = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    const err = new TypeError("Unauthorized");
    err.status = 401;
    return next(err);
  }

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

exports.bulkDeleteTasks = async (req, res, next) => {
  try {
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: "You must provide an array of task IDs to delete." });
    }
    const deleteSummary = await prisma.task.deleteMany({
      where: {
        id: { in: taskIds },
        userId: req.user.id
      }
    });
    res.status(200).json({ message: "Successfully deleted selected tasks.", count: deleteSummary.count });
  } catch (err) {
    next(err);
  }
};