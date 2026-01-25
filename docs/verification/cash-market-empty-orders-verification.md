# Verificare: De ce nu apar ordine în Cash Market

**Data:** 2026-01-25  
**Endpoint verificat:** `http://localhost:5173/cash-market`  
**API Endpoint:** `GET /api/v1/cash-market/real/orderbook/CEA`

## Problema

Pagina Cash Market afișează un order book gol (fără bids și asks).

## Rezultatul verificării

### 1. Test API Endpoint

```bash
curl http://localhost:8000/api/v1/cash-market/real/orderbook/CEA
```

**Răspuns:**
```json
{
    "certificate_type": "CEA",
    "bids": [],
    "asks": [],
    "spread": null,
    "best_bid": null,
    "best_ask": null,
    "last_price": 63.0,
    "volume_24h": 0.0,
    "change_24h": 0.0
}
```

### 2. Analiza codului

Funcția `get_real_orderbook` din `backend/app/services/order_matching.py` (linia 517) interoghează baza de date pentru:

**SELL orders (asks):**
- `certificate_type = CEA`
- `side = SELL`
- `status IN (OPEN, PARTIALLY_FILLED)`
- `seller_id IS NOT NULL OR market_maker_id IS NOT NULL`

**BUY orders (bids):**
- `certificate_type = CEA`
- `side = BUY`
- `status IN (OPEN, PARTIALLY_FILLED)`
- `entity_id IS NOT NULL OR market_maker_id IS NOT NULL`

### 3. Cauza

**Nu există ordine în baza de date** care să îndeplinească criteriile de mai sus.

## Explicație

Sistemul funcționează corect. Order book-ul este gol pentru că:

1. **Nu există ordine de vânzare (SELL)** create de:
   - Sellers (tabelul `sellers`)
   - Market Makers (tabelul `market_makers`)

2. **Nu există ordine de cumpărare (BUY)** create de:
   - Entities (utilizatori cu `entity_id`)
   - Market Makers

## Soluții

### Opțiunea 1: Crearea de ordine de test

Pentru a testa funcționalitatea, poți crea ordine de test prin:

1. **Market Makers** - folosind API-ul de backoffice:
   ```
   POST /api/v1/admin/market-orders
   ```

2. **Sellers** - prin inserarea directă în baza de date sau prin API-ul de administrare

3. **Entities** - utilizatorii pot plasa ordine prin:
   ```
   POST /api/v1/cash-market/orders
   ```

### Opțiunea 2: Folosirea endpoint-ului simulat (pentru demo)

Există un endpoint care generează date simulate:

```
GET /api/v1/cash-market/orderbook/CEA
```

Acest endpoint returnează date simulate pentru demonstrație, dar frontend-ul folosește endpoint-ul real (`/real/orderbook/CEA`).

### Opțiunea 3: Verificarea bazei de date

Verifică direct în baza de date dacă există ordine:

```sql
SELECT 
    id, 
    certificate_type, 
    side, 
    status, 
    price, 
    quantity,
    seller_id,
    market_maker_id,
    entity_id
FROM orders 
WHERE certificate_type = 'CEA' 
  AND status IN ('OPEN', 'PARTIALLY_FILLED')
ORDER BY created_at DESC;
```

## Concluzie

**Sistemul funcționează corect.** Order book-ul este gol pentru că nu există ordine în baza de date. Pentru a vedea ordine în interfață, este necesar să se creeze ordine prin:

- Market Makers (via backoffice)
- Sellers (via API sau direct în DB)
- Entities/Users (via interfața de trading)

## Recomandări

1. **Pentru development/testing:** Creează un script de seed care să genereze ordine de test
2. **Pentru demo:** Consideră folosirea endpoint-ului simulat temporar
3. **Pentru producție:** Asigură-te că Market Makers și Sellers au fost configurați și au creat ordine

## Fișiere relevante

- `backend/app/services/order_matching.py` - funcția `get_real_orderbook`
- `backend/app/api/v1/cash_market.py` - endpoint-ul `/real/orderbook/{certificate_type}`
- `frontend/src/pages/CashMarketPage.tsx` - componenta care afișează order book-ul
- `frontend/src/services/api.ts` - funcția `getRealOrderBook`
