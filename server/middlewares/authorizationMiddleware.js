const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Permission-based Authorization Middleware
 *
 * Usage:
 *   router.get("/reports", protect, authorizePermissions("viewReports"), handler);
 *
 * - Checks if the logged-in user has ALL required permissions
 * - Special case: if user has "*" permission, bypasses all checks
 */
const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Fetch user with role + permissions
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }, // req.user is set in protect middleware
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const userPermissions =
        user.role?.permissions.map((perm) => perm.name) || [];

      // Super Admin bypass
      if (userPermissions.includes("*")) {
        return next();
      }

      // Check if user has all required permissions
      const hasPermissions = requiredPermissions.every((p) =>
        userPermissions.includes(p)
      );

      if (!hasPermissions) {
        return res
          .status(403)
          .json({ message: "Forbidden: Missing required permissions" });
      }

      next();
    } catch (err) {
      console.error("Authorization error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};
module.exports = authorize;
