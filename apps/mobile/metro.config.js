// Metro config for monorepo (Turborepo) with Expo SDK 50+.
// Watches the repo root so we can resolve workspaces (@medconecta/shared, etc.).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

// 0. Ensure Metro treats `apps/mobile` as the project root (entry file
//    resolution, relative imports, etc.). Without this, when run from a
//    monorepo the server can resolve `./index` against the repo root.
config.projectRoot = projectRoot;

// 1. Make Metro watch the entire monorepo (so shared packages get picked up).
config.watchFolders = [monorepoRoot];

// 2. Let Metro look up modules from the root `node_modules` (workspaces hoisted).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force the workspace packages to be resolved from source (TS files),
//    not re-compiled to .js during bundling. This matches what the native
//    bundler does via babel-plugin-module-resolver.
config.resolver.disableHierarchicalLookup = true;

// 4. Web bundler (Metro on web) needs a single project root.
config.resolver.extraNodeModules = {
  '@medconecta/shared': path.resolve(monorepoRoot, 'packages/shared'),
  '@medconecta/db': path.resolve(monorepoRoot, 'packages/db'),
};

// 5. Web shims for native-only modules.
const shimPath = path.resolve(__dirname, 'src/shims');
const webShims = {
  'better-sqlite3': path.resolve(shimPath, 'empty.ts'),
  'react-native-sqlite-storage': path.resolve(shimPath, 'empty.ts'),
  'expo-secure-store': path.resolve(shimPath, 'expo-secure-store.ts'),
  'expo-local-authentication': path.resolve(shimPath, 'expo-local-authentication.ts'),
  'expo-notifications': path.resolve(shimPath, 'expo-notifications.ts'),
  'expo-file-system': path.resolve(shimPath, 'expo-file-system.ts'),
  '@react-native-async-storage/async-storage': path.resolve(shimPath, 'async-storage.ts'),
};

config.resolver.blockList = exclusionList([
  /better-sqlite3/,
]);

// 6. Add `.js` -> `.ts` rewriting for the shared package (which uses
//    `moduleResolution: bundler` and imports explicit `.js` specifiers).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // On web, stub out native-only modules that ship native binaries.
  if (platform === 'web' && webShims[moduleName]) {
    return {
      filePath: webShims[moduleName],
      type: 'sourceFile',
    };
  }

  // Rewrite ".js" specifiers to ".ts" so Metro can resolve them.
  // We strip the custom resolver from the context to avoid infinite recursion
  // and let Metro's default resolver handle the actual file lookup.
  if (moduleName.endsWith('.js')) {
    const tsModule = moduleName.slice(0, -3) + '.ts';
    const defaultContext = { ...context, resolveRequest: undefined };
    try {
      return context.resolveRequest(defaultContext, tsModule, platform);
    } catch {
      // fall through to default
    }
  }

  // Default resolution — strip our custom resolver to avoid recursion.
  const defaultContext = { ...context, resolveRequest: undefined };
  return context.resolveRequest(defaultContext, moduleName, platform);
};

// 7. Make sure `.ts`/`.tsx` are in the source exts (Expo already adds these,
//    but we re-affirm to be safe for the web platform).
config.resolver.sourceExts = config.resolver.sourceExts ?? [];
['ts', 'tsx'].forEach((ext) => {
  if (!config.resolver.sourceExts.includes(ext)) {
    config.resolver.sourceExts.push(ext);
  }
});

module.exports = config;
