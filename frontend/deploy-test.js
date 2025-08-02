#!/usr/bin/env node

/**
 * Vercel Deployment Pre-flight Check
 * Run this script before deploying to catch common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 OK Motor - Vercel Deployment Pre-flight Check\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'vercel.json',
  'src/config/environment.js',
  'public/manifest.json',
  'public/sw.js',
  '.env.example'
];

const optionalFiles = [
  '.env',
  '.env.production'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📄 Checking optional files...');
optionalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️  ${file} - Optional but recommended`);
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredScripts = ['build:prod', 'build', 'start'];
requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`❌ ${script} script is missing`);
    allFilesExist = false;
  }
});

// Check vercel.json configuration
console.log('\n⚙️ Checking vercel.json...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.builds && vercelConfig.builds[0] && vercelConfig.builds[0].config && vercelConfig.builds[0].config.distDir === 'build') {
    console.log('✅ Build output directory configured correctly');
  } else {
    console.log('❌ Build output directory not configured properly');
  }
  
  if (vercelConfig.routes && vercelConfig.routes.some(route => route.src === '/(.*)'&& route.dest === '/index.html')) {
    console.log('✅ SPA routing configured correctly');
  } else {
    console.log('❌ SPA routing not configured properly');
  }
} catch (error) {
  console.log('❌ Error reading vercel.json:', error.message);
  allFilesExist = false;
}

// Environment configuration check
console.log('\n🌍 Environment Configuration Check...');
console.log('⚠️  Make sure to set these environment variables in Vercel dashboard:');
console.log('   - REACT_APP_API_URL=https://your-backend-url.com');
console.log('   - REACT_APP_ENV=production');

console.log('\n🔧 Backend CORS Check...');
console.log('⚠️  Ensure your backend CORS allows your Vercel domain:');
console.log('   - https://your-app.vercel.app');
console.log('   - Or use environment variable for dynamic origin');

if (allFilesExist) {
  console.log('\n🎉 All checks passed! Your app should deploy successfully to Vercel.');
  console.log('\n📝 Next steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Connect repository in Vercel dashboard');
  console.log('3. Set environment variables');
  console.log('4. Deploy!');
} else {
  console.log('\n❌ Some issues found. Please fix them before deploying.');
  process.exit(1);
}
