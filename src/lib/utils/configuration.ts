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