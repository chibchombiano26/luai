import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = process.cwd();
const privatePacksDir = path.join(projectRoot, 'private-packages');
const e2eRuntimeDir = path.join(projectRoot, '.runtime-config', 'e2e');
const e2eDatabasePath = path.join(e2eRuntimeDir, 'quotes.db');
const seedDatabasePath = path.join(projectRoot, 'quotes.db');
const env = {
  ...process.env,
  CLERK_AUTH_ENABLED: 'false',
  BASIC_AUTH_ENABLED: 'false',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '',
  CLERK_SECRET_KEY: '',
  APP_RUNTIME_CONFIG_DIR: process.env.APP_RUNTIME_CONFIG_DIR || e2eRuntimeDir,
  DATABASE_URL: process.env.DATABASE_URL || e2eDatabasePath,
  TURSO_URL: '',
  TURSO_AUTH_TOKEN: '',
  POSTGRES_URL: '',
  MCP_E2E_INSURANCE_MOCKS: 'true',
  MCP_PORT: process.env.MCP_PORT || '604',
};

if (!env.FLOW_PACKS_DIR && !env.FLOW_PACKS_DIRS && !env.FLOW_PACK_PACKAGES && fs.existsSync(privatePacksDir)) {
  env.FLOW_PACKS_DIRS = 'flow-packs,my-flow-packs,private-packages';
}

const children = new Set();
let shuttingDown = false;

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: projectRoot,
      stdio: 'inherit',
      env,
      shell: process.platform === 'win32',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${commandArgs.join(' ')} failed with exit code ${code ?? 'unknown'}`));
    });

    child.on('error', reject);
  });
}

function spawnProcess(command, commandArgs, label) {
  const child = spawn(command, commandArgs, {
    cwd: projectRoot,
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  });

  children.add(child);

  child.on('exit', (code, signal) => {
    children.delete(child);

    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    for (const otherChild of children) {
      otherChild.kill('SIGTERM');
    }

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error(`[e2e:${label}] failed to start`, error);

    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    for (const otherChild of children) {
      otherChild.kill('SIGTERM');
    }
    process.exit(1);
  });

  return child;
}

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    child.kill(signal);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

fs.rmSync(e2eRuntimeDir, { recursive: true, force: true });
fs.mkdirSync(e2eRuntimeDir, { recursive: true });
if (fs.existsSync(seedDatabasePath)) {
  fs.copyFileSync(seedDatabasePath, e2eDatabasePath);
}

await run('npm', ['run', 'build:flow-packs']);

spawnProcess('npm', ['exec', '--', 'next', 'dev', '-p', '600'], 'next');
spawnProcess('npm', ['--prefix', 'src/mcp-server', 'run', 'dev'], 'mcp');
