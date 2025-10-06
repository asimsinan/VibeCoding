'use client'

/**
 * Command Pattern Implementation for Whiteboard Undo/Redo System
 * 
 * This system provides a robust, extensible undo/redo functionality using the Command Pattern.
 * Every user action is encapsulated as a command that can be executed, undone, and redone.
 */

// Base Command Interface
export interface Command {
  execute(): Promise<void>
  undo(): Promise<void>
  redo(): Promise<void>
  getDescription(): string
  getTimestamp(): number
  getId(): string
}

// Abstract Base Command Class
export abstract class BaseCommand implements Command {
  protected id: string
  protected timestamp: number
  protected description: string

  constructor(description: string) {
    this.id = this.generateId()
    this.timestamp = Date.now()
    this.description = description
  }

  abstract execute(): Promise<void>
  abstract undo(): Promise<void>
  abstract redo(): Promise<void>

  getDescription(): string {
    return this.description
  }

  getTimestamp(): number {
    return this.timestamp
  }

  getId(): string {
    return this.id
  }

  private generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Command Manager for handling undo/redo operations
export class CommandManager {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private maxStackSize: number = 100
  private eventEmitter: EventTarget

  constructor(maxStackSize: number = 100) {
    this.maxStackSize = maxStackSize
    this.eventEmitter = new EventTarget()
  }

  async executeCommand(command: Command): Promise<void> {
    try {
      console.log(`▶️ Executing command: ${command.getDescription()}`)
      await command.execute()
      this.undoStack.push(command)
      this.redoStack = [] // Clear redo stack when new command is executed
      this.trimStack()
      this.emitEvent('commandExecuted', { command })
      console.log(`✅ Command executed successfully: ${command.getDescription()}`)
    } catch (error) {
      console.error('❌ Command execution failed:', error)
      throw error
    }
  }

  async undo(): Promise<boolean> {
    if (this.undoStack.length === 0) {
      console.log('⚠️ No commands to undo')
      return false
    }

    console.log(`📚 Current undo stack (${this.undoStack.length} commands):`, 
      this.undoStack.map(cmd => cmd.getDescription()))
    
    const command = this.undoStack.pop()!
    try {
      console.log(`↩️ Undoing command: ${command.getDescription()}`)
      console.log(`🎯 Command ID: ${command.getId()}`)
      await command.undo()
      this.redoStack.push(command)
      this.emitEvent('commandUndone', { command })
      console.log(`✅ Command undone successfully: ${command.getDescription()}`)
      return true
    } catch (error) {
      console.error('❌ Command undo failed:', error)
      this.undoStack.push(command) // Restore command to stack
      return false
    }
  }

  async redo(): Promise<boolean> {
    if (this.redoStack.length === 0) {
      console.log('⚠️ No commands to redo')
      return false
    }

    const command = this.redoStack.pop()!
    try {
      console.log(`↷ Redoing command: ${command.getDescription()}`)
      await command.redo()
      this.undoStack.push(command)
      this.emitEvent('commandRedone', { command })
      console.log(`✅ Command redone successfully: ${command.getDescription()}`)
      return true
    } catch (error) {
      console.error('❌ Command redo failed:', error)
      this.redoStack.push(command) // Restore command to stack
      return false
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  getUndoStack(): Command[] {
    return [...this.undoStack]
  }

  getRedoStack(): Command[] {
    return [...this.redoStack]
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.emitEvent('historyCleared', {})
    console.log('🗑️ Command history cleared')
  }

  getHistoryLength(): number {
    return this.undoStack.length
  }

  private trimStack(): void {
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack = this.undoStack.slice(-this.maxStackSize)
    }
  }

  private emitEvent(eventType: string, detail: any): void {
    const event = new CustomEvent(eventType, { detail })
    this.eventEmitter.dispatchEvent(event)
  }

  // Event listener methods
  addEventListener(eventType: string, listener: EventListener): void {
    this.eventEmitter.addEventListener(eventType, listener)
  }

  removeEventListener(eventType: string, listener: EventListener): void {
    this.eventEmitter.removeEventListener(eventType, listener)
  }
}

// Singleton instance for the whiteboard
export const whiteboardCommandManager = new CommandManager(100)
