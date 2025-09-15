const bcrypt = require("bcrypt");

async function seedDatabase(prisma) {
  // 1. Ensure the SUPER_ADMIN role exists
  let role = await prisma.role.findUnique({
    where: { name: "SUPER_ADMIN" },
    include: { permissions: true },
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: "SUPER_ADMIN",
      },
    });
    console.log("SUPER_ADMIN role created");
  }

  // 2. Ensure the "*" permission exists
  let permission = await prisma.permission.findUnique({
    where: { name: "*" },
  });

  if (!permission) {
    permission = await prisma.permission.create({
      data: {
        name: "*",
        description: "Super Admin has access to all permissions",
      },
    });
    console.log("* permission created");
  }

  // 3. Attach * permission to SUPER_ADMIN role (if not already attached)
  const roleHasPermission = role.permissions?.some((p) => p.name === "*");
  if (!roleHasPermission) {
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          connect: { id: permission.id },
        },
      },
    });
    console.log("Linked * permission to SUPER_ADMIN role");
  }

  // 4. Create initial SYS ADMIN user
  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@sys.com" }, // give admin a default email
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash("tvnVXVi#d3YmjqX", 10);

    await prisma.user.create({
      data: {
        name: "SYS ADMIN",
        email: "admin@sys.com",
        phoneno: "0000000000",
        password: hashedPassword,
        role: {
          connect: { id: role.id },
        },
      },
    });

    console.log("SYS ADMIN user created with SUPER_ADMIN role");
  } else {
    console.log("SYS ADMIN already exists, skipping user creation");
  }
}

module.exports = seedDatabase;
