const prisma = require("../db/prisma");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().max(255).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(6).required(),
});

exports.register = async (req, res, next) => {
  try {
    const { error, value } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const hashedPassword = await bcrypt.hash(value.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: value.email,
          name: value.name,
          hashedPassword: hashedPassword,
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });

      const welcomeTaskData = [
        { title: "Complete your profile", userId: newUser.id, priority: "medium" },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];

      await tx.task.createMany({ data: welcomeTaskData });

      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: { id: true, title: true, isCompleted: true, userId: true, priority: true },
      });

      return { user: newUser, welcomeTasks };
    });

    global.user_id = result.user.id;

    res.status(201).json({
      name: result.user.name,
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email already registered" });
    }
    next(err);
  }
};

exports.logon = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    global.user_id = user.id;

    res.status(200).json({ 
      message: "Logon successful", 
      name: user.name, 
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (err) {
    next(err);
  }
};

exports.logoff = async (req, res, next) => {
  global.user_id = null;
  res.status(200).json({ message: "Logged off successfully" });
};