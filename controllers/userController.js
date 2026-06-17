const prisma = require("../db/prisma");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const userSchema = Joi.object({
  name: Joi.string().max(255).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(6).required(),
});

const cookieFlags = (req) => {
  const flags = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };

  if (process.env.NODE_ENV === "production") {
    flags.domain = req.hostname;
  }

  return flags;
};

const setJwtCookie = (req, res, user) => {
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); 
  
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); 
  return payload.csrfToken; 
};

exports.register = async (req, res, next) => {
  try {
    let isPerson = false;  

    if (req.body.recaptchaToken) {    
      const token = req.body.recaptchaToken;    
      const params = new URLSearchParams();    
      params.append("secret", process.env.RECAPTCHA_SECRET);    
      params.append("response", token);    
      params.append("remoteip", req.ip);    
      const response = await fetch(      
        "https://www.google.com/recaptcha/api/siteverify",      
        {        
          method: "POST",        
          body: params.toString(),        
          headers: {          
            "Content-Type": "application/x-www-form-urlencoded",          
          },        
        }      
      );    
      const data = await response.json();    
      if (data.success) isPerson = true;    
      delete req.body.recaptchaToken;  
      
    } else if (
      process.env.RECAPTCHA_BYPASS && 
      req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
    ) {    
      isPerson = true;  
    }  

    if (!isPerson) {    
      return res      
        .status(StatusCodes.BAD_REQUEST)      
        .json({ message: "Bot verification failed. Please complete the reCAPTCHA." });  
    }

    const { error, value } = userSchema.validate(req.body);
    if (error) return res.status(StatusCodes.BAD_REQUEST).json({ error: error.details[0].message });

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

    const csrfToken = setJwtCookie(req, res, result.user);

    res.status(StatusCodes.CREATED).json({
      name: result.user.name,
      email: result.user.email,
      csrfToken: csrfToken,
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Email already registered" });
    }
    next(err);
  }
};

exports.logon = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid email or password" });
    }
    const csrfToken = setJwtCookie(req, res, user);
    res.status(StatusCodes.OK).json({ 
      name: user.name, 
      email: user.email,
      csrfToken: csrfToken
    });
  } catch (err) {
    next(err);
  }
};

exports.logoff = async (req, res, next) => {
  res.clearCookie("jwt", cookieFlags(req));
  res.status(StatusCodes.OK).json({ message: "Successfully logged off." });
};