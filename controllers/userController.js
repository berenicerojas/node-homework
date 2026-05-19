const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const { userSchema } = require('../models/tasks'); 

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
};

const verifyPassword = (password, storedHash) => {
  return new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKeyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
      
      if (keyBuffer.length !== derivedKeyBuffer.length) {
        return resolve(false);
      }
      resolve(crypto.timingSafeEqual(keyBuffer, derivedKeyBuffer));
    });
  });
};

const register = async (req, res) => {
  try {
    const { error, value } = userSchema.validate(req.body); 
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const hashedPassword = await hashPassword(value.password);

    const newUser = await prisma.user.create({
      data: {
        email: value.email,
        hashedPassword: hashedPassword, 
        name: value.name,
      },
    });


    newUser.password = value.password;

    return res.status(201).json(newUser);

  } catch (err) {
    
    if (err.code === 'P2002') {
      return res.status(400).json({ error: "Email already exists" });
    }
    return res.status(400).json({ error: err.message });
  }
};

const logon = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await verifyPassword(password, user.hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    user.password = password;
    global.user_id = user.id;
    
    return res.status(200).json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const logoff = async (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { register, logon, logoff };