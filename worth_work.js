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

