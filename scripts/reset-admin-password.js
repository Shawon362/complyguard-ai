import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  // eslint-disable-next-line no-undef
  input: process.stdin,
  // eslint-disable-next-line no-undef
  output: process.stdout,
});

const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function resetPassword() {
  console.log("\n==========================================");
  console.log("  🔑 RESET ADMIN PASSWORD");
  console.log("==========================================\n");

  // Show all admins first
  const all = await prisma.adminUser.findMany({
    select: { email: true, createdAt: true },
  });

  if (all.length === 0) {
    console.log("❌ No admin users found.");
    console.log("Run: npm run create-admin to create one.\n");
    rl.close();
    await prisma.$disconnect();
    return;
  }

  console.log("Existing admins:");
  all.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.email}`);
  });
  console.log("");

  const email = await ask("Which email to reset password for? ");

  const admin = await prisma.adminUser.findUnique({
    where: { email: email.trim() },
  });

  if (!admin) {
    console.log(`\n❌ No admin found with email: ${email}\n`);
    rl.close();
    await prisma.$disconnect();
    return;
  }

  const newPassword = await ask("New password (min 8 chars): ");

  if (newPassword.length < 8) {
    console.log("\n❌ Password must be at least 8 characters\n");
    rl.close();
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.adminUser.update({
    where: { email: email.trim() },
    data: { passwordHash: hashedPassword },
  });

  console.log("\n✅ Password reset successfully!");
  console.log(`   Email:    ${email}`);
  console.log(`   New Pass: ${"*".repeat(newPassword.length)}`);
  console.log(`\n   Now login at /admin/login\n`);

  rl.close();
  await prisma.$disconnect();
}

resetPassword().catch((e) => {
  console.error(e);
  rl.close();
  // eslint-disable-next-line no-undef
  process.exit(1);
});