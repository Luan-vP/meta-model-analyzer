import { writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import esbuild from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const srcDir = join(__dirname, 'src')
const distDir = join(__dirname, 'dist')

// Resolve the shared hexagon + driven adapters so esbuild inlines them into
// each bundle (the extension has no runtime module resolution for @core).
const alias = {
  '@core': join(repoRoot, 'core', 'index.ts'),
  '@adapters': join(repoRoot, 'adapters'),
}

// Clean dist
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true })
}
mkdirSync(distDir, { recursive: true })
mkdirSync(join(distDir, 'icons'), { recursive: true })

console.log('Bundling with esbuild…')

// background + popup are ES modules (popup.html uses <script type="module">).
await esbuild.build({
  entryPoints: {
    background: join(srcDir, 'background.ts'),
    popup: join(srcDir, 'popup.ts'),
  },
  bundle: true,
  format: 'esm',
  target: 'es2022',
  outdir: distDir,
  alias,
  sourcemap: true,
  logLevel: 'info',
})

// Content scripts are classic scripts — must be IIFE (no import/export at runtime).
await esbuild.build({
  entryPoints: { content: join(srcDir, 'content.ts') },
  bundle: true,
  format: 'iife',
  target: 'es2022',
  outdir: distDir,
  alias,
  sourcemap: true,
  logLevel: 'info',
})

// Copy manifest + popup HTML
copyFileSync(join(srcDir, 'manifest.json'), join(distDir, 'manifest.json'))
copyFileSync(join(srcDir, 'popup.html'), join(distDir, 'popup.html'))

// Copy the paper textures the overlay reuses from the web app (public/textures).
// Declared in manifest web_accessible_resources so the content script can load
// them via chrome.runtime.getURL on any host page.
mkdirSync(join(distDir, 'textures'), { recursive: true })
for (const tex of ['handmade-paper.png', 'paper.png', 'notebook.png']) {
  copyFileSync(join(repoRoot, 'public', 'textures', tex), join(distDir, 'textures', tex))
}

// Generate simple PNG icons
generatePngIcon('icon16.png', 16)
generatePngIcon('icon48.png', 48)
generatePngIcon('icon128.png', 128)

// List output files
console.log('\n📁 dist/ contents:')
function listFiles(dir, prefix = '') {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      listFiles(path, prefix + entry.name + '/')
    } else {
      console.log(`  ${prefix}${entry.name}`)
    }
  }
}
listFiles(distDir)

console.log('\n✅ Build complete!')
console.log('📦 To load the extension:')
console.log('   1. Open chrome://extensions')
console.log('   2. Enable "Developer mode"')
console.log('   3. Click "Load unpacked"')
console.log('   4. Select the "dist" folder')

function generatePngIcon(filename, size) {
  const width = size
  const height = size

  // CRC32 lookup table
  const crcTable = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    crcTable[n] = c
  }

  function crc32(bytes) {
    let crc = 0xFFFFFFFF
    for (let i = 0; i < bytes.length; i++) {
      crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8)
    }
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  function makeChunk(type, data) {
    const length = data.length
    const totalLen = 4 + 4 + length + 4 // len + type + data + crc
    const chunk = new Uint8Array(totalLen)
    const view = new DataView(chunk.buffer)

    // Length (big-endian)
    view.setUint32(0, length)

    // Type
    for (let i = 0; i < 4; i++) {
      chunk[4 + i] = type.charCodeAt(i)
    }

    // Data
    chunk.set(data, 8)

    // CRC over type + data
    const crcBytes = chunk.slice(4, 8 + length)
    const crc = crc32(crcBytes)
    view.setUint32(8 + length, crc)

    return chunk
  }

  // PNG signature
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdrData = new Uint8Array(13)
  const ihdrView = new DataView(ihdrData.buffer)
  ihdrView.setUint32(0, width)
  ihdrView.setUint32(4, height)
  ihdrView.setUint8(8, 8)   // bit depth
  ihdrView.setUint8(9, 2)   // RGB
  ihdrView.setUint8(10, 0)  // compression
  ihdrView.setUint8(11, 0)  // filter
  ihdrView.setUint8(12, 0)  // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData)

  // IDAT — solid burnt-orange accent #C0763B
  const rowBytes = 1 + 3 * width
  const rawData = new Uint8Array(height * rowBytes)
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes
    rawData[rowStart] = 0 // no filter
    for (let x = 0; x < width; x++) {
      // Burnt-orange accent #C0763B (matches the web app's paper theme)
      rawData[rowStart + 1 + 3 * x] = 0xC0
      rawData[rowStart + 1 + 3 * x + 1] = 0x76
      rawData[rowStart + 1 + 3 * x + 2] = 0x3B
    }
  }

  // Build uncompressed deflate stream
  const deflateParts = []
  const maxChunkSize = 65535
  let pos = 0
  while (pos < rawData.length) {
    const remaining = rawData.length - pos
    const chunkSize = Math.min(maxChunkSize, remaining)
    const isFinal = (pos + chunkSize >= rawData.length) ? 1 : 0
    const leSize = chunkSize & 0xFFFF
    const neSize = (~leSize) & 0xFFFF
    const header = new Uint8Array(5)
    header[0] = isFinal
    header[1] = leSize & 0xFF
    header[2] = (leSize >> 8) & 0xFF
    header[3] = neSize & 0xFF
    header[4] = (neSize >> 8) & 0xFF
    deflateParts.push(header)
    deflateParts.push(rawData.slice(pos, pos + chunkSize))
    pos += chunkSize
  }
  const deflateData = concatUint8(deflateParts)
  const idatChunk = makeChunk('IDAT', deflateData)

  // IEND
  const iendChunk = makeChunk('IEND', new Uint8Array(0))

  // Write PNG
  const png = concatUint8([signature, ihdrChunk, idatChunk, iendChunk])
  writeFileSync(join(distDir, 'icons', filename), png)
}

function concatUint8(arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}
