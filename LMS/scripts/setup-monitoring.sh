#!/bin/bash

# LMS Monitoring Setup Script
# This script sets up comprehensive monitoring and alerting for the LMS application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_COMPOSE_FILE="docker-compose.monitoring.yml"
GRAFANA_ADMIN_PASSWORD="admin"
PROMETHEUS_PORT="9090"
GRAFANA_PORT="3001"
ALERTMANAGER_PORT="9093"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites for monitoring setup..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if main LMS application is running
    if ! docker ps | grep -q "lms-app"; then
        warning "LMS application is not running. Please start it first with: docker-compose -f docker-compose.prod.yml up -d"
    fi
    
    success "Prerequisites check completed"
}

# Create monitoring directories
create_directories() {
    log "Creating monitoring directories..."
    
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    mkdir -p monitoring/rules
    mkdir -p monitoring/exporters
    
    success "Monitoring directories created"
}

# Setup Prometheus configuration
setup_prometheus() {
    log "Setting up Prometheus configuration..."
    
    # Check if prometheus.yml exists
    if [ ! -f "monitoring/prometheus.yml" ]; then
        error "Prometheus configuration file not found. Please ensure monitoring/prometheus.yml exists."
    fi
    
    # Validate Prometheus configuration
    if docker run --rm -v "$(pwd)/monitoring:/etc/prometheus" prom/prometheus:latest promtool check config /etc/prometheus/prometheus.yml; then
        success "Prometheus configuration is valid"
    else
        error "Prometheus configuration is invalid"
    fi
}

# Setup AlertManager configuration
setup_alertmanager() {
    log "Setting up AlertManager configuration..."
    
    # Check if alertmanager.yml exists
    if [ ! -f "monitoring/alertmanager.yml" ]; then
        error "AlertManager configuration file not found. Please ensure monitoring/alertmanager.yml exists."
    fi
    
    # Validate AlertManager configuration
    if docker run --rm -v "$(pwd)/monitoring:/etc/alertmanager" prom/alertmanager:latest amtool check-config /etc/alertmanager/alertmanager.yml; then
        success "AlertManager configuration is valid"
    else
        error "AlertManager configuration is invalid"
    fi
}

# Setup Grafana dashboards
setup_grafana() {
    log "Setting up Grafana dashboards..."
    
    # Check if dashboard files exist
    if [ ! -f "monitoring/grafana/dashboards/lms-application.json" ]; then
        warning "LMS application dashboard not found. Creating default dashboard..."
        # Create a basic dashboard if none exists
        cat > monitoring/grafana/dashboards/lms-application.json << 'EOF'
{
  "dashboard": {
    "title": "LMS Application Dashboard",
    "panels": [
      {
        "title": "Application Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"lms-app\"}",
            "legendFormat": "Application Status"
          }
        ]
      }
    ]
  }
}
EOF
    fi
    
    success "Grafana dashboards configured"
}

# Start monitoring services
start_monitoring() {
    log "Starting monitoring services..."
    
    # Start monitoring stack
    docker-compose -f "$MONITORING_COMPOSE_FILE" up -d
    
    success "Monitoring services started"
}

# Wait for services to be ready
wait_for_services() {
    log "Waiting for monitoring services to be ready..."
    
    # Wait for Prometheus
    log "Waiting for Prometheus..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:$PROMETHEUS_PORT/-/healthy &> /dev/null; then
            success "Prometheus is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        error "Prometheus failed to start within 60 seconds"
    fi
    
    # Wait for Grafana
    log "Waiting for Grafana..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:$GRAFANA_PORT/api/health &> /dev/null; then
            success "Grafana is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        error "Grafana failed to start within 60 seconds"
    fi
    
    # Wait for AlertManager
    log "Waiting for AlertManager..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:$ALERTMANAGER_PORT/-/healthy &> /dev/null; then
            success "AlertManager is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        error "AlertManager failed to start within 60 seconds"
    fi
}

# Configure Grafana datasources
configure_grafana() {
    log "Configuring Grafana datasources..."
    
    # Wait a bit for Grafana to be fully ready
    sleep 10
    
    # Add Prometheus datasource
    curl -X POST \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Prometheus",
        "type": "prometheus",
        "url": "http://prometheus:9090",
        "access": "proxy",
        "isDefault": true
      }' \
      http://admin:$GRAFANA_ADMIN_PASSWORD@localhost:$GRAFANA_PORT/api/datasources
    
    success "Grafana datasources configured"
}

# Import Grafana dashboards
import_dashboards() {
    log "Importing Grafana dashboards..."
    
    # Import LMS application dashboard
    if [ -f "monitoring/grafana/dashboards/lms-application.json" ]; then
        curl -X POST \
          -H "Content-Type: application/json" \
          -d @monitoring/grafana/dashboards/lms-application.json \
          http://admin:$GRAFANA_ADMIN_PASSWORD@localhost:$GRAFANA_PORT/api/dashboards/db
        
        success "LMS application dashboard imported"
    fi
}

# Run health checks
health_check() {
    log "Running monitoring health checks..."
    
    # Check Prometheus
    if curl -f http://localhost:$PROMETHEUS_PORT/-/healthy; then
        success "Prometheus health check passed"
    else
        error "Prometheus health check failed"
    fi
    
    # Check Grafana
    if curl -f http://localhost:$GRAFANA_PORT/api/health; then
        success "Grafana health check passed"
    else
        error "Grafana health check failed"
    fi
    
    # Check AlertManager
    if curl -f http://localhost:$ALERTMANAGER_PORT/-/healthy; then
        success "AlertManager health check passed"
    else
        error "AlertManager health check failed"
    fi
}

# Show monitoring status
show_status() {
    log "Monitoring Setup Status:"
    echo ""
    echo "Services:"
    docker-compose -f "$MONITORING_COMPOSE_FILE" ps
    echo ""
    echo "Access URLs:"
    echo "  Prometheus: http://localhost:$PROMETHEUS_PORT"
    echo "  Grafana: http://localhost:$GRAFANA_PORT (admin/$GRAFANA_ADMIN_PASSWORD)"
    echo "  AlertManager: http://localhost:$ALERTMANAGER_PORT"
    echo ""
    echo "Key Metrics Endpoints:"
    echo "  LMS App Metrics: http://localhost:3000/api/metrics"
    echo "  Node Exporter: http://localhost:9100/metrics"
    echo "  PostgreSQL Exporter: http://localhost:9187/metrics"
    echo "  Redis Exporter: http://localhost:9121/metrics"
    echo ""
    echo "Monitoring Commands:"
    echo "  View logs: docker-compose -f $MONITORING_COMPOSE_FILE logs -f"
    echo "  Restart services: docker-compose -f $MONITORING_COMPOSE_FILE restart"
    echo "  Stop services: docker-compose -f $MONITORING_COMPOSE_FILE down"
    echo ""
    echo "Alert Testing:"
    echo "  Test alert: curl -X POST http://localhost:$ALERTMANAGER_PORT/api/v1/alerts"
    echo ""
}

# Setup alerting rules
setup_alerting_rules() {
    log "Setting up alerting rules..."
    
    # Check if alerting rules exist
    if [ ! -f "monitoring/rules/lms-alerts.yml" ]; then
        warning "Alerting rules not found. Please ensure monitoring/rules/lms-alerts.yml exists."
    else
        success "Alerting rules configured"
    fi
}

# Main setup function
main() {
    log "Starting LMS Monitoring Setup"
    log "============================="
    
    # Parse command line arguments
    case "${1:-setup}" in
        "setup")
            check_prerequisites
            create_directories
            setup_prometheus
            setup_alertmanager
            setup_grafana
            setup_alerting_rules
            start_monitoring
            wait_for_services
            configure_grafana
            import_dashboards
            health_check
            show_status
            success "Monitoring setup completed successfully!"
            ;;
        "start")
            start_monitoring
            wait_for_services
            ;;
        "stop")
            log "Stopping monitoring services..."
            docker-compose -f "$MONITORING_COMPOSE_FILE" down
            success "Monitoring services stopped"
            ;;
        "restart")
            log "Restarting monitoring services..."
            docker-compose -f "$MONITORING_COMPOSE_FILE" restart
            wait_for_services
            success "Monitoring services restarted"
            ;;
        "status")
            show_status
            ;;
        "health")
            health_check
            ;;
        "logs")
            docker-compose -f "$MONITORING_COMPOSE_FILE" logs -f
            ;;
        *)
            echo "Usage: $0 {setup|start|stop|restart|status|health|logs}"
            echo ""
            echo "Commands:"
            echo "  setup   - Full monitoring setup (default)"
            echo "  start   - Start monitoring services"
            echo "  stop    - Stop monitoring services"
            echo "  restart - Restart monitoring services"
            echo "  status  - Show monitoring status"
            echo "  health  - Run health checks"
            echo "  logs    - View monitoring logs"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
