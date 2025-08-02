'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface CronStatus {
  isRunning: boolean;
  activeJobs: number;
  totalExecutions: number;
  lastExecution?: {
    jobName: string;
    startTime: string;
    endTime?: string;
    success?: boolean;
    error?: string;
  };
}

interface PaymentStats {
  totalPending: number;
  pendingWithTapId: number;
  pendingWithoutTapId: number;
  lastChecked: string;
}

interface ExecutionHistory {
  jobName: string;
  startTime: string;
  endTime?: string;
  success?: boolean;
  error?: string;
  result?: any;
}

export default function CronJobMonitor() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<CronStatus | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/cron/status?includeStats=true&includeHistory=true&limit=20');
      const data = await response.json() as {
        success: boolean;
        status?: CronStatus;
        paymentStats?: PaymentStats;
        executionHistory?: ExecutionHistory[];
      };

      if (data.success) {
        setStatus(data.status || null);
        setPaymentStats(data.paymentStats || null);
        setExecutionHistory(data.executionHistory || []);
      } else {
        showToast('Failed to fetch cron status', 'error');
      }
    } catch (error) {
      console.error('Error fetching cron status:', error);
      showToast('Error fetching cron status', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const controlCron = async (action: 'start' | 'stop' | 'restart') => {
    try {
      const response = await fetch('/api/admin/cron/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json() as { success: boolean };

      if (data.success) {
        showToast(`Cron scheduler ${action}ed successfully`, 'success');
        fetchStatus();
      } else {
        showToast(`Failed to ${action} cron scheduler`, 'error');
      }
    } catch (error) {
      console.error(`Error ${action}ing cron scheduler:`, error);
      showToast(`Error ${action}ing cron scheduler`, 'error');
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    return `${Math.round(duration / 1000)}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cron Job Status</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-sm rounded ${
                autoRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={fetchStatus}
              disabled={refreshing}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Status</div>
              <div className={`text-lg font-semibold ${status.isRunning ? 'text-green-600' : 'text-red-600'}`}>
                {status.isRunning ? 'Running' : 'Stopped'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Active Jobs</div>
              <div className="text-lg font-semibold text-gray-900">{status.activeJobs}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Executions</div>
              <div className="text-lg font-semibold text-gray-900">{status.totalExecutions}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Last Execution</div>
              <div className="text-sm text-gray-900">
                {status.lastExecution ? formatDateTime(status.lastExecution.startTime) : 'Never'}
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={() => controlCron('start')}
            disabled={status?.isRunning}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start
          </button>
          <button
            onClick={() => controlCron('stop')}
            disabled={!status?.isRunning}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </button>
          <button
            onClick={() => controlCron('restart')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Restart
          </button>
        </div>
      </div>

      {/* Payment Stats Card */}
      {paymentStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600">Total Pending</div>
              <div className="text-lg font-semibold text-blue-900">{paymentStats.totalPending}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-600">With TAP ID</div>
              <div className="text-lg font-semibold text-yellow-900">{paymentStats.pendingWithTapId}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm text-red-600">Without TAP ID</div>
              <div className="text-lg font-semibold text-red-900">{paymentStats.pendingWithoutTapId}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Last Checked</div>
              <div className="text-sm text-gray-900">{formatDateTime(paymentStats.lastChecked)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Execution History Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {executionHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No execution history available
                  </td>
                </tr>
              ) : (
                executionHistory.map((execution, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {execution.jobName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(execution.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(execution.startTime, execution.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        execution.success
                          ? 'bg-green-100 text-green-800'
                          : execution.success === false
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {execution.success === true ? 'Success' : execution.success === false ? 'Failed' : 'Running'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {execution.error ? (
                        <span className="text-red-600" title={execution.error}>
                          {execution.error.length > 50 ? `${execution.error.substring(0, 50)}...` : execution.error}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 