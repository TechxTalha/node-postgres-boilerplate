const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

/**
 * Register an Admin User
 * Accessible only to SUPER_ADMIN (* permission)
 */
const registerAdmin = async (req, res) => {
  try {
    const { name, email, phoneno, password, roleId } = req.body;

    // Validate input
    if (!name || !email || !phoneno || !password || !roleId) {
      return res
        .status(400)
        .json({ message: "All fields including roleId are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      return res
        .status(400)
        .json({ message: "Invalid roleId, role does not exist" });
    }

    // Create new Admin
    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        phoneno,
        password: hashedPassword,
        roleId,
      },
      include: { role: true },
    });

    res.status(201).json({
      message: "Admin registered successfully",
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role.name,
      },
    });
  } catch (err) {
    console.error("Register Admin Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, phoneno, password, roleId } = req.body;

    // Validate input
    if (!name || !email || !phoneno || !password || !roleId) {
      return res
        .status(400)
        .json({ message: "All fields including roleId are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      return res
        .status(400)
        .json({ message: "Invalid roleId, role does not exist" });
    }

    // Create new User
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phoneno,
        password: hashedPassword,
        roleId,
      },
      include: { role: true },
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.name,
      },
    });
  } catch (err) {
    console.error("Register User Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Send token in cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Respond with user info (no password)
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneno: user.phoneno,
        role: user.role.name,
        permissions: user.role.permissions.map((p) => p.name),
      },
      token,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both old and new password are required" });
    }

    // Get logged-in user from req.user (set by protect middleware)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const loginStatus = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.json({ loggedIn: false });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user with role + permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneno: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.json({ loggedIn: false });
    }

    return res.json({
      loggedIn: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneno: user.phoneno,
        role: user.role?.name || null,
        permissions: user.role?.permissions.map((p) => p.name) || [],
      },
    });
  } catch (err) {
    console.error("Login Status Error:", err);
    return res.json({ loggedIn: false });
  }
};

const logOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserDetails = async (req, res) => {
  try {
    // req.user is set by `protect` middleware (decoded from JWT)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Exclude password
    const { password, ...userData } = user;

    res.json({
      ...userData,
      role: user.role.name,
      permissions: user.role.permissions.map((p) => p.name),
    });
  } catch (err) {
    console.error("GetUserDetails Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create Role
 * Body: { name: "ADMIN", permissionIds: [1,2,3] }
 */

const createRole = async (req, res) => {
  try {
    const { name, permissionIds } = req.body; // expect IDs not names

    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const role = await prisma.role.create({
      data: {
        name,
        permissions: {
          connect: permissionIds?.map((id) => ({ id })) || [],
        },
      },
      include: { permissions: true },
    });

    return res.status(201).json({ message: "Role created", role });
  } catch (err) {
    console.error("Create Role Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update Role
 * Params: id
 * Body: { name: "NEW_ROLE_NAME", permissionIds: [1,2,3] }
 * */

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissionIds } = req.body;

    const existingRole = await prisma.role.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    const role = await prisma.role.update({
      where: { id: parseInt(id) },
      data: {
        name,
        permissions: {
          set: [], // clear old
          connect: permissionIds?.map((pid) => ({ id: pid })) || [],
        },
      },
      include: { permissions: true },
    });

    return res.json({ message: "Role updated", role });
  } catch (err) {
    console.error("Update Role Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 *  Delete Role
 *  Params: id
 * Prevent deletion if any user is assigned to this role
 * */
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id);

    // check role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: { users: true }, // check if users are linked
    });

    if (!existingRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    // prevent deletion if any user is assigned to this role
    if (existingRole.users.length > 0) {
      return res.status(400).json({
        message: "Cannot delete role: it is assigned to one or more users",
      });
    }

    await prisma.role.delete({ where: { id: roleId } });

    return res.json({ message: "Role deleted successfully" });
  } catch (err) {
    console.error("Delete Role Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create Permission
 * Body: { name: "VIEW_USERS", description: "Can view user list" }
 */
const createPermission = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Permission name is required" });
    }

    const existing = await prisma.permission.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: "Permission already exists" });
    }

    const permission = await prisma.permission.create({
      data: { name, description },
    });

    return res.status(201).json({ message: "Permission created", permission });
  } catch (err) {
    console.error("Create Permission Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update Permission
 * Params: id
 * Body: { name: "EDIT_USERS", description: "Can edit user details" }
 */
const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const permissionId = parseInt(id);

    const existing = await prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Permission not found" });
    }

    const updated = await prisma.permission.update({
      where: { id: permissionId },
      data: { name, description },
    });

    return res.json({ message: "Permission updated", permission: updated });
  } catch (err) {
    console.error("Update Permission Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete Permission
 * Params: id
 */
const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const permissionId = parseInt(id);

    const existing = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: { roles: true }, // check if linked to any role
    });
    if (!existing) {
      return res.status(404).json({ message: "Permission not found" });
    }

    if (existing.roles.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete permission: it is assigned to one or more roles",
      });
    }

    await prisma.permission.delete({ where: { id: permissionId } });

    return res.json({ message: "Permission deleted successfully" });
  } catch (err) {
    console.error("Delete Permission Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
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
};
