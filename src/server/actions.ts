"use server";

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export async function logToLedger(
  action: "ACHIEVED" | "PURGED",
  mandateTitle: string,
  xp: number,
  ram: number,
  isSlop: boolean
) {
  try {
    const timestamp = new Date().toISOString();
    
    // Construct the payload to be hashed
    const rawData = `${timestamp}|${action}|${mandateTitle}|XP:${xp}|RAM:${ram}|SLOP:${isSlop}`;
    
    // Generate a cryptographic hash of the action
    const hash = crypto.createHash("sha256").update(rawData).digest("hex");
    
    // Format the log entry (Scientific Brutalism aesthetic)
    const logEntry = `[${timestamp}] [${hash.substring(0, 16)}] [${action.padEnd(8)}] "${mandateTitle}" | XP: ${xp.toString().padEnd(4)} | RAM: ${ram.toString().padEnd(3)}MB | SLOP: ${isSlop}
`;
    
    const ledgerPath = path.join(process.cwd(), "PROTOCOL_B_LEDGER.log");
    
    // Append to the immutable ledger
    await fs.appendFile(ledgerPath, logEntry, "utf8");
    
    return { success: true, hash };
  } catch (error) {
    console.error("Failed to write to Protocol B Ledger:", error);
    return { success: false, error };
  }
}
