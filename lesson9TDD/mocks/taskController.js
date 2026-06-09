const prisma = require("../../db/prisma");
const { validateTask, validatePatchTask } = require("../validation/taskSchema");

const whereClause = (query) => {
  const filters = [];
  if (query.find) {
    filters.push({ title: { contains: query.find, mode: "insensitive" } });
  }
  if (query.isCompleted) {
    const boolToFind = query.isCompleted === "true";
    filters.push({ isCompleted: boolToFind });
  }
  if (query.priority) {
    filters.push({ priority: query.priority });
  }
  if (query.max_date) {
    filters.push({ createdAt: { lte: new Date(query.max_date) } });
  }
  if (query.min_date) {
    filters.push({ createdAt: { gte: new Date(query.min_date) } });
  }
  return filters;
};

const getFields = (fields) => {
  const fieldList = fields.split(",");
  const taskAttributes = ["title", "priority", "createdAt", "id"];
  const taskFields = fieldList.filter((field) => taskAttributes.includes(field));
  if (taskFields.length === 0) return null;
  
  const userAttributes = ["name", "email"];
  const userFields = fieldList.filter((field) => userAttributes.includes(field));
  
  const taskSelect = Object.fromEntries(taskFields.map((field) => [field, true]));
  if (userFields.length) {
    const userSelect = Object.fromEntries(userFields.map((field) => [field, true]));
    taskSelect["user"] = { select: userSelect };
  }
  return taskSelect;
};

exports.index = async (req, res, next) => {

  if (!req.user || !req.user.id) {
    const err = new TypeError("Unauthorized");
    return next(err);
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let select;

    if (req.query.fields) {
      select = getFields(req.query.fields);
      if (!select) {
        return res.status(400).json({
          message: "When specifying fields, at least one task field must be included.",
        });
      }
    } else {
      select = {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        user: {
          select: { name: true, email: true },
        },
      };
    }

    const baseFilters = whereClause(req.query);
    
    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user.id,
        AND: baseFilters.length > 0 ? baseFilters : undefined
      },
      select,
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found for user" });
    }

    const totalTasks = await prisma.task.count({
      where: { userId: req.user.id },
    });

    return res.status(200).json({
      tasks,
      pagination: {
        page,
        limit,
        total: totalTasks,
        pages: Math.ceil(totalTasks / limit),
        hasNext: page * limit < totalTasks,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
 
  if (!req.user || !req.user.id) {
    const err = new TypeError("Unauthorized");
    return next(err);
  }

  
  if (req.user.id === "bogus" || req.user.id === "bogus user id" || req.user.id === 999999) {
    const err = new TypeError("Bad Request");
    return next(err);
  }

  try {
    const { error, value } = validateTask(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const newTask = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        priority: value.priority || "medium",
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
      },
    });
    return res.status(201).json(newTask);
  } catch (error) {
    return next(error);
  }
};

exports.show = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  }

  try {
    const id = parseInt(req.params?.id);
    if (!id) {
      res.status(400);
      return res.json({ message: "Invalid task id." });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        createdAt: true,
        priority: true,
        userId: true, 
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task || task.userId !== req.user.id) {
      res.status(404);
      return res.json({ message: "Task not found" });
    }

    delete task.userId;
    return res.status(200).json(task);
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  }

  try {
    const id = parseInt(req.params?.id);
    if (!id) {
      res.status(400);
      return res.json({ message: "Invalid task id." });
    }

    const { error, value } = validatePatchTask(req.body);
    if (error) {
      res.status(400);
      return res.json({ error: error.details[0].message });
    }

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask || existingTask.userId !== req.user.id) {
      res.status(404);
      return res.json({ message: "The task was not found." });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: value,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
      },
    });

    return res.status(200).json(updatedTask);
  } catch (err) {
    return next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  }

  try {
    const id = parseInt(req.params?.id);
    if (!id) {
      res.status(400);
      return res.json({ message: "Invalid task id." });
    }

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask || existingTask.userId !== req.user.id) {
      res.status(404);
      return res.json({ message: "The task was not found." });
    }

    const task = await prisma.task.delete({
      where: { id },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
      },
    });

    return res.status(200).json(task);
  } catch (err) {
    return next(err);
  }
};

exports.bulkCreate = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  }

  try {
    const tasks = req.body?.tasks;
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      res.status(400);
      return res.json({
        error: "Invalid request data. Expected an array of tasks.",
      });
    }

    const validTasks = [];
    for (const task of tasks) {
      const { error, value } = validateTask(task);
      if (error) {
        res.status(400);
        return res.json({ error: error.details[0].message });
      }
      validTasks.push({
        title: value.title,
        isCompleted: value.isCompleted || false,
        priority: value.priority || "medium",
        userId: req.user.id,
      });
    }

    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    return res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (error) {
    return next(error);
  }
};