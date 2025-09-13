const os = require('os');
const { testConnection } = require('./db');

class MonitoringService {
  constructor() {
    this.startTime = Date.now();
    this.errorCounts = {
      database: 0,
      upload: 0,
      auth: 0,
      other: 0
    };
  }

  // Get system metrics
  async getSystemMetrics() {
    const uptime = process.uptime();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMem = totalMem - freeMem;
    const memUsage = process.memoryUsage();

    return {
      uptime: uptime,
      timestamp: new Date().toISOString(),
      memory: {
        free: freeMem,
        total: totalMem,
        used: usedMem,
        usagePercentage: ((usedMem / totalMem) * 100).toFixed(2),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal
      },
      cpu: {
        loadAvg: os.loadavg(),
        cores: os.cpus().length
      }
    };
  }

  // Track errors by category
  trackError(category = 'other') {
    if (this.errorCounts[category] !== undefined) {
      this.errorCounts[category]++;
    } else {
      this.errorCounts.other++;
    }
  }

  // Get error metrics
  getErrorMetrics() {
    return {
      ...this.errorCounts,
      total: Object.values(this.errorCounts).reduce((a, b) => a + b, 0)
    };
  }

  // Reset error counts
  resetErrorCounts() {
    Object.keys(this.errorCounts).forEach(key => {
      this.errorCounts[key] = 0;
    });
  }

  // Get comprehensive health check
  async getHealthStatus() {
    try {
      // Get system metrics (skipping DB check for now)
      const metrics = await this.getSystemMetrics();
      const dbConnected = false; // Temporarily disable DB check
      
      // Check memory usage (warn if over 90%)
      const memoryWarning = metrics.memory.usagePercentage > 90;
      
      // Check error rates (warn if more than 100 total errors)
      const errorMetrics = this.getErrorMetrics();
      const errorWarning = errorMetrics.total > 100;

      return {
        status: dbConnected && !memoryWarning && !errorWarning ? 'healthy' : 'warning',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: dbConnected
        },
        system: metrics,
        errors: errorMetrics,
        warnings: {
          memory: memoryWarning,
          errors: errorWarning
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

module.exports = monitoringService;