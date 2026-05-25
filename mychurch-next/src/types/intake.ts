/**
 * Intake Request Types and Constants (shared — no server dependency)
 * 
 * This file is safe to import in both Server and Client components.
 * Do NOT add "use server" or "use client" here.
 */

export type IntakeStatus = 'pending' | 'submitted' | 'used' | 'expired';

export interface IntakeField {
  key: string;
  label: string;
  labelFa: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'select';
  required: boolean;
  options?: string[];
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
  { key: 'full_name',      label: 'Full Name',           labelFa: 'نام و نام خانوادگی',   type: 'text',     required: true  },
  { key: 'first_name',     label: 'First Name',          labelFa: 'نام',                   type: 'text',     required: true  },
  { key: 'last_name',      label: 'Last Name',           labelFa: 'نام خانوادگی',          type: 'text',     required: true  },
  { key: 'email',          label: 'Email Address',       labelFa: 'آدرس ایمیل',            type: 'email',    required: false },
  { key: 'phone',          label: 'Phone Number',        labelFa: 'شماره تلفن',            type: 'phone',    required: false },
  { key: 'address',        label: 'Full Address',        labelFa: 'آدرس کامل',             type: 'textarea', required: false },
  { key: 'city',           label: 'City',                labelFa: 'شهر',                   type: 'text',     required: false },
  { key: 'state',          label: 'State',               labelFa: 'ایالت',                 type: 'text',     required: false },
  { key: 'zip',            label: 'ZIP Code',            labelFa: 'کد پستی',               type: 'text',     required: false },
  { key: 'country',        label: 'Country',             labelFa: 'کشور',                  type: 'text',     required: false },
  { key: 'case_number',    label: 'Case Number',         labelFa: 'شماره پرونده',          type: 'text',     required: false },
  { key: 'date_of_birth',  label: 'Date of Birth',       labelFa: 'تاریخ تولد',            type: 'date',     required: false },
  { key: 'nationality',    label: 'Nationality',         labelFa: 'ملیت',                  type: 'text',     required: false },
  { key: 'membership_id',  label: 'Membership ID',       labelFa: 'شناسه عضویت',           type: 'text',     required: false },
  { key: 'organization',   label: 'Organization/Agency', labelFa: 'سازمان / ارگان',        type: 'text',     required: false },
  { key: 'request_type',   label: 'Request Type',        labelFa: 'نوع درخواست',           type: 'select',   required: true,
    options: ['Immigration/Visa', 'Tax/IRS', 'Employment', 'Membership', 'Legal', 'Financial', 'Other']
  },
  { key: 'description',    label: 'Additional Details',  labelFa: 'توضیحات تکمیلی',       type: 'textarea', required: false },
  { key: 'custom_field',   label: 'Custom Field',        labelFa: 'فیلد دلخواه',           type: 'text',     required: false },
];
