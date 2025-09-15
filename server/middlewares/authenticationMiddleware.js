const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    // Verify JWT
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
      res.status(401);
      throw new Error("Token not valid!");
    }

    // Fetch user from DB (excluding password manually)
    const user = await prisma.user.findUnique({
      where: { id: verified.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneno: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: { id: true, name: true, description: true },
            },
          },
        },
        // password is NOT selected, so it won’t leak
      },
    });

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});

module.exports = protect;
