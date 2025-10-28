import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminWorshipManagementPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 flex items-center justify-center" dir="rtl">
      <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-4 text-center"> مدیریت سرودهای پرستشی</h1>
        <p className="text-gray-300 text-center mb-8">
          این صفحه در حال توسعه است. لطفاً از صفحه سرودها استفاده کنید.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/worship')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            مشاهده سرودها
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            بازگشت به پنل مدیریت
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWorshipManagementPage;
