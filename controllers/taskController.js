const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

const create = async (req, res) => {
  if (!req.body) req.body = {};
  
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  const userEmail = global.user_id ? global.user_id.email : null;

  const newTask = { 
    ...value, 
    id: taskCounter(), 
    userId: userEmail 
  };
  
  global.tasks.push(newTask);
  
  const { userId, ...sanitizedTask } = newTask;
  res.status(201).json(sanitizedTask);
};

const index = async (req, res) => {
  const userEmail = global.user_id ? global.user_id.email : null;
  
  const userTasks = global.tasks.filter((task) => task.userId === userEmail);
  
  if (userTasks.length === 0) {
    return res.status(404).json({ message: "That task was not found" });
  }

  const sanitizedTasks = userTasks.map((task) => {
    const { userId, ...sanitizedTask } = task;
    return sanitizedTask;
  });
  
  res.status(200).json(sanitizedTasks);
};

const show = async (req, res) => {
  
  const taskToFind = parseInt(req.params ? req.params.id : null);
  
  if (!taskToFind) {
    return res.status(400).json({ message: "The task ID passed is not valid." });
  }

  const userEmail = global.user_id ? global.user_id.email : null;
  const task = global.tasks.find((t) => t.id === taskToFind && t.userId === userEmail);
  
  if (!task) {
    return res.status(404).json({ message: "That task was not found" });
  }
  
  const { userId, ...sanitizedTask } = task;
  res.status(200).json(sanitizedTask);
};

const update = async (req, res) => {
  const taskToFind = parseInt(req.params ? req.params.id : null);
  
  if (!taskToFind) {
    return res.status(400).json({ message: "The task ID passed is not valid." });
  }

  const userEmail = global.user_id ? global.user_id.email : null;
  const task = global.tasks.find((t) => t.id === taskToFind && t.userId === userEmail);
  
  if (!task) {
    return res.status(404).json({ message: "That task was not found" });
  }

  const { error, value } = patchTaskSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  Object.assign(task, value);
  
  const { userId, ...sanitizedTask } = task;
  res.status(200).json(sanitizedTask);
};

const deleteTask = async (req, res) => {
  const taskToFind = parseInt(req.params ? req.params.id : null);
  
  if (!taskToFind) {
    return res.status(400).json({ message: "The task ID passed is not valid." });
  }

  const userEmail = global.user_id ? global.user_id.email : null;
  const taskIndex = global.tasks.findIndex((t) => t.id === taskToFind && t.userId === userEmail);

  if (taskIndex === -1) {
    return res.status(404).json({ message: "That task was not found" });
  }

  const { userId, ...task } = global.tasks[taskIndex];
  global.tasks.splice(taskIndex, 1);
  
  return res.status(200).json(task);
};

module.exports = { create, index, show, update, deleteTask };