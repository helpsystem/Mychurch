/**
 * TTS Usage Dashboard
 * 
 * Admin page for monitoring Google Cloud TTS usage and quota
 */

import React, { useState, useEffect } from 'react';

interface UsageStats {
  currentMonth: string;
  charactersUsed: number;
  requestCount: number;
  limit: number;
  remaining: number;
  percentageUsed: string;
  lastReset: string;
  history: Array<{
    month: string;
    charactersUsed: number;
    requestCount: number;
  }>;
}

export default function TTSUsageDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/tts/usage');
      if (!response.ok) {
        throw new Error('Failed to load usage stats');
      }
      
      const data = await response.json();
      setStats(data.usage);
      setError(null);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-xl font-bold mb-2">Error</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={loadStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const percentage = parseFloat(stats.percentageUsed);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            TTS Usage Dashboard
          </h1>
          <p className="text-gray-600">
            Google Cloud Text-to-Speech Free Tier Monitoring
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {formatDate(stats.lastReset)}
          </p>
        </div>

        {/* Current Month Usage */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Current Month: {stats.currentMonth}
          </h2>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Usage</span>
              <span className={`text-sm font-bold ${getUsageColor(percentage)}`}>
                {stats.percentageUsed}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  percentage >= 90 ? 'bg-red-600' :
                  percentage >= 75 ? 'bg-orange-500' :
                  percentage >= 50 ? 'bg-yellow-500' :
                  'bg-green-600'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">
                Characters Used
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatNumber(stats.charactersUsed)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                of {formatNumber(stats.limit)}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">
                Remaining
              </div>
              <div className="text-2xl font-bold text-green-900">
                {formatNumber(stats.remaining)}
              </div>
              <div className="text-xs text-green-600 mt-1">
                characters left
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium mb-1">
                API Requests
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {formatNumber(stats.requestCount)}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                this month
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {percentage >= 75 && (
            <div className={`mt-6 p-4 rounded-lg ${
              percentage >= 90 ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className={`font-bold mb-1 ${
                percentage >= 90 ? 'text-red-800' : 'text-orange-800'
              }`}>
                {percentage >= 90 ? '⚠️ Critical Warning' : '⚠️ Warning'}
              </div>
              <p className={percentage >= 90 ? 'text-red-700' : 'text-orange-700'}>
                {percentage >= 90
                  ? 'You are approaching the free tier limit. Consider reducing usage or upgrading your plan.'
                  : 'You have used more than 75% of your free tier quota. Monitor usage carefully.'}
              </p>
            </div>
          )}
        </div>

        {/* Historical Data */}
        {stats.history && stats.history.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Historical Usage
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700">Month</th>
                    <th className="text-right py-3 px-4 text-gray-700">Characters</th>
                    <th className="text-right py-3 px-4 text-gray-700">Requests</th>
                    <th className="text-right py-3 px-4 text-gray-700">Usage %</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.history.map((entry, index) => {
                    const historyPercentage = (entry.charactersUsed / stats.limit) * 100;
                    
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {entry.month}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          {formatNumber(entry.charactersUsed)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          {formatNumber(entry.requestCount)}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${getUsageColor(historyPercentage)}`}>
                          {historyPercentage.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Free Tier Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div>
              <h3 className="font-bold mb-2">WaveNet Voices (fa-IR-Wavenet-D)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Limit: 500,000 characters/month</li>
                <li>Best quality Persian voice</li>
                <li>Used for all Bible verses and songs</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2">Usage Tracking</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Resets on 1st of each month</li>
                <li>All requests are cached locally</li>
                <li>Auto-syncs to production server</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadStats}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 Refresh Stats
          </button>
        </div>
      </div>
    </div>
  );
}
