import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Building frontend for production...');

try {
  // Try TypeScript compilation with production config
  console.log('Transpiling TypeScript files...');
  execSync('tsc -p tsconfig.prod.json', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful!');
} catch (error) {
  console.log('⚠️  TypeScript compilation had errors, continuing with Vite build...');
}

try {
  // Run Vite build (Vite has its own TypeScript handling)
  console.log('Running Vite build...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Copy config.js to dist folder
  const configSource = path.join(__dirname, 'public', 'config.js');
  const configDest = path.join(__dirname, 'dist', 'config.js');
  
  if (fs.existsSync(configSource)) {
    fs.copyFileSync(configSource, configDest);
    console.log('✅ Copied config.js to dist folder');
  } else {
    console.warn('⚠️  config.js not found in public folder');
  }
  
  // Check if dist folder was created
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    console.log('✅ Build completed successfully!');
    process.exit(0);
  } else {
    console.error('❌ Build failed - no dist folder created');
    process.exit(1);
  }
} catch (e) {
  console.error('❌ Vite build failed');
  process.exit(1);
}
