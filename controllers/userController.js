const pool = require("../db/pg-pool");
const crypto = require("crypto");
const { userSchema } = require("../validation/userSchema");

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
};

const comparePassword = (password, hash) => {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
};

const logon = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Authentication failed. User not found." });
    }
    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.hashed_password);
    if (!isMatch) {
      return res.status(401).json({ message: "Authentication failed. Incorrect password." });
    }
    global.user_id = user.id;
    return res.status(200).json({ message: "Logon successful", name: user.name });
  } catch (err) {
    if (typeof next === "function") return next(err);
    return res.status(500).json({ message: err.message });
  }
};

const register = async (req, res, next) => {
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }
  try {
    const hashedPassword = await hashPassword(req.body.password);
    const result = await pool.query(
      `INSERT INTO users (email, name, hashed_password) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, name`,
      [value.email, value.name, hashedPassword]
    );
    const newUser = result.rows[0];
    global.user_id = newUser.id;
    return res.status(201).json({ name: newUser.name, email: newUser.email });
  } catch (e) {
    if (e.code === "23505" || (e.message && e.message.includes("unique"))) {
      return res.status(400).json({ message: "Email is already registered" });
    }
    if (typeof next === "function") return next(e);
    return res.status(500).json({ message: e.message });
  }
};

const logoff = (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: "Logoff successful" });
};

module.exports = { logon, register, logoff };