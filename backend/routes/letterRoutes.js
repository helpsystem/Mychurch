// backend/routes/letterRoutes.js
// Official Letter Management Routes

const express = require('express');
const router = express.Router();
const { pool } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
    draftLetter,
    improveLetter,
    suggestSubject,
    generateBilingualLetter
} = require('../services/letterAIService');
const { generateLetterPDF, generateStrongPassword } = require('../services/pdfService');
const nodemailer = require('nodemailer');
const path = require('path');

// Email transporter configuration
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * GET /api/letters
 * Get all letters (with pagination and filters)
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            search,
            year
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = `
      SELECT l.*, u.name as created_by_name 
      FROM official_letters l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE 1=1
    `;

        const params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND l.status = $${paramCount}`;
            params.push(status);
        }

        if (search) {
            paramCount++;
            query += ` AND (
        l.letter_number ILIKE $${paramCount} OR 
        l.recipient_name ILIKE $${paramCount} OR
        l.subject::text ILIKE $${paramCount}
      )`;
            params.push(`%${search}%`);
        }

        if (year) {
            paramCount++;
            query += ` AND EXTRACT(YEAR FROM l.letter_date) = $${paramCount}`;
            params.push(year);
        }

        query += ` ORDER BY l.letter_date DESC, l.created_at DESC`;
        query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM official_letters WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (status) {
            countParamCount++;
            countQuery += ` AND status = $${countParamCount}`;
            countParams.push(status);
        }

        if (search) {
            countParamCount++;
            countQuery += ` AND (
        letter_number ILIKE $${countParamCount} OR 
        recipient_name ILIKE $${countParamCount} OR
        subject::text ILIKE $${countParamCount}
      )`;
            countParams.push(`%${search}%`);
        }

        if (year) {
            countParamCount++;
            countQuery += ` AND EXTRACT(YEAR FROM letter_date) = $${countParamCount}`;
            countParams.push(year);
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            letters: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get letters error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch letters'
        });
    }
});

/**
 * GET /api/letters/next-number
 * Get next letter number
 */
router.get('/next-number', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT get_next_letter_number() as letter_number');

        res.json({
            success: true,
            letterNumber: result.rows[0].letter_number
        });
    } catch (error) {
        console.error('Get next number error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate letter number'
        });
    }
});

/**
 * GET /api/letters/:id
 * Get specific letter
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM official_letters WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Letter not found'
            });
        }

        res.json({
            success: true,
            letter: result.rows[0]
        });

    } catch (error) {
        console.error('Get letter error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch letter'
        });
    }
});

/**
 * POST /api/letters
 * Create new letter
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            recipient_name,
            recipient_title,
            recipient_organization,
            recipient_address,
            recipient_email,
            subject,
            body,
            language = 'en',
            letter_date
        } = req.body;

        // Validate required fields
        if (!recipient_name || !subject || !body) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get next letter number
        const numberResult = await pool.query('SELECT get_next_letter_number() as letter_number');
        const letterNumber = numberResult.rows[0].letter_number;

        // Insert letter
        const result = await pool.query(`
      INSERT INTO official_letters (
        letter_number, recipient_name, recipient_title, recipient_organization,
        recipient_address, recipient_email, subject, body, language,
        letter_date, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
            letterNumber,
            recipient_name,
            recipient_title,
            recipient_organization,
            recipient_address,
            recipient_email,
            subject,
            body,
            language,
            letter_date || new Date(),
            req.user.id,
            'draft'
        ]);

        res.status(201).json({
            success: true,
            letter: result.rows[0]
        });

    } catch (error) {
        console.error('Create letter error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create letter'
        });
    }
});

/**
 * PUT /api/letters/:id
 * Update letter
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            recipient_name,
            recipient_title,
            recipient_organization,
            recipient_address,
            recipient_email,
            subject,
            body,
            language,
            letter_date
        } = req.body;

        const result = await pool.query(`
      UPDATE official_letters SET
        recipient_name = COALESCE($1, recipient_name),
        recipient_title = COALESCE($2, recipient_title),
        recipient_organization = COALESCE($3, recipient_organization),
        recipient_address = COALESCE($4, recipient_address),
        recipient_email = COALESCE($5, recipient_email),
        subject = COALESCE($6, subject),
        body = COALESCE($7, body),
        language = COALESCE($8, language),
        letter_date = COALESCE($9, letter_date),
        updated_at = NOW()
      WHERE id = $10 AND status = 'draft'
      RETURNING *
    `, [
            recipient_name,
            recipient_title,
            recipient_organization,
            recipient_address,
            recipient_email,
            subject,
            body,
            language,
            letter_date,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Letter not found or already signed'
            });
        }

        res.json({
            success: true,
            letter: result.rows[0]
        });

    } catch (error) {
        console.error('Update letter error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update letter'
        });
    }
});

/**
 * POST /api/letters/:id/sign
 * Sign letter and generate PDF
 */
router.post('/:id/sign', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { signer_id, generate_password = true } = req.body;

        // Get letter
        const letterResult = await pool.query(
            'SELECT * FROM official_letters WHERE id = $1',
            [id]
        );

        if (letterResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Letter not found'
            });
        }

        const letter = letterResult.rows[0];

        // Get signer info
        const signerResult = await pool.query(
            'SELECT * FROM leaders WHERE id = $1',
            [signer_id || req.user.leader_id]
        );

        if (signerResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Signer not found'
            });
        }

        const signer = signerResult.rows[0];

        // Get letter settings
        const settingsResult = await pool.query(
            'SELECT * FROM letter_settings WHERE id = 1'
        );
        const settings = settingsResult.rows[0];

        // Generate password
        const pdfPassword = generate_password ? generateStrongPassword() : null;

        // Prepare letter data for PDF
        const letterData = {
            ...letter,
            signer_name: signer.name?.en || signer.name,
            signer_title: signer.title?.en || signer.title,
            signature_url: signer.image_url,
            pdf_password: pdfPassword
        };

        // Generate PDF
        const pdfPath = await generateLetterPDF(letterData, settings);

        // Update letter
        const updateResult = await pool.query(`
      UPDATE official_letters SET
        signed_by = $1,
        signer_name = $2,
        signer_title = $3,
        signature_url = $4,
        signed_at = NOW(),
        pdf_url = $5,
        pdf_password = $6,
        status = 'signed',
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [
            signer_id,
            letterData.signer_name,
            letterData.signer_title,
            letterData.signature_url,
            pdfPath,
            pdfPassword,
            id
        ]);

        res.json({
            success: true,
            letter: updateResult.rows[0],
            pdfPassword: pdfPassword // DON'T send this in production - return it separately
        });

    } catch (error) {
        console.error('Sign letter error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sign letter'
        });
    }
});

/**
 * POST /api/letters/:id/send-email
 * Send letter via email
 */
router.post('/:id/send-email', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { recipients, message } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Recipients array is required'
            });
        }

        // Get letter
        const result = await pool.query(
            'SELECT * FROM official_letters WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Letter not found'
            });
        }

        const letter = result.rows[0];

        if (letter.status !== 'signed' || !letter.pdf_url) {
            return res.status(400).json({
                success: false,
                message: 'Letter must be signed before sending'
            });
        }

        // Create email transporter
        const transporter = createEmailTransporter();

        // Send email
        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@iranianchurchdc.org',
            to: recipients.join(', '),
            subject: `Official Letter: ${letter.letter_number}`,
            html: `
        <p>Dear Recipient,</p>
        <p>${message || 'Please find attached the official letter from Iranian Christian Church of D.C.'}</p>
        <p>Letter Number: <strong>${letter.letter_number}</strong></p>
        <p>Date: <strong>${new Date(letter.letter_date).toLocaleDateString()}</strong></p>
        ${letter.pdf_password ? `<p><strong>PDF Password:</strong> ${letter.pdf_password}</p>` : ''}
        <p>Best regards,<br/>Iranian Christian Church of D.C.</p>
      `,
            attachments: [
                {
                    filename: `${letter.letter_number}.pdf`,
                    path: letter.pdf_url
                }
            ]
        };

        await transporter.sendMail(mailOptions);

        // Update letter
        await pool.query(`
      UPDATE official_letters SET
        email_sent_at = NOW(),
        email_recipients = $1,
        status = 'sent',
        updated_at = NOW()
      WHERE id = $2
    `, [recipients, id]);

        res.json({
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email'
        });
    }
});

/**
 * POST /api/letters/ai/draft
 * Generate letter draft with AI
 */
router.post('/ai/draft', authenticateToken, async (req, res) => {
    try {
        const { type, recipient, keyPoints, tone, language } = req.body;

        const draft = await draftLetter({
            type,
            recipient,
            keyPoints,
            tone,
            language
        });

        res.json({
            success: true,
            draft
        });

    } catch (error) {
        console.error('AI draft error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate draft'
        });
    }
});

/**
 * POST /api/letters/ai/improve
 * Improve letter text with AI
 */
router.post('/ai/improve', authenticateToken, async (req, res) => {
    try {
        const { text, language } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }

        const improved = await improveLetter(text, language);

        res.json({
            success: true,
            improved
        });

    } catch (error) {
        console.error('AI improve error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to improve text'
        });
    }
});

/**
 * POST /api/letters/ai/suggest-subject
 * Suggest subject line with AI
 */
router.post('/ai/suggest-subject', authenticateToken, async (req, res) => {
    try {
        const { bodyText, language } = req.body;

        if (!bodyText) {
            return res.status(400).json({
                success: false,
                message: 'Body text is required'
            });
        }

        const subject = await suggestSubject(bodyText, language);

        res.json({
            success: true,
            subject
        });

    } catch (error) {
        console.error('AI suggest subject error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to suggest subject'
        });
    }
});

/**
 * DELETE /api/letters/:id
 * Delete letter (soft delete)
 */
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE official_letters SET archived = true WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Letter not found'
            });
        }

        res.json({
            success: true,
            message: 'Letter archived successfully'
        });

    } catch (error) {
        console.error('Delete letter error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete letter'
        });
    }
});

module.exports = router;
