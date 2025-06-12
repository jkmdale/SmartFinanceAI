/**
 * SmartFinanceAI - Database Migration Scripts
 * Global SaaS Platform - Data Migration System
 * 
 * Handles database schema migrations, data transformations, and version upgrades
 * Supports rollback, data integrity validation, and cross-platform compatibility
 */

class MigrationScripts {
  constructor() {
    this.currentVersion = '1.0.0';
    this.migrations = new Map();
    this.migrationHistory = [];
    this.dbManager = window.SmartFinanceAI?.data?.databaseManager;
    this.backupService = window.SmartFinanceAI?.data?.backupService;
    
    this.initializeMigrations();
  }

  /**
   * Initialize all migration scripts
   */
  initializeMigrations() {
    // Migration from initial version to 1.0.0
    this.registerMigration('0.0.1', '1.0.0', {
      name: 'Initial Schema Setup',
      description: 'Create initial database schema with all core tables',
      up: this.migration_001_initial_schema,
      down: this.rollback_001_initial_schema,
      dataTransform: null
    });

    // Migration for adding encryption support
    this.registerMigration('1.0.0', '1.1.0', {
      name: 'Add Encryption Support',
      description: 'Add encryption fields and migrate existing data',
      up: this.migration_002_encryption_support,
      down: this.rollback_002_encryption_support,
      dataTransform: this.transform_002_encrypt_data
    });

    // Migration for multi-currency support
    this.registerMigration('1.1.0', '1.2.0', {
      name: 'Multi-Currency Support',
      description: 'Add currency fields and exchange rate tracking',
      up: this.migration_003_multi_currency,
      down: this.rollback_003_multi_currency,
      dataTransform: this.transform_003_currency_data
    });

    // Migration for enhanced goal tracking
    this.registerMigration('1.2.0', '1.3.0', {
      name: 'Enhanced Goal Tracking',
      description: 'Add advanced goal features and milestone tracking',
      up: this.migration_004_enhanced_goals,
      down: this.rollback_004_enhanced_goals,
      dataTransform: this.transform_004_goal_data
    });

    // Migration for AI features
    this.registerMigration('1.3.0', '1.4.0', {
      name: 'AI Features Integration',
      description: 'Add tables for AI predictions and insights',
      up: this.migration_005_ai_features,
      down: this.rollback_005_ai_features,
      dataTransform: null
    });

    // Migration for collaboration features
    this.registerMigration('1.4.0', '1.5.0', {
      name: 'Collaboration Features',
      description: 'Add shared accounts and family management',
      up: this.migration_006_collaboration,
      down: this.rollback_006_collaboration,
      dataTransform: this.transform_006_shared_data
    });
  }

  /**
   * Register a migration script
   */
  registerMigration(fromVersion, toVersion, migration) {
    const key = `${fromVersion}_to_${toVersion}`;
    this.migrations.set(key, {
      ...migration,
      fromVersion,
      toVersion,
      registeredAt: new Date().toISOString()
    });
  }

  /**
   * Run migrations to bring database to latest version
   */
  async runMigrations(targetVersion = null) {
    try {
      const currentVersion = await this.getCurrentDatabaseVersion();
      const finalVersion = targetVersion || this.currentVersion;

      console.log(`Starting migration from ${currentVersion} to ${finalVersion}`);

      // Find migration path
      const migrationPath = this.findMigrationPath(currentVersion, finalVersion);
      
      if (migrationPath.length === 0) {
        console.log('Database is already at target version');
        return { success: true, migrationsRun: 0 };
      }

      // Create backup before migration
      await this.createPreMigrationBackup();

      // Run migrations in sequence
      const results = [];
      for (const migration of migrationPath) {
        console.log(`Running migration: ${migration.name} (${migration.fromVersion} → ${migration.toVersion})`);
        
        const result = await this.runSingleMigration(migration);
        results.push(result);
        
        if (!result.success) {
          console.error(`Migration failed: ${migration.name}`);
          await this.rollbackMigrations(results.slice(0, -1));
          throw new Error(`Migration failed: ${result.error}`);
        }
      }

      // Update database version
      await this.updateDatabaseVersion(finalVersion);

      console.log(`Migration completed successfully. New version: ${finalVersion}`);
      
      return {
        success: true,
        migrationsRun: results.length,
        results
      };

    } catch (error) {
      console.error('Migration error:', error);
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  /**
   * Run a single migration
   */
  async runSingleMigration(migration) {
    const startTime = Date.now();
    
    try {
      // Start transaction
      const transaction = await this.dbManager.startTransaction();

      try {
        // Run schema migration
        if (migration.up) {
          await migration.up.call(this, transaction);
        }

        // Run data transformation
        if (migration.dataTransform) {
          await migration.dataTransform.call(this, transaction);
        }

        // Validate migration
        await this.validateMigration(migration, transaction);

        // Commit transaction
        await transaction.commit();

        // Record migration in history
        await this.recordMigrationHistory(migration, 'success');

        const duration = Date.now() - startTime;
        
        return {
          success: true,
          migration: migration.name,
          duration,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        // Rollback transaction
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      await this.recordMigrationHistory(migration, 'failed', error.message);
      
      return {
        success: false,
        migration: migration.name,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Find migration path between versions
   */
  findMigrationPath(fromVersion, toVersion) {
    const path = [];
    let currentVersion = fromVersion;

    while (currentVersion !== toVersion) {
      let nextMigration = null;

      // Find next migration in the chain
      for (const [key, migration] of this.migrations) {
        if (migration.fromVersion === currentVersion) {
          if (!nextMigration || this.compareVersions(migration.toVersion, nextMigration.toVersion) <= 0) {
            nextMigration = migration;
          }
        }
      }

      if (!nextMigration) {
        throw new Error(`No migration path found from ${currentVersion} to ${toVersion}`);
      }

      path.push(nextMigration);
      currentVersion = nextMigration.toVersion;

      // Prevent infinite loops
      if (path.length > 20) {
        throw new Error('Migration path too long - possible circular dependency');
      }
    }

    return path;
  }

  /**
   * Compare semantic versions
   */
  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }

  /**
   * MIGRATION 001: Initial Schema Setup
   */
  async migration_001_initial_schema(transaction) {
    const schemas = {
      // Users table
      users: `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          country TEXT NOT NULL DEFAULT 'US',
          currency TEXT NOT NULL DEFAULT 'USD',
          tier TEXT NOT NULL DEFAULT 'free',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          preferences TEXT DEFAULT '{}',
          settings TEXT DEFAULT '{}'
        )
      `,

      // Accounts table
      accounts: `
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          bank TEXT,
          currency TEXT NOT NULL DEFAULT 'USD',
          balance REAL DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `,

      // Transactions table
      transactions: `
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          account_id TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT NOT NULL,
          category TEXT,
          merchant TEXT,
          date TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'expense',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
        )
      `,

      // Goals table
      goals: `
        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          target_amount REAL NOT NULL,
          current_amount