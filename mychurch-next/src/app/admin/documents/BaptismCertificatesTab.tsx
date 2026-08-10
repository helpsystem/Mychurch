"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, FileText, Printer, Settings, CheckCircle2, XCircle, Trash2, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { CertificateTemplate, type CertificateData } from "./CertificateTemplate";
import {
  getBaptismCertificates,
  createBaptismCertificate,
  updateBaptismCertificate,
  getBaptismSettings,
  updateBaptismSettings
} from "@/actions/baptism";

export default function BaptismCertificatesTab() {
  const [activeView, setActiveView] = useState<"list" | "form" | "settings">("list");
  const [certificates, setCertificates] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<CertificateData>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Certificate-${formData.certificate_number || "Draft"}`,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [certsRes, settingsRes] = await Promise.all([
      getBaptismCertificates(),
      getBaptismSettings()
    ]);
    
    if (certsRes.data) setCertificates(certsRes.data.certificates || []);
    if (settingsRes.data) setSettings(settingsRes.data);
    setLoading(false);
  };

  const handleNew = () => {
    // Generate a temporary auto-number based on year
    const year = new Date().getFullYear();
    const count = certificates.length + 1;
    const tempNum = `ICC-${year}-${count.toString().padStart(4, "0")}`;

    setFormData({
      certificate_number: tempNum,
      church_name_en: "Iranian Christian Church",
      church_name_fa: "کلیسای مسیحی ایرانیان",
      logo_url: settings.logo_url || "",
      seal_url: settings.seal_url || "",
      pastor_signature_url: settings.pastor_signature_url || "",
      certificate_text_en: settings.certificate_text_en || "",
      certificate_text_fa: settings.certificate_text_fa || "",
    });
    setEditingId(null);
    setActiveView("form");
  };

  const handleEdit = (cert: any) => {
    setFormData(cert);
    setEditingId(cert.id);
    setActiveView("form");
  };

  const handleSave = async (status: string) => {
    if (!formData.certificate_number || !formData.recipient_name_en) {
      toast.error("Please fill required fields (Number, Recipient Name)");
      return;
    }

    setSaving(true);
    let res;
    if (editingId) {
      res = await updateBaptismCertificate(editingId, { ...formData, status });
    } else {
      res = await createBaptismCertificate({ ...formData, status });
    }

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Certificate ${status.toLowerCase()} successfully!`);
      loadData();
      if (status === 'ISSUED') {
         // Stay on form to allow printing
         setEditingId(res.data.id);
      } else {
         setActiveView("list");
      }
    }
    setSaving(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const res = await updateBaptismSettings(settings);
    if (res.error) toast.error(res.error);
    else toast.success("Settings updated");
    setSaving(false);
    setActiveView("list");
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER NAV */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="text-amber-500" />
          Baptism Certificates
        </h2>
        <div className="flex gap-2">
          {activeView !== "list" && (
            <button onClick={() => setActiveView("list")} className="px-4 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition">
              Back to List
            </button>
          )}
          {activeView === "list" && (
            <>
              <button onClick={() => setActiveView("settings")} className="px-4 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition flex items-center gap-2">
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button onClick={handleNew} className="px-4 py-2 bg-amber-600 rounded-lg text-sm hover:bg-amber-500 transition flex items-center gap-2 font-bold text-black">
                <Plus className="w-4 h-4" /> New Certificate
              </button>
            </>
          )}
        </div>
      </div>

      {/* LIST VIEW */}
      {activeView === "list" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50 border-b border-white/10">
              <tr>
                <th className="p-4 font-medium">Certificate #</th>
                <th className="p-4 font-medium">Recipient</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-white/40">No certificates found</td></tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 font-mono text-amber-400">{cert.certificate_number}</td>
                    <td className="p-4">
                      <div className="font-bold text-white">{cert.recipient_name_en}</div>
                      <div className="text-xs text-white/50">{cert.recipient_name_fa}</div>
                    </td>
                    <td className="p-4 text-white/70">{cert.baptism_date}</td>
                    <td className="p-4">
                      {cert.status === 'ISSUED' ? (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-xs font-bold">ISSUED</span>
                      ) : (
                        <span className="px-2 py-1 bg-white/10 text-white/70 rounded-md text-xs">DRAFT</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEdit(cert)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition inline-block">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SETTINGS VIEW */}
      {activeView === "settings" && (
        <div className="space-y-6 max-w-2xl bg-white/5 p-6 rounded-2xl border border-white/10">
          <h3 className="font-bold text-lg text-amber-400">Global Certificate Settings</h3>
          <div>
            <label className="block text-xs text-white/50 mb-1">Logo URL</label>
            <input value={settings.logo_url || ""} onChange={e => setSettings({...settings, logo_url: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Official Seal URL (Transparent PNG)</label>
            <input value={settings.seal_url || ""} onChange={e => setSettings({...settings, seal_url: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Pastor Signature URL (Transparent PNG)</label>
            <input value={settings.pastor_signature_url || ""} onChange={e => setSettings({...settings, pastor_signature_url: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Default English Text</label>
            <textarea value={settings.certificate_text_en || ""} onChange={e => setSettings({...settings, certificate_text_en: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm h-24" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Default Persian Text</label>
            <textarea value={settings.certificate_text_fa || ""} onChange={e => setSettings({...settings, certificate_text_fa: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm h-24 text-right" dir="rtl" />
          </div>
          <button onClick={handleSaveSettings} disabled={saving} className="px-6 py-2 bg-amber-600 text-black font-bold rounded-lg hover:bg-amber-500 transition">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}

      {/* FORM VIEW */}
      {activeView === "form" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          
          {/* Data Entry Form */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Certificate Number</label>
                <input value={formData.certificate_number || ""} onChange={e => setFormData({...formData, certificate_number: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm font-mono text-amber-400" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Baptism Date</label>
                <input type="date" value={formData.baptism_date || ""} onChange={e => setFormData({...formData, baptism_date: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Recipient Name (EN)</label>
                <input value={formData.recipient_name_en || ""} onChange={e => setFormData({...formData, recipient_name_en: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Recipient Name (FA)</label>
                <input value={formData.recipient_name_fa || ""} onChange={e => setFormData({...formData, recipient_name_fa: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-right" dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-white/50 mb-1">Date of Birth</label>
                <input type="date" value={formData.date_of_birth || ""} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Parents Names (EN)</label>
                <input value={formData.parents_names_en || ""} onChange={e => setFormData({...formData, parents_names_en: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Parents Names (FA)</label>
                <input value={formData.parents_names_fa || ""} onChange={e => setFormData({...formData, parents_names_fa: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-right" dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Sponsor/Godparent (EN)</label>
                <input value={formData.sponsor_name_en || ""} onChange={e => setFormData({...formData, sponsor_name_en: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Sponsor/Godparent (FA)</label>
                <input value={formData.sponsor_name_fa || ""} onChange={e => setFormData({...formData, sponsor_name_fa: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-right" dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Minister Name (EN)</label>
                <input value={formData.minister_name_en || ""} onChange={e => setFormData({...formData, minister_name_en: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Minister Name (FA)</label>
                <input value={formData.minister_name_fa || ""} onChange={e => setFormData({...formData, minister_name_fa: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-right" dir="rtl" />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button onClick={() => handleSave('DRAFT')} disabled={saving} className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
                {saving ? "..." : "Save Draft"}
              </button>
              <button onClick={() => handleSave('ISSUED')} disabled={saving} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Issue Certificate
              </button>
            </div>
          </div>

          {/* Live Preview & Actions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
              <span className="text-white/70 text-sm">Live Preview (A4 Landscape)</span>
              {/* @ts-ignore */}
              <button onClick={handlePrint} className="px-4 py-2 bg-amber-600 text-black font-bold rounded-lg hover:bg-amber-500 transition flex items-center gap-2 text-sm">
                <Printer className="w-4 h-4" /> Print / Export PDF
              </button>
            </div>

            {/* Container that scales down the template to fit the screen visually */}
            <div className="w-full overflow-hidden border border-white/20 rounded-2xl bg-[#080D1A] shadow-2xl origin-top-left" style={{ transform: 'scale(0.65)', marginBottom: '-30%' }}>
              <CertificateTemplate ref={printRef} data={formData as CertificateData} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
