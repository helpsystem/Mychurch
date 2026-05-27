"use client";

import { useState, useEffect, use } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { getIntakeRequest, submitIntakeForm } from "@/actions/intakeRequests";
import type { IntakeField } from "@/types/intake";
import { CheckCircle2, Loader2, AlertCircle, FileText, Building2, Globe, ChevronRight } from "lucide-react";

interface IntakeData {
  id: string;
  token: string;
  status: string;
  template_type: string;
  template_name?: string;
  required_fields: IntakeField[];
  message_to_user?: string;
  created_at: string;
}

export default function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const { language } = useLanguage();
  const isRtl = language === "fa";

  const [intake, setIntake] = useState<IntakeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [pageLang, setPageLang] = useState<"en" | "fa">("en");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getIntakeRequest(token);
      if (result.error === "already_submitted") {
        setAlreadySubmitted(true);
        setIntake(result.data as IntakeData);
      } else if (result.error) {
        setError(result.error);
      } else {
        setIntake(result.data as IntakeData);
        // Initialize form data
        const init: Record<string, string> = {};
        (result.data?.required_fields as IntakeField[] || []).forEach((f: IntakeField) => {
          init[f.key] = "";
        });
        setFormData(init);
      }
      setLoading(false);
    }
    void load();
  }, [token]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    (intake?.required_fields || []).forEach((field) => {
      if (field.required && !formData[field.key]?.trim()) {
        errors[field.key] = pageLang === "fa" ? "این فیلد الزامی است" : "This field is required";
      }
      if (field.type === "email" && formData[field.key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.key])) {
        errors[field.key] = pageLang === "fa" ? "ایمیل معتبر نیست" : "Invalid email address";
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await submitIntakeForm(token, formData);
      if (result.error === "already_submitted") {
        setAlreadySubmitted(true);
      } else if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (key: string) =>
    `w-full bg-white border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
      validationErrors[key]
        ? "border-red-400 focus:border-red-500"
        : "border-slate-200 focus:border-indigo-500"
    }`;

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading your form...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error && error !== "already_submitted") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full border border-red-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-3">Link Not Found</h1>
          <p className="text-slate-500 mb-3">This form link is invalid or has expired.</p>
          <hr className="border-slate-100 my-4" />
          <p className="text-slate-400 text-sm font-semibold" dir="rtl">لینک فرم نامعتبر یا منقضی شده است.</p>
          <p className="text-slate-400 text-xs mt-2">Please contact the church office for a new link.</p>
        </div>
      </div>
    );
  }

  // ── Already submitted ──
  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-3">Already Submitted</h1>
          <p className="text-slate-500">Your information has already been received. Thank you!</p>
          <hr className="border-slate-100 my-4" />
          <p className="text-slate-500 text-sm" dir="rtl">اطلاعات شما قبلاً دریافت شده است. متشکریم!</p>
        </div>
      </div>
    );
  }

  // ── Success state ──
  if (submitted) {
    const name = formData["full_name"] || formData["first_name"] || "";
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-slate-100">
          {/* Top banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-emerald-500 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">Form Submitted!</h1>
            {name && <p className="text-white/80 font-medium">Thank you, {name}</p>}
          </div>
          {/* Content */}
          <div className="p-8 text-center">
            <p className="text-slate-600 leading-relaxed mb-4">
              Your information has been securely received by the Iranian Christian Church of Washington DC. Our team will review your request and prepare the necessary documents.
            </p>
            {formData["email"] && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700 font-medium mb-4">
                📧 A confirmation has been sent to <strong>{formData["email"]}</strong>
              </div>
            )}
            <hr className="border-slate-100 my-5" />
            <div dir="rtl" className="text-right">
              <p className="text-slate-600 text-sm leading-relaxed font-[Vazirmatn]">
                اطلاعات شما با موفقیت دریافت شد. تیم کلیسا به زودی درخواست شما را بررسی کرده و اسناد لازم را آماده خواهد کرد.
              </p>
              {formData["email"] && (
                <p className="text-indigo-600 text-sm mt-2 font-medium font-[Vazirmatn]">
                  📧 یک ایمیل تأییدیه به آدرس {formData["email"]} ارسال شد.
                </p>
              )}
            </div>
          </div>
          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 text-center">
            <p className="text-xs text-slate-400">Iranian Christian Church of Washington DC &nbsp;|&nbsp; iranianchurchdc.com</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ──
  const typeLabel =
    intake?.template_type === "letter" ? "Official Letter" :
    intake?.template_type === "receipt" ? "Donation Receipt" :
    intake?.template_type === "invoice" ? "Invoice" : "Document";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50" dir={pageLang === "fa" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://www.iranianchurchdc.com/logo-transparent.png" alt="Church Logo" className="h-10 object-contain" />
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <button
              onClick={() => setPageLang("en")}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${pageLang === "en" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-600"}`}
            >EN</button>
            <button
              onClick={() => setPageLang("fa")}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${pageLang === "fa" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-600"}`}
            >فا</button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Title Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white mb-8 shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{typeLabel}</p>
                <h1 className="text-xl font-black leading-tight">
                  {pageLang === "fa" ? "فرم درخواست رسمی" : "Official Request Form"}
                </h1>
              </div>
            </div>
            {intake?.template_name && (
              <p className="text-white/80 text-sm font-medium mb-3">{intake.template_name}</p>
            )}
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Building2 className="w-3.5 h-3.5" />
              <span>Iranian Christian Church of Washington D.C.</span>
            </div>
          </div>
        </div>

        {/* Message from church */}
        {intake?.message_to_user && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-amber-900 text-sm leading-relaxed">
            <p className="font-bold text-xs uppercase tracking-wider text-amber-600 mb-2">
              {pageLang === "fa" ? "پیام از کلیسا" : "Message from the Church"}
            </p>
            <p>{intake.message_to_user}</p>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 space-y-5">
            <div className="mb-2">
              <h2 className="text-lg font-black text-slate-900">
                {pageLang === "fa" ? "لطفاً اطلاعات زیر را تکمیل کنید" : "Please fill in your information"}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {pageLang === "fa" ? "فیلدهای ستاره‌دار الزامی هستند" : "Fields marked with * are required"}
              </p>
            </div>

            {(intake?.required_fields || []).map((field) => {
              const label = pageLang === "fa" ? field.labelFa : field.label;
              return (
                <div key={field.key}>
                  <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    {label}
                    {field.required && <span className="text-red-500 text-base leading-none">*</span>}
                  </label>

                  {field.type === "textarea" ? (
                    <textarea
                      value={formData[field.key] || ""}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      rows={3}
                      className={`${inputCls(field.key)} resize-none`}
                      placeholder={pageLang === "fa" ? `${label} را وارد کنید...` : `Enter ${label.toLowerCase()}...`}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={formData[field.key] || ""}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className={`${inputCls(field.key)} bg-white`}
                    >
                      <option value="">
                        {pageLang === "fa" ? "انتخاب کنید..." : "Select..."}
                      </option>
                      {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      <option value="__custom__">
                        {pageLang === "fa" ? "سایر (توضیح دهید)" : "Other (specify below)"}
                      </option>
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ""}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className={inputCls(field.key)}
                      placeholder={
                        field.type === "email" ? "example@email.com" :
                        field.type === "phone" ? "+1 (XXX) XXX-XXXX" :
                        pageLang === "fa" ? `${label} را وارد کنید...` : `Enter ${label.toLowerCase()}...`
                      }
                      dir={field.type === "email" || field.type === "phone" ? "ltr" : undefined}
                    />
                  )}

                  {/* Custom field for "Other" select option */}
                  {field.type === "select" && formData[field.key] === "__custom__" && (
                    <input
                      type="text"
                      className={`${inputCls(field.key)} mt-2`}
                      placeholder={pageLang === "fa" ? "توضیح دهید..." : "Please specify..."}
                      onChange={e => setFormData(prev => ({ ...prev, [`${field.key}_custom`]: e.target.value }))}
                    />
                  )}

                  {validationErrors[field.key] && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {validationErrors[field.key]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit */}
          <div className="px-8 pb-8 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl py-4 text-base font-black shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
            >
              {submitting
                ? <><Loader2 className="w-5 h-5 animate-spin" />{pageLang === "fa" ? "در حال ارسال..." : "Submitting..."}</>
                : <><span>{pageLang === "fa" ? "ارسال اطلاعات" : "Submit Information"}</span><ChevronRight className="w-5 h-5" /></>
              }
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">
              {pageLang === "fa"
                ? "اطلاعات شما محفوظ و مورد احترام است. فقط برای تهیه سند استفاده می‌شود."
                : "Your information is private and will only be used for document preparation."}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-400 space-y-1">
          <p>Iranian Christian Church of Washington DC</p>
          <p>Washington D.C., USA &nbsp;·&nbsp; iranianchurchdc.com</p>
        </div>
      </div>
    </div>
  );
}
