// Copy the Vite android bundle into the APK assets folder.
const fs = require('fs')
const path = require('path')

const src = path.resolve(__dirname, '../dist-android')
const dest = path.resolve(__dirname, 'app/src/main/assets/app')

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name)
    const d = path.join(to, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

if (!fs.existsSync(src)) {
  console.error('dist-android not found — run "vite build --config vite.android.config.ts" first')
  process.exit(1)
}

fs.rmSync(dest, { recursive: true, force: true })
copyDir(src, dest)
console.log('Android bundle copied →', dest)
