#!/usr/bin/env node

// SmartFinanceAI - Deployment Script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

class DeploymentProcess {
  constructor() {
    this.startTime = Date.now();
    this.environment = process.env.NODE_ENV || 'production';
    this.deploymentTarget = process.env.DEPLOYMENT_TARGET || 'vercel';
    this.distPath = path.resolve(__dirname, '../dist');
    this.version = this.getPackageVersion();
  }

  async run() {
    try {
      log('\n🌍 SmartFinanceAI Deployment Starting...', 'magenta');
      log('===========================================', 'cyan');
      log(`📦 Version: ${this.version}`, 'blue');
      log(`🎯 Target: ${this.deploymentTarget}`, 'blue');
      log(`🌐 Environment: ${this.environment}`, 'blue');

      await this.validatePreDeployment();
      await this.runBuild();
      await this.runTests();
      await this.performSecurityChecks();
      await this.validateBuildArtifacts();
      await this.deployToTarget();
      await this.runPostDeploymentTests();
      await this.updateDeploymentRecords();
      await this.notifyTeam();

      this.showDeploymentSummary();

    } catch (error) {
      logError(`Deployment failed: ${error.message}`);
      await this.handleDeploymentFailure(error);
      process.exit(1);
    }
  }

  async validatePreDeployment() {
    logStep(1, 'Pre-deployment Validation');

    // Check if build directory exists
    if (!fs.existsSync(this.distPath)) {
      throw new Error('Build directory does not exist. Run build first.');
    }

    // Validate environment variables
    const requiredEnvVars = this.getRequiredEnvVars();
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Check deployment target configuration
    await this.validateDeploymentTarget();

    // Verify Git status
    await this.validateGitStatus();

    logSuccess('Pre-deployment validation complete');
  }

  async runBuild() {
    logStep(2, 'Running Production Build');

    try {
      execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
      logSuccess('Production build completed');
    } catch (error) {
      throw new Error('Build failed. Check build output for details.');
    }
  }

  async runTests() {
    logStep(3, 'Running Test Suite');

    try {
      // Run unit tests
      execSync('npm test -- --coverage --watchAll=false', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
      logSuccess('Unit tests passed');

      // Run E2E tests if available
      try {
        execSync('npm run test:e2e', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
        logSuccess('E2E tests passed');
      } catch (error) {
        logWarning('E2E tests not available or failed');
      }

    } catch (error) {
      throw new Error('Tests failed. Deployment aborted.');
    }
  }

  async performSecurityChecks() {
    logStep(4, 'Security Checks');

    try {
      // Run npm audit
      execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
      logSuccess('No security vulnerabilities found');
    } catch (error) {
      logWarning('Security vulnerabilities detected. Review npm audit output.');
    }

    // Check for sensitive data in build
    await this.scanForSensitiveData();

    logSuccess('Security checks completed');
  }

  async validateBuildArtifacts() {
    logStep(5, 'Validating Build Artifacts');

    const requiredFiles = [
      'index.html',
      'manifest.json',
      'sw.js'
    ];

    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(this.distPath, file))
    );

    if (missingFiles.length > 0) {
      throw new Error(`Missing required build artifacts: ${missingFiles.join(', ')}`);
    }

    // Check bundle sizes
    const bundleSizes = this.getBundleSizes();
    
    if (bundleSizes.javascript > 1024 * 1024) { // 1MB
      logWarning('JavaScript bundle is larger than 1MB');
    }

    if (bundleSizes.total > 5 * 1024 * 1024) { // 5MB
      logWarning('Total bundle size is larger than 5MB');
    }

    logSuccess('Build artifacts validated');
  }

  async deployToTarget() {
    logStep(6, `Deploying to ${this.deploymentTarget}`);

    switch (this.deploymentTarget.toLowerCase()) {
      case 'vercel':
        await this.deployToVercel();
        break;
      case 'netlify':
        await this.deployToNetlify();
        break;
      case 'aws':
        await this.deployToAWS();
        break;
      case 'azure':
        await this.deployToAzure();
        break;
      default:
        throw new Error(`Unsupported deployment target: ${this.deploymentTarget}`);
    }
  }

  async deployToVercel() {
    try {
      const vercelConfig = {
        name: 'smartfinanceai',
        version: 2,
        builds: [
          {
            src: 'dist/**/*',
            use: '@vercel/static'
          }
        ],
        routes: [
          {
            src: '/(.*)',
            dest: '/dist/$1'
          }
        ]
      };

      // Write vercel.json if it doesn't exist
      const vercelConfigPath = path.resolve(__dirname, '../vercel.json');
      if (!fs.existsSync(vercelConfigPath)) {
        fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
      }

      // Deploy with Vercel CLI
      const deployCommand = this.environment === 'production' ? 
        'vercel --prod --confirm' : 
        'vercel --confirm';

      execSync(deployCommand, { stdio: 'inherit' });
      logSuccess('Deployed to Vercel successfully');

    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }
  }

  async deployToNetlify() {
    try {
      // Deploy with Netlify CLI
      const deployCommand = this.environment === 'production' ? 
        'netlify deploy --prod --dir=dist' : 
        'netlify deploy --dir=dist';

      execSync(deployCommand, { stdio: 'inherit' });
      logSuccess('Deployed to Netlify successfully');

    } catch (error) {
      throw new Error(`Netlify deployment failed: ${error.message}`);
    }
  }

  async deployToAWS() {
    try {
      // Sync to S3 bucket
      const bucketName = process.env.AWS_S3_BUCKET;
      if (!bucketName) {
        throw new Error('AWS_S3_BUCKET environment variable not set');
      }

      execSync(`aws s3 sync dist/ s3://${bucketName} --delete`, { stdio: 'inherit' });
      
      // Invalidate CloudFront distribution if configured
      const distributionId = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;
      if (distributionId) {
        execSync(`aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*"`, { stdio: 'inherit' });
        logSuccess('CloudFront cache invalidated');
      }

      logSuccess('Deployed to AWS S3 successfully');

    } catch (error) {
      throw new Error(`AWS deployment failed: ${error.message}`);
    }
  }

  async deployToAzure() {
    try {
      // Deploy to Azure Static Web Apps
      const resourceGroup = process.env.AZURE_RESOURCE_GROUP;
      const appName = process.env.AZURE_APP_NAME;

      if (!resourceGroup || !appName) {
        throw new Error('Azure configuration incomplete');
      }

      execSync(`az staticwebapp deploy --name ${appName} --resource-group ${resourceGroup} --app-location dist`, { stdio: 'inherit' });
      logSuccess('Deployed to Azure successfully');

    } catch (error) {
      throw new Error(`Azure deployment failed: ${error.message}`);
    }
  }

  async runPostDeploymentTests() {
    logStep(7, 'Post-deployment Testing');

    const deploymentUrl = await this.getDeploymentUrl();
    
    if (deploymentUrl) {
      // Test basic connectivity
      await this.testDeploymentHealth(deploymentUrl);
      
      // Test critical user flows
      await this.testCriticalFlows(deploymentUrl);
      
      logSuccess('Post-deployment tests passed');
    } else {
      logWarning('Deployment URL not available, skipping post-deployment tests');
    }
  }

  async updateDeploymentRecords() {
    logStep(8, 'Updating Deployment Records');

    const deploymentRecord = {
      version: this.version,
      environment: this.environment,
      target: this.deploymentTarget,
      timestamp: new Date().toISOString(),
      deploymentTime: Date.now() - this.startTime,
      gitCommit: this.getGitCommit(),
      deployer: process.env.USER || process.env.USERNAME || 'unknown'
    };

    // Save deployment record
    const recordsPath = path.resolve(__dirname, '../deployment-records.json');
    let records = [];
    
    if (fs.existsSync(recordsPath)) {
      records = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
    }
    
    records.unshift(deploymentRecord);
    
    // Keep only last 50 records
    if (records.length > 50) {
      records = records.slice(0, 50);
    }
    
    fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
    
    logSuccess('Deployment record updated');
  }

  async notifyTeam() {
    logStep(9, 'Team Notification');

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (webhookUrl) {
      try {
        const message = {
          text: `🚀 SmartFinanceAI deployed successfully!`,
          attachments: [
            {
              color: 'good',
              fields: [
                { title: 'Version', value: this.version, short: true },
                { title: 'Environment', value: this.environment, short: true },
                { title: 'Target', value: this.deploymentTarget, short: true },
                { title: 'Deploy Time', value: this.formatTime(Date.now() - this.startTime), short: true }
              ]
            }
          ]
        };

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          logSuccess('Team notified via Slack');
        } else {
          logWarning('Failed to send Slack notification');
        }
      } catch (error) {
        logWarning('Slack notification failed');
      }
    } else {
      logWarning('Slack webhook not configured');
    }
  }

  async handleDeploymentFailure(error) {
    log('\n💥 Deployment Failed!', 'red');
    log('===================', 'red');
    
    // Log failure details
    const failureRecord = {
      version: this.version,
      environment: this.environment,
      target: this.deploymentTarget,
      timestamp: new Date().toISOString(),
      error: error.message,
      gitCommit: this.getGitCommit()
    };

    // Save failure record
    const failuresPath = path.resolve(__dirname, '../deployment-failures.json');
    let failures = [];
    
    if (fs.existsSync(failuresPath)) {
      failures = JSON.parse(fs.readFileSync(failuresPath, 'utf8'));
    }
    
    failures.unshift(failureRecord);
    fs.writeFileSync(failuresPath, JSON.stringify(failures, null, 2));

    // Notify team of failure
    await this.notifyFailure(error);
  }

  showDeploymentSummary() {
    const deploymentTime = Date.now() - this.startTime;
    
    log('\n🎉 Deployment Complete!', 'green');
    log('=======================', 'cyan');
    log(`⏱️  Deployment time: ${this.formatTime(deploymentTime)}`, 'blue');
    log(`📦 Version: ${this.version}`, 'blue');
    log(`🎯 Target: ${this.deploymentTarget}`, 'blue');
    log(`🌐 Environment: ${this.environment}`, 'blue');
    log('\n🌟 SmartFinanceAI is live!', 'magenta');
  }

  // Helper methods
  getRequiredEnvVars() {
    const baseVars = ['NODE_ENV'];
    
    switch (this.deploymentTarget.toLowerCase()) {
      case 'vercel':
        return [...baseVars, 'VERCEL_TOKEN'];
      case 'netlify':
        return [...baseVars, 'NETLIFY_AUTH_TOKEN'];
      case 'aws':
        return [...baseVars, 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
      case 'azure':
        return [...baseVars, 'AZURE_RESOURCE_GROUP', 'AZURE_APP_NAME'];
      default:
        return baseVars;
    }
  }

  async validateDeploymentTarget() {
    switch (this.deploymentTarget.toLowerCase()) {
      case 'vercel':
        await this.validateVercelConfig();
        break;
      case 'netlify':
        await this.validateNetlifyConfig();
        break;
      case 'aws':
        await this.validateAWSConfig();
        break;
      case 'azure':
        await this.validateAzureConfig();
        break;
    }
  }

  async validateVercelConfig() {
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      logSuccess('Vercel CLI available');
    } catch {
      throw new Error('Vercel CLI not installed');
    }
  }

  async validateNetlifyConfig() {
    try {
      execSync('netlify --version', { stdio: 'pipe' });
      logSuccess('Netlify CLI available');
    } catch {
      throw new Error('Netlify CLI not installed');
    }
  }

  async validateAWSConfig() {
    try {
      execSync('aws --version', { stdio: 'pipe' });
      logSuccess('AWS CLI available');
    } catch {
      throw new Error('AWS CLI not installed');
    }
  }

  async validateAzureConfig() {
    try {
      execSync('az --version', { stdio: 'pipe' });
      logSuccess('Azure CLI available');
    } catch {
      throw new Error('Azure CLI not installed');
    }
  }

  async validateGitStatus() {
    try {
      // Check if working directory is clean
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim() && this.environment === 'production') {
        logWarning('Working directory is not clean. Proceeding anyway.');
      }

      // Ensure we're on the correct branch for production
      if (this.environment === 'production') {
        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        if (currentBranch !== 'main' && currentBranch !== 'master') {
          logWarning(`Deploying from branch '${currentBranch}' instead of main/master`);
        }
      }

      logSuccess('Git status validated');
    } catch (error) {
      logWarning('Git validation failed - not a git repository?');
    }
  }

  async scanForSensitiveData() {
    const sensitivePatterns = [
      /api[_-]?key[\s]*=[\s]*['"]\w+['"]/gi,
      /secret[\s]*=[\s]*['"]\w+['"]/gi,
      /password[\s]*=[\s]*['"]\w+['"]/gi,
      /token[\s]*=[\s]*['"]\w+['"]/gi
    ];

    const files = this.getAllFiles(this.distPath);
    let foundSensitive = false;

    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.html')) {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const pattern of sensitivePatterns) {
          if (pattern.test(content)) {
            logWarning(`Potential sensitive data found in ${file}`);
            foundSensitive = true;
          }
        }
      }
    }

    if (!foundSensitive) {
      logSuccess('No sensitive data detected in build');
    }
  }

  getBundleSizes() {
    const jsFiles = this.getFilesWithExtensions(this.distPath, ['.js']);
    const cssFiles = this.getFilesWithExtensions(this.distPath, ['.css']);
    const imageFiles = this.getFilesWithExtensions(this.distPath, ['.png', '.jpg', '.svg']);

    return {
      javascript: this.getTotalFileSize(jsFiles),
      css: this.getTotalFileSize(cssFiles),
      images: this.getTotalFileSize(imageFiles),
      total: this.getTotalFileSize(this.getAllFiles(this.distPath))
    };
  }

  async getDeploymentUrl() {
    // This would typically be returned by the deployment service
    // For now, return a placeholder
    switch (this.deploymentTarget.toLowerCase()) {
      case 'vercel':
        return `https://smartfinanceai-${this.getGitCommit().slice(0, 7)}.vercel.app`;
      case 'netlify':
        return `https://smartfinanceai-${this.getGitCommit().slice(0, 7)}.netlify.app`;
      default:
        return null;
    }
  }

  async testDeploymentHealth(url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        logSuccess(`Deployment accessible at ${url}`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      logWarning(`Health check failed: ${error.message}`);
    }
  }

  async testCriticalFlows(url) {
    // Basic smoke tests for critical user flows
    const testUrls = [
      `${url}/`,
      `${url}/auth/login`,
      `${url}/dashboard`,
      `${url}/manifest.json`
    ];

    for (const testUrl of testUrls) {
      try {
        const response = await fetch(testUrl);
        if (response.ok) {
          logSuccess(`✓ ${testUrl}`);
        } else {
          logWarning(`✗ ${testUrl} - HTTP ${response.status}`);
        }
      } catch (error) {
        logWarning(`✗ ${testUrl} - ${error.message}`);
      }
    }
  }

  async notifyFailure(error) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (webhookUrl) {
      try {
        const message = {
          text: `💥 SmartFinanceAI deployment failed!`,
          attachments: [
            {
              color: 'danger',
              fields: [
                { title: 'Version', value: this.version, short: true },
                { title: 'Environment', value: this.environment, short: true },
                { title: 'Target', value: this.deploymentTarget, short: true },
                { title: 'Error', value: error.message, short: false }
              ]
            }
          ]
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
      } catch {
        // Fail silently
      }
    }
  }

  getPackageVersion() {
    const packagePath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  }

  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getAllFiles(dir) {
    const files = [];
    
    function scanDirectory(directory) {
      const items = fs.readdirSync(directory);
      
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }
    
    scanDirectory(dir);
    return files;
  }

  getFilesWithExtensions(dir, extensions) {
    return this.getAllFiles(dir).filter(file =>
      extensions.some(ext => file.endsWith(ext))
    );
  }

  getTotalFileSize(files) {
    return files.reduce((total, file) => {
      return total + fs.statSync(file).size;
    }, 0);
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

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--target=')) {
      options.target = arg.split('=')[1];
    } else if (arg.startsWith('--env=')) {
      options.environment = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
SmartFinanceAI Deployment Script

Usage: node scripts/deploy.js [options]

Options:
  --target=<target>     Deployment target (vercel, netlify, aws, azure)
  --env=<environment>   Environment (development, staging, production)
  --help, -h           Show this help message

Environment Variables:
  NODE_ENV             Environment (development, staging, production)
  DEPLOYMENT_TARGET    Target platform (vercel, netlify, aws, azure)
  
  For Vercel:
    VERCEL_TOKEN       Vercel authentication token
  
  For Netlify:
    NETLIFY_AUTH_TOKEN Netlify authentication token
  
  For AWS:
    AWS_ACCESS_KEY_ID     AWS access key
    AWS_SECRET_ACCESS_KEY AWS secret key
    AWS_S3_BUCKET         S3 bucket name
    AWS_CLOUDFRONT_DISTRIBUTION_ID (optional)
  
  For Azure:
    AZURE_RESOURCE_GROUP  Azure resource group
    AZURE_APP_NAME        Azure app name

Examples:
  node scripts/deploy.js --target=vercel --env=production
  node scripts/deploy.js --target=aws
  DEPLOYMENT_TARGET=netlify node scripts/deploy.js
`);
}

// Run deployment if called directly
if (require.main === module) {
  const options = parseArgs();
  
  // Set environment variables from command line options
  if (options.target) {
    process.env.DEPLOYMENT_TARGET = options.target;
  }
  if (options.environment) {
    process.env.NODE_ENV = options.environment;
  }
  
  const deployment = new DeploymentProcess();
  deployment.run();
}

module.exports = DeploymentProcess;