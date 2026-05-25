'use server';

import { createClient } from '@/utils/supabase/server';
import { requireRole } from '@/utils/rbac';
import { sendMail } from '@/lib/mailer';
import { randomBytes } from 'crypto';

export type IntakeStatus = 'pending' | 'submitted' | 'used' | 'expired';

export interface IntakeField {
  key: string;
  label: string;
  labelFa: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'select';
  required: boolean;
  options?: string[]; // for select
}

export interface CreateIntakeOptions {
  templateType: 'letter' | 'receipt' | 'invoice';
  templateName?: string;
  templateLetterId?: string;
  requiredFields: IntakeField[];
  messageToUser?: string;
  folderName?: string;
}

// ─── Predefined fields for quick selection ────────────────────────────────────
export const INTAKE_FIELD_PRESETS: IntakeField[] = [
  { key: 'full_name',      label: 'Full Name',          labelFa: 'نام و نام خانوادگی',    type: 'text',     required: true  },
  { key: 'first_name',     label: 'First Name',         labelFa: 'نام',                    type: 'text',     required: true  },
  { key: 'last_name',      label: 'Last Name',          labelFa: 'نام خانوادگی',          type: 'text',     required: true  },
  { key: 'email',          label: 'Email Address',      labelFa: 'آدرس ایمیل',             type: 'email',    required: false },
  { key: 'phone',          label: 'Phone Number',       labelFa: 'شماره تلفن',             type: 'phone',    required: false },
  { key: 'address',        label: 'Full Address',       labelFa: 'آدرس کامل',              type: 'textarea', required: false },
  { key: 'city',           label: 'City',               labelFa: 'شهر',                    type: 'text',     required: false },
  { key: 'state',          label: 'State',              labelFa: 'ایالت',                  type: 'text',     required: false },
  { key: 'zip',            label: 'ZIP Code',           labelFa: 'کد پستی',               type: 'text',     required: false },
  { key: 'country',        label: 'Country',            labelFa: 'کشور',                   type: 'text',     required: false },
  { key: 'case_number',    label: 'Case Number',        labelFa: 'شماره پرونده',           type: 'text',     required: false },
  { key: 'date_of_birth',  label: 'Date of Birth',      labelFa: 'تاریخ تولد',             type: 'date',     required: false },
  { key: 'nationality',    label: 'Nationality',        labelFa: 'ملیت',                   type: 'text',     required: false },
  { key: 'membership_id',  label: 'Membership ID',      labelFa: 'شناسه عضویت',            type: 'text',     required: false },
  { key: 'organization',   label: 'Organization/Agency',labelFa: 'سازمان / ارگان',         type: 'text',     required: false },
  { key: 'request_type',   label: 'Request Type',       labelFa: 'نوع درخواست',            type: 'select',   required: true,
    options: ['Immigration/Visa', 'Tax/IRS', 'Employment', 'Membership', 'Legal', 'Financial', 'Other']
  },
  { key: 'description',    label: 'Additional Details', labelFa: 'توضیحات تکمیلی',        type: 'textarea', required: false },
  { key: 'custom_field',   label: 'Custom Field',       labelFa: 'فیلد دلخواه',            type: 'text',     required: false },
];

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
        expires_at: null, // no expiry by default
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

  // Fetch the request
  const { data: request, error: fetchError } = await supabase
    .from('intake_requests')
    .select('*')
    .eq('token', token)
    .single();

  if (fetchError || !request) return { error: 'Invalid link' };
  if (request.status !== 'pending') return { error: 'already_submitted' };

  // Update status
  const { error: updateError } = await supabase
    .from('intake_requests')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      submitted_data: submittedData,
    })
    .eq('token', token);

  if (updateError) return { error: updateError.message };

  // Send confirmation email to user if they provided an email
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
      // Don't fail the submission if email fails
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
