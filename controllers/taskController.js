const pool = require("../db/pg-pool");

const create = async (req, res, next) => {
  const { title } = req.body;
  const isCompletedInput = req.body.isCompleted !== undefined ? req.body.isCompleted : req.body.is_completed;
  const fallbackCompleted = isCompletedInput !== undefined ? isCompletedInput : false;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, is_completed, user_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, title, is_completed`,
      [title, fallbackCompleted, global.user_id]
    );
    const row = result.rows[0];
    return res.status(201).json({
      id: row.id,
      title: row.title,
      isCompleted: row.is_completed,
      is_completed: row.is_completed
    });
  } catch (err) {
    if (typeof next === "function") return next(err);
    return res.status(500).json({ message: err.message });
  }
};

const index = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
      [global.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No tasks found" });
    }
    const formattedTasks = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      isCompleted: row.is_completed,
      is_completed: row.is_completed
    }));
    return res.status(200).json(formattedTasks);
  } catch (err) {
    if (typeof next === "function") return next(err);
    return res.status(500).json({ message: err.message });
  }
};

const show = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
      [req.params.id, global.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "That task was not found" });
    }
    const row = result.rows[0];
    return res.status(200).json({
      id: row.id,
      title: row.title,
      isCompleted: row.is_completed,
      is_completed: row.is_completed
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
    let keys = Object.keys(taskChange);
    keys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key));
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const idParm = `$${keys.length + 1}`;
    const userParm = `$${keys.length + 2}`;
    const result = await pool.query(
      `UPDATE tasks SET ${setClauses} 
       WHERE id = ${idParm} AND user_id = ${userParm} 
       RETURNING id, title, is_completed`,
      [...Object.values(taskChange), req.params.id, global.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "That task was not found" });
    }
    const row = result.rows[0];
    return res.status(200).json({
      id: row.id,
      title: row.title,
      isCompleted: row.is_completed,
      is_completed: row.is_completed
    });
  } catch (err) {
    if (typeof next === "function") return next(err);
    return res.status(500).json({ message: err.message });
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, global.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "That task was not found" });
    }
    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    if (typeof next === "function") return next(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { create, index, show, update, deleteTask };