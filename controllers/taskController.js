const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// FIX FOR INDEX: Changed 'User' to 'user'
exports.index = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized: Missing user ID" });
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        user: { // <--- Corrected to lowercase 'user'
          select: {
            name: true,
            email: true
          }
        }
      },
      skip: 0,
      take: 10,
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({ tasks });
  } catch (error) {
    next(error);
  }
};

// FIX FOR CREATE: Added a safety check for req.user
exports.create = async (req, res, next) => {
  try {
    // Safety check to prevent "Cannot read properties of undefined (reading 'id')"
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Assuming your Joi validation runs here...
    // const { error, value } = taskSchema.validate(req.body);
    // if (error) return next(error);

    const value = req.body; // fallback if validation occurs in middleware

    const newTask = await prisma.task.create({
      data: {
        ...value,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
      }
    });

    return res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
};

// FIX FOR SHOW: Changed 'User' to 'user'
exports.show = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const task = await prisma.task.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        createdAt: true,
        priority: true,
        userId: true,
        user: { // <--- Corrected to lowercase 'user'
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!task || task.userId !== req.user.id) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};