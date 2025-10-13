# LMS Monitoring and Alerting Configuration

This directory contains comprehensive monitoring and alerting configurations for the LMS production environment.

## Components

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert routing and notification
- **Node Exporter**: System metrics
- **PostgreSQL Exporter**: Database metrics
- **Redis Exporter**: Cache metrics
- **Nginx Exporter**: Web server metrics

## Quick Start

1. **Start monitoring stack**:
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **Access dashboards**:
   - Grafana: http://localhost:3001 (admin/admin)
   - Prometheus: http://localhost:9090
   - AlertManager: http://localhost:9093

3. **Import dashboards**:
   - LMS Application Dashboard
   - Infrastructure Dashboard
   - Database Performance Dashboard

## Configuration Files

- `prometheus.yml`: Prometheus configuration
- `alertmanager.yml`: Alert routing configuration
- `grafana/`: Grafana dashboards and datasources
- `rules/`: Prometheus alerting rules
- `exporters/`: Custom metric exporters

## Alerting Rules

### Critical Alerts
- Application down
- Database connection failures
- High error rates
- Disk space critical

### Warning Alerts
- High CPU usage
- High memory usage
- Slow response times
- Cache hit rate low

### Info Alerts
- Deployment notifications
- Certificate expiration warnings
- Backup completion notifications

## Monitoring Metrics

### Application Metrics
- Request rate and duration
- Error rates by endpoint
- Active users and sessions
- Database query performance

### Infrastructure Metrics
- CPU, memory, disk usage
- Network I/O
- Container health
- Service availability

### Business Metrics
- User registrations
- Course enrollments
- Quiz completions
- File uploads

## Integration

### Notification Channels
- Email notifications
- Slack integration
- PagerDuty alerts
- Webhook endpoints

### External Services
- AWS CloudWatch
- DataDog integration
- New Relic monitoring
- Custom webhook endpoints
