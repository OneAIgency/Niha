# Settlement System Deployment Checklist

Complete checklist for deploying the T+3 Settlement System to production safely.

**Last Updated:** 2026-01-25
**Version:** 1.0.0
**Status:** Production Ready

---

## Prerequisites

### Database Requirements
- [ ] PostgreSQL 15+ running
- [ ] Database user `niha_user` has necessary permissions
- [ ] `settlement_batches` table exists
- [ ] `settlement_status_history` table exists
- [ ] Verify schema with: `\d settlement_batches` in psql

### Environment Variables
- [ ] `DATABASE_URL` configured
- [ ] `REDIS_URL` configured (for sessions)
- [ ] `RESEND_API_KEY` configured (for email notifications)
- [ ] `RESEND_FROM_EMAIL` configured
- [ ] `ENVIRONMENT=production` set
- [ ] `CORS_ORIGINS` configured with frontend URL

### External Dependencies
- [ ] Email service (Resend) API key validated
- [ ] Test email delivery works
- [ ] Admin email addresses configured

---

## Pre-Deployment Verification

### 1. Database Schema Validation

```bash
# Connect to production database
psql $DATABASE_URL

# Verify settlement tables exist
\d settlement_batches
\d settlement_status_history

# Check indexes
\di settlement*

# Expected indexes:
# - settlement_batches_pkey (id)
# - settlement_batches_batch_reference_idx (batch_reference)
# - settlement_batches_entity_id_idx (entity_id)
# - settlement_batches_status_idx (status)
# - settlement_status_history_pkey (id)
# - settlement_status_history_settlement_batch_id_idx
```

### 2. Model Validation

```bash
# In backend container
python3 -c "
from app.models.models import SettlementBatch, SettlementStatusHistory
print('✅ Settlement models imported successfully')
"
```

### 3. Service Validation

```bash
# Test settlement service
python3 -c "
from app.services.settlement_service import SettlementService
from datetime import datetime
# Test business days calculation
result = SettlementService.calculate_business_days(datetime(2026, 1, 23), 3)
print(f'✅ Business days calculation works: {result}')
"
```

### 4. API Endpoint Validation

```bash
# Test settlement endpoints (requires running server)
curl -X GET http://localhost:8000/api/v1/settlement/pending \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with {"data": [], "count": 0}
```

---

## Deployment Steps

### Step 1: Code Deployment

```bash
# Pull latest code
git pull origin main

# Verify settlement system files exist
ls -la backend/app/services/settlement*.py
ls -la backend/app/api/v1/settlement.py

# Install/update dependencies
cd backend
pip install -r requirements.txt
```

### Step 2: Database Migration

```bash
# Run Alembic migrations
cd backend
alembic upgrade head

# Verify migration applied
alembic current

# Verify tables
python3 -c "
from app.core.database import AsyncSessionLocal
from sqlalchemy import text
import asyncio

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text('SELECT COUNT(*) FROM settlement_batches'))
        print(f'✅ settlement_batches accessible: {result.scalar()} rows')
        result = await db.execute(text('SELECT COUNT(*) FROM settlement_status_history'))
        print(f'✅ settlement_status_history accessible: {result.scalar()} rows')

asyncio.run(check())
"
```

### Step 3: Service Configuration

```bash
# Restart backend service
docker-compose restart backend

# Check logs for settlement processor startup
docker-compose logs backend | grep -i settlement

# Expected output:
# "Settlement processor started (running every 1 hour)"
# "Settlement processor and monitoring started"
```

### Step 4: Verify Background Tasks

```bash
# Check background tasks are running
docker-compose logs backend | tail -100 | grep -E "(processor|monitoring)"

# Should see hourly logs like:
# "Settlement monitoring cycle completed: 0 alerts detected"
# "Settlement processor executed successfully"
```

### Step 5: Email Notification Test

```bash
# Test email delivery
python3 -c "
from app.services.email_service import EmailService
import asyncio

async def test():
    service = EmailService()
    result = await service._send_email(
        to_email='admin@test.com',
        subject='Settlement Test',
        html_content='<p>Test email</p>'
    )
    print(f'✅ Email sent: {result}')

asyncio.run(test())
"
```

---

## Post-Deployment Validation

### Critical Tests (Run Immediately)

#### 1. Create Test Settlement

```python
# In backend container Python shell
from app.core.database import AsyncSessionLocal
from app.services.settlement_service import SettlementService
from app.models.models import Entity, User
from decimal import Decimal
import asyncio

async def test():
    async with AsyncSessionLocal() as db:
        # Get or create test entity
        entity = await db.execute(
            "SELECT * FROM entities WHERE name = 'Test Entity' LIMIT 1"
        )
        entity = entity.first()

        if not entity:
            print("⚠️  Create test entity first")
            return

        # Create test settlement
        settlement = await SettlementService.create_cea_purchase_settlement(
            db=db,
            entity_id=entity.id,
            order_id=None,
            trade_id=None,
            quantity=Decimal("100"),
            price=Decimal("13.50"),
            seller_id=None,
            created_by=entity.created_by
        )

        print(f"✅ Test settlement created: {settlement.batch_reference}")
        print(f"   Status: {settlement.status}")
        print(f"   Expected date: {settlement.expected_settlement_date}")

asyncio.run(test())
```

#### 2. Verify Settlement Progression

```bash
# Wait 5 seconds then check if processor advances it
sleep 5

# Check settlement status
python3 -c "
from app.core.database import AsyncSessionLocal
from sqlalchemy import select
from app.models.models import SettlementBatch
import asyncio

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(SettlementBatch).order_by(
                SettlementBatch.created_at.desc()
            ).limit(1)
        )
        settlement = result.scalar()
        print(f'Latest settlement: {settlement.batch_reference}')
        print(f'Status: {settlement.status}')
        print(f'History entries: {len(settlement.status_history)}')

asyncio.run(check())
"
```

#### 3. Test API Endpoints

```bash
# Get admin token
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"adminpass"}' | jq -r '.access_token')

# Test pending settlements
curl -X GET http://localhost:8000/api/v1/settlement/pending \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test monitoring metrics (admin only)
curl -X GET http://localhost:8000/api/v1/settlement/monitoring/metrics \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test alerts
curl -X GET http://localhost:8000/api/v1/settlement/monitoring/alerts \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### 4. Verify Monitoring System

```bash
# Check monitoring metrics
curl -X GET http://localhost:8000/api/v1/settlement/monitoring/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Expected fields:
# - total_pending
# - total_in_progress
# - total_settled_today
# - total_failed
# - total_overdue
```

#### 5. Test Email Alerts

```python
# Create overdue settlement to trigger alert
from app.core.database import AsyncSessionLocal
from app.services.settlement_service import SettlementService
from app.services.settlement_monitoring import SettlementMonitoring
from datetime import datetime, timedelta
import asyncio

async def test_alerts():
    async with AsyncSessionLocal() as db:
        # Get test settlement
        settlement = await db.execute("SELECT * FROM settlement_batches ORDER BY created_at DESC LIMIT 1")
        settlement = settlement.first()

        # Make it overdue
        settlement.expected_settlement_date = datetime.utcnow() - timedelta(days=4)
        await db.commit()

        # Run monitoring
        alerts = await SettlementMonitoring.detect_alerts(db)
        print(f"✅ Detected {len(alerts)} alerts")

        # Trigger email send
        await SettlementMonitoring.send_alert_emails(db, alerts)
        print("✅ Alert emails sent")

asyncio.run(test_alerts())
```

---

## Monitoring Setup

### Health Checks

Add these to your monitoring system (Grafana, Datadog, etc.):

#### API Endpoint Health

```bash
# Every 5 minutes
curl -f http://localhost:8000/api/v1/settlement/monitoring/metrics \
  -H "Authorization: Bearer $MONITORING_TOKEN" || exit 1
```

#### Settlement Processor Health

```bash
# Check logs for recent activity (last 2 hours)
docker-compose logs --since 2h backend | grep "Settlement processor" | tail -1
```

#### Alert Monitoring

```bash
# Check for critical alerts every 15 minutes
CRITICAL_COUNT=$(curl -s http://localhost:8000/api/v1/settlement/monitoring/alerts \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.critical_count')

if [ "$CRITICAL_COUNT" -gt 0 ]; then
  echo "⚠️  CRITICAL: $CRITICAL_COUNT settlement alerts!"
  exit 1
fi
```

### Metrics to Track

1. **Settlement Counts**
   - Total pending
   - Total in progress
   - Daily settled count
   - Failed settlements

2. **Performance**
   - Average settlement time (target: <72 hours for T+3)
   - Overdue settlement percentage (target: <5%)
   - Processor execution time

3. **Value Metrics**
   - Total value pending (EUR)
   - Daily settled value (EUR)

4. **Alert Metrics**
   - Critical alerts count (target: 0)
   - Error alerts count (target: <3)
   - Warning alerts count

---

## Rollback Procedure

If issues occur after deployment:

### Emergency Rollback

```bash
# 1. Stop processing
docker-compose stop backend

# 2. Revert code
git revert HEAD
git push

# 3. Rollback database (if migration applied)
cd backend
alembic downgrade -1

# 4. Restart with previous version
docker-compose up -d backend

# 5. Verify system is stable
docker-compose logs backend | tail -100
```

### Data Recovery

```sql
-- If settlements were incorrectly processed

-- 1. Find affected settlements
SELECT id, batch_reference, status, updated_at
FROM settlement_batches
WHERE updated_at > '2026-01-25 00:00:00'  -- Deployment time
ORDER BY updated_at DESC;

-- 2. Revert status if needed (only if safe)
UPDATE settlement_batches
SET status = 'PENDING',
    updated_at = now()
WHERE id = '<settlement_id>';

-- 3. Add corrective history entry
INSERT INTO settlement_status_history (
    settlement_batch_id,
    status,
    notes,
    updated_by,
    created_at
) VALUES (
    '<settlement_id>',
    'PENDING',
    'Reverted due to deployment issue - manual review required',
    '<admin_user_id>',
    now()
);
```

---

## Production Configuration

### Recommended Settings

```bash
# .env for production
ENVIRONMENT=production

# Settlement processor
SETTLEMENT_PROCESSOR_INTERVAL_HOURS=1  # Run every hour
SETTLEMENT_MONITORING_INTERVAL_HOURS=1  # Monitor every hour

# Alert thresholds
SETTLEMENT_OVERDUE_WARNING_DAYS=1
SETTLEMENT_OVERDUE_CRITICAL_DAYS=3
SETTLEMENT_STUCK_STATUS_HOURS=48

# Email configuration
RESEND_API_KEY=<production_key>
RESEND_FROM_EMAIL=notifications@nihagroup.com
ADMIN_ALERT_EMAILS=admin@nihagroup.com,ops@nihagroup.com
```

### Background Task Tuning

```python
# In main.py lifespan function

# Production intervals
SETTLEMENT_PROCESSOR_INTERVAL = 3600  # 1 hour
SETTLEMENT_MONITORING_INTERVAL = 3600  # 1 hour

# For high-volume scenarios, reduce intervals:
# SETTLEMENT_PROCESSOR_INTERVAL = 1800  # 30 minutes
# SETTLEMENT_MONITORING_INTERVAL = 900  # 15 minutes
```

---

## Troubleshooting

### Issue: Settlement Not Progressing

**Symptoms:**
- Settlement stuck in PENDING for >24 hours
- No status updates in history

**Diagnosis:**
```bash
# Check processor logs
docker-compose logs backend | grep "settlement.*process"

# Check settlement details
psql $DATABASE_URL -c "
SELECT id, batch_reference, status, expected_settlement_date,
       created_at, updated_at
FROM settlement_batches
WHERE status NOT IN ('SETTLED', 'FAILED')
ORDER BY created_at DESC
LIMIT 10;"
```

**Resolution:**
1. Verify background task is running
2. Check expected_settlement_date hasn't passed
3. Manually advance if needed:
   ```python
   await SettlementService.update_settlement_status(
       db, settlement_id, SettlementStatus.TRANSFER_INITIATED,
       "Manual advancement", admin_user_id
   )
   ```

### Issue: Email Alerts Not Sending

**Symptoms:**
- Critical alerts detected but no emails received

**Diagnosis:**
```bash
# Check Resend API key
echo $RESEND_API_KEY

# Test email directly
python3 -c "from app.services.email_service import EmailService; import asyncio; asyncio.run(EmailService()._send_email('test@example.com', 'Test', '<p>Test</p>'))"
```

**Resolution:**
1. Verify RESEND_API_KEY is valid
2. Check admin users exist: `SELECT * FROM users WHERE role = 'ADMIN';`
3. Check email service logs: `docker-compose logs backend | grep -i email`

### Issue: High Memory Usage

**Symptoms:**
- Backend container using >2GB RAM
- OOM kills

**Diagnosis:**
```bash
# Check container memory
docker stats backend

# Check active settlements
psql $DATABASE_URL -c "SELECT COUNT(*) FROM settlement_batches WHERE status NOT IN ('SETTLED', 'FAILED');"
```

**Resolution:**
1. Add pagination to settlement queries
2. Limit monitoring query ranges
3. Increase container memory limit
4. Archive old settled settlements

---

## Performance Benchmarks

Expected performance on production hardware:

- **Settlement Creation:** <100ms per settlement
- **Status Update:** <50ms per update
- **Processor Cycle:** <5 seconds for 100 settlements
- **Monitoring Cycle:** <10 seconds for 1000 settlements
- **API Response Time:** <200ms for /pending, <100ms for metrics

---

## Security Checklist

- [ ] Settlement API endpoints require authentication
- [ ] Monitoring endpoints require ADMIN role
- [ ] Entity isolation enforced (users only see own settlements)
- [ ] SQL injection prevention (using ORM)
- [ ] Email alerts don't expose sensitive data
- [ ] Background tasks use system user for updates
- [ ] Rate limiting configured for API endpoints

---

## Success Criteria

Deployment is successful when:

✅ All database tables exist with correct schema
✅ Settlement processor running and logging hourly
✅ Monitoring system detecting metrics correctly
✅ Test settlement created and progressing
✅ API endpoints responding correctly
✅ Email notifications being sent
✅ No critical alerts in monitoring
✅ Background tasks visible in logs
✅ Zero errors in last 100 log lines
✅ Admin can view metrics dashboard

---

## Support Contacts

**Development Team:**
- Lead Developer: [contact info]
- DevOps: [contact info]

**Escalation:**
- Critical issues: [on-call rotation]
- After hours: [emergency contact]

**Documentation:**
- Settlement Service: `backend/app/services/settlement_service.py`
- Settlement Processor: `backend/app/services/settlement_processor.py`
- Settlement Monitoring: `backend/app/services/settlement_monitoring.py`
- API Endpoints: `backend/app/api/v1/settlement.py`
- Models: `backend/app/models/models.py` (line 470+)

---

## Maintenance Schedule

**Daily:**
- Review monitoring metrics
- Check for critical alerts
- Verify email deliveries

**Weekly:**
- Review settlement completion rate
- Check average settlement time
- Analyze failed settlements
- Review alert history

**Monthly:**
- Archive old settlements (SETTLED >90 days)
- Performance optimization review
- Update documentation
- Security review

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-25
**Next Review:** 2026-02-25
