const express = require("express");
const protect = require("../middlewares/authenticationMiddleware");
const authorize = require("../middlewares/authorizationMiddleware");
const {
  registerAdmin,
  registerUser,
  login,
  changePassword,
  loginStatus,
  logOut,
  getUserDetails,
  createRole,
  updateRole,
  deleteRole,
  createPermission,
  updatePermission,
  deletePermission,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register/admin", protect, authorize("*"), registerAdmin);
router.post("/register/user", protect, authorize("*"), registerUser);
router.post("/login", login);
router.post("/change-password", protect, changePassword);
router.get("/login-status", loginStatus);
router.post("/logout", logOut);
router.get("/user-details", protect, getUserDetails);

/* -------------------- ROLES -------------------- */
router.post("/roles", protect, authorize("MANAGE_ROLES"), createRole);
router.put("/roles/:id", protect, authorize("MANAGE_ROLES"), updateRole);
router.delete("/roles/:id", protect, authorize("MANAGE_ROLES"), deleteRole);

/* -------------------- PERMISSIONS -------------------- */
router.post(
  "/permissions",
  protect,
  authorize("MANAGE_PERMISSIONS"),
  createPermission
);
router.put(
  "/permissions/:id",
  protect,
  authorize("MANAGE_PERMISSIONS"),
  updatePermission
);
router.delete(
  "/permissions/:id",
  protect,
  authorize("MANAGE_PERMISSIONS"),
  deletePermission
);

module.exports = router;
