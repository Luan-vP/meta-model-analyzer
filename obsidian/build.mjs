import esbuild from 'esbuild'
import { builtinModules } from 'module'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

// Obsidian provides these at runtime; node builtins are available in Electron.
const external = [
  'obsidian',
  'electron',
  '@codemirror/autocomplete',
  '@codemirror/collab',
  '@codemirror/commands',
  '@codemirror/language',
  '@codemirror/lint',
  '@codemirror/search',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/common',
  '@lezer/highlight',
  '@lezer/lr',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]

await esbuild.build({
  entryPoints: [join(__dirname, 'src', 'main.ts')],
  outfile: join(__dirname, 'main.js'),
  bundle: true,
  // Obsidian loads plugins as CommonJS.
  format: 'cjs',
  platform: 'browser',
  target: 'es2018',
  sourcemap: true,
  logLevel: 'info',
  external,
  alias: {
    '@core': join(repoRoot, 'core', 'index.ts'),
    '@adapters': join(repoRoot, 'adapters'),
  },
})

console.log('✅ Obsidian plugin built: obsidian/main.js')
console.log('   Load it by symlinking/copying this folder into <vault>/.obsidian/plugins/meta-model-analyzer/')
