const fs = require('node:fs');
const path = require('node:path');

/**
 * 简单的 .env 文件解析器，避免依赖额外的 npm 包
 */
function parseEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...values] = trimmed.split('=');
    if (key && values.length > 0) {
      // 去掉可能的引号
      env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

const dotEnvPath = path.resolve(__dirname, '.env');
const envConfig = parseEnv(dotEnvPath);

module.exports = {
  apps: [{
    name: 'skillsmk',
    script: './.output/server/index.mjs',
    // cluster 模式：利用所有 CPU 核心，多个并发请求并行处理，避免单进程排队
    exec_mode: 'cluster',
    instances: 'max',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0',
      ...envConfig
    }
  }]
};
