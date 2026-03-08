import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const CONFIG_FILE = 'flow-packs.config.json';
const DEFAULT_PUBLIC_LOCAL_DIRECTORIES = ['flow-packs'];
const DEFAULT_LOCAL_DIRECTORIES = ['flow-packs', 'my-flow-packs'];

function unique(values) {
  return [...new Set(values)];
}

function resolveStringList(rawValue, fallback) {
  const source =
    typeof rawValue === 'string' && rawValue.trim().length > 0
      ? rawValue
      : fallback.join(',');

  return unique(
    source
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
}

async function readConfigFile(projectRoot) {
  const configPath = path.resolve(projectRoot, CONFIG_FILE);

  try {
    const raw = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    const code = error && typeof error === 'object' ? error.code : null;
    if (code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

function fromConfigList(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const list = value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);

  return list.length > 0 ? unique(list) : fallback;
}

export async function getFlowPackSourceConfig(projectRoot, env = process.env) {
  const config = await readConfigFile(projectRoot);
  const detectedLocalDirectories = [...fromConfigList(config.localDirectories, DEFAULT_LOCAL_DIRECTORIES)];
  const privateOverlayDir = 'private-packages';
  const privateOverlayPath = path.resolve(projectRoot, privateOverlayDir);

  if (
    !detectedLocalDirectories.includes(privateOverlayDir) &&
    fsSync.existsSync(privateOverlayPath)
  ) {
    detectedLocalDirectories.push(privateOverlayDir);
  }

  const localDirectories = env.FLOW_PACKS_DIR
    ? resolveStringList(env.FLOW_PACKS_DIR, [env.FLOW_PACKS_DIR])
    : resolveStringList(
        env.FLOW_PACKS_DIRS,
        detectedLocalDirectories
      );
  const publicLocalDirectories = resolveStringList(
    env.PUBLIC_FLOW_PACKS_DIRS,
    fromConfigList(config.publicLocalDirectories, DEFAULT_PUBLIC_LOCAL_DIRECTORIES)
  );
  const packageNames = resolveStringList(
    env.FLOW_PACK_PACKAGES,
    fromConfigList(config.packageNames, [])
  );
  const publicPackageNames = resolveStringList(
    env.PUBLIC_FLOW_PACK_PACKAGES,
    fromConfigList(config.publicPackageNames, [])
  );

  return {
    localDirectories,
    publicLocalDirectories,
    packageNames,
    publicPackageNames,
  };
}

export async function getConfiguredFlowPackPackageNames(projectRoot, env = process.env) {
  const config = await getFlowPackSourceConfig(projectRoot, env);

  return unique([...config.packageNames, ...config.publicPackageNames]);
}
