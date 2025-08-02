export interface CronJobConfig {
  name: string;
  schedule: string; // Cron expression
  endpoint: string;
  enabled: boolean;
  description: string;
}

export const CRON_JOBS: CronJobConfig[] = [
  {
    name: 'payment-status-check',
    schedule: '*/1 * * * *', // Every 5 minutes
    endpoint: '/api/cron/check-payments',
    enabled: true,
    description: 'Check pending payment statuses and update wallet balances'
  },
  {
    name: 'payment-status-check-hourly',
    schedule: '0 * * * *', // Every hour
    endpoint: '/api/cron/check-payments',
    enabled: true,
    description: 'Hourly check for pending payments (backup)'
  }
];

export const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN || 'your-secret-token-here';

/**
 * Validate cron expression
 */
export function validateCronExpression(expression: string): boolean {
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(expression);
}

/**
 * Get next run time for a cron expression
 */
export function getNextRunTime(cronExpression: string): Date {
  const now = new Date();
  const parts = cronExpression.split(' ');
  
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression');
  }

  const [minute, hour, day, month, dayOfWeek] = parts;
  
  // Simple implementation - you might want to use a proper cron library
  const nextRun = new Date(now);
  
  // For now, just add 5 minutes as a simple fallback
  nextRun.setMinutes(nextRun.getMinutes() + 5);
  
  return nextRun;
}

/**
 * Format cron job status for logging
 */
export function formatCronJobStatus(job: CronJobConfig, lastRun?: Date, nextRun?: Date): string {
  return `Cron Job: ${job.name} (${job.enabled ? 'ENABLED' : 'DISABLED'})
    Schedule: ${job.schedule}
    Endpoint: ${job.endpoint}
    Last Run: ${lastRun ? lastRun.toISOString() : 'Never'}
    Next Run: ${nextRun ? nextRun.toISOString() : 'Unknown'}
    Description: ${job.description}`;
} 