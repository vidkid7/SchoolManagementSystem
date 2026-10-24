const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building backend for production...');

console.log('Transpiling TypeScript files...');

try {
  execSync('tsc -p tsconfig.prod.json --noEmitOnError false', { 
    stdio: 'inherit',
    shell: true 
  });
} catch (error) {
  console.error('❌ TypeScript compilation failed; refusing to report a successful build.');
  process.exit(1);
}

// Check if dist folder was created
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.error('❌ Build failed - no dist folder created');
  process.exit(1);
}

// Resolve path aliases
try {
  console.log('Resolving path aliases...');
  execSync('tsc-alias -p tsconfig.prod.json', { stdio: 'inherit', shell: true });
  console.log('✅ Build completed successfully!');
} catch (e) {
  console.error('❌ Failed to resolve TypeScript path aliases.');
  process.exit(1);
}
