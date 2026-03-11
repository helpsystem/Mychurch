import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { useAuth } from '../hooks/useAuth';
import {
  FileText, Printer, Download, Plus, ChevronDown, ChevronRight,
  Building2, CreditCard, Package, FileSignature, Globe,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, Type, Minus, X, Check, DollarSign, Calendar, Hash
} from 'lucide-react';

// ---------- Types ----------
interface LetterTemplate {
  id: string;
  nameEn: string;
  nameFa: string;
  toEn: string;
  toFa: string;
  subjectEn: string;
  subjectFa: string;
  bodyEn: string;
  bodyFa: string;
  category: 'immigration' | 'tax' | 'membership' | 'general';
}

interface DonationReceipt {
  donorName: string;
  donorAddress: string;
  amount: number;
  method: 'cash' | 'check' | 'card' | 'in-kind';
  checkNumber?: string;
  description: string;
  date: string;
  inKindItems?: { name: string; qty: number; value: number }[];
}

// ---------- Templates ----------
const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'uscis-membership',
    nameEn: 'USCIS – Church Membership Letter',
    nameFa: 'نامه عضویت کلیسا برای USCIS',
    toEn: 'U.S. Citizenship and Immigration Services (USCIS)',
    toFa: 'اداره مهاجرت و شهروندی ایالات متحده',
    subjectEn: 'Letter of Church Membership and Active Participation',
    subjectFa: 'نامه عضویت و حضور فعال در کلیسا',
    category: 'immigration',
    bodyEn: `To Whom It May Concern,

This letter is to confirm that [MEMBER NAME] is a registered member of the Iranian Church of Washington DC (Samanabyar Church), located at [ADDRESS]. 

[He/She] has been an active and faithful member of our congregation since [DATE]. [He/She] attends our weekly worship services, participates in Bible study groups, and actively contributes to our church community activities.

Our church serves the Persian-speaking Christian community in the greater Washington DC area. We are a registered 501(c)(3) non-profit religious organization.

We respectfully request favorable consideration for [MEMBER NAME]'s application. Should you require any additional information, please do not hesitate to contact us.

Respectfully,`,
    bodyFa: `با احترام،

این نامه تأیید می‌کند که [نام عضو] یک عضو رسمی کلیسای ایرانیان واشنگتن دی.سی (کلیسای سماناب‌یار) می‌باشد که در آدرس [آدرس] واقع است.

ایشان از تاریخ [تاریخ] عضو فعال و متعهد جماعت ما بوده‌اند. ایشان در جلسات پرستشی هفتگی، گروه‌های مطالعه کتاب مقدس شرکت می‌کنند و به طور فعال در فعالیت‌های جامعه کلیسا مشارکت دارند.

کلیسای ما به جامعه مسیحی فارسی‌زبان در منطقه واشنگتن دی.سی خدمت می‌کند. ما یک سازمان غیرانتفاعی مذهبی ثبت‌شده 501(c)(3) هستیم.

محترماً خواهشمند است که تقاضای [نام عضو] مورد توجه مساعد قرار گیرد.

با احترام،`
  },
  {
    id: 'irs-tax-exempt',
    nameEn: 'IRS – Tax-Exempt Donation Acknowledgment',
    nameFa: 'تأیید کمک مالی معاف از مالیات (IRS)',
    toEn: 'Internal Revenue Service (IRS)',
    toFa: 'اداره مالیات ایالات متحده',
    subjectEn: 'Acknowledgment of Charitable Contribution – 501(c)(3)',
    subjectFa: 'تأیید کمک مالی خیریه – 501(c)(3)',
    category: 'tax',
    bodyEn: `Dear [DONOR NAME],

This letter serves as an official acknowledgment of your generous charitable contribution to the Iranian Church of Washington DC (EIN: [EIN NUMBER]).

Our organization is a tax-exempt entity under Section 501(c)(3) of the Internal Revenue Code. No goods or services were provided in exchange for this contribution.

This letter may be used for tax purposes. Please retain it for your records.

Thank you sincerely for your generous support of our ministry.

God bless you,`,
    bodyFa: `[نام اهداکننده] عزیز،

این نامه تأیید رسمی کمک مالی سخاوتمندانه شما به کلیسای ایرانیان واشنگتن دی.سی می‌باشد (EIN: [شماره EIN]).

سازمان ما یک نهاد معاف از مالیات تحت بخش 501(c)(3) قانون مالیات داخلی است. هیچ کالا یا خدماتی در ازای این کمک ارائه نشده است.

این نامه ممکن است برای مقاصد مالیاتی استفاده شود. لطفاً آن را برای سوابق خود نگه دارید.

با سپاس صمیمانه از حمایت سخاوتمندانه شما،`
  },
  {
    id: 'general-reference',
    nameEn: 'General Reference / Support Letter',
    nameFa: 'نامه معرفی / حمایت عمومی',
    toEn: 'To Whom It May Concern',
    toFa: 'به هر مقام ذیربط',
    subjectEn: 'Letter of Support and Character Reference',
    subjectFa: 'نامه حمایت و معرفی شخصیتی',
    category: 'general',
    bodyEn: `To Whom It May Concern,

It is with great pleasure that I write this letter of support on behalf of [NAME]. I have known [him/her] through our church community for [DURATION] years.

During this time, I have found [NAME] to be a person of strong moral character, integrity, and dedication. [He/She] is deeply committed to our faith community and has demonstrated exceptional responsibility in all church activities.

I wholeheartedly recommend [NAME] and vouch for [his/her] character and good standing in our community. Please feel free to contact me should you require any further information.

Sincerely,`,
    bodyFa: `با احترام،

با کمال افتخار این نامه حمایت را از طرف [نام] می‌نویسم. من ایشان را از طریق جامعه کلیسای ما به مدت [مدت] سال می‌شناسم.

در این مدت، [نام] را فردی با شخصیت اخلاقی قوی، صداقت و تعهد یافته‌ام. ایشان به طور عمیقی به جامعه ایمانی ما متعهد هستند و در تمام فعالیت‌های کلیسا مسئولیت استثنایی نشان داده‌اند.

صمیمانه [نام] را توصیه می‌کنم. در صورت نیاز به اطلاعات بیشتر با ما تماس بگیرید.

با احترام،`
  }
];

// ---------- Letterhead Component ----------
const ChurchLetterhead: React.FC<{ settings: any; lang: 'en' | 'fa'; docRef?: string; date?: string }> = ({ settings, lang, docRef, date }) => (
  <div className="mb-8">
    <div className="flex justify-between items-start pb-5 border-b-4 border-double border-gray-700">
      <div className="flex items-center gap-5">
        <img src={settings.logoUrl} alt="Church Logo" className="w-20 h-20 object-contain" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{settings.churchName?.[lang] || 'Iranian Church of Washington DC'}</h1>
          <p className="text-sm text-gray-600 mt-1">A 501(c)(3) Non-Profit Religious Organization</p>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            <div>{settings.address}</div>
            <div className="flex gap-4">
              {settings.phone && <span>Tel: {settings.phone}</span>}
              {settings.whatsappNumber && <span>WhatsApp: {settings.whatsappNumber}</span>}
            </div>
            {settings.facebookUrl && <div>Web: samanabyar.online</div>}
          </div>
        </div>
      </div>
      <div className="text-right text-sm text-gray-600">
        <div className="font-bold text-base mb-1">{date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        {docRef && <div className="text-xs text-gray-400">Ref: {docRef}</div>}
      </div>
    </div>
  </div>
);

// ---------- Donation Receipt Print View ----------
const DonationReceiptPrint: React.FC<{ receipt: DonationReceipt; settings: any; receiptNo: string }> = ({ receipt, settings, receiptNo }) => {
  const isInKind = receipt.method === 'in-kind';
  return (
    <div className="w-[210mm] min-h-[148mm] bg-white text-black p-[15mm] font-serif">
      <ChurchLetterhead settings={settings} lang="en" docRef={`RCP-${receiptNo}`} date={receipt.date} />
      
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase tracking-widest text-gray-800 border-2 border-gray-300 inline-block px-6 py-2 rounded">
          {isInKind ? 'In-Kind Donation Receipt' : 'Charitable Contribution Receipt'}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div className="space-y-2">
          <div><span className="font-bold">Donor Name:</span> {receipt.donorName}</div>
          <div><span className="font-bold">Address:</span> {receipt.donorAddress}</div>
          <div><span className="font-bold">Date:</span> {receipt.date}</div>
        </div>
        <div className="space-y-2">
          <div><span className="font-bold">Receipt #:</span> RCP-{receiptNo}</div>
          <div><span className="font-bold">Payment Method:</span> {receipt.method.toUpperCase()}</div>
          {receipt.checkNumber && <div><span className="font-bold">Check #:</span> {receipt.checkNumber}</div>}
          {!isInKind && <div><span className="font-bold text-lg">Amount:</span> <span className="text-xl font-bold">${receipt.amount.toFixed(2)}</span></div>}
        </div>
      </div>

      {isInKind && receipt.inKindItems && (
        <table className="w-full border-collapse mb-6 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">Item Description</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Qty</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Est. Value</th>
            </tr>
          </thead>
          <tbody>
            {receipt.inKindItems.map((item, i) => (
              <tr key={i}>
                <td className="border border-gray-300 px-3 py-2">{item.name}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{item.qty}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">${item.value.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold">
              <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">Total Estimated Value:</td>
              <td className="border border-gray-300 px-3 py-2 text-right">
                ${receipt.inKindItems.reduce((s, i) => s + i.value * i.qty, 0).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      <div className="mb-6 text-sm border border-gray-200 rounded p-3 bg-gray-50">
        <span className="font-bold">Description / Purpose:</span> {receipt.description}
      </div>

      <div className="border border-gray-300 rounded p-4 text-xs text-gray-500 mb-6 bg-blue-50/30">
        <strong>Tax Notice:</strong> The Iranian Church of Washington DC is a 501(c)(3) tax-exempt organization. 
        No goods or services were provided in exchange for this contribution. This receipt may be used for 
        federal income tax deduction purposes. Please retain for your records.
      </div>

      <div className="flex justify-between items-end mt-8 pt-4 border-t border-gray-300">
        <div className="text-sm">
          <div className="w-40 border-b border-gray-400 mb-1 mt-8"></div>
          <div className="text-xs text-gray-500">Authorized Signature</div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>Iranian Church of Washington DC</div>
          <div>samanabyar.online</div>
        </div>
      </div>
    </div>
  );
};

// =================== MAIN PAGE ===================
const ChurchDocumentsPage: React.FC = () => {
  const { lang } = useLanguage();
  const { content } = useContent();
  const { user } = useAuth();
  const settings = content.settings;

  const [activeTab, setActiveTab] = useState<'letters' | 'receipts' | 'inkind'>('letters');
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [letterBodyEn, setLetterBodyEn] = useState('');
  const [letterBodyFa, setLetterBodyFa] = useState('');
  const [letterTo, setLetterTo] = useState('');
  const [letterSubject, setLetterSubject] = useState('');
  const [letterRecipientName, setLetterRecipientName] = useState('');
  const [editLang, setEditLang] = useState<'en' | 'fa'>('en');

  // Receipt state
  const [receipt, setReceipt] = useState<DonationReceipt>({
    donorName: '',
    donorAddress: '',
    amount: 0,
    method: 'cash',
    description: 'Charitable contribution to the Iranian Church of Washington DC',
    date: new Date().toLocaleDateString('en-US'),
    checkNumber: '',
  });
  const [inKindItems, setInKindItems] = useState<{ name: string; qty: number; value: number }[]>([{ name: '', qty: 1, value: 0 }]);
  const [receiptNo] = useState(() => Math.floor(Math.random() * 90000 + 10000).toString());

  const letterPrintRef = useRef<HTMLDivElement>(null);
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  const handlePrintLetter = useReactToPrint({ contentRef: letterPrintRef });
  const handlePrintReceipt = useReactToPrint({ contentRef: receiptPrintRef });

  const loadTemplate = (tpl: LetterTemplate) => {
    setSelectedTemplate(tpl);
    setLetterBodyEn(tpl.bodyEn);
    setLetterBodyFa(tpl.bodyFa);
    setLetterTo(tpl.toEn);
    setLetterSubject(tpl.subjectEn);
  };

  const categoryColors: Record<string, string> = {
    immigration: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    tax: 'bg-green-500/20 text-green-300 border-green-500/30',
    membership: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    general: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  const refNo = `ICW-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  return (
    <div className="min-h-screen bg-primary text-white" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 py-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {lang === 'fa' ? 'اسناد و مدارک رسمی کلیسا' : 'Church Official Documents'}
            </h1>
            <p className="text-dimWhite">
              {lang === 'fa' 
                ? 'نامه‌های اداری، رسیدهای کمک مالی و مدارک رسمی'
                : 'Administrative letters, donation receipts, and official documents'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit">
          {[
            { id: 'letters', icon: <FileSignature className="w-4 h-4" />, en: 'Official Letters', fa: 'نامه‌های اداری' },
            { id: 'receipts', icon: <DollarSign className="w-4 h-4" />, en: 'Donation Receipt', fa: 'رسید کمک مالی' },
            { id: 'inkind', icon: <Package className="w-4 h-4" />, en: 'In-Kind Receipt', fa: 'رسید لوازم' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-lg'
                  : 'text-dimWhite hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {lang === 'fa' ? tab.fa : tab.en}
            </button>
          ))}
        </div>

        {/* ========== LETTERS TAB ========== */}
        {activeTab === 'letters' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Sidebar */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                {lang === 'fa' ? 'الگوهای آماده' : 'Ready Templates'}
              </h3>
              {LETTER_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => loadTemplate(tpl)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedTemplate?.id === tpl.id
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[tpl.category]}`}>
                      {tpl.category.toUpperCase()}
                    </span>
                    {selectedTemplate?.id === tpl.id && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div className="text-white text-sm font-medium leading-tight">
                    {lang === 'fa' ? tpl.nameFa : tpl.nameEn}
                  </div>
                </button>
              ))}
              <button
                onClick={() => { setSelectedTemplate(null); setLetterBodyEn(''); setLetterBodyFa(''); setLetterTo(''); setLetterSubject(''); }}
                className="w-full p-4 rounded-xl border border-dashed border-white/20 text-dimWhite hover:text-white hover:border-white/40 transition-all flex items-center gap-2 justify-center text-sm"
              >
                <Plus className="w-4 h-4" />
                {lang === 'fa' ? 'نامه سفارشی' : 'Custom Letter'}
              </button>
            </div>

            {/* Editor */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-card p-6 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">{lang === 'fa' ? 'ویرایش نامه' : 'Letter Editor'}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditLang('en')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${editLang === 'en' ? 'bg-blue-500 text-white border-blue-500' : 'border-white/20 text-dimWhite hover:border-white/40'}`}
                    >EN</button>
                    <button
                      onClick={() => setEditLang('fa')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${editLang === 'fa' ? 'bg-blue-500 text-white border-blue-500' : 'border-white/20 text-dimWhite hover:border-white/40'}`}
                    >فا</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'گیرنده' : 'Recipient / To'}</label>
                    <input
                      value={letterRecipientName}
                      onChange={e => setLetterRecipientName(e.target.value)}
                      placeholder="e.g. John Smith"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'سازمان / اداره' : 'Organization / Agency'}</label>
                    <input
                      value={letterTo}
                      onChange={e => setLetterTo(e.target.value)}
                      placeholder="e.g. USCIS, IRS..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'موضوع' : 'Subject / Re:'}</label>
                    <input
                      value={letterSubject}
                      onChange={e => setLetterSubject(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'متن نامه' : 'Letter Body'}</label>
                    <textarea
                      dir={editLang === 'fa' ? 'rtl' : 'ltr'}
                      value={editLang === 'en' ? letterBodyEn : letterBodyFa}
                      onChange={e => editLang === 'en' ? setLetterBodyEn(e.target.value) : setLetterBodyFa(e.target.value)}
                      rows={14}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400 resize-y font-mono"
                    />
                    <p className="text-xs text-dimWhite mt-1">
                      {lang === 'fa' ? 'از [نام عضو]، [تاریخ] برای جایگزینی استفاده کنید.' : 'Use [MEMBER NAME], [DATE] as placeholders.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-5 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handlePrintLetter()}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    {lang === 'fa' ? 'چاپ / PDF' : 'Print / PDF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden print area for letters */}
            <div className="hidden">
              <div ref={letterPrintRef}>
                <div className="w-[210mm] min-h-[297mm] bg-white text-black p-[20mm] flex flex-col font-serif">
                  <ChurchLetterhead settings={settings} lang={editLang} docRef={refNo} />
                  <div className="mb-4 text-sm space-y-1">
                    {letterRecipientName && <div><strong>Attention:</strong> {letterRecipientName}</div>}
                    {letterTo && <div><strong>To:</strong> {letterTo}</div>}
                    <div><strong>{editLang === 'fa' ? 'از طرف:' : 'From:'}</strong> {settings.churchName?.[editLang]}</div>
                  </div>
                  {letterSubject && (
                    <div className="mb-6 font-bold text-sm underline">
                      RE: {letterSubject}
                    </div>
                  )}
                  <main className="text-justify leading-relaxed text-sm flex-grow whitespace-pre-wrap" dir={editLang === 'fa' ? 'rtl' : 'ltr'}>
                    {editLang === 'en' ? letterBodyEn : letterBodyFa}
                  </main>
                  <footer className="pt-6 border-t border-gray-300 text-sm mt-8">
                    <div className="mb-10">Pastor / Church Administrator</div>
                    <div className="w-48 border-b border-gray-400 mb-1"></div>
                    <div className="font-semibold">{settings.churchName?.[editLang]}</div>
                    <div className="text-xs text-gray-500">{settings.address}</div>
                    <div className="text-xs text-gray-500">Tel: {settings.phone}</div>
                  </footer>
                </div>
                <style>{`@media print { body { margin: 0; } }`}</style>
              </div>
            </div>
          </div>
        )}

        {/* ========== CASH/CHECK RECEIPT TAB ========== */}
        {(activeTab === 'receipts' || activeTab === 'inkind') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-400" />
                {activeTab === 'receipts'
                  ? (lang === 'fa' ? 'اطلاعات رسید کمک مالی' : 'Donation Receipt Details')
                  : (lang === 'fa' ? 'اطلاعات رسید لوازم اهدایی' : 'In-Kind Donation Receipt')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'نام و نام خانوادگی اهداکننده' : 'Donor Full Name'}</label>
                  <input
                    value={receipt.donorName}
                    onChange={e => setReceipt(r => ({ ...r, donorName: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400"
                    placeholder="John Smith"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'آدرس اهداکننده' : 'Donor Address'}</label>
                  <input
                    value={receipt.donorAddress}
                    onChange={e => setReceipt(r => ({ ...r, donorAddress: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400"
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
                <div>
                  <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'تاریخ' : 'Date'}</label>
                  <input
                    type="date"
                    value={receipt.date}
                    onChange={e => setReceipt(r => ({ ...r, date: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400"
                  />
                </div>
                {activeTab === 'receipts' && (
                  <div>
                    <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'مبلغ ($)' : 'Amount ($)'}</label>
                    <input
                      type="number"
                      value={receipt.amount}
                      onChange={e => setReceipt(r => ({ ...r, amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400"
                    />
                  </div>
                )}
                {activeTab === 'receipts' && (
                  <>
                    <div>
                      <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'روش پرداخت' : 'Payment Method'}</label>
                      <select
                        value={receipt.method}
                        onChange={e => setReceipt(r => ({ ...r, method: e.target.value as any }))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400"
                      >
                        <option value="cash">💵 Cash / نقد</option>
                        <option value="check">📝 Check / چک</option>
                        <option value="card">💳 Credit Card / کارت</option>
                      </select>
                    </div>
                    {receipt.method === 'check' && (
                      <div>
                        <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'شماره چک' : 'Check Number'}</label>
                        <input
                          value={receipt.checkNumber}
                          onChange={e => setReceipt(r => ({ ...r, checkNumber: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400"
                          placeholder="#12345"
                        />
                      </div>
                    )}
                  </>
                )}
                <div className="col-span-2">
                  <label className="text-xs text-dimWhite mb-1 block">{lang === 'fa' ? 'توضیحات / هدف' : 'Description / Purpose'}</label>
                  <textarea
                    value={receipt.description}
                    onChange={e => setReceipt(r => ({ ...r, description: e.target.value }))}
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-400 resize-none"
                  />
                </div>
              </div>

              {/* In-Kind Items */}
              {activeTab === 'inkind' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-dimWhite">{lang === 'fa' ? 'لیست اقلام اهدایی' : 'Donated Items'}</label>
                    <button
                      onClick={() => setInKindItems(items => [...items, { name: '', qty: 1, value: 0 }])}
                      className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> {lang === 'fa' ? 'افزودن' : 'Add Item'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {inKindItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                        <input
                          value={item.name}
                          onChange={e => setInKindItems(items => items.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                          placeholder="Item name"
                          className="col-span-2 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-green-400"
                        />
                        <input
                          type="number"
                          value={item.qty}
                          onChange={e => setInKindItems(items => items.map((it, i) => i === idx ? { ...it, qty: parseInt(e.target.value) || 1 } : it))}
                          placeholder="Qty"
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-green-400"
                        />
                        <input
                          type="number"
                          value={item.value}
                          onChange={e => setInKindItems(items => items.map((it, i) => i === idx ? { ...it, value: parseFloat(e.target.value) || 0 } : it))}
                          placeholder="$Value"
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-green-400"
                        />
                        <button
                          onClick={() => setInKindItems(items => items.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 flex justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => handlePrintReceipt()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:brightness-110 text-white px-5 py-3 rounded-xl font-medium transition-all mt-4"
              >
                <Printer className="w-4 h-4" />
                {lang === 'fa' ? 'چاپ رسید / PDF' : 'Print Receipt / Save PDF'}
              </button>
            </div>

            {/* Live Preview */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">{lang === 'fa' ? 'پیش‌نمایش' : 'Preview'}</h3>
              <div className="bg-gray-200 rounded-xl overflow-hidden shadow-xl" style={{ transform: 'scale(0.72)', transformOrigin: 'top left', width: '139%', height: '500px' }}>
                <DonationReceiptPrint
                  receipt={{ ...receipt, method: activeTab === 'inkind' ? 'in-kind' : receipt.method, inKindItems }}
                  settings={settings}
                  receiptNo={receiptNo}
                />
              </div>
            </div>

            {/* Hidden print area */}
            <div className="hidden">
              <div ref={receiptPrintRef}>
                <DonationReceiptPrint
                  receipt={{ ...receipt, method: activeTab === 'inkind' ? 'in-kind' : receipt.method, inKindItems }}
                  settings={settings}
                  receiptNo={receiptNo}
                />
                <style>{`@media print { body { margin: 0; } }`}</style>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChurchDocumentsPage;
