#!/usr/bin/env node
/**
 * Health Check Routes for AppointmentScheduler
 * 
 * This file provides health check endpoints for monitoring database
 * connectivity and application status.
 * 
 * Maps to TASK-004: Database Setup
 * TDD Phase: Contract
 * Constitutional Compliance: Integration-First Testing Gate, Performance Gate
 */

const express = require('express');
const { checkDatabaseHealth } = require('../config/database');

const router = express.Router();

// Basic health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AppointmentScheduler',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database health check endpoint
router.get('/database', async (req, res) => {
  try {
    const health = await checkDatabaseHealth();
    
    if (health.status === 'healthy') {
      res.status(200).json(health);
    } else {
      res.status(503).json(health);
    }
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      service: 'AppointmentScheduler Database'
    });
  }
});

// Detailed health check endpoint
router.get('/detailed', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    const health = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'AppointmentScheduler',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: dbHealth,
        memory: {
          used: process.memoryUsage(),
          uptime: process.uptime()
        },
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid
        }
      }
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      service: 'AppointmentScheduler'
    });
  }
});

// Readiness check endpoint (for Kubernetes/Docker)
router.get('/ready', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    if (dbHealth.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not available'
      });
    }
    
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      reason: error.message
    });
  }
});

// Liveness check endpoint (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
