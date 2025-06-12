#!/usr/bin/env node

// SmartFinanceAI - Production Build Script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const webpack = require('webpack');
const config = require('../webpack.config.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n🚀 Step ${step}: ${description}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

class BuildProcess {
  constructor() {
    this.startTime = Date.now();
    this.distPath = path.resolve(__dirname, '../dist');
    this.publicPath = path.resolve(__dirname, '../public');
    this.srcPath = path.resolve(__dirname, '../src');
  }

  async run() {
    try {
      log('\n🌟 SmartFinanceAI Production Build Starting...', 'magenta');
      log('================================================', 'cyan');

      await this.validateEnvironment();
      await this.cleanDistDirectory();
      await this.runWebpackBuild();
      await this.copyStaticAssets();
      await this.optimizeAssets();
      await this.generateServiceWorker();
      await this.createManifest();
      await this.validateBuild();
      await this.generateBuildReport();

      this.showBuildSummary();

    } catch (error) {
      logError(`Build failed: ${error.message}`);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    logStep(1, 'Validating Environment');

    // Check Node version
    const nodeVersion = process.version;
    const requiredVersion = 'v16.0.0';
    if (nodeVersion < requiredVersion) {
      throw new Error(`Node.js ${requiredVersion} or higher required. Current: ${nodeVersion}`);
    }
    logSuccess(`Node.js version: ${nodeVersion}`);

    // Check required environment variables
    const requiredEnvVars = [
      'NODE_ENV',
      'API_BASE_URL',
      'JWT_SECRET',
      'ENCRYPTION_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      logWarning(`Missing environment variables: ${missingVars.join(', ')}`);
      logWarning('Build will continue with default values');
    }

    // Validate package.json
    const packagePath = path.resolve(__dirname, '../package.json');
    if (!fs.existsSync(packagePath)) {
      throw new Error('package.json not found');
    }
    logSuccess('Environment validation complete');
  }

  async cleanDistDirectory() {
    logStep(2, 'Cleaning Distribution Directory');

    if (fs.existsSync(this.distPath)) {
      fs.rmSync(this.distPath, { recursive: true, force: true });
      logSuccess('Removed existing dist directory');
    }

    fs.mkdirSync(this.distPath, { recursive: true });
    logSuccess('Created clean dist directory');
  }

  async runWebpackBuild() {
    logStep(3, 'Running Webpack Build');

    return new Promise((resolve, reject) => {
      const compiler = webpack(config({}, { mode: 'production' }));

      compiler.run((err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        if (stats.hasErrors()) {
          const errors = stats.toJson().errors;
          reject(new Error(`Webpack errors:\n${errors.map(e => e.message).join('\n')}`));
          return;
        }

        if (stats.hasWarnings()) {
          const warnings = stats.toJson().warnings;
          logWarning(`Webpack warnings:\n${warnings.map(w => w.message).join('\n')}`);
        }

        const { time, assets } = stats.toJson();
        logSuccess(`Webpack build completed in ${time}ms`);
        logSuccess(`Generated ${assets.length} assets`);

        resolve(stats);
      });
    });
  }

  async copyStaticAssets() {
    logStep(4, 'Copying Static Assets');

    const staticFiles = [
      'manifest.json',
      'robots.txt',
      'favicon.ico',
      'offline.html'
    ];

    let copiedFiles = 0;

    for (const file of staticFiles) {
      const srcFile = path.join(this.publicPath, file);
      const destFile = path.join(this.distPath, file);

      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
        copiedFiles++;
      }
    }

    // Copy icons directory
    const iconsSource = path.join(this.publicPath, 'icons');
    const iconsDestination = path.join(this.distPath, 'icons');

    if (fs.existsSync(iconsSource)) {
      fs.cpSync(iconsSource, iconsDestination, { recursive: true });
      logSuccess('Copied icons directory');
    }

    // Copy images directory
    const imagesSource = path.join(this.publicPath, 'images');
    const imagesDestination = path.join(this.distPath, 'images');

    if (fs.existsSync(imagesSource)) {
      fs.cpSync(imagesSource, imagesDestination, { recursive: true });
      logSuccess('Copied images directory');
    }

    logSuccess(`Copied ${copiedFiles} static files`);
  }

  async optimizeAssets() {
    logStep(5, 'Optimizing Assets');

    try {
      // Compress images (if imagemin is available)
      const hasImagemin = this.hasPackage('imagemin');
      if (hasImagemin) {
        execSync('npx imagemin dist/images/* --out-dir=dist/images', { stdio: 'pipe' });
        logSuccess('Optimized images');
      } else {
        logWarning('imagemin not available, skipping image optimization');
      }

      // Gzip static assets
      const gzipFiles = this.getFilesWithExtensions(this.distPath, ['.js', '.css', '.html']);
      let gzippedCount = 0;

      for (const file of gzipFiles) {
        try {
          execSync(`gzip -9 -c "${file}" > "${file}.gz"`);
          gzippedCount++;
        } catch (error) {
          logWarning(`Failed to gzip ${file}`);
        }
      }

      logSuccess(`Created gzip versions for ${gzippedCount} files`);

    } catch (error) {
      logWarning(`Asset optimization failed: ${error.message}`);
    }
  }

  async generateServiceWorker() {
    logStep(6, 'Generating Service Worker');

    const swPath = path.join(this.distPath, 'sw.js');
    
    if (fs.existsSync(swPath)) {
      logSuccess('Service worker generated by Workbox');
    } else {
      // Fallback basic service worker
      const basicSW = `
// SmartFinanceAI Service Worker
const CACHE_NAME = 'smartfinanceai-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
`;
      fs.writeFileSync(swPath, basicSW);
      logSuccess('Generated fallback service worker');
    }
  }

  async createManifest() {
    logStep(7, 'Creating Web App Manifest');

    const manifestPath = path.join(this.distPath, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      const manifest = {
        name: 'SmartFinanceAI',
        short_name: 'SmartFinanceAI',
        description: 'Global Personal Finance Operating System',
        start_url: '/',
        display: 'standalone',
        theme_color: '#8b5cf6',
        background_color: '#0f172a',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      };

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      logSuccess('Created web app manifest');
    } else {
      logSuccess('Web app manifest already exists');
    }
  }

  async validateBuild() {
    logStep(8, 'Validating Build');

    const requiredFiles = [
      'index.html',
      'manifest.json',
      'sw.js'
    ];

    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(this.distPath, file))
    );

    if (missingFiles.length > 0) {
      throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
    }

    // Check bundle sizes
    const jsFiles = this.getFilesWithExtensions(this.distPath, ['.js']);
    const cssFiles = this.getFilesWithExtensions(this.distPath, ['.css']);

    const totalJSSize = this.getTotalFileSize(jsFiles);
    const totalCSSSize = this.getTotalFileSize(cssFiles);

    logSuccess(`JavaScript bundle size: ${this.formatBytes(totalJSSize)}`);
    logSuccess(`CSS bundle size: ${this.formatBytes(totalCSSSize)}`);

    // Warn if bundles are too large
    if (totalJSSize > 1024 * 1024) { // 1MB
      logWarning('JavaScript bundle is larger than 1MB');
    }

    if (totalCSSSize > 256 * 1024) { // 256KB
      logWarning('CSS bundle is larger than 256KB');
    }

    logSuccess('Build validation complete');
  }

  async generateBuildReport() {
    logStep(9, 'Generating Build Report');

    const buildReport = {
      timestamp: new Date().toISOString(),
      version: this.getPackageVersion(),
      environment: process.env.NODE_ENV || 'production',
      buildTime: Date.now() - this.startTime,
      assets: this.getBuildAssets(),
      sizes: this.getBuildSizes(),
      nodeVersion: process.version,
      platform: process.platform
    };

    const reportPath = path.join(this.distPath, 'build-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(buildReport, null, 2));

    logSuccess('Generated build report');
  }

  showBuildSummary() {
    const buildTime = Date.now() - this.startTime;
    
    log('\n🎉 Build Complete!', 'green');
    log('==================', 'cyan');
    log(`⏱️  Build time: ${this.formatTime(buildTime)}`, 'blue');
    log(`📁 Output directory: ${this.distPath}`, 'blue');
    log(`📊 Total assets: ${this.getBuildAssets().length}`, 'blue');
    log(`💾 Total size: ${this.formatBytes(this.getTotalBuildSize())}`, 'blue');
    log('\n🚀 Ready for deployment!', 'magenta');
  }

  // Helper methods
  hasPackage(packageName) {
    try {
      require.resolve(packageName);
      return true;
    } catch {
      return false;
    }
  }

  getFilesWithExtensions(dir, extensions) {
    const files = [];
    
    function scanDirectory(directory) {
      const items = fs.readdirSync(directory);
      
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    scanDirectory(dir);
    return files;
  }

  getTotalFileSize(files) {
    return files.reduce((total, file) => {
      return total + fs.statSync(file).size;
    }, 0);
  }

  getBuildAssets() {
    return this.getFilesWithExtensions(this.distPath, ['.js', '.css', '.html', '.json', '.png', '.jpg', '.svg']);
  }

  getBuildSizes() {
    const jsFiles = this.getFilesWithExtensions(this.distPath, ['.js']);
    const cssFiles = this.getFilesWithExtensions(this.distPath, ['.css']);
    const imageFiles = this.getFilesWithExtensions(this.distPath, ['.png', '.jpg', '.svg']);

    return {
      javascript: this.getTotalFileSize(jsFiles),
      css: this.getTotalFileSize(cssFiles),
      images: this.getTotalFileSize(imageFiles),
      total: this.getTotalBuildSize()
    };
  }

  getTotalBuildSize() {
    return this.getTotalFileSize(this.getBuildAssets());
  }

  getPackageVersion() {
    const packagePath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}

// Run build if called directly
if (require.main === module) {
  const build = new BuildProcess();
  build.run();
}

module.exports = BuildProcess;