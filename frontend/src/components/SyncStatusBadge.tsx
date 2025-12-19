// components/SyncStatusBadge.tsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/axios';
import { useLanguage } from '../hooks/useLanguage';

interface SyncStatusBadgeProps {
  songId: number;
  processingStatus?: string;
  onResyncClick?: () => void;
  showResyncButton?: boolean;
}

const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ 
  songId, 
  processingStatus,
  onResyncClick,
  showResyncButton = false
}) => {
  const { lang } = useLanguage();
  const [status, setStatus] = useState(processingStatus || 'not_processed');
  const [isResyncing, setIsResyncing] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (status === 'queued' || status === 'processing') {
      const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [status]);

  const checkStatus = async () => {
    try {
      const response = await api.get(`/api/worship-songs/${songId}/sync-status`);
      if (response.data.hasJob) {
        const job = response.data.job;
        setJobDetails(job);
        
        // Update status based on job
        if (job.status === 'completed') {
          setStatus('completed');
        } else if (job.status === 'failed') {
          setStatus('failed');
        } else if (job.status === 'processing') {
          setStatus('processing');
        } else if (job.status === 'pending') {
          setStatus('queued');
        }
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };

  const handleResync = async () => {
    setIsResyncing(true);
    try {
      const response = await api.post(`/api/worship-songs/${songId}/resync`);
      if (response.data.success) {
        setStatus('queued');
        if (onResyncClick) onResyncClick();
      }
    } catch (error: any) {
      console.error('Resync error:', error);
      if (error.response?.status === 409) {
        alert(lang === 'fa' ? 'این سرود در حال پردازش است' : 'Song is already queued');
      }
    } finally {
      setIsResyncing(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          label: lang === 'fa' ? 'همگام‌سازی شده' : 'Synced',
          tooltip: jobDetails?.completedAt 
            ? `${lang === 'fa' ? 'تکمیل شد در' : 'Completed at'} ${new Date(jobDetails.completedAt).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')}`
            : ''
        };
      case 'processing':
        return {
          icon: Loader2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20',
          label: lang === 'fa' ? 'در حال پردازش...' : 'Processing...',
          animate: true,
          tooltip: lang === 'fa' ? 'هوش مصنوعی در حال تحلیل فایل صوتی است' : 'AI is analyzing audio'
        };
      case 'queued':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          label: lang === 'fa' ? 'در صف' : 'Queued',
          tooltip: lang === 'fa' ? 'در صف برای پردازش' : 'Waiting for processing'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          label: lang === 'fa' ? 'خطا' : 'Failed',
          tooltip: jobDetails?.errorMessage || (lang === 'fa' ? 'خطا در پردازش' : 'Processing failed')
        };
      case 'not_processed':
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/20',
          label: lang === 'fa' ? 'پردازش نشده' : 'Not Processed',
          tooltip: lang === 'fa' ? 'این سرود هنوز پردازش نشده است' : 'Song not yet processed'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      <div 
        className={`relative flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.color} text-sm font-medium cursor-help`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Icon size={14} className={config.animate ? 'animate-spin' : ''} />
        <span>{config.label}</span>

        {/* Tooltip */}
        {showTooltip && config.tooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10 shadow-lg">
            {config.tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Re-sync Button (for admins/leaders) */}
      {showResyncButton && (
        <button
          onClick={handleResync}
          disabled={isResyncing || status === 'processing' || status === 'queued'}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={lang === 'fa' ? 'همگام‌سازی مجدد' : 'Re-sync'}
        >
          {isResyncing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
        </button>
      )}
    </div>
  );
};

export default SyncStatusBadge;
