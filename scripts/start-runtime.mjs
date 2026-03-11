import { spawn } from 'node:child_process';

const children = new Set();
let shuttingDown = false;

function spawnProcess(command, args, label) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
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
    console.error(`[runtime:${label}] failed to start`, error);

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

spawnProcess('npm', ['run', 'start'], 'next');

if (process.env.START_MCP_SERVER === 'true') {
  spawnProcess('npm', ['--prefix', 'src/mcp-server', 'run', 'start'], 'mcp');
}
