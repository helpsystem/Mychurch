import React from 'react';
import { BookOpen, MessageCircle, Search, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

const BibleAIChatPage: React.FC = () => {
  const { t, lang } = useLanguage();

  const features = [
    {
      icon: MessageCircle,
      titleFa: 'پاسخ به سوالات',
      titleEn: 'Answer Questions',
      descFa: 'هر سوال کتاب‌مقدسی خود را بپرسید و پاسخ دریافت کنید',
      descEn: 'Ask any Bible-related question and get answers'
    },
    {
      icon: BookOpen,
      titleFa: 'آیات مرتبط',
      titleEn: 'Related Verses',
      descFa: 'برای هر سوال، آیات مرتبط از کتاب مقدس دریافت کنید',
      descEn: 'Get relevant Bible verses for every question'
    },
    {
      icon: Search,
      titleFa: 'جستجوی هوشمند',
      titleEn: 'Smart Search',
      descFa: 'جستجوی پیشرفته در تمام کتاب مقدس',
      descEn: 'Advanced search across the entire Bible'
    },
    {
      icon: Heart,
      titleFa: 'راهنمای معنوی',
      titleEn: 'Spiritual Guidance',
      descFa: 'راهنمایی معنوی مبتنی بر کلام خداوند',
      descEn: 'Spiritual guidance based on God\'s Word'
    }
  ];

  const examples = lang === 'fa' ? [
    {
      question: 'چگونه می‌توانم آرامش پیدا کنم؟',
      answer: 'کتاب مقدس در مورد آرامش می‌فرماید:',
      verse: 'یوحنا ۱۴:۲۷ - آرامش خود را به شما می‌بخشم...'
    },
    {
      question: 'خداوند چه می‌گوید درباره محبت؟',
      answer: 'کلام خدا می‌فرماید:',
      verse: 'یوحنا ۳:۱۶ - زیرا خدا جهان را چنان محبت نمود...'
    },
    {
      question: 'در زمان سختی چه کنم؟',
      answer: 'کتاب مقدس راهنمایی می‌دهد:',
      verse: 'مزامیر ۴۶:۱ - خدا پناهگاه و قوت ما است...'
    }
  ] : [
    {
      question: 'How can I find peace?',
      answer: 'The Bible says about peace:',
      verse: 'John 14:27 - Peace I leave with you...'
    },
    {
      question: 'What does God say about love?',
      answer: 'God\'s Word says:',
      verse: 'John 3:16 - For God so loved the world...'
    },
    {
      question: 'What should I do in difficult times?',
      answer: 'The Bible guides:',
      verse: 'Psalm 46:1 - God is our refuge and strength...'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-2xl">
              <Sparkles className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {lang === 'fa' ? 'دستیار هوشمند کتاب مقدس' : 'Bible AI Assistant'}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {lang === 'fa'
              ? 'سوالات خود را بپرسید و پاسخ‌های مبتنی بر کلام خدا دریافت کنید'
              : 'Ask your questions and receive answers based on God\'s Word'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                // Scroll to chatbot or open it
                const widget = document.querySelector('[aria-label*="Bible Chat"]') as HTMLElement;
                if (widget) widget.click();
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 space-x-reverse"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{lang === 'fa' ? 'شروع گفتگو' : 'Start Chat'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="/bible"
              className="bg-white text-gray-700 border-2 border-gray-300 px-8 py-4 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300 flex items-center space-x-2 space-x-reverse"
            >
              <BookOpen className="w-5 h-5" />
              <span>{lang === 'fa' ? 'مطالعه کتاب مقدس' : 'Read Bible'}</span>
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
            >
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-3 inline-block mb-4">
                <feature.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {lang === 'fa' ? feature.titleFa : feature.titleEn}
              </h3>
              <p className="text-gray-600 text-sm">
                {lang === 'fa' ? feature.descFa : feature.descEn}
              </p>
            </div>
          ))}
        </div>

        {/* Examples Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
            {lang === 'fa' ? '✨ نمونه‌های استفاده' : '✨ Usage Examples'}
          </h2>
          <div className="space-y-6">
            {examples.map((example, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 hover:border-purple-300 transition-all"
              >
                <div className="mb-4">
                  <span className="text-sm font-semibold text-blue-600 mb-2 block">
                    {lang === 'fa' ? '❓ سوال:' : '❓ Question:'}
                  </span>
                  <p className="text-lg font-medium text-gray-800">{example.question}</p>
                </div>
                <div className="mb-3">
                  <span className="text-sm font-semibold text-purple-600 mb-1 block">
                    {lang === 'fa' ? '💬 پاسخ:' : '💬 Answer:'}
                  </span>
                  <p className="text-gray-600">{example.answer}</p>
                </div>
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
                  <span className="text-sm font-semibold text-amber-800 mb-1 block flex items-center">
                    <BookOpen className="w-4 h-4 mr-1 ml-1" />
                    {lang === 'fa' ? 'آیه مرتبط:' : 'Related Verse:'}
                  </span>
                  <p className="text-gray-700 italic">{example.verse}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl font-bold mb-6">
            {lang === 'fa' ? 'چگونه کار می‌کند؟' : 'How Does It Work?'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl mb-4">1️⃣</div>
              <h3 className="font-bold text-xl mb-2">
                {lang === 'fa' ? 'سوال بپرسید' : 'Ask a Question'}
              </h3>
              <p className="opacity-90">
                {lang === 'fa'
                  ? 'هر سوالی که در ذهن دارید را بپرسید'
                  : 'Ask any question you have in mind'}
              </p>
            </div>
            <div>
              <div className="text-5xl mb-4">2️⃣</div>
              <h3 className="font-bold text-xl mb-2">
                {lang === 'fa' ? 'جستجو در کتاب مقدس' : 'Search the Bible'}
              </h3>
              <p className="opacity-90">
                {lang === 'fa'
                  ? 'سیستم هوشمند در کتاب مقدس جستجو می‌کند'
                  : 'AI searches through the Bible'}
              </p>
            </div>
            <div>
              <div className="text-5xl mb-4">3️⃣</div>
              <h3 className="font-bold text-xl mb-2">
                {lang === 'fa' ? 'پاسخ دریافت کنید' : 'Get Answer'}
              </h3>
              <p className="opacity-90">
                {lang === 'fa'
                  ? 'پاسخ همراه با آیات مرتبط دریافت کنید'
                  : 'Receive answer with relevant verses'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const widget = document.querySelector('[aria-label*="Bible Chat"]') as HTMLElement;
              if (widget) widget.click();
            }}
            className="mt-8 bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 inline-flex items-center space-x-2 space-x-reverse"
          >
            <Sparkles className="w-5 h-5" />
            <span>{lang === 'fa' ? 'همین الان امتحان کنید!' : 'Try It Now!'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BibleAIChatPage;
