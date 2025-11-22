// scripts/seed-admin.ts
import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME || "Initial Admin";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.");
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    console.log("Admin user already exists (", existingAdmin.email, ") – nothing to do.");
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  const hashed = await bcrypt.hash(adminPassword, 12);

  if (existingUser) {
    console.log("Promoting existing user to ADMIN:", adminEmail);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN", password: hashed },
    });
  } else {
    console.log("Creating new ADMIN user:", adminEmail);
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
      },
    });
  }

  console.log("Admin seeding completed.");
}

main()
  .catch((err) => {
    console.error("Error during admin seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
