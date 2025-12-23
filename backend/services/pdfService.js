// backend/services/pdfService.js
// Professional PDF Generation Service with Beautiful Letterhead

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { PDFDocument: PDFLib, StandardFonts, rgb } = require('pdf-lib');

/**
 * Generate a professional letter PDF with beautiful letterhead
 * @param {Object} letterData - Letter information
 * @param {Object} letterSettings - Church settings
 * @returns {Promise<string>} Path to generated PDF
 */
async function generateLetterPDF(letterData, letterSettings) {
    return new Promise(async (resolve, reject) => {
        try {
            // Create a new PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 140,
                    bottom: 60,
                    left: 60,
                    right: 60
                },
                bufferPages: true
            });

            const filename = `letter-${letterData.letter_number}.pdf`;
            const filepath = path.join(__dirname, '../temp', filename);

            // Ensure temp directory exists
            if (!fs.existsSync(path.join(__dirname, '../temp'))) {
                fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
            }

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // ==========================================
            // PROFESSIONAL LETTERHEAD DESIGN
            // ==========================================

            // Background gradient effect (subtle)
            doc.rect(0, 0, 595, 150)
                .fillOpacity(0.03)
                .fill('#5CE1E6');

            doc.fillOpacity(1); // Reset opacity

            // Top accent bar
            doc.rect(0, 0, 595, 8)
                .fill('#5CE1E6');

            // Church Logo (if available)
            const logoPath = path.join(__dirname, '../../public/images/logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 60, 25, {
                    width: 70,
                    height: 70
                });
            }

            // Church Name - English
            doc.font('Helvetica-Bold')
                .fontSize(20)
                .fillColor('#1a1a1a')
                .text(letterSettings.church_name.en, 150, 35, {
                    width: 380,
                    align: 'left'
                });

            // Church Name - Persian (if available)
            if (letterSettings.church_name.fa) {
                doc.font('Helvetica')
                    .fontSize(14)
                    .fillColor('#4a4a4a')
                    .text(letterSettings.church_name.fa, 150, 60, {
                        width: 380,
                        align: 'left'
                    });
            }

            // Contact Information (Professional Layout)
            doc.fontSize(9)
                .fillColor('#666666');

            const contactY = 85;
            const contactLineHeight = 12;

            // Address
            doc.text(`📍 ${letterSettings.church_address.en}`, 150, contactY, {
                width: 380,
                align: 'left'
            });

            // Phone and Email on same line
            doc.text(`📞 ${letterSettings.phone}  |  ✉️ ${letterSettings.email}`,
                150, contactY + contactLineHeight, {
                width: 380,
                align: 'left'
            });

            // Website
            if (letterSettings.website) {
                doc.fillColor('#5CE1E6')
                    .text(`🌐 ${letterSettings.website}`,
                        150, contactY + contactLineHeight * 2, {
                        width: 380,
                        align: 'left',
                        link: letterSettings.website
                    });
            }

            // Decorative line separator
            doc.moveTo(60, 125)
                .lineTo(535, 125)
                .strokeOpacity(0.3)
                .stroke('#5CE1E6');

            doc.strokeOpacity(1); // Reset

            // ==========================================
            // LETTER HEADER (Number & Date)
            // ==========================================

            doc.font('Helvetica')
                .fontSize(10)
                .fillColor('#333333');

            const headerY = 150;

            // Letter Number
            doc.font('Helvetica-Bold')
                .text('Letter No:', 60, headerY, { continued: true })
                .font('Helvetica')
                .text(` ${letterData.letter_number}`, { align: 'left' });

            // Date (aligned to right)
            const dateStr = new Date(letterData.letter_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.font('Helvetica-Bold')
                .text('Date:', 400, headerY, { continued: true })
                .font('Helvetica')
                .text(` ${dateStr}`, { align: 'left' });

            // ==========================================
            // RECIPIENT INFORMATION
            // ==========================================

            doc.moveDown(2);

            doc.font('Helvetica-Bold')
                .fontSize(11)
                .fillColor('#000000')
                .text('To:', { continued: false });

            doc.font('Helvetica')
                .fontSize(11)
                .text(letterData.recipient_name, { indent: 20 });

            if (letterData.recipient_title) {
                doc.text(letterData.recipient_title, { indent: 20 });
            }

            if (letterData.recipient_organization) {
                doc.text(letterData.recipient_organization, { indent: 20 });
            }

            // ==========================================
            // SUBJECT LINE
            // ==========================================

            doc.moveDown(1.5);

            const subjectText = letterData.subject[letterData.language] || letterData.subject.en;

            doc.font('Helvetica-Bold')
                .fontSize(12)
                .fillColor('#000000')
                .text('Subject:', { continued: true })
                .font('Helvetica')
                .text(` ${subjectText}`, {
                    underline: false
                });

            // ==========================================
            // LETTER BODY
            // ==========================================

            doc.moveDown(2);

            const bodyText = letterData.body[letterData.language] || letterData.body.en;

            doc.font('Helvetica')
                .fontSize(11)
                .fillColor('#1a1a1a')
                .text(bodyText, {
                    align: 'justify',
                    lineGap: 4
                });

            // ==========================================
            // CLOSING & SIGNATURE
            // ==========================================

            doc.moveDown(2);

            // Default closing
            const closingText = letterSettings.default_closing?.[letterData.language] ||
                "We pray for God's blessings upon you.";

            doc.font('Helvetica')
                .fontSize(11)
                .text(closingText, { align: 'left' });

            doc.moveDown(0.5);
            doc.text('Sincerely,', { align: 'left' });

            doc.moveDown(1);

            // Digital Signature (if available)
            if (letterData.signature_url && fs.existsSync(letterData.signature_url)) {
                doc.image(letterData.signature_url, doc.x, doc.y, {
                    width: 150,
                    height: 50
                });
                doc.moveDown(3);
            } else {
                doc.moveDown(2);
            }

            // Signer Information
            doc.font('Helvetica-Bold')
                .fontSize(11)
                .fillColor('#000000')
                .text(letterData.signer_name || 'Pastor David Nasernejad', { align: 'left' });

            doc.font('Helvetica')
                .fontSize(10)
                .fillColor('#666666')
                .text(letterData.signer_title || 'Senior Pastor', { align: 'left' });

            doc.text(letterSettings.church_name.en, { align: 'left' });

            // ==========================================
            // FOOTER (on all pages)
            // ==========================================

            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);

                // Footer line
                doc.moveTo(60, doc.page.height - 50)
                    .lineTo(535, doc.page.height - 50)
                    .strokeOpacity(0.2)
                    .stroke('#5CE1E6');

                // Footer text
                doc.font('Helvetica')
                    .fontSize(8)
                    .fillColor('#999999')
                    .text(
                        `${letterSettings.church_name.en} | ${letterSettings.phone} | ${letterSettings.email}`,
                        60,
                        doc.page.height - 40,
                        {
                            width: 475,
                            align: 'center'
                        }
                    );

                // Page number
                doc.text(
                    `Page ${i + 1} of ${range.count}`,
                    60,
                    doc.page.height - 40,
                    {
                        width: 475,
                        align: 'right'
                    }
                );
            }

            // Finalize PDF
            doc.end();

            stream.on('finish', async () => {
                try {
                    // Add password protection if requested
                    if (letterData.pdf_password) {
                        const protectedPath = await addPasswordProtection(filepath, letterData.pdf_password);
                        resolve(protectedPath);
                    } else {
                        resolve(filepath);
                    }
                } catch (err) {
                    reject(err);
                }
            });

            stream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Add password protection to PDF
 * @param {string} pdfPath - Path to unprotected PDF
 * @param {string} password - Password to set
 * @returns {Promise<string>} Path to protected PDF
 */
async function addPasswordProtection(pdfPath, password) {
    try {
        const existingPdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFLib.load(existingPdfBytes);

        // Encrypt the PDF
        const pdfBytes = await pdfDoc.save({
            userPassword: password,
            ownerPassword: password + '_owner_' + Date.now(),
            permissions: {
                printing: 'highResolution',
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: false,
                contentAccessibility: true,
                documentAssembly: false
            }
        });

        const protectedPath = pdfPath.replace('.pdf', '-protected.pdf');
        fs.writeFileSync(protectedPath, pdfBytes);

        // Remove unprotected version
        fs.unlinkSync(pdfPath);

        return protectedPath;
    } catch (error) {
        console.error('Password protection error:', error);
        throw new Error('Failed to add password protection to PDF');
    }
}

/**
 * Generate a random strong password
 * @returns {string} Random password
 */
function generateStrongPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    return password;
}

module.exports = {
    generateLetterPDF,
    addPasswordProtection,
    generateStrongPassword
};
