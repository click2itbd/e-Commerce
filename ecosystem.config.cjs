module.exports = {
  apps: [
    {
      name: 'click2it-backend',
      script: 'server.ts',
      interpreter: 'node_modules/.bin/tsx',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      max_memory_restart: '1G', // Restart if it uses too much memory
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
