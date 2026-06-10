const prisma = require("../db/prisma");

const getUserId = (req) => {
  if (req.user && req.user.id) return req.user.id;
  if (global.user_id) return global.user_id;
  return null;
};

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    const targetedUserId = req.params.id ? parseInt(req.params.id) : userId;

    const userExists = await prisma.user.findUnique({
      where: { id: targetedUserId }
    });

    if (!userExists) {
      return res.status(404).json({ message: "The user was not found." });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const taskStats = await prisma.task.groupBy({
      by: ['isCompleted'],
      where: { userId: targetedUserId },
      _count: { id: true }
    });

    const recentTasks = await prisma.task.findMany({
      where: { userId: targetedUserId },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    const weeklyTasksGrouped = await prisma.task.groupBy({
      by: ['createdAt'],
      where: {
        userId: targetedUserId,
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

    const userId = getUserId(req);
    let results;

    try {
      results = await prisma.$queryRawUnsafe(
        `SELECT t.id, t.title, t.priority, t."isCompleted", u.name AS user_name 
         FROM "Task" t 
         INNER JOIN "User" u ON t."userId" = u.id 
         WHERE t."userId" = $1 AND t.title ILIKE $2`,
        userId,
        `%${q}%`
      );
    } catch (sqlError) {
      const fallbackData = await prisma.task.findMany({
        where: {
          userId: userId,
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