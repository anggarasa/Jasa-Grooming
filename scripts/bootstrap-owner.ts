import { prisma } from "../lib/prisma";
import { hashPassword, validatePasswordPolicy } from "../modules/auth/password.service";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Role } from "@prisma/client";

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const rest = arg.slice(2);
      if (rest.includes("=")) {
        const eqIdx = rest.indexOf("=");
        const key = rest.slice(0, eqIdx);
        const val = rest.slice(eqIdx + 1);
        args[key] = val;
      } else {
        const nextArg = argv[i + 1];
        if (nextArg && !nextArg.startsWith("--")) {
          args[rest] = nextArg;
          i++;
        } else {
          args[rest] = "true";
        }
      }
    }
  }
  return args;
}

async function main() {
  console.log("==================================================");
  console.log("  PawCare Grooming — Owner Account Provisioning   ");
  console.log("==================================================");

  const args = parseArgs();
  let email = args.email || process.env.INITIAL_OWNER_EMAIL;
  let name = args.name || process.env.INITIAL_OWNER_NAME;
  let password = args.password || process.env.INITIAL_OWNER_PASSWORD;

  if (!email || !name || !password) {
    const rl = readline.createInterface({ input, output });
    try {
      if (!name) {
        name = await rl.question("Masukkan Nama Lengkap Owner [Owner PawCare]: ");
        if (!name.trim()) name = "Owner PawCare";
      }

      if (!email) {
        email = await rl.question("Masukkan Email Akun [owner@pawcare.id]: ");
        if (!email.trim()) email = "owner@pawcare.id";
      }

      if (!password) {
        password = await rl.question(
          "Masukkan Kata Sandi (min 12 karakter, huruf besar, kecil, angka, simbol): "
        );
      }
    } finally {
      rl.close();
    }
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // Validasi kebijakan password
  const policyCheck = validatePasswordPolicy(password);
  if (!policyCheck.valid) {
    console.error(`\n❌ Gagal: ${policyCheck.error}`);
    process.exit(1);
  }

  console.log(`\nMemproses pembuatan / pembaruan akun Owner: ${cleanEmail}...`);

  const passwordHash = await hashPassword(password);

  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: cleanName,
        passwordHash,
        role: Role.OWNER,
        isActive: true,
        tokenVersion: { increment: 1 },
      },
    });

    console.log("\n✅ Akun Owner berhasil diperbarui!");
    console.log(`ID Pengguna : ${updated.id}`);
    console.log(`Nama        : ${updated.name}`);
    console.log(`Email       : ${updated.email}`);
    console.log(`Role        : ${updated.role}`);
    console.log(`Status      : ${updated.isActive ? "Aktif" : "Nonaktif"}`);
  } else {
    const created = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: Role.OWNER,
        isActive: true,
      },
    });

    console.log("\n✅ Akun Owner baru berhasil dibuat!");
    console.log(`ID Pengguna : ${created.id}`);
    console.log(`Nama        : ${created.name}`);
    console.log(`Email       : ${created.email}`);
    console.log(`Role        : ${created.role}`);
    console.log(`Status      : ${created.isActive ? "Aktif" : "Nonaktif"}`);
  }

  console.log("\nAnda sekarang dapat masuk ke dashboard admin melalui /login.");
}

main()
  .catch((err) => {
    console.error("❌ Kesalahan fatal saat provisioning owner:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
