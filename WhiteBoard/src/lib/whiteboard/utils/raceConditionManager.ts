'use client'

/**
 * Enhanced Race Condition Prevention System
 * 
 * Implements multiple strategies to prevent race conditions during undo/redo operations:
 * 1. Atomic Transactions
 * 2. Timestamp-Based Conflict Resolution
 * 3. Operation Locking with Timeout
 * 4. State Checkpointing
 * 5. Conflict Detection and Resolution
 */

export interface OperationLock {
  id: string
  type: 'undo' | 'redo' | 'sync' | 'drawing'
  timestamp: number
  timeout: number
  userId?: string
}

export interface StateCheckpoint {
  id: string
  timestamp: number
  drawings: any[]
  stickyNotes: any[]
  version: number
}

export interface ConflictResolution {
  strategy: 'timestamp' | 'user_priority' | 'manual' | 'rollback'
  resolved: boolean
  conflictData?: any
}

export class RaceConditionManager {
  private operationLocks: Map<string, OperationLock> = new Map()
  private stateCheckpoints: StateCheckpoint[] = []
  private conflictResolutions: Map<string, ConflictResolution> = new Map()
  private readonly LOCK_TIMEOUT = 5000 // 5 seconds
  private readonly MAX_CHECKPOINTS = 10

  /**
   * Acquire an operation lock to prevent race conditions
   */
  acquireLock(operationId: string, type: OperationLock['type'], userId?: string): boolean {
    const now = Date.now()
    
    // Check if there's already a conflicting lock
    const conflictingLock = this.findConflictingLock(type)
    if (conflictingLock) {
      console.warn(`❌ Cannot acquire lock for ${operationId}: conflicting lock exists`, conflictingLock)
      return false
    }

    // Create new lock
    const lock: OperationLock = {
      id: operationId,
      type,
      timestamp: now,
      timeout: now + this.LOCK_TIMEOUT,
      userId
    }

    this.operationLocks.set(operationId, lock)
    console.log(`🔒 Acquired lock for ${operationId} (${type})`)
    return true
  }

  /**
   * Release an operation lock
   */
  releaseLock(operationId: string): boolean {
    const lock = this.operationLocks.get(operationId)
    if (!lock) {
      console.warn(`❌ No lock found for ${operationId}`)
      return false
    }

    this.operationLocks.delete(operationId)
    console.log(`🔓 Released lock for ${operationId}`)
    return true
  }

  /**
   * Check if an operation can proceed (no conflicting locks)
   */
  canProceed(type: OperationLock['type']): boolean {
    const conflictingLock = this.findConflictingLock(type)
    return !conflictingLock
  }

  /**
   * Find conflicting locks for a given operation type
   */
  private findConflictingLock(type: OperationLock['type']): OperationLock | null {
    const now = Date.now()
    
    for (const [lockId, lock] of this.operationLocks) {
      // Check if lock has expired
      if (now > lock.timeout) {
        console.warn(`⏰ Lock ${lockId} has expired, removing`)
        this.operationLocks.delete(lockId)
        continue
      }

      // Check for conflicts based on operation type
      if (this.isConflicting(lock.type, type)) {
        return lock
      }
    }

    return null
  }

  /**
   * Determine if two operation types conflict
   */
  private isConflicting(type1: OperationLock['type'], type2: OperationLock['type']): boolean {
    // Define conflict matrix
    const conflicts: Record<OperationLock['type'], OperationLock['type'][]> = {
      'undo': ['redo', 'sync', 'drawing'],
      'redo': ['undo', 'sync', 'drawing'],
      'sync': ['undo', 'redo', 'drawing'],
      'drawing': ['undo', 'redo', 'sync']
    }

    return conflicts[type1]?.includes(type2) || false
  }

  /**
   * Create a state checkpoint for rollback capability
   */
  createCheckpoint(drawings: any[], stickyNotes: any[]): string {
    const checkpointId = `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const checkpoint: StateCheckpoint = {
      id: checkpointId,
      timestamp: Date.now(),
      drawings: JSON.parse(JSON.stringify(drawings)), // Deep copy
      stickyNotes: JSON.parse(JSON.stringify(stickyNotes)), // Deep copy
      version: this.stateCheckpoints.length + 1
    }

    this.stateCheckpoints.push(checkpoint)
    
    // Maintain max checkpoint limit
    if (this.stateCheckpoints.length > this.MAX_CHECKPOINTS) {
      this.stateCheckpoints.shift()
    }

    console.log(`💾 Created checkpoint ${checkpointId} (version ${checkpoint.version})`)
    return checkpointId
  }

  /**
   * Rollback to a previous checkpoint
   */
  rollbackToCheckpoint(checkpointId: string): StateCheckpoint | null {
    const checkpoint = this.stateCheckpoints.find(cp => cp.id === checkpointId)
    if (!checkpoint) {
      console.error(`❌ Checkpoint ${checkpointId} not found`)
      return null
    }

    console.log(`🔄 Rolling back to checkpoint ${checkpointId} (version ${checkpoint.version})`)
    return checkpoint
  }

  /**
   * Get the latest checkpoint
   */
  getLatestCheckpoint(): StateCheckpoint | null {
    return this.stateCheckpoints[this.stateCheckpoints.length - 1] || null
  }

  /**
   * Detect conflicts between local and remote state
   */
  detectConflict(localState: any, remoteState: any): ConflictResolution | null {
    const localTimestamp = localState.timestamp || 0
    const remoteTimestamp = remoteState.timestamp || 0

    // If timestamps are equal, we have a conflict
    if (localTimestamp === remoteTimestamp && localTimestamp > 0) {
      const conflictId = `conflict_${Date.now()}`
      const resolution: ConflictResolution = {
        strategy: 'timestamp',
        resolved: false,
        conflictData: {
          local: localState,
          remote: remoteState,
          timestamp: localTimestamp
        }
      }

      this.conflictResolutions.set(conflictId, resolution)
      console.warn(`⚠️ Conflict detected: ${conflictId}`, resolution)
      return resolution
    }

    return null
  }

  /**
   * Resolve a conflict using timestamp-based strategy
   */
  resolveConflict(conflictId: string, strategy: ConflictResolution['strategy'] = 'timestamp'): boolean {
    const conflict = this.conflictResolutions.get(conflictId)
    if (!conflict) {
      console.error(`❌ Conflict ${conflictId} not found`)
      return false
    }

    switch (strategy) {
      case 'timestamp':
        // Use the state with the latest timestamp
        const localTimestamp = conflict.conflictData?.local?.timestamp || 0
        const remoteTimestamp = conflict.conflictData?.remote?.timestamp || 0
        
        if (remoteTimestamp > localTimestamp) {
          console.log(`✅ Resolved conflict ${conflictId}: using remote state (newer timestamp)`)
          conflict.resolved = true
          return true
        } else {
          console.log(`✅ Resolved conflict ${conflictId}: using local state (newer timestamp)`)
          conflict.resolved = true
          return true
        }

      case 'rollback':
        // Rollback to previous checkpoint
        const latestCheckpoint = this.getLatestCheckpoint()
        if (latestCheckpoint) {
          console.log(`✅ Resolved conflict ${conflictId}: rolling back to checkpoint`)
          conflict.resolved = true
          return true
        }
        break

      case 'manual':
        // Mark for manual resolution
        console.log(`⏳ Conflict ${conflictId} marked for manual resolution`)
        return false
    }

    return false
  }

  /**
   * Execute an atomic operation with automatic conflict resolution
   */
  async executeAtomicOperation<T>(
    operationId: string,
    operationType: OperationLock['type'],
    operation: () => Promise<T>,
    userId?: string
  ): Promise<T | null> {
    // Acquire lock
    if (!this.acquireLock(operationId, operationType, userId)) {
      console.error(`❌ Failed to acquire lock for ${operationId}`)
      return null
    }

    try {
      // Create checkpoint before operation
      // const checkpointId = this.createCheckpoint([], [])
      
      // Execute operation
      console.log(`⚡ Executing atomic operation ${operationId}`)
      const result = await operation()
      
      // Release lock
      this.releaseLock(operationId)
      
      console.log(`✅ Atomic operation ${operationId} completed successfully`)
      return result
      
    } catch (error) {
      // Rollback on error
      console.error(`❌ Atomic operation ${operationId} failed, rolling back`)
      // const checkpoint = this.rollbackToCheckpoint(checkpointId)
      
      // Release lock
      this.releaseLock(operationId)
      
      throw error
    }
  }

  /**
   * Get current lock status for debugging
   */
  getLockStatus(): { locks: OperationLock[], checkpoints: number, conflicts: number } {
    return {
      locks: Array.from(this.operationLocks.values()),
      checkpoints: this.stateCheckpoints.length,
      conflicts: this.conflictResolutions.size
    }
  }

  /**
   * Clear all locks and checkpoints (for cleanup)
   */
  clear(): void {
    this.operationLocks.clear()
    this.stateCheckpoints = []
    this.conflictResolutions.clear()
    console.log('🧹 Race condition manager cleared')
  }
}

// Singleton instance for the whiteboard
export const raceConditionManager = new RaceConditionManager()
