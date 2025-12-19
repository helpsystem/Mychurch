import React, { useState } from 'react';
import {
  ModernButton,
  ModernCard,
  Badge,
  Alert,
  Spinner,
  Skeleton,
  Modal,
  Input,
  ProgressBar,
  Avatar,
  GlassCard,
  GradientText,
} from '../components/TailwindComponents';

const TailwindDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(65);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <GradientText gradient="blue-purple" className="text-5xl">
            نمونه کامپوننت‌های Tailwind
          </GradientText>
          <p className="text-gray-600 dark:text-gray-300 text-xl">
            کامپوننت‌های آماده برای استفاده در پروژه
          </p>
        </div>

        {/* Buttons */}
        <ModernCard className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            دکمه‌ها
          </h2>
          <div className="flex flex-wrap gap-4">
            <ModernButton variant="primary">
              دکمه اصلی
            </ModernButton>
            <ModernButton variant="secondary">
              دکمه ثانویه
            </ModernButton>
            <ModernButton variant="outline">
              دکمه Outline
            </ModernButton>
            <ModernButton variant="ghost">
              دکمه Ghost
            </ModernButton>
            <ModernButton variant="success">
              موفق
            </ModernButton>
            <ModernButton variant="danger">
              خطر
            </ModernButton>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <ModernButton variant="primary" size="sm">
              کوچک
            </ModernButton>
            <ModernButton variant="primary" size="md">
              متوسط
            </ModernButton>
            <ModernButton variant="primary" size="lg">
              بزرگ
            </ModernButton>
          </div>
        </ModernCard>

        {/* Badges */}
        <ModernCard className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Badge ها
          </h2>
          <div className="flex flex-wrap gap-3">
            <Badge color="blue">آبی</Badge>
            <Badge color="green">سبز</Badge>
            <Badge color="red">قرمز</Badge>
            <Badge color="yellow">زرد</Badge>
            <Badge color="purple">بنفش</Badge>
          </div>
        </ModernCard>

        {/* Alerts */}
        <div className="space-y-4">
          <Alert type="success">
            عملیات با موفقیت انجام شد!
          </Alert>
          <Alert type="error">
            خطایی در انجام عملیات رخ داده است.
          </Alert>
          <Alert type="warning">
            لطفاً به این نکته توجه کنید.
          </Alert>
          <Alert type="info">
            اطلاعیه: سیستم در حال بروزرسانی است.
          </Alert>
        </div>

        {/* Loading States */}
        <ModernCard className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            وضعیت‌های بارگذاری
          </h2>
          
          <div className="space-y-6">
            {/* Spinners */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Spinners:</h3>
              <div className="flex items-center gap-6">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </div>
            </div>
            
            {/* Skeleton */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Skeleton Loading:</h3>
              <Skeleton lines={3} />
            </div>
            
            {/* Progress Bar */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Progress Bar:</h3>
              <ProgressBar value={progress} color="blue" />
              <div className="flex gap-2 mt-3">
                <ModernButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => setProgress(Math.max(0, progress - 10))}
                >
                  کاهش
                </ModernButton>
                <ModernButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => setProgress(Math.min(100, progress + 10))}
                >
                  افزایش
                </ModernButton>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Forms */}
        <ModernCard className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            فرم‌ها
          </h2>
          <div className="space-y-4 max-w-md">
            <Input 
              label="نام"
              placeholder="نام خود را وارد کنید"
              icon={<span>👤</span>}
            />
            <Input 
              label="ایمیل"
              type="email"
              placeholder="example@mail.com"
              icon={<span>✉️</span>}
            />
            <Input 
              label="رمز عبور"
              type="password"
              placeholder="رمز عبور"
              icon={<span>🔒</span>}
            />
            <Input 
              label="فیلد با خطا"
              error="این فیلد الزامی است"
              placeholder="مقدار"
            />
            <ModernButton variant="primary" className="w-full">
              ارسال
            </ModernButton>
          </div>
        </ModernCard>

        {/* Avatars */}
        <ModernCard className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Avatar
          </h2>
          <div className="flex items-center gap-4">
            <Avatar 
              src="https://i.pravatar.cc/150?img=1"
              alt="کاربر 1"
              size="xs"
            />
            <Avatar 
              src="https://i.pravatar.cc/150?img=2"
              alt="کاربر 2"
              size="sm"
              online
            />
            <Avatar 
              src="https://i.pravatar.cc/150?img=3"
              alt="کاربر 3"
              size="md"
              online
            />
            <Avatar 
              src="https://i.pravatar.cc/150?img=4"
              alt="کاربر 4"
              size="lg"
            />
            <Avatar 
              src="https://i.pravatar.cc/150?img=5"
              alt="کاربر 5"
              size="xl"
              online
            />
          </div>
        </ModernCard>

        {/* Glass Card */}
        <GlassCard className="p-8 relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
            style={{ zIndex: -1 }}
          />
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Glass Morphism Card
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            این کارت با افکت شیشه‌ای (Glassmorphism) طراحی شده است.
            پس‌زمینه blur شده و شفاف است.
          </p>
        </GlassCard>

        {/* Modal */}
        <ModernCard className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Modal
          </h2>
          <ModernButton 
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            باز کردن Modal
          </ModernButton>
          
          <Modal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="عنوان Modal"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                این یک Modal ساده است که می‌توانید محتوای دلخواه خود را در آن قرار دهید.
              </p>
              <Alert type="info">
                می‌توانید از تمام کامپوننت‌ها داخل Modal استفاده کنید.
              </Alert>
              <div className="flex gap-3 justify-end">
                <ModernButton 
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  انصراف
                </ModernButton>
                <ModernButton 
                  variant="primary"
                  onClick={() => {
                    alert('تایید شد!');
                    setIsModalOpen(false);
                  }}
                >
                  تایید
                </ModernButton>
              </div>
            </div>
          </Modal>
        </ModernCard>

        {/* Example Cards Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            نمونه کارت‌های محتوا
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ModernCard key={i} className="group cursor-pointer">
                <div className="relative overflow-hidden h-48">
                  <img 
                    src={`https://picsum.photos/400/300?random=${i}`}
                    alt={`تصویر ${i}`}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <Badge 
                    color="blue"
                    className="absolute top-4 right-4"
                  >
                    جدید
                  </Badge>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                    عنوان کارت {i}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    این یک توضیح کوتاه برای کارت شماره {i} است.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar 
                        src={`https://i.pravatar.cc/150?img=${i}`}
                        alt={`نویسنده ${i}`}
                        size="xs"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        نویسنده {i}
                      </span>
                    </div>
                    <ModernButton variant="ghost" size="sm">
                      بیشتر →
                    </ModernButton>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TailwindDemo;
