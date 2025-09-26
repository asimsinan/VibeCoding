#!/usr/bin/env node
/**
 * Appointment Core CLI Interface
 * 
 * Command-line interface for the appointment-core library:
 * - Calendar view generation
 * - Appointment booking and management
 * - Availability checking
 * - JSON mode support for programmatic access
 * 
 * Maps to TASK-010: Create CLI Interface
 * TDD Phase: Implementation
 * Constitutional Compliance: CLI Interface Gate, Library-First Gate
 */

const { Command } = require('commander');
const chalk = require('chalk');
const { appointmentCore } = require('../index');

class AppointmentCLI {
  constructor() {
    this.program = new Command();
    this.jsonMode = false;
    this.setupCommands();
  }

  /**
   * Setup CLI commands
   */
  setupCommands() {
    this.program
      .name('appointment-core')
      .description('Appointment scheduling and management CLI')
      .version(require('../../package.json').version)
      .option('-j, --json', 'Output in JSON format')
      .option('-v, --verbose', 'Verbose output')
      .hook('preAction', (thisCommand) => {
        this.jsonMode = thisCommand.opts().json;
      });

    // Calendar command
    this.program
      .command('calendar <year> <month>')
      .description('Generate calendar view for a specific month')
      .option('-t, --timezone <timezone>', 'Timezone (default: UTC)', 'UTC')
      .option('-d, --duration <minutes>', 'Slot duration in minutes (default: 60)', '60')
      .action(async (year, month, options) => {
        await this.handleCalendarCommand(year, month, options);
      });

    // Book command
    this.program
      .command('book <startTime> <endTime> <email> <name>')
      .description('Book a new appointment')
      .option('-n, --notes <notes>', 'Appointment notes')
      .action(async (startTime, endTime, email, name, options) => {
        await this.handleBookCommand(startTime, endTime, email, name, options);
      });

    // List command
    this.program
      .command('list')
      .description('List appointments')
      .option('-s, --status <status>', 'Filter by status (confirmed, pending, cancelled)')
      .option('-e, --email <email>', 'Filter by user email')
      .option('-l, --limit <number>', 'Limit number of results', '10')
      .action(async (options) => {
        await this.handleListCommand(options);
      });

    // Get command
    this.program
      .command('get <id>')
      .description('Get appointment by ID')
      .action(async (id) => {
        await this.handleGetCommand(id);
      });

    // Update command
    this.program
      .command('update <id>')
      .description('Update an appointment')
      .option('-s, --start-time <time>', 'New start time')
      .option('-e, --end-time <time>', 'New end time')
      .option('-m, --email <email>', 'New user email')
      .option('-n, --name <name>', 'New user name')
      .option('-o, --notes <notes>', 'New notes')
      .option('-t, --status <status>', 'New status')
      .action(async (id, options) => {
        await this.handleUpdateCommand(id, options);
      });

    // Cancel command
    this.program
      .command('cancel <id>')
      .description('Cancel an appointment')
      .action(async (id) => {
        await this.handleCancelCommand(id);
      });

    // Availability command
    this.program
      .command('availability <startTime> <endTime>')
      .description('Check availability for a time range')
      .option('-e, --exclude <id>', 'Exclude appointment ID from conflict check')
      .action(async (startTime, endTime, options) => {
        await this.handleAvailabilityCommand(startTime, endTime, options);
      });

    // Stats command
    this.program
      .command('stats')
      .description('Get appointment statistics')
      .option('-s, --start-date <date>', 'Start date (YYYY-MM-DD)')
      .option('-e, --end-date <date>', 'End date (YYYY-MM-DD)')
      .action(async (options) => {
        await this.handleStatsCommand(options);
      });

    // Health command
    this.program
      .command('health')
      .description('Check system health')
      .action(async () => {
        await this.handleHealthCommand();
      });
  }

  /**
   * Handle calendar command
   */
  async handleCalendarCommand(year, month, options) {
    try {
      await appointmentCore.initialize();
      
      const calendarService = appointmentCore.getCalendarService();
      const calendar = await calendarService.generateCalendar(
        parseInt(year),
        parseInt(month),
        options.timezone,
        parseInt(options.duration)
      );

      if (this.jsonMode) {
        this.outputJson(calendar);
      } else {
        this.outputCalendar(calendar);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle book command
   */
  async handleBookCommand(startTime, endTime, email, name, options) {
    try {
      await appointmentCore.initialize();
      
      const appointmentService = appointmentCore.getAppointmentService();
      const appointment = await appointmentService.createAppointment({
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        userEmail: email,
        userName: name,
        notes: options.notes || ''
      });

      if (this.jsonMode) {
        this.outputJson(appointment);
      } else {
        this.outputSuccess(`Appointment booked successfully: ${appointment.id}`);
        this.outputAppointment(appointment);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle list command
   */
  async handleListCommand(options) {
    try {
      await appointmentCore.initialize();
      
      const appointmentService = appointmentCore.getAppointmentService();
      const filters = {};
      
      if (options.status) filters.status = options.status;
      if (options.email) filters.userEmail = options.email;
      if (options.limit) filters.limit = parseInt(options.limit);
      
      const appointments = await appointmentService.listAppointments(filters);

      if (this.jsonMode) {
        this.outputJson(appointments);
      } else {
        this.outputAppointments(appointments);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle get command
   */
  async handleGetCommand(id) {
    try {
      await appointmentCore.initialize();
      
      const appointmentService = appointmentCore.getAppointmentService();
      const appointment = await appointmentService.getAppointment(id);

      if (this.jsonMode) {
        this.outputJson(appointment);
      } else {
        this.outputAppointment(appointment);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle update command
   */
  async handleUpdateCommand(id, options) {
    try {
      await appointmentCore.initialize();
      
      const appointmentService = appointmentCore.getAppointmentService();
      const updateData = {};
      
      if (options.startTime) updateData.startTime = new Date(options.startTime);
      if (options.endTime) updateData.endTime = new Date(options.endTime);
      if (options.email) updateData.userEmail = options.email;
      if (options.name) updateData.userName = options.name;
      if (options.notes) updateData.notes = options.notes;
      if (options.status) updateData.status = options.status;
      
      const appointment = await appointmentService.updateAppointment(id, updateData);

      if (this.jsonMode) {
        this.outputJson(appointment);
      } else {
        this.outputSuccess(`Appointment updated successfully: ${appointment.id}`);
        this.outputAppointment(appointment);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle cancel command
   */
  async handleCancelCommand(id) {
    try {
      await appointmentCore.initialize();
      
      const appointmentService = appointmentCore.getAppointmentService();
      const appointment = await appointmentService.cancelAppointment(id);

      if (this.jsonMode) {
        this.outputJson(appointment);
      } else {
        this.outputSuccess(`Appointment cancelled successfully: ${appointment.id}`);
        this.outputAppointment(appointment);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle availability command
   */
  async handleAvailabilityCommand(startTime, endTime, options) {
    try {
      await appointmentCore.initialize();
      
      const timeSlotService = appointmentCore.getTimeSlotService();
      const availability = await timeSlotService.checkAvailability(
        new Date(startTime),
        new Date(endTime),
        options.exclude
      );

      if (this.jsonMode) {
        this.outputJson(availability);
      } else {
        this.outputAvailability(availability);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle stats command
   */
  async handleStatsCommand(options) {
    try {
      await appointmentCore.initialize();
      
      const calendarService = appointmentCore.getCalendarService();
      const startDate = options.startDate ? new Date(options.startDate) : new Date();
      const endDate = options.endDate ? new Date(options.endDate) : new Date();
      
      const stats = await calendarService.getAppointmentStats(startDate, endDate);

      if (this.jsonMode) {
        this.outputJson(stats);
      } else {
        this.outputStats(stats);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle health command
   */
  async handleHealthCommand() {
    try {
      await appointmentCore.initialize();
      const health = await appointmentCore.healthCheck();

      if (this.jsonMode) {
        this.outputJson(health);
      } else {
        this.outputHealth(health);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Output JSON data
   */
  outputJson(data) {
    console.log(JSON.stringify(data, null, 2));
  }

  /**
   * Output calendar
   */
  outputCalendar(calendar) {
    console.log(chalk.blue.bold(`\nCalendar: ${calendar.monthName} ${calendar.year}`));
    console.log(chalk.gray(`Timezone: ${calendar.timezone}`));
    console.log(chalk.gray(`Business Hours: ${calendar.businessHours.start}:00 - ${calendar.businessHours.end}:00`));
    console.log(chalk.gray(`Total Appointments: ${calendar.stats.totalAppointments}`));
    console.log(chalk.gray(`Utilization Rate: ${(calendar.stats.utilizationRate * 100).toFixed(1)}%`));
    
    console.log('\nDays with appointments:');
    calendar.days.forEach(day => {
      if (day.appointments.length > 0) {
        console.log(chalk.green(`  ${day.date}: ${day.appointments.length} appointments`));
      }
    });
  }

  /**
   * Output appointment
   */
  outputAppointment(appointment) {
    console.log(chalk.blue.bold('\nAppointment Details:'));
    console.log(`ID: ${appointment.id}`);
    console.log(`Start Time: ${appointment.startTime.toISOString()}`);
    console.log(`End Time: ${appointment.endTime.toISOString()}`);
    console.log(`User: ${appointment.userName} (${appointment.userEmail})`);
    console.log(`Status: ${appointment.status}`);
    if (appointment.notes) {
      console.log(`Notes: ${appointment.notes}`);
    }
  }

  /**
   * Output appointments list
   */
  outputAppointments(appointments) {
    if (appointments.length === 0) {
      console.log(chalk.yellow('No appointments found.'));
      return;
    }

    console.log(chalk.blue.bold(`\nAppointments (${appointments.length}):`));
    appointments.forEach(appointment => {
      console.log(chalk.green(`  ${appointment.id}: ${appointment.startTime.toISOString()} - ${appointment.userName} (${appointment.status})`));
    });
  }

  /**
   * Output availability
   */
  outputAvailability(availability) {
    console.log(chalk.blue.bold('\nAvailability Check:'));
    console.log(`Available: ${availability.isAvailable ? chalk.green('Yes') : chalk.red('No')}`);
    
    if (availability.conflictingAppointments.length > 0) {
      console.log(chalk.red(`Conflicting Appointments: ${availability.conflictingAppointments.join(', ')}`));
    }
    
    if (availability.availableSlots.length > 0) {
      console.log(chalk.green(`Available Slots: ${availability.availableSlots.length}`));
    }
  }

  /**
   * Output statistics
   */
  outputStats(stats) {
    console.log(chalk.blue.bold('\nAppointment Statistics:'));
    console.log(`Total: ${stats.totalAppointments}`);
    console.log(`Confirmed: ${stats.confirmedAppointments}`);
    console.log(`Pending: ${stats.pendingAppointments}`);
    console.log(`Cancelled: ${stats.cancelledAppointments}`);
    console.log(`Average Duration: ${stats.averageDuration} minutes`);
    
    if (stats.popularHours.length > 0) {
      console.log('\nPopular Hours:');
      stats.popularHours.forEach(hour => {
        console.log(`  ${hour.hour}:00 - ${hour.count} appointments (${hour.percentage}%)`);
      });
    }
  }

  /**
   * Output health status
   */
  outputHealth(health) {
    console.log(chalk.blue.bold('\nSystem Health:'));
    console.log(`Status: ${health.healthy ? chalk.green('Healthy') : chalk.red('Unhealthy')}`);
    
    if (health.database) {
      console.log(`Database: ${health.database.healthy ? chalk.green('Connected') : chalk.red('Disconnected')}`);
      if (health.database.responseTime) {
        console.log(`Response Time: ${health.database.responseTime}ms`);
      }
    }
    
    console.log(`Services: ${health.services.join(', ')}`);
  }

  /**
   * Output success message
   */
  outputSuccess(message) {
    console.log(chalk.green(`✓ ${message}`));
  }

  /**
   * Handle errors
   */
  handleError(error) {
    if (this.jsonMode) {
      console.error(JSON.stringify({
        error: true,
        message: error.message,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      console.error(chalk.red(`✗ Error: ${error.message}`));
    }
    process.exit(1);
  }

  /**
   * Run the CLI
   */
  async run() {
    try {
      await this.program.parseAsync();
    } catch (error) {
      this.handleError(error);
    } finally {
      // Cleanup
      try {
        await appointmentCore.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new AppointmentCLI();
  cli.run().catch(error => {
    console.error(chalk.red(`Fatal error: ${error.message}`));
    process.exit(1);
  });
}

module.exports = AppointmentCLI;
