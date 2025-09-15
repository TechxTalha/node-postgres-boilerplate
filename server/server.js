// import modules
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const morgan = require("morgan");
const cors = require("cors");
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middlewares/errorMiddleware");
const seedDatabase = require("./utils/seedDatabase");
require("dotenv").config();

// app
const app = express();

// middleware for parsing requests
app.use(bodyparser.json());
app.use(express.urlencoded({ extended: false }));

// init prisma client (manages PostgreSQL connection pool)
const prisma = new PrismaClient();

// global middlewares
app.use(cookieParser());
app.use(morgan("dev")); // request logging
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // allow frontend domain
    credentials: true,
  })
);

// routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// error handler (custom middleware)
app.use(errorHandler);

// port
const port = process.env.PORT || 8008;

// start server + run seed
const server = app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma");
    await seedDatabase(prisma); // pass prisma if seedRoles needs it
    console.log("Roles seeded successfully");
  } catch (err) {
    console.error("Error seeding roles:", err);
  }
});

// handle graceful shutdown (important for Prisma)
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log("👋 Server closed. Prisma disconnected.");
    process.exit(0);
  });
});
