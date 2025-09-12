import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Calendar, TrendingUp, Users, MessageSquare, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

interface AnalyticsData {
  announcements: {
    total_announcements: number;
    published_announcements: number;
    draft_announcements: number;
    announcements_last_30_days: number;
  };
  channels: Array<{
    channel: string;
    message_count: number;
    successful_sends: number;
    avg_recipients: number;
  }>;
  dailyStats: Array<{
    date: string;
    total_messages: number;
    successful_messages: number;
    total_recipients: number;
  }>;
  languages: Array<{
    language: string;
    usage_count: number;
  }>;
  delivery: Array<{
    delivery_status: string;
    count: number;
    percentage: number;
  }>;
  generatedAt: string;
}

interface PerformanceData {
  channelPerformance: Array<{
    channel: string;
    total_attempts: number;
    successful_sends: number;
    success_rate: number;
    avg_recipients_per_send: number;
    error_count: number;
  }>;
  commonErrors: Array<{
    error_message: string;
    occurrence_count: number;
    last_occurrence: string;
  }>;
  hourlyUsage: Array<{
    hour: number;
    message_count: number;
  }>;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const [overviewResponse, performanceResponse] = await Promise.all([
        fetch('/api/analytics/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/analytics/performance', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!overviewResponse.ok || !performanceResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const overviewData = await overviewResponse.json();
      const performanceStats = await performanceResponse.json();

      setAnalyticsData(overviewData);
      setPerformanceData(performanceStats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData || !performanceData) {
    return <div>No data available</div>;
  }

  const formatChannelName = (channel: string) => {
    const names = {
      website: 'Website',
      email: 'Email', 
      sms: 'SMS',
      whatsapp: 'WhatsApp',
      push: 'Push'
    };
    return names[channel as keyof typeof names] || channel;
  };

  const formatLanguage = (lang: string) => {
    return lang === 'en' ? 'English' : lang === 'fa' ? 'Persian' : lang;
  };

  const channelData = analyticsData.channels.map(item => ({
    name: formatChannelName(item.channel),
    messages: item.message_count,
    successful: item.successful_sends,
    recipients: Math.round(item.avg_recipients)
  }));

  const languageData = analyticsData.languages.map(item => ({
    name: formatLanguage(item.language),
    value: item.usage_count
  }));

  const deliveryData = analyticsData.delivery.map(item => ({
    name: item.delivery_status === 'delivered' ? 'Delivered' : 
          item.delivery_status === 'failed' ? 'Failed' : item.delivery_status,
    value: item.count,
    percentage: item.percentage
  }));

  const dailyChartData = analyticsData.dailyStats.slice(0, 14).reverse().map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    messages: item.total_messages,
    recipients: item.total_recipients
  }));

  const hourlyChartData = performanceData.hourlyUsage.map(item => ({
    hour: `${item.hour}:00`,
    messages: item.message_count
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {new Date(analyticsData.generatedAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric', 
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" dir="ltr">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'performance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Performance
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-500">Total Announcements</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.announcements.total_announcements}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-500">Published</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.announcements.published_announcements}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-500">Draft</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.announcements.draft_announcements}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-500">Last 30 Days</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.announcements.announcements_last_30_days}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Channel Performance */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Channel Performance</h3>
                <div className="h-80">
                  <Bar 
                    data={{
                      labels: channelData.map(item => item.name),
                      datasets: [
                        {
                          label: 'Messages',
                          data: channelData.map(item => item.messages),
                          backgroundColor: '#3B82F6'
                        },
                        {
                          label: 'Successful',
                          data: channelData.map(item => item.successful),
                          backgroundColor: '#10B981'
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' as const },
                        title: { display: false }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Daily Messages Trend */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Messages (2 weeks)</h3>
                <div className="h-80">
                  <Line 
                    data={{
                      labels: dailyChartData.map(item => item.date),
                      datasets: [
                        {
                          label: 'Messages',
                          data: dailyChartData.map(item => item.messages),
                          borderColor: '#3B82F6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.1
                        },
                        {
                          label: 'Recipients',
                          data: dailyChartData.map(item => item.recipients),
                          borderColor: '#10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          tension: 0.1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' as const },
                        title: { display: false }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Language Usage */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Language Usage</h3>
                <div className="h-80 flex justify-center">
                  <Pie 
                    data={{
                      labels: languageData.map(item => item.name),
                      datasets: [{
                        data: languageData.map(item => item.value),
                        backgroundColor: COLORS,
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' as const },
                        title: { display: false }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Delivery Status */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Status</h3>
                <div className="h-80 flex justify-center">
                  <Pie 
                    data={{
                      labels: deliveryData.map(item => `${item.name} (${item.percentage}%)`),
                      datasets: [{
                        data: deliveryData.map(item => item.value),
                        backgroundColor: COLORS,
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' as const },
                        title: { display: false }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'performance' && (
          <>
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Channel Performance Table */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Channel Performance Table</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Recipients</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {performanceData.channelPerformance.map((channel) => (
                        <tr key={channel.channel}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatChannelName(channel.channel)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {channel.total_attempts}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              channel.success_rate >= 90 ? 'bg-green-100 text-green-800' :
                              channel.success_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {channel.success_rate}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Math.round(channel.avg_recipients_per_send)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hourly Usage Pattern */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Hourly Usage Pattern</h3>
                <div className="h-80">
                  <Bar 
                    data={{
                      labels: hourlyChartData.map(item => item.hour),
                      datasets: [{
                        label: 'Messages',
                        data: hourlyChartData.map(item => item.messages),
                        backgroundColor: '#3B82F6'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' as const },
                        title: { display: false }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Common Errors */}
            {performanceData.commonErrors.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Common Errors</h3>
                <div className="space-y-4">
                  {performanceData.commonErrors.map((error, index) => (
                    <div key={index} className="border-l-4 border-red-400 bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="mr-3">
                          <p className="text-sm text-red-800">{error.error_message}</p>
                          <p className="text-xs text-red-600 mt-1">
                            Count: {error.occurrence_count} | 
                            Last: {new Date(error.last_occurrence).toLocaleDateString('en-US')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};