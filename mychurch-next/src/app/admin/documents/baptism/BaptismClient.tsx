"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, FileText, Printer, Settings, CheckCircle2, XCircle, Trash2, Edit, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { CertificateTemplate, type CertificateData } from "../CertificateTemplate";
import {
  getBaptismCertificates,
  createBaptismCertificate,
  updateBaptismCertificate,
  getBaptismSettings,
  updateBaptismSettings
} from "@/actions/baptism";

export default function BaptismClient() {
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
    const year = new Date().getFullYear();
    const count = certificates.length + 1;
    const tempNum = `IPC-${year}-${count.toString().padStart(4, "0")}`;

    setFormData({
      certificate_number: tempNum,
      church_name_en: "Iranian Presbyterian Church",
      church_name_fa: "کلیسای انجیلی ایرانیان",
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
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-tertiary" /></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto relative z-10 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-display-xl font-display-xl text-on-surface mb-2">Baptism Certificates</h2>
            <p className="text-body-base font-body-base text-on-surface-variant font-scripture-calligraphy italic">Manage & Issue Certificates</p>
          </div>
          
          {activeView !== "list" && (
            <button onClick={() => setActiveView("list")} className="glass-panel text-on-surface-variant px-6 py-2 rounded-lg font-body-bold hover:bg-white/10 transition-colors flex items-center gap-2 border-white/10">
              <ArrowLeft className="w-5 h-5" />
              Back to Registry
            </button>
          )}
        </div>
      </div>

      {/* LIST VIEW */}
      {activeView === "list" && (
        <div className="grid grid-cols-12 gap-6">
          {/* Main Table Area (Span 8) */}
          <div className="col-span-12 xl:col-span-8 glass-panel rounded-xl overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-surface-container-low/50">
              <h3 className="text-headline-md font-headline-md text-on-surface">Recent Certificates</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input className="bg-white/5 border border-outline-variant rounded-full py-1.5 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-all w-64 placeholder:text-outline" placeholder="Search certificates..." type="text"/>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-label-caps font-label-caps text-on-surface-variant bg-surface-container-lowest/50 border-b border-white/5">
                    <th className="p-4 font-normal">ID / شناسه</th>
                    <th className="p-4 font-normal">Name / نام</th>
                    <th className="p-4 font-normal">Date / تاریخ</th>
                    <th className="p-4 font-normal">Status / وضعیت</th>
                    <th className="p-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-body-base font-body-base divide-y divide-white/5">
                  {certificates.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No certificates found in registry</td></tr>
                  ) : (
                    certificates.map((cert) => (
                      <tr key={cert.id} onClick={() => handleEdit(cert)} className="hover:bg-white/5 transition-colors group cursor-pointer">
                        <td className="p-4 text-outline font-mono text-sm">{cert.certificate_number}</td>
                        <td className="p-4">
                          <div className="font-bold text-on-surface">{cert.recipient_name_en}</div>
                          <div className="text-sm text-outline font-scripture-calligraphy" dir="rtl">{cert.recipient_name_fa}</div>
                        </td>
                        <td className="p-4 text-on-surface-variant">{cert.baptism_date}</td>
                        <td className="p-4">
                          {cert.status === 'ISSUED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                              Issued
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-on-surface-variant hover:text-tertiary mx-1"><Edit className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Side Panel Area (Span 4) */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
            <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl"></div>
              <h3 className="text-headline-md font-headline-md mb-4 flex items-center gap-2 text-on-surface">
                <Settings className="w-5 h-5 text-secondary" /> Quick Actions
              </h3>
              <div className="space-y-3">
                <button onClick={handleNew} className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-body-bold">
                  <Plus className="w-5 h-5" /> New Certificate
                </button>
                <button onClick={() => setActiveView("settings")} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-body-bold">
                  <Settings className="w-5 h-5" /> Registry Settings
                </button>
              </div>
            </div>
            
            <div className="glass-panel rounded-xl p-6 flex-1 border border-white/10">
              <h3 className="text-headline-md font-headline-md mb-4 border-b border-white/10 pb-2 text-on-surface">Statistics</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-on-surface-variant">
                    <span className="font-body-base">Total Certificates</span>
                    <span className="font-bold text-on-surface">{certificates.length}</span>
                 </div>
                 <div className="flex justify-between items-center text-on-surface-variant">
                    <span className="font-body-base">Issued</span>
                    <span className="font-bold text-primary">{certificates.filter(c => c.status === 'ISSUED').length}</span>
                 </div>
                 <div className="flex justify-between items-center text-on-surface-variant">
                    <span className="font-body-base">Drafts</span>
                    <span className="font-bold text-secondary">{certificates.filter(c => c.status !== 'ISSUED').length}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS VIEW */}
      {activeView === "settings" && (
        <div className="space-y-6 max-w-3xl glass-panel p-8 rounded-2xl border border-white/10">
          <h3 className="text-headline-lg font-headline-lg text-tertiary mb-6">Global Certificate Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-label-caps text-on-surface-variant mb-2">Logo URL</label>
              <input value={settings.logo_url || ""} onChange={e => setSettings({...settings, logo_url: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-tertiary" />
            </div>
            <div>
              <label className="block text-sm font-label-caps text-on-surface-variant mb-2">Official Seal URL (Transparent PNG)</label>
              <input value={settings.seal_url || ""} onChange={e => setSettings({...settings, seal_url: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-tertiary" />
            </div>
            <div>
              <label className="block text-sm font-label-caps text-on-surface-variant mb-2">Pastor Signature URL (Transparent PNG)</label>
              <input value={settings.pastor_signature_url || ""} onChange={e => setSettings({...settings, pastor_signature_url: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-tertiary" />
            </div>
            <div>
              <label className="block text-sm font-label-caps text-on-surface-variant mb-2">Default English Text</label>
              <textarea value={settings.certificate_text_en || ""} onChange={e => setSettings({...settings, certificate_text_en: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-tertiary h-32" />
            </div>
            <div>
              <label className="block text-sm font-label-caps text-on-surface-variant mb-2">Default Persian Text</label>
              <textarea value={settings.certificate_text_fa || ""} onChange={e => setSettings({...settings, certificate_text_fa: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-tertiary h-32 font-scripture-calligraphy text-right" dir="rtl" />
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/10 flex justify-end">
             <button onClick={handleSaveSettings} disabled={saving} className="px-8 py-3 bg-tertiary/20 text-tertiary border border-tertiary/50 font-body-bold rounded-lg hover:bg-tertiary/30 transition">
               {saving ? "Saving..." : "Save Settings"}
             </button>
          </div>
        </div>
      )}

      {/* FORM VIEW */}
      {activeView === "form" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          
          {/* Data Entry Form */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
            <h3 className="text-headline-lg font-headline-lg text-on-surface border-b border-white/10 pb-4 mb-6">Certificate Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Certificate Number</label>
                <input value={formData.certificate_number || ""} onChange={e => setFormData({...formData, certificate_number: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm font-mono text-secondary focus:border-tertiary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Baptism Date</label>
                <input type="date" value={formData.baptism_date || ""} onChange={e => setFormData({...formData, baptism_date: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:border-tertiary focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Recipient Name (EN)</label>
                <input value={formData.recipient_name_en || ""} onChange={e => setFormData({...formData, recipient_name_en: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:border-tertiary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Recipient Name (FA)</label>
                <input value={formData.recipient_name_fa || ""} onChange={e => setFormData({...formData, recipient_name_fa: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface text-right focus:border-tertiary focus:outline-none font-scripture-calligraphy" dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Date of Birth</label>
                <input type="date" value={formData.date_of_birth || ""} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:border-tertiary focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Parents Names (EN)</label>
                <input value={formData.parents_names_en || ""} onChange={e => setFormData({...formData, parents_names_en: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:border-tertiary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Parents Names (FA)</label>
                <input value={formData.parents_names_fa || ""} onChange={e => setFormData({...formData, parents_names_fa: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface text-right focus:border-tertiary focus:outline-none font-scripture-calligraphy" dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Sponsor/Godparent (EN)</label>
                <input value={formData.sponsor_name_en || ""} onChange={e => setFormData({...formData, sponsor_name_en: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:border-tertiary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Sponsor/Godparent (FA)</label>
                <input value={formData.sponsor_name_fa || ""} onChange={e => setFormData({...formData, sponsor_name_fa: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface text-right focus:border-tertiary focus:outline-none font-scripture-calligraphy" dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Minister Name (EN)</label>
                <input value={formData.minister_name_en || ""} onChange={e => setFormData({...formData, minister_name_en: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:border-tertiary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-label-caps text-on-surface-variant mb-1">Minister Name (FA)</label>
                <input value={formData.minister_name_fa || ""} onChange={e => setFormData({...formData, minister_name_fa: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface text-right focus:border-tertiary focus:outline-none font-scripture-calligraphy" dir="rtl" />
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex justify-between">
              <button onClick={() => handleSave('DRAFT')} disabled={saving} className="px-6 py-2.5 bg-surface-variant text-on-surface-variant rounded-lg hover:bg-surface-variant/80 transition font-body-bold">
                {saving ? "..." : "Save Draft"}
              </button>
              <button onClick={() => handleSave('ISSUED')} disabled={saving} className="px-6 py-2.5 bg-primary/20 border border-primary/50 text-primary font-body-bold rounded-lg hover:bg-primary/30 transition flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Issue Certificate
              </button>
            </div>
          </div>

          {/* Live Preview & Actions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center glass-panel p-4 rounded-xl border border-white/10">
              <span className="text-on-surface-variant text-sm font-label-caps">Live Preview (A4 Landscape)</span>
              {/* @ts-ignore */}
              <button onClick={handlePrint} className="px-4 py-2 bg-tertiary/20 text-tertiary border border-tertiary/50 font-bold rounded-lg hover:bg-tertiary/30 transition flex items-center gap-2 text-sm">
                <Printer className="w-4 h-4" /> Print PDF
              </button>
            </div>

            {/* Container that scales down the template to fit the screen visually */}
            <div className="w-full overflow-hidden border border-white/10 rounded-2xl bg-white shadow-2xl origin-top-left flex justify-center" style={{ transform: 'scale(0.70)', transformOrigin: 'top center', marginBottom: '-25%' }}>
              <CertificateTemplate ref={printRef} data={formData as CertificateData} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
