const prisma = require("../db/prisma");

const create = async (req, res, next) => {
  const { title } = req.body;
  const isCompletedInput = req.body.isCompleted !== undefined ? req.body.isCompleted : req.body.is_completed;
  const fallbackCompleted = isCompletedInput !== undefined ? isCompletedInput : false;

  try {
    const task = await prisma.task.create({
      data: {
        title: title,
        isCompleted: fallbackCompleted,
        userId: global.user_id, 
      },
    });

    return res.status(201).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      is_completed: task.isCompleted, 
    });
  } catch (err) {
    if (typeof next === "function") return next(err);
    return res.status(500).json({ message: err.message });
  }
};

const index = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: global.user_id },
    });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found" });
    }

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      is_completed: task.isCompleted,
    }));

    return res.status(200).json(formattedTasks);
  } catch (err) {
    if (typeof next === "function") return next(err);
    return res.status(500).json({ message: err.message });
  }
};

const show = async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: global.user_id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "That task was not found" });
    }

    return res.status(200).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      is_completed: task.isCompleted,
    });
  } catch (err) {
    if (typeof next === "function") return next(err);
    return res.status(500).json({ message: err.message });
  }
};

const update = async (req, res, next) => {
  const taskChange = req.body;
  if (!taskChange || Object.keys(taskChange).length === 0) {
    return res.status(400).json({ message: "No updates provided" });
  }

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: global.user_id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "That task was not found" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title: taskChange.title,
        isCompleted: taskChange.isCompleted !== undefined ? taskChange.isCompleted : taskChange.is_completed,
      },
    });

    return res.status(200).json({
      id: updatedTask.id,
      title: updatedTask.title,
      isCompleted: updatedTask.isCompleted,
      is_completed: updatedTask.isCompleted,
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      if (typeof next === "function") return next(err);
      return res.status(500).json({ message: err.message });
    }
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: global.user_id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "That task was not found" });
    }

    await prisma.task.delete({
      where: { id: parseInt(req.params.id) },
    });

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      if (typeof next === "function") return next(err);
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = { create, index, show, update, deleteTask };