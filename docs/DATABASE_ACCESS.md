# Database Access Guide

**Version:** 1.1  
**Last Updated:** 2026-01-25

This guide explains how to access the Nihao Carbon database to view orders, transactions, users, and other data.

## Connection Pooling

The database uses **QueuePool** for optimal performance:
- **Pool Size:** 10 connections
- **Max Overflow:** 20 additional connections
- **Pre-ping:** Enabled (handles stale connections)

This configuration supports up to 30 concurrent database connections and automatically handles connection health checks.

**See:** [Database Configuration](./architecture/database-configuration.md) for details.

## Database Connection Details

### Docker Environment
- **Host**: `localhost` (from your machine) or `db` (from within Docker network)
- **Port**: `5433` (mapped from container port 5432)
- **Database**: `niha_carbon`
- **User**: `niha_user`
- **Password**: `niha_secure_pass_2024`

### Connection String
```
postgresql://niha_user:niha_secure_pass_2024@localhost:5433/niha_carbon
```

## Access Methods

### 1. Using Docker Exec (Quick Access)

Connect directly to the database container:

```bash
# Interactive psql session
docker exec -it niha_db psql -U niha_user -d niha_carbon

# Execute a single query
docker exec niha_db psql -U niha_user -d niha_carbon -c "SELECT * FROM users LIMIT 5;"

# List all tables
docker exec niha_db psql -U niha_user -d niha_carbon -c "\dt"

# Count rows in a table
docker exec niha_db psql -U niha_user -d niha_carbon -c "SELECT COUNT(*) FROM orders;"
```

### 2. Using Python Script

A convenient Python script is available at `backend/access_db.py`:

```bash
cd backend

# Show database statistics
python access_db.py --stats

# List all tables
python access_db.py --tables

# Count rows in a table
python access_db.py --count users
python access_db.py --count orders
python access_db.py --count trades

# Execute custom query
python access_db.py --query "SELECT * FROM users WHERE email = 'admin@nihaogroup.com'"

# Show sample data from a table
python access_db.py --sample orders --limit 10
python access_db.py --sample cash_market_trades --limit 20
```

### 3. Using Database Client (pgAdmin, DBeaver, etc.)

Use any PostgreSQL client with these connection details:

- **Host**: `localhost`
- **Port**: `5433`
- **Database**: `niha_carbon`
- **Username**: `niha_user`
- **Password**: `niha_secure_pass_2024`

#### Example: DBeaver
1. Create new PostgreSQL connection
2. Enter the connection details above
3. Test connection and connect

#### Example: psql (if installed locally)
```bash
psql -h localhost -p 5433 -U niha_user -d niha_carbon
```

## Common Queries

### View All Users
```sql
SELECT id, email, first_name, last_name, role, is_active, created_at 
FROM users 
ORDER BY created_at DESC;
```

### View All Orders
```sql
SELECT id, user_id, order_type, side, quantity, price, status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 50;
```

### View Cash Market Trades
```sql
SELECT id, buyer_id, seller_id, quantity, price, status, created_at 
FROM cash_market_trades 
ORDER BY created_at DESC 
LIMIT 50;
```

### View Asset Transactions
```sql
SELECT id, user_id, transaction_type, amount, certificate_type, created_at 
FROM asset_transactions 
ORDER BY created_at DESC 
LIMIT 50;
```

### View Entities
```sql
SELECT id, name, legal_name, jurisdiction, verified, kyc_status, created_at 
FROM entities 
ORDER BY created_at DESC;
```

### View Market Makers
```sql
SELECT mm.id, mm.user_id, mm.maker_type, mm.is_active, u.email, u.first_name, u.last_name
FROM market_maker_clients mm
JOIN users u ON mm.user_id = u.id
ORDER BY mm.created_at DESC;
```

### View Settlement Batches
```sql
SELECT id, batch_date, status, total_trades, created_at 
FROM settlement_batches 
ORDER BY batch_date DESC;
```

### Get Statistics
```sql
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'trades', COUNT(*) FROM trades
UNION ALL
SELECT 'cash_market_trades', COUNT(*) FROM cash_market_trades
UNION ALL
SELECT 'swap_requests', COUNT(*) FROM swap_requests
UNION ALL
SELECT 'asset_transactions', COUNT(*) FROM asset_transactions
UNION ALL
SELECT 'certificates', COUNT(*) FROM certificates
UNION ALL
SELECT 'entities', COUNT(*) FROM entities
ORDER BY table_name;
```

## Troubleshooting

### Cannot connect to database

1. **Check if Docker containers are running:**
   ```bash
   docker ps | grep niha
   ```

2. **Check if database is healthy:**
   ```bash
   docker ps --filter "name=niha_db"
   ```

3. **Check database logs:**
   ```bash
   docker logs niha_db
   ```

4. **Verify port mapping:**
   ```bash
   docker port niha_db
   ```
   Should show: `5432/tcp -> 0.0.0.0:5433`

### Connection refused

- Make sure you're using port `5433` (not 5432) when connecting from your local machine
- If connecting from within Docker network, use port `5432` and host `db`

### Authentication failed

- Verify the password in `docker-compose.yml` matches what you're using
- Check `backend/.env` file for correct `DATABASE_URL`

## Database Schema

The database contains the following main tables:

- `users` - User accounts
- `entities` - Legal entities
- `orders` - Trading orders
- `trades` - Completed trades
- `cash_market_trades` - Cash market transactions
- `swap_requests` - Swap order requests
- `asset_transactions` - Asset movement history
- `certificates` - Carbon certificates
- `deposits` - User deposits
- `settlement_batches` - Settlement processing batches
- `market_maker_clients` - Market maker accounts
- `liquidity_operations` - Liquidity provider operations
- `price_history` - Historical price data
- `activity_logs` - System activity logs
- `authentication_attempts` - Login attempts
- `user_sessions` - Active user sessions

For detailed schema information, check the SQLAlchemy models in `backend/app/models/models.py`.
