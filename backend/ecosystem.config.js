module.exports = {
  apps: [
    {
      name: 'brane-tts',
      script: 'tts_server.py',
      interpreter: 'python',
      cwd: __dirname,
      args: '',
      env: {
        TTS_PORT: '3200',
      },
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
      error_file: './logs/tts-error.log',
      out_file: './logs/tts-out.log',
      merge_logs: true,
      autorestart: true,
    },
  ],
};
