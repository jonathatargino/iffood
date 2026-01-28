module.exports = {
  apps: [
    {
      name: 'iffood-api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
