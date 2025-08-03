import { CRON_JOBS, CronJobConfig, CRON_SECRET_TOKEN } from './cronConfig';
import logger from '@/lib/logger';

interface CronJobExecution {
  jobName: string;
  startTime: Date;
  endTime?: Date;
  success?: boolean;
  error?: string;
  result?: any;
}

class CronScheduler {
  private isRunning = false;
  private executions: CronJobExecution[] = [];
  private intervals: NodeJS.Timeout[] = [];

  /**
   * Start the cron scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.info('Cron scheduler is already running');
      return;
    }

    logger.info('Starting cron scheduler...');
    this.isRunning = true;

    // Start each enabled cron job
    CRON_JOBS.forEach(job => {
      if (job.enabled) {
        this.scheduleJob(job);
      }
    });

    logger.info(`Cron scheduler started with ${CRON_JOBS.filter(j => j.enabled).length} jobs`);
  }

  /**
   * Stop the cron scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      logger.info('Cron scheduler is not running');
      return;
    }

    logger.info('Stopping cron scheduler...');
    this.isRunning = false;

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    logger.info('Cron scheduler stopped');
  }

  /**
   * Schedule a single cron job
   */
  private scheduleJob(job: CronJobConfig): void {
    const intervalMs = this.getIntervalFromCronExpression(job.schedule);
    
    if (intervalMs === null) {
      logger.error(`Invalid cron expression for job ${job.name}: ${job.schedule}`);
      return;
    }

    logger.info(`Scheduling job ${job.name} to run every ${intervalMs / 1000} seconds`);

    const interval = setInterval(async () => {
      if (this.isRunning) {
        await this.executeJob(job);
      }
    }, intervalMs);

    this.intervals.push(interval);

    // Execute immediately on startup
    this.executeJob(job);
  }

  /**
   * Execute a single cron job
   */
  private async executeJob(job: CronJobConfig): Promise<void> {
    const execution: CronJobExecution = {
      jobName: job.name,
      startTime: new Date()
    };

    try {
      logger.info(`Executing cron job: ${job.name}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${job.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CRON_SECRET_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      execution.endTime = new Date();
      execution.success = response.ok;
      execution.result = result;

      if (response.ok) {
        logger.info(`Cron job ${job.name} completed successfully`);
      } else {
        logger.error(`Cron job ${job.name} failed:`, result);
        execution.error = (result as any)?.error || 'Unknown error';
      }
    } catch (error) {
      execution.endTime = new Date();
      execution.success = false;
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error(`Cron job ${job.name} failed with error:`, error);
    }

    this.executions.push(execution);

    // Keep only last 100 executions
    if (this.executions.length > 100) {
      this.executions = this.executions.slice(-100);
    }
  }

  /**
   * Convert cron expression to interval in milliseconds
   * This is a simplified implementation - you might want to use a proper cron library
   */
  private getIntervalFromCronExpression(cronExpression: string): number | null {
    const parts = cronExpression.split(' ');
    
    if (parts.length !== 5) {
      return null;
    }

    const [minute, hour, day, month, dayOfWeek] = parts;

    // Handle common patterns
    if (minute.startsWith('*/')) {
      const interval = parseInt(minute.substring(2));
      return interval * 60 * 1000; // Convert to milliseconds
    }

    if (minute === '*' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
      return 60 * 1000; // Every minute
    }

    // Default to 5 minutes for other patterns
    return 5 * 60 * 1000;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): CronJobExecution[] {
    return [...this.executions];
  }

  /**
   * Get recent executions for a specific job
   */
  getJobExecutions(jobName: string, limit: number = 10): CronJobExecution[] {
    return this.executions
      .filter(exec => exec.jobName === jobName)
      .slice(-limit);
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    activeJobs: number;
    totalExecutions: number;
    lastExecution?: CronJobExecution;
  } {
    return {
      isRunning: this.isRunning,
      activeJobs: this.intervals.length,
      totalExecutions: this.executions.length,
      lastExecution: this.executions[this.executions.length - 1]
    };
  }
}

// Export singleton instance
export const cronScheduler = new CronScheduler();

