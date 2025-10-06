#!/usr/bin/env node

/**
 * Whiteboard CLI
 * 
 * Command-line interface for whiteboard operations.
 * Provides functionality for creating, managing, and exporting whiteboards.
 */

import { Command } from 'commander'
import { createClient } from '@supabase/supabase-js'
// import { Drawing } from '../lib/whiteboard/models/Drawing' // Unused import
// import { StickyNote } from '../lib/whiteboard/models/StickyNote' // Unused import
// import { Whiteboard } from '../lib/whiteboard/models/Whiteboard' // Unused import

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
const supabase = createClient(supabaseUrl, supabaseKey)

const program = new Command()

program
  .name('whiteboard-cli')
  .description('CLI for collaborative whiteboard management')
  .version('1.0.0')

// Whiteboard commands
const whiteboardCmd = program
  .command('whiteboard')
  .description('Whiteboard management commands')

whiteboardCmd
  .command('create')
  .description('Create a new whiteboard')
  .option('-n, --name <name>', 'Whiteboard name', 'Untitled Whiteboard')
  .option('-w, --width <width>', 'Canvas width', '800')
  .option('-h, --height <height>', 'Canvas height', '600')
  .option('-b, --background <color>', 'Background color', '#ffffff')
  .action(async (options) => {
    try {
      console.log('Creating whiteboard...')
      
      const whiteboardData = {
        name: options.name,
        settings: {
          width: parseInt(options.width),
          height: parseInt(options.height),
          backgroundColor: options.background
        }
      }

      const { data, error } = await supabase
        .from('whiteboards')
        .insert(whiteboardData)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Whiteboard created successfully!')
      console.log(`ID: ${data.id}`)
      console.log(`Name: ${data.name}`)
      console.log(`Size: ${data.settings.width}x${data.settings.height}`)
      console.log(`Background: ${data.settings.backgroundColor}`)
    } catch (error) {
      console.error('❌ Error creating whiteboard:', error)
      process.exit(1)
    }
  })

whiteboardCmd
  .command('list')
  .description('List all whiteboards')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .action(async (options) => {
    try {
      console.log('Fetching whiteboards...')
      
      const { data, error } = await supabase
        .from('whiteboards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(options.limit))

      if (error) throw error

      if (data.length === 0) {
        console.log('No whiteboards found.')
        return
      }

      console.log(`\nFound ${data.length} whiteboard(s):\n`)
      data.forEach((wb, index) => {
        console.log(`${index + 1}. ${wb.name}`)
        console.log(`   ID: ${wb.id}`)
        console.log(`   Size: ${wb.settings.width}x${wb.settings.height}`)
        console.log(`   Created: ${new Date(wb.created_at).toLocaleString()}`)
        console.log('')
      })
    } catch (error) {
      console.error('❌ Error fetching whiteboards:', error)
      process.exit(1)
    }
  })

whiteboardCmd
  .command('get <id>')
  .description('Get whiteboard details')
  .action(async (id) => {
    try {
      console.log(`Fetching whiteboard ${id}...`)
      
      const { data, error } = await supabase
        .from('whiteboards')
        .select(`
          *,
          drawings (*),
          sticky_notes (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      console.log('\n📋 Whiteboard Details:')
      console.log(`Name: ${data.name}`)
      console.log(`Size: ${data.settings.width}x${data.settings.height}`)
      console.log(`Background: ${data.settings.backgroundColor}`)
      console.log(`Created: ${new Date(data.created_at).toLocaleString()}`)
      console.log(`Updated: ${new Date(data.updated_at).toLocaleString()}`)
      console.log(`Drawings: ${data.drawings.length}`)
      console.log(`Sticky Notes: ${data.sticky_notes.length}`)
    } catch (error) {
      console.error('❌ Error fetching whiteboard:', error)
      process.exit(1)
    }
  })

whiteboardCmd
  .command('delete <id>')
  .description('Delete a whiteboard')
  .option('-f, --force', 'Force deletion without confirmation')
  .action(async (id, options) => {
    try {
      if (!options.force) {
        console.log(`⚠️  Are you sure you want to delete whiteboard ${id}?`)
        console.log('This action cannot be undone.')
        console.log('Use --force flag to skip confirmation.')
        return
      }

      console.log(`Deleting whiteboard ${id}...`)
      
      const { error } = await supabase
        .from('whiteboards')
        .delete()
        .eq('id', id)

      if (error) throw error

      console.log('✅ Whiteboard deleted successfully!')
    } catch (error) {
      console.error('❌ Error deleting whiteboard:', error)
      process.exit(1)
    }
  })

// Drawing commands
const drawingCmd = program
  .command('drawing')
  .description('Drawing management commands')

drawingCmd
  .command('add <whiteboardId>')
  .description('Add a drawing to whiteboard')
  .option('-t, --tool <tool>', 'Drawing tool (pen|brush|eraser)', 'pen')
  .option('-c, --color <color>', 'Drawing color', '#000000')
  .option('-s, --size <size>', 'Drawing size', '2')
  .option('-p, --points <points>', 'Drawing points as JSON array', '[]')
  .option('-u, --user <userId>', 'User ID', 'cli-user')
  .action(async (whiteboardId, options) => {
    try {
      console.log('Adding drawing...')
      
      const points = JSON.parse(options.points)
      if (!Array.isArray(points)) {
        throw new Error('Points must be a JSON array')
      }

      const drawingData = {
        whiteboardId,
        tool: options.tool as 'pen' | 'brush' | 'eraser',
        color: options.color,
        size: parseInt(options.size),
        points,
        userId: options.user
      }

      const { data, error } = await supabase
        .from('drawings')
        .insert(drawingData)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Drawing added successfully!')
      console.log(`ID: ${data.id}`)
      console.log(`Tool: ${data.tool}`)
      console.log(`Color: ${data.color}`)
      console.log(`Size: ${data.size}`)
      console.log(`Points: ${data.points.length}`)
    } catch (error) {
      console.error('❌ Error adding drawing:', error)
      process.exit(1)
    }
  })

// Sticky note commands
const stickyNoteCmd = program
  .command('sticky-note')
  .description('Sticky note management commands')

stickyNoteCmd
  .command('add <whiteboardId>')
  .description('Add a sticky note to whiteboard')
  .option('-c, --content <content>', 'Note content', 'New sticky note')
  .option('-x, --x <x>', 'X position', '100')
  .option('-y, --y <y>', 'Y position', '100')
  .option('-color, --color <color>', 'Note color', '#FFE066')
  .option('-u, --user <userId>', 'User ID', 'cli-user')
  .action(async (whiteboardId, options) => {
    try {
      console.log('Adding sticky note...')
      
      const stickyNoteData = {
        whiteboardId,
        content: options.content,
        position: {
          x: parseInt(options.x),
          y: parseInt(options.y)
        },
        color: options.color,
        userId: options.user
      }

      const { data, error } = await supabase
        .from('sticky_notes')
        .insert(stickyNoteData)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Sticky note added successfully!')
      console.log(`ID: ${data.id}`)
      console.log(`Content: ${data.content}`)
      console.log(`Position: (${data.position.x}, ${data.position.y})`)
      console.log(`Color: ${data.color}`)
    } catch (error) {
      console.error('❌ Error adding sticky note:', error)
      process.exit(1)
    }
  })

// Export commands
const exportCmd = program
  .command('export')
  .description('Export whiteboard data')

exportCmd
  .command('whiteboard <id>')
  .description('Export whiteboard to JSON')
  .option('-o, --output <file>', 'Output file path', 'whiteboard.json')
  .action(async (id, options) => {
    try {
      console.log(`Exporting whiteboard ${id}...`)
      
      const { data, error } = await supabase
        .from('whiteboards')
        .select(`
          *,
          drawings (*),
          sticky_notes (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      const fs = require('fs')
      fs.writeFileSync(options.output, JSON.stringify(data, null, 2))

      console.log('✅ Whiteboard exported successfully!')
      console.log(`File: ${options.output}`)
      console.log(`Drawings: ${data.drawings.length}`)
      console.log(`Sticky Notes: ${data.sticky_notes.length}`)
    } catch (error) {
      console.error('❌ Error exporting whiteboard:', error)
      process.exit(1)
    }
  })

// Stats commands
const statsCmd = program
  .command('stats')
  .description('Show whiteboard statistics')

statsCmd
  .command('whiteboard <id>')
  .description('Show whiteboard statistics')
  .action(async (id) => {
    try {
      console.log(`Fetching statistics for whiteboard ${id}...`)
      
      const { data, error } = await supabase
        .from('whiteboards')
        .select(`
          *,
          drawings (*),
          sticky_notes (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      const drawings = data.drawings || []
      const stickyNotes = data.sticky_notes || []

      // Calculate statistics
      const totalPoints = drawings.reduce((sum: number, drawing: any) => sum + drawing.points.length, 0)
      const avgPointsPerDrawing = drawings.length > 0 ? totalPoints / drawings.length : 0
      const totalContentLength = stickyNotes.reduce((sum: number, note: any) => sum + note.content.length, 0)
      const avgContentLength = stickyNotes.length > 0 ? totalContentLength / stickyNotes.length : 0

      console.log('\n📊 Whiteboard Statistics:')
      console.log(`Name: ${data.name}`)
      console.log(`Size: ${data.settings.width}x${data.settings.height}`)
      console.log(`Created: ${new Date(data.created_at).toLocaleString()}`)
      console.log(`Last Updated: ${new Date(data.updated_at).toLocaleString()}`)
      console.log('')
      console.log('Drawings:')
      console.log(`  Count: ${drawings.length}`)
      console.log(`  Total Points: ${totalPoints}`)
      console.log(`  Average Points per Drawing: ${avgPointsPerDrawing.toFixed(2)}`)
      console.log('')
      console.log('Sticky Notes:')
      console.log(`  Count: ${stickyNotes.length}`)
      console.log(`  Total Content Length: ${totalContentLength} characters`)
      console.log(`  Average Content Length: ${avgContentLength.toFixed(2)} characters`)
    } catch (error) {
      console.error('❌ Error fetching statistics:', error)
      process.exit(1)
    }
  })

// Parse command line arguments
program.parse()

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
