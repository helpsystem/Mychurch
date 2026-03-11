'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Receipt, 
  Package, 
  Code, 
  Eye, 
  Sparkles,
  Download,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Send
} from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

// --- Default Templates ---
const TEMPLATES = {
  letterhead: {
    id: 'letterhead',
    name: 'سربرگ اداری',
    icon: FileText,
    code: `<div dir="rtl" class="w-full max-w-4xl mx-auto bg-white p-8 shadow-lg min-h-[1122px] flex flex-col relative font-sans text-gray-800">
  <!-- Header -->
  <div class="flex justify-between items-start border-b-4 border-blue-800 pb-6 mb-8">
    <div class="flex items-center gap-4">
      <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-2xl shadow-inner">لوگو</div>
      <div>
        <h1 class="text-3xl font-black text-blue-900 tracking-tight">شرکت توسعه فناوری پارس</h1>
        <p class="text-sm text-gray-500 mt-1 font-medium">پیشرو در ارائه راهکارهای نوین نرم‌افزاری</p>
      </div>
    </div>
    <div class="text-sm flex flex-col gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
      <div class="flex justify-between gap-8"><span>شماره:</span> <span class="font-bold text-gray-800">1402/10/25-01</span></div>
      <div class="flex justify-between gap-8"><span>تاریخ:</span> <span class="font-bold text-gray-800">1402/10/25</span></div>
      <div class="flex justify-between gap-8"><span>پیوست:</span> <span class="font-bold text-gray-800">ندارد</span></div>
    </div>
  </div>
  
  <!-- Content -->
  <div class="flex-grow text-justify leading-loose text-lg px-4">
    <p>جناب آقای / سرکار خانم <strong class="text-blue-900">[نام گیرنده]</strong></p>
    <p>موضوع: <strong class="text-blue-900">[موضوع نامه]</strong></p>
    <br/>
    <p>با سلام و احترام،</p>
    <p>بدینوسیله به استحضار می‌رساند که با توجه به توافقات صورت گرفته در جلسه مورخ [تاریخ جلسه]، پیش‌نویس قرارداد همکاری در زمینه طراحی و توسعه پلتفرم جامع خدمات الکترونیک به پیوست ارسال می‌گردد.</p>
    <p>خواهشمند است پس از بررسی و تایید، مراتب را جهت اقدامات بعدی به این شرکت اعلام فرمایید. پیشاپیش از حسن توجه و همکاری شما سپاسگزاریم.</p>
    <br/>
    <br/>
    <div class="text-left ml-12 mt-8">
      <p class="font-bold text-blue-900 mb-8">با تشکر</p>
      <p class="font-bold">مدیر عامل</p>
      <p class="text-sm text-gray-500">شرکت توسعه فناوری پارس</p>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="mt-8 pt-4 border-t-2 border-blue-100 flex justify-between items-center text-xs text-gray-500 bg-blue-50/50 p-4 rounded-b-lg">
    <div class="flex gap-6">
      <span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> تهران، خیابان ولیعصر، کوچه فناوری، پلاک ۱۲، واحد ۴</span>
      <span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> ۰۲۱-۱۲۳۴۵۶۷۸</span>
    </div>
    <div class="font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">صفحه ۱ از ۱</div>
  </div>
</div>`
  },
  receipt: {
    id: 'receipt',
    name: 'رسید پرداخت وجه',
    icon: Receipt,
    code: `<div dir="rtl" class="w-full max-w-3xl mx-auto bg-white p-10 shadow-xl border border-gray-200 font-sans text-gray-800 rounded-2xl relative overflow-hidden">
  <!-- Decorative background element -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 z-0"></div>
  
  <div class="relative z-10">
    <div class="flex justify-between items-center border-b-2 border-emerald-500 pb-6 mb-8">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h1 class="text-3xl font-black text-emerald-800 tracking-tight">رسید پرداخت وجه</h1>
      </div>
      <div class="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 text-left">
        <div class="flex justify-between gap-4 mb-1"><span>شماره رسید:</span> <span class="font-bold text-gray-900 text-lg">10045</span></div>
        <div class="flex justify-between gap-4"><span>تاریخ:</span> <span class="font-bold text-gray-800">1402/11/05</span></div>
      </div>
    </div>
    
    <div class="space-y-6 text-lg bg-gray-50/50 p-6 rounded-xl border border-gray-100">
      <div class="flex items-center gap-3">
        <span class="text-gray-500 w-32">مبلغ:</span>
        <span class="font-black text-2xl text-emerald-700 bg-emerald-50 px-4 py-1 rounded-lg border border-emerald-100">50,000,000</span>
        <span class="text-gray-500 font-medium">ریال</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-gray-500 w-32">معادل حروف:</span>
        <span class="font-bold text-gray-800">پنجاه میلیون ریال</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-gray-500 w-32">دریافت شد از:</span>
        <span class="font-bold text-gray-800 border-b-2 border-dashed border-gray-300 flex-grow pb-1">شرکت نمونه پرداز</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-gray-500 w-32">بابت:</span>
        <span class="font-bold text-gray-800 border-b-2 border-dashed border-gray-300 flex-grow pb-1">طراحی وب‌سایت، خدمات سئو و پشتیبانی یکساله</span>
      </div>
      <div class="flex items-center gap-3 pt-2">
        <span class="text-gray-500 w-32">به صورت:</span>
        <div class="flex gap-6 font-bold text-gray-700">
          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="pay_type" checked class="w-5 h-5 text-emerald-600 accent-emerald-600"> نقدی</label>
          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="pay_type" class="w-5 h-5 text-emerald-600 accent-emerald-600"> چک</label>
          <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="pay_type" class="w-5 h-5 text-emerald-600 accent-emerald-600"> حواله بانکی</label>
        </div>
      </div>
    </div>
    
    <div class="mt-16 flex justify-between px-12">
      <div class="text-center">
        <p class="mb-12 font-medium text-gray-500">امضا پرداخت کننده</p>
        <div class="w-40 border-b-2 border-gray-300"></div>
      </div>
      <div class="text-center">
        <p class="mb-12 font-medium text-gray-500">امضا و مهر دریافت کننده</p>
        <div class="w-40 border-b-2 border-gray-300"></div>
      </div>
    </div>
  </div>
</div>`
  },
  delivery: {
    id: 'delivery',
    name: 'رسید تحویل کالا',
    icon: Package,
    code: `<div dir="rtl" class="w-full max-w-4xl mx-auto bg-white p-8 shadow-lg border-t-8 border-orange-500 font-sans text-gray-800 rounded-lg">
  <div class="flex justify-between items-center pb-6 mb-6 border-b border-gray-200">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
      </div>
      <div>
        <h1 class="text-3xl font-black text-gray-800">رسید تحویل کالا</h1>
        <p class="text-orange-600 font-medium text-sm mt-1">Delivery Receipt</p>
      </div>
    </div>
    <div class="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
      <div class="flex justify-between gap-6 mb-2"><span>شماره حواله:</span> <span class="font-bold text-gray-900 text-lg">DLV-9876</span></div>
      <div class="flex justify-between gap-6"><span>تاریخ تحویل:</span> <span class="font-bold text-gray-800">1402/12/10</span></div>
    </div>
  </div>
  
  <div class="grid grid-cols-2 gap-6 mb-8">
    <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-2 h-full bg-gray-400"></div>
      <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
        مشخصات فرستنده
      </h3>
      <div class="space-y-2 text-sm">
        <p class="flex justify-between"><span class="text-gray-500">نام:</span> <span class="font-bold">انبار مرکزی دیجی‌کالا</span></p>
        <p class="flex justify-between"><span class="text-gray-500">تلفن:</span> <span class="font-bold" dir="ltr">021-5555555</span></p>
        <p class="flex flex-col mt-2 pt-2 border-t border-gray-200"><span class="text-gray-500 mb-1">آدرس:</span> <span class="font-medium leading-relaxed">تهران، شهرک صنعتی، سوله شماره ۴، بخش ارسال</span></p>
      </div>
    </div>
    <div class="bg-orange-50 p-5 rounded-xl border border-orange-200 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-2 h-full bg-orange-400"></div>
      <h3 class="font-bold text-orange-800 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
        مشخصات گیرنده
      </h3>
      <div class="space-y-2 text-sm">
        <p class="flex justify-between"><span class="text-orange-600/70">نام:</span> <span class="font-bold text-orange-900">فروشگاه نمونه پرداز</span></p>
        <p class="flex justify-between"><span class="text-orange-600/70">تلفن:</span> <span class="font-bold text-orange-900" dir="ltr">071-3333333</span></p>
        <p class="flex flex-col mt-2 pt-2 border-t border-orange-200/50"><span class="text-orange-600/70 mb-1">آدرس:</span> <span class="font-medium leading-relaxed text-orange-900">شیراز، خیابان زند، مجتمع تجاری، طبقه دوم، پلاک ۴۵</span></p>
      </div>
    </div>
  </div>
  
  <div class="rounded-xl overflow-hidden border border-gray-200 mb-8">
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-100 text-gray-700 text-sm">
          <th class="p-3 text-center w-12 border-b border-gray-200">ردیف</th>
          <th class="p-3 text-right border-b border-gray-200">شرح کالا</th>
          <th class="p-3 text-center w-24 border-b border-gray-200">تعداد/مقدار</th>
          <th class="p-3 text-center w-24 border-b border-gray-200">واحد</th>
          <th class="p-3 text-right border-b border-gray-200">ملاحظات</th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="p-3 text-center border-b border-gray-100 text-gray-500">۱</td>
          <td class="p-3 border-b border-gray-100 font-bold text-gray-800">لپ‌تاپ لنوو مدل ThinkPad X1 Carbon</td>
          <td class="p-3 text-center border-b border-gray-100 font-bold text-lg">۲</td>
          <td class="p-3 text-center border-b border-gray-100 text-gray-500">دستگاه</td>
          <td class="p-3 text-gray-500 border-b border-gray-100">پلمپ شرکتی - گارانتی اصلی</td>
        </tr>
        <tr class="hover:bg-gray-50 transition-colors bg-gray-50/50">
          <td class="p-3 text-center border-b border-gray-100 text-gray-500">۲</td>
          <td class="p-3 border-b border-gray-100 font-bold text-gray-800">مانیتور 24 اینچ ال‌جی مدل 24MP400</td>
          <td class="p-3 text-center border-b border-gray-100 font-bold text-lg">۵</td>
          <td class="p-3 text-center border-b border-gray-100 text-gray-500">عدد</td>
          <td class="p-3 text-gray-500 border-b border-gray-100">-</td>
        </tr>
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="p-3 text-center border-b border-gray-100 text-gray-500">۳</td>
          <td class="p-3 border-b border-gray-100 font-bold text-gray-800">موس بی‌سیم لاجیتک M170</td>
          <td class="p-3 text-center border-b border-gray-100 font-bold text-lg">۱۰</td>
          <td class="p-3 text-center border-b border-gray-100 text-gray-500">عدد</td>
          <td class="p-3 text-gray-500 border-b border-gray-100">رنگ مشکی</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="flex justify-between px-12 mt-16 bg-gray-50 p-6 rounded-xl border border-gray-100">
    <div class="text-center">
      <p class="mb-16 font-medium text-gray-500 text-sm">مهر و امضای تحویل دهنده</p>
      <div class="w-48 border-b-2 border-gray-300 mx-auto"></div>
    </div>
    <div class="text-center">
      <p class="mb-16 font-medium text-gray-500 text-sm">مهر و امضای گیرنده (تایید سلامت فیزیکی کالا)</p>
      <div class="w-48 border-b-2 border-gray-300 mx-auto"></div>
    </div>
  </div>
</div>`
  }
};

export default function TemplateEditor() {
  const [activeTemplateId, setActiveTemplateId] = useState('letterhead');
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'ai'>('preview');
  const [codes, setCodes] = useState<Record<string, string>>({
    letterhead: TEMPLATES.letterhead.code,
    receipt: TEMPLATES.receipt.code,
    delivery: TEMPLATES.delivery.code,
  });
  
  const [isCopied, setIsCopied] = useState(false);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiImage, setAiImage] = useState<File | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);

  const activeCode = codes[activeTemplateId];

  const handleCodeChange = (newCode: string) => {
    setCodes(prev => ({
      ...prev,
      [activeTemplateId]: newCode
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAiImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiSubmit = async () => {
    if (!aiPrompt && !aiImage) return;
    
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const parts: any[] = [];
      
      if (aiImagePreview) {
        // Extract base64 data
        const base64Data = aiImagePreview.split(',')[1];
        const mimeType = aiImagePreview.split(';')[0].split(':')[1];
        
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          }
        });
      }
      
      parts.push({
        text: `You are an expert web designer and Tailwind CSS developer. 
        I am working on a Persian (RTL) HTML template. 
        Here is the current HTML code:
        
        \`\`\`html
        ${activeCode}
        \`\`\`
        
        User request: ${aiPrompt || 'Extract data from this image and update the HTML template with it.'}
        
        Instructions:
        1. If the user uploaded an image of a receipt/letterhead, extract the text/data from it and populate the HTML template.
        2. If the user asked for design changes, modify the Tailwind classes and HTML structure accordingly.
        3. ALWAYS return ONLY the raw, complete, updated HTML code. 
        4. DO NOT wrap the code in markdown blocks (like \`\`\`html). Just return the raw HTML string.
        5. Ensure the design remains beautiful, professional, and uses Tailwind CSS. Keep dir="rtl".`
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          systemInstruction: "You are an expert frontend developer. You only output raw HTML with Tailwind CSS classes. No markdown formatting, no explanations."
        }
      });

      let newHtml = response.text || '';
      // Clean up in case the model still outputs markdown
      newHtml = newHtml.replace(/^\`\`\`html\\n/, '').replace(/\\n\`\`\`$/, '').trim();
      
      handleCodeChange(newHtml);
      setActiveTab('preview');
      setAiPrompt('');
      setAiImage(null);
      setAiImagePreview(null);
      
    } catch (error) {
      console.error("AI Error:", error);
      alert("خطا در ارتباط با هوش مصنوعی. لطفا دوباره تلاش کنید.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-vazir text-gray-900" dir="rtl">
      {/* Sidebar */}
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col z-10 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 text-indigo-600 mb-1">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-xl font-black tracking-tight">DocuGenius</h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">قالب‌ساز هوشمند اسناد اداری</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">نوع سند</p>
          {Object.values(TEMPLATES).map((template) => {
            const Icon = template.icon;
            const isActive = activeTemplateId === template.id;
            return (
              <button
                key={template.id}
                onClick={() => setActiveTemplateId(template.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm border border-indigo-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {template.name}
              </button>
            );
          })}
        </div>
        
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            سیستم آماده به کار
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              پیش‌نمایش
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="w-4 h-4" />
              کد HTML
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'ai' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              دستیار هوش مصنوعی
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {isCopied ? 'کپی شد' : 'کپی کد'}
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              چاپ / PDF
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-hidden bg-gray-100/50 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0 overflow-y-auto p-8 print:p-0 print:bg-white"
              >
                <div 
                  className="mx-auto print:shadow-none print:m-0"
                  dangerouslySetInnerHTML={{ __html: activeCode }}
                />
              </motion.div>
            )}

            {activeTab === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0 p-6"
              >
                <div className="h-full bg-gray-900 rounded-xl shadow-inner overflow-hidden flex flex-col border border-gray-800">
                  <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                    <span className="text-gray-400 text-xs font-mono">HTML / Tailwind CSS</span>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                  </div>
                  <textarea
                    value={activeCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="flex-1 w-full bg-transparent text-gray-300 font-mono text-sm p-6 focus:outline-none resize-none"
                    dir="ltr"
                    spellCheck="false"
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0 p-6 flex justify-center items-start overflow-y-auto"
              >
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                  <div className="bg-indigo-600 p-6 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5" />
                      دستیار هوشمند طراحی
                    </h2>
                    <p className="text-indigo-100 text-sm">
                      می‌توانید تغییرات ظاهری را درخواست کنید یا تصویر یک رسید/نامه را آپلود کنید تا اطلاعات آن استخراج و در قالب جایگذاری شود.
                    </p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">درخواست شما</label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="مثال: رنگ پس‌زمینه هدر را به آبی تیره تغییر بده و فونت عنوان را بزرگتر کن..."
                        className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-32 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">آپلود تصویر (اختیاری)</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {aiImagePreview ? (
                          <div className="flex flex-col items-center">
                            <img src={aiImagePreview} alt="Preview" className="h-32 object-contain rounded-lg mb-3 shadow-sm" />
                            <span className="text-sm text-indigo-600 font-medium">تصویر انتخاب شد. برای تغییر کلیک کنید.</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-gray-500">
                            <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="text-sm font-medium">برای آپلود تصویر کلیک کنید یا تصویر را اینجا رها کنید</p>
                            <p className="text-xs mt-1 text-gray-400">پشتیبانی از JPG, PNG</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleAiSubmit}
                      disabled={isAiLoading || (!aiPrompt && !aiImage)}
                      className="w-full bg-indigo-600 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAiLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          در حال پردازش و تفکر عمیق...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          اعمال تغییرات
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
