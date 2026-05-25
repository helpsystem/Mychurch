'use server';

/**
 * Intake Request Server Actions
 * 
 * IMPORTANT: This file uses "use server" — it may ONLY export async functions.
 * All types and constants are in @/types/intake
 */

import { createClient } from '@/utils/supabase/server';
import { requireRole } from '@/utils/rbac';
import { sendMail } from '@/lib/mailer';
import { randomBytes } from 'crypto';
import type { CreateIntakeOptions, IntakeStatus } from '@/types/intake';

export type { IntakeStatus } from '@/types/intake';
export type { IntakeField, CreateIntakeOptions } from '@/types/intake';

// ─── Create a new intake request ─────────────────────────────────────────────
export async function createIntakeRequest(opts: CreateIntakeOptions) {
  try {
    await requireRole(['Admin', 'Leader']);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const token = randomBytes(32).toString('hex');

    const { data, error } = await supabase
      .from('intake_requests')
      .insert({
        token,
        created_by: user.email,
        status: 'pending',
        template_type: opts.templateType,
        template_name: opts.templateName,
        template_letter_id: opts.templateLetterId,
        required_fields: opts.requiredFields,
        message_to_user: opts.messageToUser || '',
        folder_name: opts.folderName || 'General',
        expires_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('[IntakeRequest] create error:', error);
      return { error: error.message };
    }

    return { data, token };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─── Get a single intake request by token (PUBLIC - no auth) ─────────────────
export async function getIntakeRequest(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('intake_requests')
    .select('id, token, status, template_type, template_name, required_fields, message_to_user, expires_at, created_at')
    .eq('token', token)
    .single();

  if (error || !data) return { error: 'Not found' };
  if (data.status === 'submitted' || data.status === 'used') return { error: 'already_submitted', data };
  return { data };
}

// ─── Submit intake form (PUBLIC - no auth needed) ─────────────────────────────
export async function submitIntakeForm(token: string, submittedData: Record<string, string>) {
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from('intake_requests')
    .select('*')
    .eq('token', token)
    .single();

  if (fetchError || !request) return { error: 'Invalid link' };
  if (request.status !== 'pending') return { error: 'already_submitted' };

  const { error: updateError } = await supabase
    .from('intake_requests')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_data: submittedData,
    })
    .eq('token', token);

  if (updateError) return { error: updateError.message };

  const userEmail = submittedData['email'];
  if (userEmail) {
    try {
      await sendMail({
        to: userEmail,
        subject: 'Your Request Has Been Received | درخواست شما دریافت شد',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; background:#f4f4f5; padding: 40px 10px; margin:0;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <table width="100%" style="max-width:600px; background:#fff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#1e1b4b,#312e81); padding:32px; text-align:center;">
                      <img src="https://www.iranianchurchdc.com/logo-transparent.png" alt="Church Logo" style="height:50px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
                      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900;">Request Received ✓</h1>
                      <p style="color:#a5b4fc;margin:8px 0 0;font-size:13px;">Iranian Christian Church of Washington D.C.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 40px;">
                      <p style="color:#1c1917;font-size:15px;line-height:1.7;">
                        Dear <strong>${submittedData['full_name'] || submittedData['first_name'] || 'Applicant'}</strong>,<br><br>
                        We have successfully received your information. Our team will review your request and prepare the necessary documents shortly.<br><br>
                        If you have any questions, please contact us at <a href="mailto:info@iranianchurchdc.com" style="color:#4f46e5;">info@iranianchurchdc.com</a>
                      </p>
                      <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />
                      <p style="color:#64748b;font-size:13px;direction:rtl;text-align:right;font-family:'Tahoma',sans-serif;">
                        درخواست شما با موفقیت دریافت شد. تیم ما به زودی اسناد لازم را آماده خواهد کرد.<br>
                        برای سؤال با ما در ارتباط باشید: <a href="mailto:info@iranianchurchdc.com" style="color:#4f46e5;">info@iranianchurchdc.com</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#f8fafc;border-top:1px solid #e4e4e7;padding:20px 40px;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#71717a;">Iranian Christian Church of Washington DC &nbsp;|&nbsp; iranianchurchdc.com</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      });
    } catch (emailErr) {
      console.warn('[Intake] Failed to send confirmation email:', emailErr);
    }
  }

  return { success: true };
}

// ─── Get all intake requests for admin ───────────────────────────────────────
export async function getMyIntakeRequests(status?: IntakeStatus) {
  try {
    await requireRole(['Admin', 'Leader']);
    const supabase = await createClient();

    let query = supabase
      .from('intake_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { data: data || [] };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─── Mark intake as used in a document ───────────────────────────────────────
export async function markIntakeAsUsed(requestId: string, documentId?: string) {
  try {
    await requireRole(['Admin', 'Leader']);
    const supabase = await createClient();

    const { error } = await supabase
      .from('intake_requests')
      .update({
        status: 'used',
        used_in_document_id: documentId || null,
      })
      .eq('id', requestId);

    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─── Delete an intake request ─────────────────────────────────────────────────
export async function deleteIntakeRequest(requestId: string) {
  try {
    await requireRole(['Admin', 'Leader']);
    const supabase = await createClient();
    const { error } = await supabase.from('intake_requests').delete().eq('id', requestId);
    if (error) return { error: error.message };
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
