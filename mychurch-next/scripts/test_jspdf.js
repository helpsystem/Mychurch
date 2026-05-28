const { jsPDF } = require('jspdf');

try {
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
        encryption: {
            userPassword: "",
            ownerPassword: `IranChurch-DOC-2026`,
            userPermissions: ["print", "print-high", "copy"],
        }
    });
    console.log("✅ jsPDF initialized successfully with encryption options!");
} catch (e) {
    console.error("❌ jsPDF constructor failed:", e);
}
