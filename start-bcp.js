#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const envPath = path.join(root, '.env');
const envExample = path.join(root, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envPath);
    console.log('.env creado desde .env.example — edita las credenciales antes de produccion.');
  } else {
    console.error('No se encontro .env.example. Crea el archivo .env manualmente.');
    process.exit(1);
  }
}

const run = (cmd) => {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root });
};

run('docker compose down');
run('docker compose up -d --build');

console.log('\nBancoBCP levantado:');
console.log('  Frontend: http://localhost:3000');
console.log('  API:      http://localhost:5001/api');
console.log('  Health:   http://localhost:5001/api/health');
