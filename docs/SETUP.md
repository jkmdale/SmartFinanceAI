# 🚀 SmartFinanceAI Setup Guide

Complete setup instructions for development, testing, and production deployment.

## 📋 **Prerequisites**

### **System Requirements**
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (or **yarn** >= 1.22.0)
- **Git** >= 2.30.0
- **Modern Browser** with WebAuthn support

### **Recommended Development Tools**
- **VS Code** with recommended extensions
- **Chrome DevTools** for debugging
- **Postman** for API testing (if using backend)

## ⚡ **Quick Setup**

### **1. Clone Repository**
```bash
git clone https://github.com/smartfinanceai/platform.git
cd smartfinanceai
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env  # or your preferred editor
```

### **4. Start Development Server**
```bash
npm run dev
```

### **5. Open Application**
Navigate to `http://localhost:3000` in your browser.

## 🔧 **Detailed Setup**

### **Environment Variables Configuration**

Create `.env` file with the following required variables:

```bash
# Application Configuration
NODE_ENV=development
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME=SmartFinanceAI

# Security Settings
VITE_ENCRYPTION_KEY=your-32-character-encryption-key
VITE_JWT_SECRET=your-super-secret-jwt-key

# WebAuthn Configuration
VITE_WEBAUTHN_RP_NAME=SmartFinanceAI
VITE_WEBAUTHN_RP_ID=localhost
VITE_WEBAUTHN_ORIGIN=http://localhost:3000

# AI Configuration (Optional)
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_OPENAI_MODEL=gpt-4

# Feature Flags
VITE_FEATURE_AI_INSIGHTS=true
VITE_FEATURE_CSV_IMPORT=true
VITE_FEATURE_GOAL_TRACKING=true

# Default Settings
VITE_DEFAULT_COUNTRY=NZ
VITE_DEFAULT_CURRENCY=NZD
VITE_DEFAULT_LANGUAGE=en-NZ
```

### **Security Key Generation**

Generate secure encryption keys:

```bash
# Generate 32-character encryption key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🌍 **Country-Specific Setup**

### **New Zealand Setup**
```bash
# Environment variables
VITE_DEFAULT_COUNTRY=NZ
VITE_DEFAULT_CURRENCY=NZD
VITE_DEFAULT_LANGUAGE=en-NZ
VITE_DEFAULT_TIMEZONE=Pacific/Auckland

# Enable NZ-specific features
VITE_FEATURE_KIWISAVER_NZ=true
```

### **Australia Setup**
```bash
# Environment variables
VITE_DEFAULT_COUNTRY=AU
VITE_DEFAULT_CURRENCY=AUD
VITE_DEFAULT_LANGUAGE=en-AU
VITE_DEFAULT_TIMEZONE=Australia/Sydney

# Enable AU-specific features
VITE_FEATURE_SUPERANNUATION_AU=true
```

### **United States Setup**
```bash
# Environment variables
VITE_DEFAULT_COUNTRY=US
VITE_DEFAULT_CURRENCY=USD
VITE_DEFAULT_LANGUAGE=en-US
VITE_DEFAULT_TIMEZONE=America/New_York

# Enable US-specific features
VITE_FEATURE_401K_US=true
```

### **United Kingdom Setup**
```bash
# Environment variables
VITE_DEFAULT_COUNTRY=GB
VITE_DEFAULT_CURRENCY=GBP
VITE_DEFAULT_LANGUAGE=en-GB
VITE_DEFAULT_TIMEZONE=Europe/London
```

### **Canada Setup**
```bash
# Environment variables
VITE_DEFAULT_COUNTRY=CA
VITE_DEFAULT_CURRENCY=CAD
VITE_DEFAULT_LANGUAGE=en-CA
VITE_DEFAULT_TIMEZONE=America/Toronto
```

## 🔒 **Security Setup**

### **HTTPS Setup (Development)**
For testing WebAuthn and PWA features:

```bash
# Install mkcert for local HTTPS
brew install mkcert  # macOS
# or
choco install mkcert  # Windows
# or
sudo apt install libnss3-tools && wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 && chmod +x mkcert && sudo mv mkcert /usr/local/bin/  # Linux

# Create local CA
mkcert -install

# Generate certificates
mkcert localhost 127.0.0.1 ::1

# Update package.json dev script
# "dev": "vite --host 0.0.0.0 --port 3000 --https --cert localhost+2.pem --key localhost+2-key.pem"
```

### **WebAuthn Testing**
WebAuthn requires HTTPS or localhost. For testing:

1. Use Chrome with `--ignore-certificate-errors-spki-list` flag
2. Enable `chrome://flags/#enable-web-authentication-api`
3. Use physical security key or platform authenticator

## 📊 **Database Setup**

SmartFinanceAI uses IndexedDB for client-side storage:

### **Initialize Database**
```javascript
// Database will auto-initialize on first run
// Check browser console for initialization logs

// Manual initialization (if needed)
const dbManager = new DatabaseManager();
await dbManager.initialize('user-encryption-key');
```

### **Development Data**
```bash
# Seed development data
npm run seed-data
```

## 🧪 **Testing Setup**

### **Unit Tests**
```bash
# Install test dependencies
npm install --save-dev vitest @vitest/ui

# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

### **E2E Tests**
```bash
# Install Playwright
npm install --save-dev @playwright/test

# Setup Playwright
npx playwright install

# Run E2E tests
npm run test:e2e
```

### **Performance Testing**
```bash
# Run performance tests
npm run test:performance

# Generate performance report
npm run analyze
```

## 🚀 **Development Workflow**

### **Available Scripts**
```bash
# Development
npm run dev          # Start dev server
npm run dev:https    # Start dev server with HTTPS

# Building
npm run build        # Production build
npm run preview      # Preview production build

# Testing
npm run test         # Unit tests
npm run test:ui      # Test UI
npm run test:e2e     # End-to-end tests
npm run test:coverage # Coverage report

# Code Quality
npm run lint         # ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Prettier formatting

# PWA
npm run pwa:generate-icons  # Generate PWA icons

# Security
npm run security:audit      # Security audit
```

### **Development Server Features**
- **Hot Module Replacement** - Instant updates
- **Error Overlay** - In-browser error display
- **Source Maps** - Debug with original source
- **CORS Support** - Cross-origin requests
- **Proxy Support** - API routing

## 🏗️ **Project Structure**

```
SmartFinanceAI/
├── 📁 public/               # Static assets
│   ├── index.html           # Main HTML entry
│   ├── manifest.json        # PWA manifest
│   ├── sw.js               # Service worker
│   ├── 📁 icons/           # PWA icons
│   ├── 📁 images/          # Static images
│   └── 📁 fonts/           # Custom fonts
│
├── 📁 src/                  # Source code
│   ├── 📁 auth/            # Authentication
│   ├── 📁 onboarding/      # User onboarding
│   ├── 📁 core/            # Core features
│   ├── 📁 ai/              # AI intelligence
│   ├── 📁 global/          # Globalization
│   ├── 📁 platform/        # SaaS platform
│   ├── 📁 components/      # UI components
│   ├── 📁 data/            # Data management
│   ├── 📁 utils/           # Utilities
│   ├── 📁 styles/          # CSS styles
│   └── 📁 api/             # API integration
│
├── 📁 docs/                 # Documentation
├── 📁 tests/                # Test files
├── 📁 config/               # Configuration
├── 📁 scripts/              # Build scripts
├── package.json             # Dependencies
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
├── .eslintrc.js            # ESLint config
├── .prettierrc             # Prettier config
└── LICENSE                 # License file
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3001
```

#### **Node Version Issues**
```bash
# Check Node version
node --version

# Use Node Version Manager
nvm install 18
nvm use 18
```

#### **Permission Issues**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

#### **IndexedDB Issues**
```bash
# Clear browser data
# Chrome: Settings > Privacy > Clear browsing data
# Firefox: Settings > Privacy > Clear Data
```

#### **WebAuthn Not Working**
- Ensure HTTPS or localhost
- Check browser compatibility
- Verify WebAuthn flags enabled
- Test with physical security key

### **Debug Mode**
```bash
# Enable debug logging
VITE_DEBUG_MODE=true npm run dev

# Verbose logging
VITE_VERBOSE_LOGGING=true npm run dev
```

## 🔧 **IDE Setup**

### **VS Code Extensions**
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "ms-vscode.live-server"
  ]
}
```

### **VS Code Settings**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.env": true
  }
}
```

## 📱 **Mobile Development**

### **PWA Testing**
```bash
# Test PWA features
npm run build
npm run preview

# Check PWA score
# Use Lighthouse in Chrome DevTools
```

### **Device Testing**
- Use Chrome DevTools device emulation
- Test on actual mobile devices
- Verify offline functionality
- Test install prompts

## 🌐 **Multi-Country Testing**

### **Test Different Countries**
```bash
# Test New Zealand
VITE_DEFAULT_COUNTRY=NZ npm run dev

# Test Australia
VITE_DEFAULT_COUNTRY=AU npm run dev

# Test United States
VITE_DEFAULT_COUNTRY=US npm run dev
```

### **Currency Testing**
```bash
# Test different currencies
VITE_DEFAULT_CURRENCY=USD npm run dev
VITE_DEFAULT_CURRENCY=EUR npm run dev
```

## 📞 **Support**

### **Getting Help**
- 📖 Check documentation in `/docs`
- 🐛 Report issues on GitHub
- 💬 Join community discussions
- 📧 Contact support: support@smartfinanceai.com

### **Development Support**
- 🔧 Technical issues: dev@smartfinanceai.com
- 🔒 Security concerns: security@smartfinanceai.com
- 🌍 Localization: i18n@smartfinanceai.com

---

**Next Steps:**
- ✅ Complete setup following this guide
- 📖 Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- 🔒 Review [SECURITY.md](SECURITY.md) for security practices
- 🚀 Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment