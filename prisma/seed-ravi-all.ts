/**
 * Convenience script — seeds ALL demo data for Ravi Kumar:
 *   1. Medications + MedicationLogs + Notifications (seed-medications.ts)
 *   2. People, Memories, Mood, Routines, Quiz, Contacts, etc. (seed-demo.ts)
 *
 * Run: npx tsx prisma/seed-ravi-all.ts
 */

import { execSync } from "child_process";
import { resolve } from "path";

const dir = resolve(__dirname);

function run(label: string, file: string) {
  console.log(`\n--- ${label} ---`);
  execSync(`npx tsx ${file}`, { cwd: dir, stdio: "inherit" });
}

run("Medications + Notifications", "./seed-medications.ts");
run("People, Memories, Mood, Routines, Quiz & more", "./seed-demo.ts");

console.log("\n✅ All demo data seeded for Ravi Kumar!");
