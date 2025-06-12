/**
 * 🔄 SmartFinanceAI - Sync Manager
 * 
 * Advanced offline/online data synchronization for PWA
 * 
 * Features:
 * - Intelligent conflict resolution for financial data
 * - Offline-first architecture with background sync
 * - Real-time sync when online with WebSocket support
 * - Incremental sync to minimize data transfer
 * - Retry logic with exponential backoff
 * - Data integrity verification and checksums
 * - Multi-device synchronization support
 * - Secure sync with end-to-end encryption
 */

import { encryptionService } from './encryption-service.js';
import { tenantIsolation } from '../platform/tenant-isolation.js';

/**
 * Sync Manager Class
 * Handles all data synchronization between local storage and server
 */
export class SyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = new Map();
        this.syncInProgress = false;
        this.lastSyncTime = null;
        this.syncInterval = 30000; // 30 seconds
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second base delay
        
        // WebSocket connection for real-time sync
        this.websocket = null;
        this.websocketReconnectAttempts = 0;
        this.maxWebSocketReconnectAttempts = 5;
        
        // Sync statistics
        this.syncStats = {
            totalSyncs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            conflictsResolved: 0,
            lastSyncDuration: 0,
            averageSyncDuration: 0
        };

        // Conflict resolution strategies
        this.conflictStrategies = {
            'last-write-wins': this.lastWriteWinsStrategy.bind(this),
            'server-wins': this.serverWinsStrategy.bind(this),
            'client-wins': this.clientWinsStrategy.bind(this),
            'merge': this.mergeStrategy.bind(this),
            'financial-priority': this.financialPriorityStrategy.bind(this)
        };

        this.init();
    }

    /**
     * Initialize sync manager
     */
    async init() {
        try {
            // Setup online/offline event listeners
            this.setupNetworkListeners();
            
            // Setup background sync for PWA
            this.setupBackgroundSync();
            
            // Setup periodic sync
            this.setupPeriodicSync();
            
            // Load sync queue from storage
            await this.loadSyncQueue();
            
            // Establish WebSocket connection if online
            if (this.isOnline) {
                await this.connectWebSocket();
            }
            
            // Perform initial sync if online
            if (this.isOnline) {
                await this.performSync();
            }
            
            console.log('✅ Sync Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Sync Manager:', error);
        }
    }

    /**
     * Setup network status listeners
     */
    setupNetworkListeners() {
        window.addEventListener('online', async () => {
            console.log('🌐 Network connection restored');
            this.isOnline = true;
            
            // Connect WebSocket
            await this.connectWebSocket();
            
            // Sync pending changes
            await this.performSync();
            
            // Notify user
            this.notifyNetworkStatus('online');
        });

        window.addEventListener('offline', () => {
            console.log('📵 Network connection lost');
            this.isOnline = false;
            
            // Close WebSocket
            this.disconnectWebSocket();
            
            // Notify user
            this.notifyNetworkStatus('offline');
        });
    }

    /**
     * Setup background sync for PWA
     */
    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then(registration => {
                // Register background sync
                registration.sync.register('financial-data-sync');
                
                // Listen for sync events
                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data.type === 'BACKGROUND_SYNC') {
                        this.handleBackgroundSync(event.data);
                    }
                });
            });
        }
    }

    /**
     * Setup periodic sync timer
     */
    setupPeriodicSync() {
        setInterval(() => {
            if (this.isOnline && !this.syncInProgress) {
                this.performIncrementalSync();
            }
        }, this.syncInterval);
    }

    /**
     * Connect WebSocket for real-time sync
     */
    async connectWebSocket() {
        try {
            const tenant = tenantIsolation.getCurrentTenantInfo();
            if (!tenant) {
                throw new Error('No active tenant for WebSocket connection');
            }

            const wsUrl = `wss://api.smartfinanceai.com/ws/sync/${tenant.tenantId}`;
            this.websocket = new WebSocket(wsUrl);

            this.websocket.onopen = () => {
                console.log('🔗 WebSocket connected for real-time sync');
                this.websocketReconnectAttempts = 0;
                
                // Send authentication
                this.websocket.send(JSON.stringify({
                    type: 'AUTH',
                    token: tenant.sessionId,
                    clientInfo: this.getClientInfo()
                }));
            };

            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };

            this.websocket.onclose = () => {
                console.log('❌ WebSocket disconnected');
                this.handleWebSocketReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };

        } catch (error) {
            console.error('❌ Failed to connect WebSocket:', error);
        }
    }

    /**
     * Disconnect WebSocket
     */
    disconnectWebSocket() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }

    /**
     * Handle WebSocket message
     * @param {MessageEvent} event - WebSocket message event
     */
    handleWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'SYNC_UPDATE':
                    this.handleRemoteUpdate(message.data);
                    break;
                
                case 'CONFLICT_DETECTED':
                    this.handleSyncConflict(message.data);
                    break;
                
                case 'SYNC_COMPLETE':
                    this.handleSyncComplete(message.data);
                    break;
                
                case 'PING':
                    this.websocket.send(JSON.stringify({ type: 'PONG' }));
                    break;
                    
                default:
                    console.warn('Unknown WebSocket message type:', message.type);
            }
            
        } catch (error) {
            console.error('❌ Failed to handle WebSocket message:', error);
        }
    }

    /**
     * Handle WebSocket reconnection
     */
    handleWebSocketReconnect() {
        if (this.websocketReconnectAttempts < this.maxWebSocketReconnectAttempts && this.isOnline) {
            this.websocketReconnectAttempts++;
            const delay = Math.pow(2, this.websocketReconnectAttempts) * 1000; // Exponential backoff
            
            setTimeout(() => {
                console.log(`🔄 Attempting WebSocket reconnection (${this.websocketReconnectAttempts}/${this.maxWebSocketReconnectAttempts})`);
                this.connectWebSocket();
            }, delay);
        }
    }

    /**
     * Queue data for sync
     * @param {string} operation - Operation type (create, update, delete)
     * @param {string} dataType - Data type (transaction, account, goal, etc.)
     * @param {Object} data - Data to sync
     * @param {Object} metadata - Additional metadata
     */
    async queueForSync(operation, dataType, data, metadata = {}) {
        try {
            const syncItem = {
                id: this.generateSyncId(),
                operation,
                dataType,
                data: await this.encryptData(data),
                metadata,
                timestamp: new Date().toISOString(),
                retries: 0,
                checksum: await this.calculateChecksum(data)
            };

            this.syncQueue.set(syncItem.id, syncItem);
            await this.saveSyncQueue();

            // Attempt immediate sync if online
            if (this.isOnline && !this.syncInProgress) {
                await this.performSync();
            }

            console.log(`📝 Queued ${operation} ${dataType} for sync`);
            
        } catch (error) {
            console.error('❌ Failed to queue item for sync:', error);
        }
    }

    /**
     * Perform full synchronization
     */
    async performSync() {
        if (this.syncInProgress || !this.isOnline) {
            return;
        }

        const startTime = Date.now();
        this.syncInProgress = true;

        try {
            console.log('🔄 Starting full sync...');

            // Get pending sync items
            const pendingItems = Array.from(this.syncQueue.values());
            
            if (pendingItems.length === 0) {
                console.log('✅ No items to sync');
                return;
            }

            // Group items by data type for batch processing
            const groupedItems = this.groupSyncItems(pendingItems);

            // Process each group
            for (const [dataType, items] of Object.entries(groupedItems)) {
                await this.syncDataType(dataType, items);
            }

            // Update sync statistics
            const duration = Date.now() - startTime;
            this.updateSyncStats(true, duration);
            
            this.lastSyncTime = new Date().toISOString();
            console.log(`✅ Full sync completed in ${duration}ms`);

        } catch (error) {
            console.error('❌ Full sync failed:', error);
            this.updateSyncStats(false, Date.now() - startTime);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Perform incremental sync (only changed data)
     */
    async performIncrementalSync() {
        if (this.syncInProgress || !this.isOnline) {
            return;
        }

        try {
            console.log('⚡ Starting incremental sync...');

            const lastSync = this.lastSyncTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            
            // Get server changes since last sync
            const serverChanges = await this.getServerChanges(lastSync);
            
            // Apply server changes locally
            if (serverChanges.length > 0) {
                await this.applyServerChanges(serverChanges);
            }

            // Send local changes to server
            const localChanges = this.getLocalChangesSince(lastSync);
            if (localChanges.length > 0) {
                await this.sendLocalChanges(localChanges);
            }

            this.lastSyncTime = new Date().toISOString();
            console.log(`⚡ Incremental sync completed`);

        } catch (error) {
            console.error('❌ Incremental sync failed:', error);
        }
    }

    /**
     * Sync specific data type
     * @param {string} dataType - Data type to sync
     * @param {Array} items - Items to sync
     */
    async syncDataType(dataType, items) {
        try {
            console.log(`🔄 Syncing ${items.length} ${dataType} items...`);

            // Prepare batch request
            const batchData = await this.prepareBatchData(items);
            
            // Send to server
            const response = await this.sendBatchToServer(dataType, batchData);
            
            // Handle response
            await this.processBatchResponse(items, response);

        } catch (error) {
            console.error(`❌ Failed to sync ${dataType}:`, error);
            
            // Mark items for retry
            items.forEach(item => {
                if (item.retries < this.maxRetries) {
                    item.retries++;
                    item.nextRetry = new Date(Date.now() + (this.retryDelay * Math.pow(2, item.retries))).toISOString();
                } else {
                    console.error(`❌ Max retries exceeded for ${item.id}, removing from queue`);
                    this.syncQueue.delete(item.id);
                }
            });

            await this.saveSyncQueue();
        }
    }

    /**
     * Handle remote update from WebSocket
     * @param {Object} updateData - Remote update data
     */
    async handleRemoteUpdate(updateData) {
        try {
            const { operation, dataType, data, timestamp, sourceDeviceId } = updateData;
            
            // Skip if update is from this device
            const clientInfo = this.getClientInfo();
            if (sourceDeviceId === clientInfo.deviceId) {
                return;
            }

            console.log(`📥 Received remote ${operation} for ${dataType}`);

            // Decrypt data
            const decryptedData = await this.decryptData(data);
            
            // Check for conflicts
            const conflict = await this.detectConflict(dataType, decryptedData, timestamp);
            
            if (conflict) {
                await this.resolveConflict(conflict);
            } else {
                // Apply update directly
                await this.applyRemoteUpdate(operation, dataType, decryptedData);
            }

        } catch (error) {
            console.error('❌ Failed to handle remote update:', error);
        }
    }

    /**
     * Detect sync conflicts
     * @param {string} dataType - Data type
     * @param {Object} remoteData - Remote data
     * @param {string} remoteTimestamp - Remote timestamp
     */
    async detectConflict(dataType, remoteData, remoteTimestamp) {
        try {
            // Get local version of the data
            const localData = await tenantIsolation.isolatedOperation(
                () => this.getLocalData(dataType, remoteData.id)
            );

            if (!localData) {
                return null; // No conflict - data doesn't exist locally
            }

            // Compare timestamps
            const localTimestamp = localData.lastModified || localData.createdAt;
            const remoteTime = new Date(remoteTimestamp).getTime();
            const localTime = new Date(localTimestamp).getTime();

            // Check if there's a conflict (both modified around the same time)
            const timeDiff = Math.abs(remoteTime - localTime);
            const conflictThreshold = 5000; // 5 seconds

            if (timeDiff < conflictThreshold) {
                return {
                    dataType,
                    localData,
                    remoteData,
                    localTimestamp,
                    remoteTimestamp,
                    conflictType: 'concurrent_modification'
                };
            }

            // Check for data inconsistency
            const localChecksum = await this.calculateChecksum(localData);
            const remoteChecksum = await this.calculateChecksum(remoteData);

            if (localChecksum !== remoteChecksum && localTime > remoteTime) {
                return {
                    dataType,
                    localData,
                    remoteData,
                    localTimestamp,
                    remoteTimestamp,
                    conflictType: 'data_inconsistency'
                };
            }

            return null;

        } catch (error) {
            console.error('❌ Failed to detect conflict:', error);
            return null;
        }
    }

    /**
     * Resolve sync conflict using configured strategy
     * @param {Object} conflict - Conflict details
     */
    async resolveConflict(conflict) {
        try {
            console.log(`⚠️ Resolving ${conflict.conflictType} conflict for ${conflict.dataType}`);

            // Determine resolution strategy based on data type
            let strategy = 'last-write-wins';
            
            if (conflict.dataType === 'transaction' || conflict.dataType === 'account') {
                strategy = 'financial-priority';
            } else if (conflict.dataType === 'goal') {
                strategy = 'merge';
            }

            // Apply resolution strategy
            const resolvedData = await this.conflictStrategies[strategy](conflict);
            
            // Save resolved data
            await this.saveResolvedData(conflict.dataType, resolvedData);
            
            // Update statistics
            this.syncStats.conflictsResolved++;
            
            console.log(`✅ Conflict resolved using ${strategy} strategy`);

        } catch (error) {
            console.error('❌ Failed to resolve conflict:', error);
        }
    }

    /**
     * Last-write-wins conflict resolution strategy
     * @param {Object} conflict - Conflict details
     */
    async lastWriteWinsStrategy(conflict) {
        const remoteTime = new Date(conflict.remoteTimestamp).getTime();
        const localTime = new Date(conflict.localTimestamp).getTime();
        
        return remoteTime > localTime ? conflict.remoteData : conflict.localData;
    }

    /**
     * Server-wins conflict resolution strategy
     * @param {Object} conflict - Conflict details
     */
    async serverWinsStrategy(conflict) {
        return conflict.remoteData;
    }

    /**
     * Client-wins conflict resolution strategy
     * @param {Object} conflict - Conflict details
     */
    async clientWinsStrategy(conflict) {
        return conflict.localData;
    }

    /**
     * Merge conflict resolution strategy
     * @param {Object} conflict - Conflict details
     */
    async mergeStrategy(conflict) {
        const { localData, remoteData } = conflict;
        
        // Smart merge based on data type
        const merged = { ...localData };
        
        // Merge non-conflicting fields from remote data
        for (const [key, value] of Object.entries(remoteData)) {
            if (key !== 'id' && key !== 'lastModified') {
                // Prefer remote value if local value is empty/null
                if (!localData[key] || localData[key] === '' || localData[key] === null) {
                    merged[key] = value;
                }
                // For arrays, merge unique items
                else if (Array.isArray(localData[key]) && Array.isArray(value)) {
                    merged[key] = [...new Set([...localData[key], ...value])];
                }
            }
        }
        
        // Update timestamp
        merged.lastModified = new Date().toISOString();
        merged.mergedAt = new Date().toISOString();
        
        return merged;
    }

    /**
     * Financial-priority conflict resolution strategy
     * @param {Object} conflict - Conflict details
     */
    async financialPriorityStrategy(conflict) {
        const { localData, remoteData, dataType } = conflict;
        
        // For financial data, prioritize based on data completeness and accuracy
        if (dataType === 'transaction') {
            // Prefer transaction with more complete data
            const localScore = this.calculateTransactionCompleteness(localData);
            const remoteScore = this.calculateTransactionCompleteness(remoteData);
            
            return localScore >= remoteScore ? localData : remoteData;
        }
        
        if (dataType === 'account') {
            // Prefer account data with more recent balance
            const localBalance = localData.lastBalanceUpdate || localData.lastModified;
            const remoteBalance = remoteData.lastBalanceUpdate || remoteData.lastModified;
            
            return new Date(localBalance) > new Date(remoteBalance) ? localData : remoteData;
        }
        
        // Default to last-write-wins
        return this.lastWriteWinsStrategy(conflict);
    }

    /**
     * Calculate transaction completeness score
     * @param {Object} transaction - Transaction data
     */
    calculateTransactionCompleteness(transaction) {
        let score = 0;
        
        if (transaction.amount) score += 3; // Amount is critical
        if (transaction.date) score += 3; // Date is critical
        if (transaction.description) score += 2;
        if (transaction.category) score += 2;
        if (transaction.merchant) score += 1;
        if (transaction.location) score += 1;
        if (transaction.receipt) score += 1;
        
        return score;
    }

    /**
     * Group sync items by data type
     * @param {Array} items - Sync items
     */
    groupSyncItems(items) {
        return items.reduce((groups, item) => {
            const { dataType } = item;
            if (!groups[dataType]) {
                groups[dataType] = [];
            }
            groups[dataType].push(item);
            return groups;
        }, {});
    }

    /**
     * Prepare batch data for server
     * @param {Array} items - Items to prepare
     */
    async prepareBatchData(items) {
        const batchData = {
            items: [],
            metadata: {
                clientInfo: this.getClientInfo(),
                timestamp: new Date().toISOString(),
                checksum: null
            }
        };

        for (const item of items) {
            batchData.items.push({
                id: item.id,
                operation: item.operation,
                data: item.data, // Already encrypted
                timestamp: item.timestamp,
                checksum: item.checksum
            });
        }

        // Calculate batch checksum
        batchData.metadata.checksum = await this.calculateChecksum(batchData.items);
        
        return batchData;
    }

    /**
     * Send batch data to server
     * @param {string} dataType - Data type
     * @param {Object} batchData - Batch data to send
     */
    async sendBatchToServer(dataType, batchData) {
        const tenant = tenantIsolation.getCurrentTenantInfo();
        if (!tenant) {
            throw new Error('No active tenant for sync');
        }

        const response = await fetch(`/api/sync/${dataType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tenant.sessionId}`,
                'X-Tenant-ID': tenant.tenantId
            },
            body: JSON.stringify(batchData)
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Process batch response from server
     * @param {Array} items - Original items
     * @param {Object} response - Server response
     */
    async processBatchResponse(items, response) {
        const { results, conflicts, serverUpdates } = response;

        // Process successful items
        for (const result of results) {
            if (result.success) {
                // Remove from sync queue
                this.syncQueue.delete(result.itemId);
            } else {
                // Handle individual item errors
                const item = items.find(i => i.id === result.itemId);
                if (item) {
                    item.error = result.error;
                    item.retries++;
                }
            }
        }

        // Handle conflicts
        for (const conflict of conflicts || []) {
            await this.resolveConflict(conflict);
        }

        // Apply server updates
        for (const update of serverUpdates || []) {
            await this.handleRemoteUpdate(update);
        }

        // Save updated sync queue
        await this.saveSyncQueue();
    }

    /**
     * Get server changes since timestamp
     * @param {string} since - Timestamp to get changes since
     */
    async getServerChanges(since) {
        const tenant = tenantIsolation.getCurrentTenantInfo();
        if (!tenant) {
            throw new Error('No active tenant for sync');
        }

        const response = await fetch(`/api/sync/changes?since=${encodeURIComponent(since)}`, {
            headers: {
                'Authorization': `Bearer ${tenant.sessionId}`,
                'X-Tenant-ID': tenant.tenantId
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get server changes: ${response.status}`);
        }

        const data = await response.json();
        return data.changes || [];
    }

    /**
     * Get local changes since timestamp
     * @param {string} since - Timestamp to get changes since
     */
    getLocalChangesSince(since) {
        return Array.from(this.syncQueue.values()).filter(item => 
            new Date(item.timestamp) > new Date(since)
        );
    }

    /**
     * Apply server changes locally
     * @param {Array} changes - Server changes to apply
     */
    async applyServerChanges(changes) {
        for (const change of changes) {
            try {
                const decryptedData = await this.decryptData(change.data);
                await this.applyRemoteUpdate(change.operation, change.dataType, decryptedData);
            } catch (error) {
                console.error('❌ Failed to apply server change:', error);
            }
        }
    }

    /**
     * Send local changes to server
     * @param {Array} changes - Local changes to send
     */
    async sendLocalChanges(changes) {
        if (changes.length === 0) return;

        const groupedChanges = this.groupSyncItems(changes);
        
        for (const [dataType, items] of Object.entries(groupedChanges)) {
            await this.syncDataType(dataType, items);
        }
    }

    /**
     * Apply remote update to local data
     * @param {string} operation - Operation type
     * @param {string} dataType - Data type
     * @param {Object} data - Data to apply
     */
    async applyRemoteUpdate(operation, dataType, data) {
        await tenantIsolation.isolatedOperation(async () => {
            switch (operation) {
                case 'create':
                    await this.createLocalData(dataType, data);
                    break;
                case 'update':
                    await this.updateLocalData(dataType, data);
                    break;
                case 'delete':
                    await this.deleteLocalData(dataType, data.id);
                    break;
                default:
                    console.warn(`Unknown operation: ${operation}`);
            }
        });

        // Notify UI of data change
        this.notifyDataChange(operation, dataType, data);
    }

    /**
     * Encrypt data for sync
     * @param {Object} data - Data to encrypt
     */
    async encryptData(data) {
        return await encryptionService.encrypt(data);
    }

    /**
     * Decrypt data from sync
     * @param {Object} encryptedData - Encrypted data
     */
    async decryptData(encryptedData) {
        return await encryptionService.decrypt(encryptedData);
    }

    /**
     * Calculate data checksum for integrity verification
     * @param {Object} data - Data to checksum
     */
    async calculateChecksum(data) {
        const dataString = JSON.stringify(data, Object.keys(data).sort());
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate unique sync ID
     */
    generateSyncId() {
        return `sync_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }

    /**
     * Get client information
     */
    getClientInfo() {
        return {
            deviceId: this.getDeviceId(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * Get or generate device ID
     */
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    /**
     * Load sync queue from storage
     */
    async loadSyncQueue() {
        try {
            const queueData = await tenantIsolation.getTenantData('sync_queue');
            if (queueData) {
                this.syncQueue = new Map(Object.entries(queueData));
            }
        } catch (error) {
            console.error('❌ Failed to load sync queue:', error);
        }
    }

    /**
     * Save sync queue to storage
     */
    async saveSyncQueue() {
        try {
            const queueData = Object.fromEntries(this.syncQueue);
            await tenantIsolation.setTenantData('sync_queue', queueData);
        } catch (error) {
            console.error('❌ Failed to save sync queue:', error);
        }
    }

    /**
     * Update sync statistics
     * @param {boolean} success - Whether sync was successful
     * @param {number} duration - Sync duration in ms
     */
    updateSyncStats(success, duration) {
        this.syncStats.totalSyncs++;
        
        if (success) {
            this.syncStats.successfulSyncs++;
        } else {
            this.syncStats.failedSyncs++;
        }
        
        this.syncStats.lastSyncDuration = duration;
        
        // Calculate running average
        const totalDuration = this.syncStats.averageSyncDuration * (this.syncStats.totalSyncs - 1) + duration;
        this.syncStats.averageSyncDuration = totalDuration / this.syncStats.totalSyncs;
    }

    /**
     * Notify network status change
     * @param {string} status - Network status ('online' or 'offline')
     */
    notifyNetworkStatus(status) {
        const event = new CustomEvent('networkstatuschange', {
            detail: { status, timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
    }

    /**
     * Notify data change
     * @param {string} operation - Operation type
     * @param {string} dataType - Data type
     * @param {Object} data - Changed data
     */
    notifyDataChange(operation, dataType, data) {
        const event = new CustomEvent('datachange', {
            detail: { operation, dataType, data, timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime,
            queueSize: this.syncQueue.size,
            websocketConnected: this.websocket?.readyState === WebSocket.OPEN,
            stats: { ...this.syncStats }
        };
    }

    /**
     * Force immediate sync
     */
    async forcSync() {
        if (this.isOnline) {
            await this.performSync();
        } else {
            throw new Error('Cannot sync while offline');
        }
    }

    /**
     * Clear sync queue
     */
    async clearSyncQueue() {
        this.syncQueue.clear();
        await this.saveSyncQueue();
    }

    /**
     * Destroy sync manager
     */
    destroy() {
        // Clear intervals
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Disconnect WebSocket
        this.disconnectWebSocket();
        
        // Remove event listeners
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
    }
}

// Export singleton instance
export const syncManager = new SyncManager();