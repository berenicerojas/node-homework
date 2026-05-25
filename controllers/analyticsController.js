const prisma = require("../db/prisma");

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id) || global.user_id;

    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      return res.status(404).json({ message: "The user was not found." });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const taskStats = await prisma.task.groupBy({
      by: ['isCompleted'],
      where: { userId: userId },
      _count: { id: true }
    });

    const recentTasks = await prisma.task.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    const weeklyTasksGrouped = await prisma.task.groupBy({
      by: ['createdAt'],
      where: {
        userId: userId,
        createdAt: {
          gte: oneWeekAgo
        }
      },
      _count: { id: true }
    });

    res.status(200).json({
      taskStats: taskStats || [],
      recentTasks: recentTasks || [],
      weeklyProgress: weeklyTasksGrouped || []
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsersWithStats = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const dbUsers = await prisma.user.findMany({
      skip: skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: { tasks: true }
        }
      }
    });

    const users = dbUsers.map(user => {
      if (user._count) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          _count: {
            Task: user._count.tasks
          }
        };
      }
      return user;
    });

    const totalUsers = await prisma.user.count();

    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
        hasNext: page * limit < totalUsers, 
        hasPrev: page > 1                   
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.searchTasks = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) {
      return res.status(400).json({ error: "Search query must be at least 3 characters long" });
    }

    let results;
    try {
      results = await prisma.$queryRawUnsafe(
        `SELECT t.id, t.title, t.priority, t."isCompleted", u.name AS user_name 
         FROM "Task" t 
         INNER JOIN "User" u ON t."userId" = u.id 
         WHERE t."userId" = $1 AND t.title ILIKE $2`,
        global.user_id,
        `%${q}%`
      );
    } catch (sqlError) {
      const fallbackData = await prisma.task.findMany({
        where: {
          userId: global.user_id,
          title: { contains: q, mode: 'insensitive' }
        },
        include: {
          user: { select: { name: true } }
        }
      });
      
      results = fallbackData.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        isCompleted: t.isCompleted,
        user_name: t.user?.name || null
      }));
    }

    res.status(200).json({
      results: results || [],
      query: q,
      count: results ? results.length : 0
    });
  } catch (err) {
    next(err);
  }
};