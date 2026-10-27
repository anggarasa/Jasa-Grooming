import crypto from "crypto";

const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude confusing chars like 0, O, 1, I

/**
 * Generates human-readable booking code in format: GRM-YYYYMMDD-XXXX
 * Example: GRM-20261024-K8J2
 */
export function generateBookingCode(date = new Date()): string {
  // Use Jakarta date for the code prefix
  const jakartaTime = new Date(date.getTime() + 7 * 3600 * 1000);
  const year = jakartaTime.getUTCFullYear();
  const month = (jakartaTime.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = jakartaTime.getUTCDate().toString().padStart(2, "0");
  const yyyymmdd = `${year}${month}${day}`;

  const randomBytes = crypto.randomBytes(4);
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    const charIndex = randomBytes[i] % CODE_CHARS.length;
    randomPart += CODE_CHARS[charIndex];
  }

  return `GRM-${yyyymmdd}-${randomPart}`;
}
