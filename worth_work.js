// ==========================================
// Worth Work – Hours-to-Earn Calculator
// File: worth_work.js
// Description: Calculates how many work hours
// are needed to earn back a purchase cost.
// Author: Joel Saji
// Created: 2026-02-13
// ==========================================

const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const settingsPath = fm.joinPath(dir, "worth_work_settings.json");

// ------- Helper Functions -------- //

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

async function askNumber(title, placeholder = "", defaultValue = "") {
  const a = new Alert();
  a.title = title;
  a.addTextField(placeholder, String(defaultValue ?? ""));
  a.addAction("Ok");
  a.addCancelAction("Cancel");

  const idx = await a.present();
  if (idx === -1) throw new Error("User Cancelled");

  const raw = a.textFieldValue(0).trim();
  const n = Number(raw);

  if (!isFiniteNumber(n)) throw new Error(`Invalid number: "${raw}"`);
  return n;
}

async function readSettings() {
  if (!fm.fileExists(settingsPath)) return null;

  if (!fm.isFileDownloaded(settingsPath)) {
    await fm.downloadFileFromiCloud(settingsPath);
  }

  try {
    const txt = fm.readString(settingsPath);
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

function writeSettings(obj) {
  fm.writeString(settingsPath, JSON.stringify(obj, null, 2));
}

// ------- Wage Helpers ------- //

async function grabWageHourly() {
  const wage = await askNumber("Hourly Wage", "", "");
  return wage;
}

async function grabWageSalary() {
  const biWeeklyPay = await askNumber("Bi-Weekly Pay", "", "");
  const hoursPerWeek = await askNumber("Hours Per Week", "", "");

  if (hoursPerWeek <= 0) throw new Error("Hours per week must be > 0");

  // bi-weekly pay / (2 weeks * hours per week) = hourly
  return biWeeklyPay / (2 * hoursPerWeek);
}

async function grabWageType() {
  const a = new Alert();
  a.title = "Wage Information";
  a.addAction("Hourly");
  a.addAction("Salary");
  a.addCancelAction("Cancel");

  const choice = await a.present();
  if (choice === -1) throw new Error("User Cancelled");

  if (choice === 0) return await grabWageHourly();
  if (choice === 1) return await grabWageSalary();

  throw new Error("Unexpected choice");
}

// ------- Wage Logic ------- //

async function wageOptionChoice() {
  let settings = await readSettings();

  // If no settings or invalid, create new default
  if (!settings || !isFiniteNumber(settings.defaultHourlyWage)) {
    const wage = await grabWageType();
    settings = { defaultHourlyWage: wage };
    writeSettings(settings);
    return { hourlyWage: wage, source: "saved-default" };
  }

  const saved = settings.defaultHourlyWage;

  const a = new Alert();
  a.title = "Hourly Wage";
  a.message = `Saved default: $${saved.toFixed(2)}/hr\n\nChoose which wage to use:`;
  a.addAction(`Use saved ($${saved.toFixed(2)}/hr)`);
  a.addAction("Use different wage (this time only)");
  a.addAction("Update saved default wage");
  a.addCancelAction("Cancel");

  const choice = await a.present();
  if (choice === -1) throw new Error("User Cancelled");

  if (choice === 0) {
    return { hourlyWage: saved, source: "saved-default" };
  }

  if (choice === 1) {
    const wage = await grabWageType();
    return { hourlyWage: wage, source: "one-time-override" };
  }

  // choice === 2
  const updated = await grabWageType();
  settings.defaultHourlyWage = updated;
  writeSettings(settings);
  return { hourlyWage: updated, source: "saved-default-updated" };
}

async function itemValue() {
  return await askNumber("Item Value", "", "");
}

// ------- Main ------- //

async function main() {
  const wageInfo = await wageOptionChoice();
  const itemVal = await itemValue();

  if (wageInfo.hourlyWage <= 0) throw new Error("Hourly wage must be > 0");

  const perHour = itemVal / wageInfo.hourlyWage;

  const out = new Alert();
  out.title = "Item Cost in Hours";
  out.message = `This item would take ${perHour.toFixed(2)} hours to earn back.`;
  await out.present();
}

await main();
