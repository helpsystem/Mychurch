"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { Plus, Printer, CheckCircle2, ArrowLeft, Loader2, Sparkles, FileText, Wand2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { LetterDoc, DEFAULT_CHURCH, LETTER_TEMPLATES, US_ADDRESS_SUGGESTIONS, type DocHistoryItem, toEnglishDigits } from "../DocumentsClient";
import { getDocumentSettings } from "@/actions/documentSettings";
import { saveDocument } from "@/actions/documents";

export default function LettersClient() {
  const [church, setChurch] = useState(DEFAULT_CHURCH);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editLang, setEditLang] = useState<"en" | "fa">("en");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyFa, setBodyFa] = useState("");
  const [letterTo, setLetterTo] = useState("");
  const [letterToAddress, setLetterToAddress] = useState("");
  const [letterSubject, setLetterSubject] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [docNumber, setDocNumber] = useState(() => `ICW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000 + 1000))}`);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [selectedTpl, setSelectedTpl] = useState<typeof LETTER_TEMPLATES[number] | null>(null);

  // References for Printing
  const letterRef = useRef<HTMLDivElement>(null);
  const onPrintLetter = useReactToPrint({ contentRef: letterRef });

  // AI Loading States
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingEnhance, setLoadingEnhance] = useState(false);
  const [loadingTranslate, setLoadingTranslate] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const dbSettings = await getDocumentSettings();
        if (dbSettings) setChurch(prev => ({ ...prev, ...dbSettings }));
      } catch (e) {
        console.warn("Failed to load church settings", e);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleApplyTemplate = (tpl: typeof LETTER_TEMPLATES[number]) => {
    setSelectedTpl(tpl);
    setBodyEn(tpl.bodyEn || "");
    setBodyFa(tpl.bodyFa || "");
    setLetterTo(tpl.toEn || "");
    setLetterSubject(tpl.subjectEn || "");
    setPlaceholderValues({});
  };

  const detectedPlaceholders = useMemo(() => {
    const listEn = (bodyEn || "").match(/\[([^\]]+)\]/g) || [];
    const listFa = (bodyFa || "").match(/\[([^\]]+)\]/g) || [];
    const listSub = (letterSubject || "").match(/\[([^\]]+)\]/g) || [];
    const listTo = (letterTo || "").match(/\[([^\]]+)\]/g) || [];
    const listRec = (recipientName || "").match(/\[([^\]]+)\]/g) || [];
    const allMatches = [...listEn, ...listFa, ...listSub, ...listTo, ...listRec];
    const unique = new Set<string>();
    allMatches.forEach(item => unique.add(item.slice(1, -1)));
    return Array.from(unique);
  }, [bodyEn, bodyFa, letterSubject, letterTo, recipientName]);

  const replacePlaceholders = (text: string, values: Record<string, string>): string => {
    if (!text) return "";
    return text.replace(/\[([^\]]+)\]/g, (match: string, key: string) => {
      const parsedVal = values[key] !== undefined && values[key] !== "" ? values[key] : match;
      return toEnglishDigits(parsedVal);
    });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    
    const item: DocHistoryItem = {
      id: crypto.randomUUID(),
      type: "letter",
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      timestamp: Date.now(),
      refNo: docNumber,
      recipient: recipientName || letterTo || "Unspecified",
      subject: letterSubject || "No Subject",
      bodyEn: replacePlaceholders(bodyEn, placeholderValues),
      bodyFa: replacePlaceholders(bodyFa, placeholderValues),
      toAddress: letterToAddress,
    };

    const result = await saveDocument({
      document_type: "letter",
      title: item.subject,
      description: `Reference: ${item.refNo}`,
      document_content: item,
      recipient_name: item.recipient,
      tags: ["letter"],
      is_draft: false
    }, false);

    if (result.error) toast.error("Failed to save letter to registry.");
    else toast.success("Letter saved to registry successfully!");
    setSaving(false);
  };

  const [aiTopic, setAiTopic] = useState("");
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) { toast.error("Enter a topic first"); return; }
    setLoadingGenerate(true);
    try {
      const res = await fetch("/api/ai/letters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate", input: aiTopic }) });
      if (!res.ok) throw new Error("API Failed");
      const data = await res.json();
      setBodyEn(data.text);
      setEditLang("en");
      toast.success("Draft Generated!");
    } catch (e) { toast.error("AI Generation failed"); }
    finally { setLoadingGenerate(false); }
  };

  const handleAIEnhance = async () => {
    const txt = editLang === "en" ? bodyEn : bodyFa;
    if (!txt.trim()) return;
    setLoadingEnhance(true);
    try {
      const res = await fetch("/api/ai/letters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "enhance", input: txt, lang: editLang }) });
      if (!res.ok) throw new Error("API Failed");
      const data = await res.json();
      if (editLang === "en") setBodyEn(data.text); else setBodyFa(data.text);
      toast.success("Text Enhanced!");
    } catch (e) { toast.error("AI Enhance failed"); }
    finally { setLoadingEnhance(false); }
  };

  const handleAITranslate = async () => {
    const fromLang = editLang === "en" ? "en" : "fa";
    const toLang = editLang === "en" ? "fa" : "en";
    const txt = editLang === "en" ? bodyEn : bodyFa;
    if (!txt.trim()) return;
    setLoadingTranslate(true);
    try {
      const res = await fetch("/api/ai/letters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "translate", input: txt, targetLang: toLang }) });
      if (!res.ok) throw new Error("API Failed");
      const data = await res.json();
      if (toLang === "en") { setBodyEn(data.text); setEditLang("en"); } 
      else { setBodyFa(data.text); setEditLang("fa"); }
      toast.success("Translated Successfully!");
    } catch (e) { toast.error("Translation failed"); }
    finally { setLoadingTranslate(false); }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-tertiary" /></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto relative z-10 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-display-xl font-display-xl text-on-surface mb-2">Document Generator</h2>
          <p className="text-body-base font-body-base text-on-surface-variant font-scripture-calligraphy italic">Create official letters with bilingual support and live preview.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.location.href = '/admin/documents'} className="glass-panel text-on-surface-variant px-4 py-2 rounded-lg font-body-bold flex items-center gap-2 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Registry
          </button>
          <button onClick={handleSaveDraft} disabled={saving} className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Draft
          </button>
          {/* @ts-ignore */}
          <button onClick={onPrintLetter} className="px-6 py-2 rounded-lg font-body-bold flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-[0_4px_12px_rgba(var(--color-primary),0.3)]">
            <Printer className="w-4 h-4" /> Print & Finalize
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left Panel: Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Template Selection */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <h3 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Template Selection
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-2">
              {LETTER_TEMPLATES.map((tpl) => (
                <label key={tpl.id} className="cursor-pointer" onClick={() => handleApplyTemplate(tpl)}>
                  <input type="radio" name="template" className="peer sr-only" checked={selectedTpl?.id === tpl.id} readOnly />
                  <div className="p-3 rounded-lg border border-white/10 peer-checked:border-primary peer-checked:bg-primary/10 transition-all text-center h-full flex flex-col items-center justify-center">
                    <FileText className={`w-5 h-5 mb-1 ${selectedTpl?.id === tpl.id ? 'text-primary' : 'text-on-surface-variant'}`} />
                    <span className="text-sm font-medium">{tpl.nameEn}</span>
                  </div>
                </label>
              ))}
            </div>
            {selectedTpl && (
              <button onClick={() => { setSelectedTpl(null); setBodyEn(""); setBodyFa(""); }} className="text-xs text-error mt-2 hover:underline">Clear Template</button>
            )}
          </div>

          {/* Subject Details */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
            <h3 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5" /> Subject Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">Reference No.</label>
                  <input value={docNumber} onChange={e => setDocNumber(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono" />
               </div>
               <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">Recipient / Subject Name</label>
                  <input value={recipientName} onChange={e => setRecipientName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="Mr. John Doe" />
               </div>
               <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">Addressed To</label>
                  <input value={letterTo} onChange={e => setLetterTo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="USCIS, etc." />
               </div>
               <div className="col-span-2">
                  <label className="block text-xs font-label-caps text-on-surface-variant mb-1 uppercase">Subject Line (RE:)</label>
                  <input value={letterSubject} onChange={e => setLetterSubject(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="Letter of Membership" />
               </div>
            </div>
            
            {/* Dynamic Placeholders */}
            {detectedPlaceholders.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <label className="block text-xs font-label-caps text-on-surface-variant mb-3 uppercase">Template Variables</label>
                <div className="space-y-3">
                  {detectedPlaceholders.map(key => (
                    <div key={key} className="flex items-center gap-3 bg-surface-container p-2 rounded-lg border border-white/5">
                      <span className="w-1/3 text-sm font-mono text-tertiary truncate" title={key}>[{key}]</span>
                      <input 
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-on-surface"
                        placeholder="Value..."
                        value={placeholderValues[key] || ""}
                        onChange={(e) => setPlaceholderValues(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* AI Assistance */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
            <h3 className="font-headline-md text-headline-md text-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> AI Assist
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                 <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="E.g., Write a character reference for..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary" />
                 <button onClick={handleAIGenerate} disabled={loadingGenerate} className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-bold hover:bg-primary/30 transition-colors flex items-center gap-2">
                   {loadingGenerate ? <Loader2 className="w-4 h-4 animate-spin" /> : "Draft"}
                 </button>
              </div>
              <div className="flex gap-2 mt-2">
                 <button onClick={handleAIEnhance} disabled={loadingEnhance} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-on-surface-variant hover:bg-white/10 transition-colors flex justify-center items-center gap-2">
                   {loadingEnhance ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Enhance</>}
                 </button>
                 <button onClick={handleAITranslate} disabled={loadingTranslate} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-on-surface-variant hover:bg-white/10 transition-colors flex justify-center items-center gap-2">
                   {loadingTranslate ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Translate</>}
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Editor & Preview */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel rounded-xl p-0 flex flex-col h-full border border-white/10 overflow-hidden min-h-[700px]">
             
             {/* Editor Tabs */}
             <div className="flex bg-surface-container-high border-b border-white/10">
               <button onClick={() => setEditLang("en")} className={`flex-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${editLang === 'en' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-white/5'}`}>English Editor</button>
               <button onClick={() => setEditLang("fa")} className={`flex-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${editLang === 'fa' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-white/5'}`}>Persian (فارسی)</button>
             </div>

             {/* Editor Textarea */}
             <div className="p-4 bg-surface-container flex-1 flex flex-col">
               <textarea 
                 value={editLang === 'en' ? bodyEn : bodyFa}
                 onChange={(e) => editLang === 'en' ? setBodyEn(e.target.value) : setBodyFa(e.target.value)}
                 className="flex-1 w-full bg-black/20 border border-white/5 rounded-lg p-4 text-on-surface focus:outline-none focus:border-primary/50 resize-none font-body-base leading-relaxed"
                 dir={editLang === 'fa' ? 'rtl' : 'ltr'}
                 placeholder={`Write the ${editLang === 'fa' ? 'Persian' : 'English'} letter body here... Use [Brackets] for variables.`}
               />
             </div>
             
             {/* Hidden Print Ref */}
             <div className="hidden">
               <div ref={letterRef}>
                 <LetterDoc 
                   bodyEn={replacePlaceholders(bodyEn, placeholderValues)}
                   bodyFa={replacePlaceholders(bodyFa, placeholderValues)}
                   editLang={editLang}
                   to={replacePlaceholders(letterTo, placeholderValues)}
                   toAddress={letterToAddress}
                   subject={replacePlaceholders(letterSubject, placeholderValues)}
                   recipientName={replacePlaceholders(recipientName, placeholderValues)}
                   refNo={docNumber}
                   church={church}
                 />
               </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
