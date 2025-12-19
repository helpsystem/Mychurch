import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Activity,
  Server,
  Zap,
  History,
  AlertCircle,
  Loader
} from 'lucide-react';
import { n8nService, N8NWorkflow, N8NExecution, N8NServerHealth } from '../services/n8nService';

const AdminN8NAutomationPage: React.FC = () => {
  const { lang } = useLanguage();
  const isRTL = lang === 'fa';

  // State
  const [workflows, setWorkflows] = useState<N8NWorkflow[]>([]);
  const [executions, setExecutions] = useState<N8NExecution[]>([]);
  const [serverHealth, setServerHealth] = useState<N8NServerHealth | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check server health
      const health = await n8nService.checkHealth();
      setServerHealth(health);

      if (health.status === 'healthy') {
        // Load workflows
        const wfs = await n8nService.getWorkflows();
        setWorkflows(wfs);

        // Load recent executions
        const execs = await n8nService.getExecutions(undefined, 20);
        setExecutions(execs);
      } else {
        setError('سرور n8n در دسترس نیست / n8n server is not accessible');
      }
    } catch (err: any) {
      console.error('Failed to load n8n data:', err);
      setError(err.message || 'خطا در بارگذاری اطلاعات / Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    setExecuting(workflowId);
    setError(null);

    try {
      await n8nService.executeWorkflow(workflowId);
      
      // Reload executions after a short delay
      setTimeout(() => {
        loadData();
      }, 1000);

      alert(isRTL ? `ورک‌فلو ${workflowId} با موفقیت اجرا شد` : `Workflow ${workflowId} executed successfully`);
    } catch (err: any) {
      setError(err.message || 'خطا در اجرای ورک‌فلو / Failed to execute workflow');
    } finally {
      setExecuting(null);
    }
  };

  const handleToggleWorkflow = async (workflowId: string, currentState: boolean) => {
    try {
      await n8nService.toggleWorkflow(workflowId, !currentState);
      loadData();
    } catch (err: any) {
      setError(err.message || 'خطا در تغییر وضعیت / Failed to toggle workflow');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isRTL 
      ? date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-white mx-auto mb-4" size={48} />
          <p className="text-white text-xl">{isRTL ? 'در حال بارگذاری...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                <Zap className="text-yellow-400" size={36} />
                {isRTL ? 'پنل اتوماسیون n8n' : 'n8n Automation Panel'}
              </h1>
              <p className="text-gray-300 mt-2">
                {isRTL 
                  ? 'مدیریت و اجرای ورک‌فلوهای خودکار' 
                  : 'Manage and execute automated workflows'}
              </p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              <RefreshCw size={20} />
              {isRTL ? 'بروزرسانی' : 'Refresh'}
            </button>
          </div>

          {/* Server Health Status */}
          <div className="mt-4 flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <Server size={20} />
              <span className="font-semibold">{isRTL ? 'وضعیت سرور:' : 'Server Status:'}</span>
            </div>
            {serverHealth?.status === 'healthy' ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={20} />
                <span>{isRTL ? 'سالم' : 'Healthy'}</span>
                {serverHealth.latency && (
                  <span className="text-gray-400 text-sm">
                    ({serverHealth.latency}ms)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle size={20} />
                <span>{isRTL ? 'غیرفعال' : 'Offline'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-500/20 border border-red-500 text-white px-6 py-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={24} className="flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold mb-1">{isRTL ? 'خطا' : 'Error'}</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflows List */}
        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity size={28} />
              {isRTL ? 'ورک‌فلوها' : 'Workflows'}
              <span className="text-blue-400 text-lg">({workflows.length})</span>
            </h2>

            {workflows.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Activity size={48} className="mx-auto mb-4 opacity-50" />
                <p>{isRTL ? 'هیچ ورک‌فلویی یافت نشد' : 'No workflows found'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`bg-white/5 border ${
                      workflow.active ? 'border-green-500/50' : 'border-gray-500/50'
                    } rounded-xl p-5 hover:bg-white/10 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            {workflow.name}
                          </h3>
                          {workflow.active ? (
                            <span className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                              <CheckCircle size={14} />
                              {isRTL ? 'فعال' : 'Active'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-sm font-semibold">
                              <Pause size={14} />
                              {isRTL ? 'غیرفعال' : 'Inactive'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-3">
                          {isRTL ? 'شناسه:' : 'ID:'} {workflow.id}
                        </p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-300">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {isRTL ? 'ایجاد:' : 'Created:'} {formatDate(workflow.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <RefreshCw size={14} />
                            {isRTL ? 'بروز:' : 'Updated:'} {formatDate(workflow.updatedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleExecuteWorkflow(workflow.id)}
                          disabled={executing === workflow.id}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold disabled:cursor-not-allowed"
                        >
                          {executing === workflow.id ? (
                            <>
                              <Loader className="animate-spin" size={18} />
                              {isRTL ? 'در حال اجرا...' : 'Running...'}
                            </>
                          ) : (
                            <>
                              <Play size={18} />
                              {isRTL ? 'اجرا' : 'Run'}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleWorkflow(workflow.id, workflow.active)}
                          className={`flex items-center gap-2 ${
                            workflow.active
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white px-4 py-2 rounded-lg transition-colors font-semibold`}
                        >
                          {workflow.active ? (
                            <>
                              <Pause size={18} />
                              {isRTL ? 'غیرفعال' : 'Deactivate'}
                            </>
                          ) : (
                            <>
                              <Play size={18} />
                              {isRTL ? 'فعال' : 'Activate'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Executions */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <History size={28} />
              {isRTL ? 'تاریخچه اجرا' : 'Execution History'}
            </h2>

            {executions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <History size={36} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">{isRTL ? 'هیچ اجرایی یافت نشد' : 'No executions found'}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {executions.map((execution) => (
                  <div
                    key={execution.id}
                    className={`bg-white/5 border ${
                      execution.finished && !execution.data.resultData.error
                        ? 'border-green-500/50'
                        : execution.finished
                        ? 'border-red-500/50'
                        : 'border-blue-500/50'
                    } rounded-lg p-4`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {execution.finished && !execution.data.resultData.error ? (
                        <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-1" />
                      ) : execution.finished ? (
                        <XCircle size={18} className="text-red-400 flex-shrink-0 mt-1" />
                      ) : (
                        <Loader size={18} className="text-blue-400 flex-shrink-0 mt-1 animate-spin" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm mb-1">
                          {execution.workflowData.name}
                        </p>
                        <p className="text-gray-400 text-xs mb-2">
                          {formatDate(execution.startedAt)}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-1 rounded ${
                            execution.finished && !execution.data.resultData.error
                              ? 'bg-green-500/20 text-green-400'
                              : execution.finished
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {execution.finished && !execution.data.resultData.error
                              ? (isRTL ? 'موفق' : 'Success')
                              : execution.finished
                              ? (isRTL ? 'خطا' : 'Failed')
                              : (isRTL ? 'در حال اجرا' : 'Running')}
                          </span>
                          <span className="text-gray-500">
                            {execution.mode}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center text-white">
          <p className="text-sm">
            {isRTL 
              ? '💡 این پنل به سرور n8n شما متصل است و می‌تواند ورک‌فلوها را مدیریت و اجرا کند'
              : '💡 This panel is connected to your n8n server and can manage and execute workflows'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {isRTL 
              ? `سرور n8n: ${import.meta.env.VITE_N8N_URL || 'https://n8n.samyar.at'}`
              : `n8n Server: ${import.meta.env.VITE_N8N_URL || 'https://n8n.samyar.at'}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminN8NAutomationPage;
