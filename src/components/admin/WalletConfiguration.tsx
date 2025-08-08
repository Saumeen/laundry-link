'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import logger from '@/lib/logger';

interface QuickSlot {
  id: number;
  amount: number;
  reward: number;
  enabled: boolean;
}

interface WalletConfig {
  enabled: boolean;
  slots: QuickSlot[];
}

export default function WalletConfiguration() {
  const { showToast } = useToast();
  const [config, setConfig] = useState<WalletConfig>({
    enabled: true,
    slots: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      amount: 0,
      reward: 0,
      enabled: i < 5 // First 5 slots enabled by default
    }))
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/configurations/wallet-quick-slots');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      } else {
        showToast('Failed to fetch wallet configuration', 'error');
      }
    } catch (error) {
      logger.error('Error fetching wallet configuration:', error);
      showToast('Failed to fetch wallet configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/configurations/wallet-quick-slots', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        showToast('Wallet configuration saved successfully', 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to save configuration', 'error');
      }
    } catch (error) {
      logger.error('Error saving wallet configuration:', error);
      showToast('Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSlotChange = (slotId: number, field: 'amount' | 'reward' | 'enabled', value: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      slots: prev.slots.map(slot =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleToggleEnabled = () => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Wallet Quick Slots Configuration
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure quick payment amounts and their corresponding rewards
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={handleToggleEnabled}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Enable Quick Slots</span>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

             {/* Quick Slots Configuration */}
       <div className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {config.slots.map((slot) => (
             <div key={slot.id} className={`border rounded-lg p-4 ${slot.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-sm font-medium text-gray-900">
                   Quick Slot {slot.id}
                 </h4>
                 <div className="flex items-center space-x-2">
                   <span className="text-xs text-gray-500">#{slot.id}</span>
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={slot.enabled}
                       onChange={(e) => handleSlotChange(slot.id, 'enabled', e.target.checked)}
                       className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                     />
                     <span className="ml-1 text-xs text-gray-700">Enable</span>
                   </label>
                 </div>
               </div>
               
               <div className="space-y-3">
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">
                     Amount (BHD)
                   </label>
                   <input
                     type="number"
                     min="0"
                     step="0.01"
                     value={slot.amount}
                     onChange={(e) => handleSlotChange(slot.id, 'amount', parseFloat(e.target.value) || 0)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="0.00"
                     disabled={!slot.enabled}
                   />
                 </div>
                 
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">
                     Reward (BHD)
                   </label>
                   <input
                     type="number"
                     min="0"
                     step="0.01"
                     value={slot.reward}
                     onChange={(e) => handleSlotChange(slot.id, 'reward', parseFloat(e.target.value) || 0)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="0.00"
                     disabled={!slot.enabled}
                   />
                 </div>
                 
                 {slot.enabled && slot.amount > 0 && slot.reward > 0 && (
                   <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                     <div>Total: <span className="font-medium">{(slot.amount + slot.reward).toFixed(2)} BHD</span></div>
                     <div>Reward Rate: <span className="font-medium">{((slot.reward / slot.amount) * 100).toFixed(1)}%</span></div>
                   </div>
                 )}
               </div>
             </div>
           ))}
         </div>
       </div>

             {/* Summary */}
       <div className="mt-6 p-4 bg-blue-50 rounded-lg">
         <h4 className="text-sm font-medium text-blue-900 mb-2">Configuration Summary</h4>
         <div className="text-sm text-blue-800">
           <p>• Quick slots are {config.enabled ? 'enabled' : 'disabled'}</p>
           <p>• {config.slots.filter(s => s.enabled).length} slots enabled</p>
           <p>• {config.slots.filter(s => s.enabled && s.amount > 0).length} slots configured with amounts</p>
           <p>• Total possible reward: {config.slots.filter(s => s.enabled).reduce((sum, slot) => sum + slot.reward, 0).toFixed(2)} BHD</p>
         </div>
       </div>
    </div>
  );
}
