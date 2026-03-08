import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = process.cwd();
const privatePacksDir = path.join(projectRoot, 'private-packages');
const args = process.argv.slice(2);
const noAuth = args.includes('--noauth');

function run(command, commandArgs, env) {
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

const env = { ...process.env };
const hasExplicitFlowPackConfig =
  Boolean(env.FLOW_PACKS_DIR) ||
  Boolean(env.FLOW_PACKS_DIRS) ||
  Boolean(env.FLOW_PACK_PACKAGES);

if (!hasExplicitFlowPackConfig && fs.existsSync(privatePacksDir)) {
  env.FLOW_PACKS_DIRS = 'flow-packs,my-flow-packs,private-packages';
  console.log('Detected local private flow packs. Using FLOW_PACKS_DIRS=flow-packs,my-flow-packs,private-packages');
}

if (noAuth) {
  env.CLERK_AUTH_ENABLED = 'false';
  env.BASIC_AUTH_ENABLED = 'false';
  env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = '';
  env.CLERK_SECRET_KEY = '';
}

await run('npm', ['run', 'build:flow-packs'], env);
await run('next', ['dev', '-p', '600'], env);
