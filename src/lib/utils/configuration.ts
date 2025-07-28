import prisma from '@/lib/prisma';

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
      console.error(`Error fetching configuration for key ${key}:`, error);
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
      console.error(`Error fetching configurations for category ${category}:`, error);
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
      console.error(`Error setting configuration for key ${key}:`, error);
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
      console.error(`Error deleting configuration for key ${key}:`, error);
      return false;
    }
  }
} 