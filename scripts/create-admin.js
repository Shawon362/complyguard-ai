import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

// Helper: Ask question in terminal
function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main function
async function createAdmin() {
  console.log("\n========================================");
  console.log("Create Admin User");
  console.log("========================================\n");

  try {
    // Ask user for details
    const email = await ask("Email: ");
    const name = await ask("Full Name: ");
    const password = await ask("Password (min 8 chars): ");

    // Validation
    if (!email || !email.includes("@")) {
      console.log("\nInvalid email!");
      return;
    }

    if (!password || password.length < 8) {
      console.log("\nPassword must be at least 8 characters!");
      return;
    }

    if (!name) {
      console.log("\nName is required!");
      return;
    }

    // Check if admin already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`\nAdmin with email ${email} already exists!`);
      return;
    }

    // Encrypt password
    console.log("\nEncrypting password...");
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("Saving to database...");
    const admin = await prisma.adminUser.create({
      data: {
        email,
        name,
        passwordHash,
        role: "admin",
      },
    });

    console.log("\n========================================");
    console.log("Admin User Created Successfully!");
    console.log("========================================");
    console.log(`  Email:   ${admin.email}`);
    console.log(`  Name:    ${admin.name}`);
    console.log(`  Role:    ${admin.role}`);
    console.log(`  Created: ${admin.createdAt.toLocaleString()}`);
    console.log("========================================\n");
    console.log("You can now login at: /admin/login");
    console.log("");
  } catch (error) {
    console.error("\nError creating admin:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();