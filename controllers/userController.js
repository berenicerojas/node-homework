const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const register = async (req, res) => {
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  const hashedPassword = await hashPassword(value.password);
  const newUser = { name: value.name, email: value.email, password: hashedPassword };
  
  global.users.push(newUser);
  res.status(201).json({ name: value.name, email: value.email });
};

const logon = async (req, res) => {
  const { email, password } = req.body;
  const user = global.users.find(u => u.email === email);
  
  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ message: "unauthorized" });
  }

  global.user_id = { email: user.email, name: user.name };
  res.json({ name: user.name });
};

const logoff = (req, res) => {
  global.user_id = null;
  res.json({ message: "logged off" });
};

module.exports = { register, logon, logoff };