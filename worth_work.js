// ==========================================
// Worth Work – Hours-to-Earn Calculator
// File: worth_work.js
// Description: Calculates how many work hours
// are needed to earn back a purchase cost.
// Author: Joel Saji
// Created: 2026-02-13
// ==========================================


// Wage Storage/Override 
// The default wage will be saved to a icloud file which the app can pull from
// An option will be provided to either use values temporarily or change the default values

const fm = FileManager.iCloud(); //Used to interact with the icloud storage
const dir = fm.documentsDirectory();
const settingsPath = fm.joinPath(dir, "worth_work_settings.json");

// ------- Helper Functions -------- //

// Check that value input is a number
function isNumber(n) {
    return typeof n === "number" && Number.isFinite(n);
}

// Base Helper to ask user for values using Scriptable alerts which are built into the app
async function askNumber(title, placeholder = "", defaultValue = "") {
    // Present alert to collect value inputs from the user
    const a = new Alert(); // Scriptable function to send a notification box for a value
    a.title = title; // Name the alert
    a.addTextField(placeholder, String(defaultValue ?? ""));
    a.addAction("Ok");
    a.addCancelAction("Cancel");
    const idx = await a.present();
    if (idx === -1) throw new Error("User Cancelled");

    // Check input to make sure a number was entered and then return value if checks pass
    const raw = a.textFieldValue(0).trim();
    const n = Number(raw);
    if (!isFiniteNumber(n)) throw new Error(`Invalid number: "${raw}"`);
    return n;
}

// Function to grab stored values from set file path
async function readSettings() {
    // Check if file exists and attempt to download it
    if (!fm.fileExists(settingsPath)) return null; //Check for file

    if  (!fm.isFileDownloaded(settingsPath)) {
        await fm.downloadFileFromiCloud(settingsPath);
    }

    // Load file into text and return if the file isnt null
    try {
        const txt = fm.readString(settingsPath);
        return JSON.parse(txt);
    } catch (e) {
        return null;
    }
}

// Function to write and store entered settings into the set file path
function writeSettings(obj) {
    fm.writeString(settingsPath, JSON.stringify(obj, null, 2));
}


// Function to ask for hourly or salary wage and act accordingly to return wage value
async function grabWageType() {
    const a = new Alert();
    a.title = "Wage Information";

    // Check if hourly or salary and then use that to grab the correct information
    a.addAction("Hourly");
    a.addAction("Salary");
    a.addCancelAction("Cancel");

    const choice = await a.present();

    // Direct to correct helper function
    if (choice === 0) {
        const wage = await grabWageHourly();
    }
    else if (choice === 1) {
        const wage = await grabWageSalary();
    }
    else if (choice === -1) {
        throw new Error("User Cancelled");
    }

    return wage;
}

// Helper function if hourly is selected in the option
async function grabWageHourly() {
    const wage = await askNumber("Hourly Wage", "0", "0");

    return wage;
}

// Helper function if salary is chosen
async function grabWageSalary() {
    const wage = await askNumber("Bi-Weekly Salary", "0", "0");
    const hours = await askNumber("Hours Per Week", "0", "0");

    return(wage / (2 * hours));
}

// ------- Wage Logic ------- //
async function wageOptionChoice() {
    let settings = await readSettings();

    // If no settings or issue, create new file and grab info to store
    if (!settings || !isFiniteNumber(settings.defaultHourlyWage)) {
        const wage = grabWageType();

        settings = { defaultHourlyWage: wage };
        writeSettings(settings);

        return { hourlyWage: wage, source: "saved-default" };
    }

    const saved = settings.defaultHourlyWage;

    // Menu
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
        const wage = grabWageType();

        return { hourlyWage: wage, source: "one-time-override" };
    }

    const updated = grabWageType();
    settings.defaultHourlyWage = updated;
    writeSettings(settings);
    return { hourlyWage: updated, source: "saved-default-updated" };
}

// Function to get the value of the item
async function itemValue() {
    const item = await askNumber("Item Value", "Value of Item", "0");
    return item;
}

// Calculations using wage
async function main() {
    const wageInfo = await wageOptionChoice();
    const itemVal = await itemValue();

    let perHour = itemVal / wageInfo;

    const out = new Alert();
    out.title = "Item Cost in Hours";
    out.message = `This item would take ${perHour.toFixed(2)} hours`;

    await out.present();
}

await main();