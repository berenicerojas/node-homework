const prisma = require("../db/prisma");

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id) || global.user_id;

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

    res.status(200).json({
      taskStats: taskStats || [],
      recentTasks: recentTasks || [],
      weeklyProgress: []
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
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    });

    const users = dbUsers.map(user => {
      if (user._count) {
        return {
          ...user,
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
        pages: Math.ceil(totalUsers / limit)
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
        `SELECT id, title, priority, "isCompleted" FROM "Task" WHERE "userId" = $1 AND title ILIKE $2`,
        global.user_id,
        `%${q}%`
      );
    } catch (sqlError) {
      results = await prisma.task.findMany({
        where: {
          userId: global.user_id,
          title: { contains: q, mode: 'insensitive' }
        },
        select: { id: true, title: true, priority: true, isCompleted: true }
      });
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