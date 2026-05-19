const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { userSchema } = require('../models/tasks'); 

const register = async (req, res) => {
  try {
    const { error, value } = userSchema.validate(req.body); 
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: value.email },
    });
    
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const newUser = await prisma.user.create({
      data: {
        email: value.email,
        hashedPassword: value.password, 
        name: value.name,
      },
    });

    newUser.password = value.password;

    return res.status(201).json(newUser);

  } catch (err) {
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
    

    if (!user || user.hashedPassword !== password) {
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