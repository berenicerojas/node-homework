const prisma = require("../db/prisma");

const index = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: global.user_id },
      select: {
        id: true,
        title: true,
        isCompleted: true
      }
    });
    if (!tasks || tasks.length === 0) return res.status(404).json({ message: "No tasks found" });
    return res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { title } = req.body;
    const newTask = await prisma.task.create({
      data: {
        title,
        userId: global.user_id,
        isCompleted: req.body.isCompleted || false
      },

      select: {
        id: true,
        title: true,
        isCompleted: true
      }
    });
    return res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
};

const show = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id: parseInt(req.params.id),
          userId: global.user_id,
        },
      },

      select: {
        id: true,
        title: true,
        isCompleted: true
      }
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    return res.status(200).json(task);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);

    const updatedTask = await prisma.task.update({
      where: { 
        id_userId: {
          id: taskId,
          userId: global.user_id
        }
      },
      data: req.body,
      select: {
        id: true,
        title: true,
        isCompleted: true
      }
    });
    
    return res.status(200).json(updatedTask);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: "Unauthorized or not found" });
    }
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);

    await prisma.task.delete({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id
        }
      },
    });

    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: "Unauthorized or not found" });
    }
    next(err);
  }
};

module.exports = { index, create, show, update, deleteTask };