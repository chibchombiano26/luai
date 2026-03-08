import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getFlowPackSourceConfig, getConfiguredFlowPackPackageNames } from './flow-pack-config.mjs';

const projectRoot = process.cwd();
const requireFromProject = createRequire(path.join(projectRoot, 'package.json'));

function isInstalled(packageName) {
  try {
    requireFromProject.resolve(`${packageName}/package.json`);
    return true;
  } catch {
    return false;
  }
}

async function getLocalPackDependencies(projectRoot) {
  const config = await getFlowPackSourceConfig(projectRoot, process.env);
  const dependencies = new Set();

  for (const dir of config.localDirectories) {
    const absolutePath = path.resolve(projectRoot, dir);
    try {
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const packPackageJsonPath = path.join(absolutePath, entry.name, 'package.json');
        try {
          const content = await fs.readFile(packPackageJsonPath, 'utf8');
          const pkg = JSON.parse(content);
          if (pkg.dependencies) {
            Object.keys(pkg.dependencies).forEach(dep => dependencies.add(dep));
          }
        } catch {
          // No package.json or invalid JSON, skip
        }
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  return [...dependencies];
}

function installPackages(packageNames) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['install', '--no-save', '--package-lock=false', ...packageNames], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: process.env,
      shell: process.platform === 'win32',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`npm install failed with exit code ${code ?? 'unknown'}`));
    });

    child.on('error', reject);
  });
}

const configuredPackages = await getConfiguredFlowPackPackageNames(projectRoot, process.env);
const localDependencies = await getLocalPackDependencies(projectRoot);

const allRequiredPackages = [...new Set([...configuredPackages, ...localDependencies])];
const missingPackages = allRequiredPackages.filter((packageName) => !isInstalled(packageName));

if (missingPackages.length === 0) {
  process.exit(0);
}

console.log(`Installing missing flow-pack packages and local dependencies: ${missingPackages.join(', ')}`);
await installPackages(missingPackages);
