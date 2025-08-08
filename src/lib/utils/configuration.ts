import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export interface ConfigurationValue {
  key: string;
  value: string;
  description?: string | null;
  category: string;
}

export class ConfigurationManager {
  /**
   * Get a single configuration value by key
   */
  static async getConfig(key: string): Promise<string | null> {
    try {
      const config = await prisma.configuration.findUnique({
        where: { key },
        select: { value: true }
      });
      return config?.value || null;
    } catch (error) {
      logger.error(`Error fetching configuration for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get multiple configuration values by category
   */
  static async getConfigsByCategory(category: string): Promise<ConfigurationValue[]> {
    try {
      const configs = await prisma.configuration.findMany({
        where: { 
          category,
          isActive: true 
        },
        select: {
          key: true,
          value: true,
          description: true,
          category: true
        }
      });
      return configs;
    } catch (error) {
      logger.error(`Error fetching configurations for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Get time slot configuration as a structured object
   */
  static async getTimeSlotConfig(): Promise<{
    slotDuration: number;
    startTime: string;
    endTime: string;
  }> {
    const configs = await this.getConfigsByCategory('time_slots');
    
    return {
      slotDuration: parseInt(configs.find(c => c.key === 'time_slot_duration')?.value || '3'),
      startTime: configs.find(c => c.key === 'business_start_time')?.value || '09:00',
      endTime: configs.find(c => c.key === 'business_end_time')?.value || '21:00',
    };
  }

  /**
   * Get wallet top-up reward configuration
   */
  static async getWalletTopUpRewardConfig(): Promise<{
    enabled: boolean;
    amount: number;
  }> {
    const enabled = await this.getConfig('wallet_topup_reward_enabled');
    const amount = await this.getConfig('wallet_topup_reward_amount');
    
    return {
      enabled: enabled === 'true',
      amount: amount ? parseFloat(amount) : 0
    };
  }

  /**
   * Get wallet quick slots configuration
   */
  static async getWalletQuickSlotsConfig(): Promise<{
    enabled: boolean;
    slots: Array<{
      id: number;
      amount: number;
      reward: number;
      enabled: boolean;
    }>;
  }> {
    const enabled = await this.getConfig('wallet_quick_slots_enabled');
    const slots = [];
    
    // Get all 10 quick slots
    for (let i = 1; i <= 10; i++) {
      const amount = await this.getConfig(`wallet_quick_slot_${i}_amount`);
      const reward = await this.getConfig(`wallet_quick_slot_${i}_reward`);
      const slotEnabled = await this.getConfig(`wallet_quick_slot_${i}_enabled`);
      
      slots.push({
        id: i,
        amount: amount ? parseFloat(amount) : 0,
        reward: reward ? parseFloat(reward) : 0,
        enabled: slotEnabled === 'true'
      });
    }
    
    return {
      enabled: enabled === 'true',
      slots
    };
  }

  /**
   * Update wallet quick slot configuration
   */
  static async updateWalletQuickSlot(
    slotId: number, 
    amount: number, 
    reward: number,
    enabled: boolean
  ): Promise<boolean> {
    try {
      await Promise.all([
        this.setConfig(
          `wallet_quick_slot_${slotId}_amount`, 
          amount.toString(), 
          'wallet_quick_slots',
          `Quick slot ${slotId} amount (in BHD)`
        ),
        this.setConfig(
          `wallet_quick_slot_${slotId}_reward`, 
          reward.toString(), 
          'wallet_quick_slots',
          `Reward for quick slot ${slotId} (in BHD)`
        ),
        this.setConfig(
          `wallet_quick_slot_${slotId}_enabled`, 
          enabled.toString(), 
          'wallet_quick_slots',
          `Enable/disable quick slot ${slotId}`
        )
      ]);
      return true;
    } catch (error) {
      logger.error(`Error updating wallet quick slot ${slotId}:`, error);
      return false;
    }
  }

  /**
   * Set or update a configuration value
   */
  static async setConfig(key: string, value: string, category: string = 'general', description?: string): Promise<boolean> {
    try {
      await prisma.configuration.upsert({
        where: { key },
        update: { 
          value,
          category,
          description,
          updatedAt: new Date()
        },
        create: {
          key,
          value,
          category,
          description,
          isActive: true
        }
      });
      return true;
    } catch (error) {
      logger.error(`Error setting configuration for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a configuration
   */
  static async deleteConfig(key: string): Promise<boolean> {
    try {
      await prisma.configuration.delete({
        where: { key }
      });
      return true;
    } catch (error) {
      logger.error(`Error deleting configuration for key ${key}:`, error);
      return false;
    }
  }
} 