# 📚 Quick Reference Guide

## File Map & What Each Does

| File | Purpose | Key Functions |
|------|---------|----------------|
| `server.js` | Main bot logic, listens to messages | `create()`, `client.onMessage()` |
| `db.js` | Database setup | `new Database()`, `db.pragma()`, `db.exec()` |
| `storage.js` | Read/write user data | `getState()`, `setState()`, `getAbandonedCarts()` |
| `stages.js` | List all conversation steps | `stages[]` array, stage registry |
| `stages/0.js` | Welcome message | `initialStage.exec()` |
| `stages/1.js` | Show menu | `stageOne.exec()` |
| `stages/2.js` | Add items to cart | `stageTwo.exec()` |
| `stages/3.js` | Enter address | `stageThree.exec()` |
| `stages/4.js` | Confirm order | `stageFour.exec()` |
| `stages/5.js` | Transfer to attendant | `finalStage.exec()` |
| `stages/99.js` | Respond to recovery | `acrStage.exec()` |
| `cron_jobs.js` | Background tasks | `startCronJobs()`, `cron.schedule()` |
| `menu.js` | Product catalog | `menu = { 1: {...}, 2: {...} }` |

---

## Key Code Snippets

### Message Received
```javascript
// In server.js
await client.onMessage(async (message) => {
  const state = getState(message.from);
  const response = stages[state.stage].stage.exec({
    from: message.from,
    message: message.body,
    client,
    state,
  });
  if (response) await client.sendText(message.from, response);
});
```

### Get User Data
```javascript
// In storage.js
const state = getState('5521987654321@s.us');
// Returns: { stage: 2, itens: [], address: '' }
```

### Save User Data
```javascript
// In any stage handler
state.stage = 3;
setState(from, state);
// Saves to database
```

### Add Item to Cart
```javascript
// In stage 2 (stageTwo.js)
state.itens.push(menu[message]);
setState(from, state);
return `✅ ${menu[message].description} added!`;
```

### Recover Abandoned Cart
```javascript
// In cron_jobs.js (every 10 minutes)
const carts = db.prepare(`
  SELECT phone_number FROM user_state
  WHERE stage IN (2, 3) AND last_updated_at < ?
`).all(ONE_HOUR_AGO);

for (const cart of carts) {
  await client.sendText(cart.phone_number, message);
  state.stage = 99;
  setState(cart.phone_number, state);
}
```

---

## Stage Transitions

```
Stage 0 → Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5
(Start)   (Menu)   (Items)   (Address) (Confirm) (Done)
          ↑                              
          └───────────────────────────── (Cancel: *)
                    ↓
               Stage 99 (Recovery)
```

---

## Database Query Examples

### Get user's cart
```sql
SELECT state_data FROM user_state 
WHERE phone_number = '5521987654321@s.us';
-- Returns: {"itens":[...], "address":"..."}
```

### Find abandoned carts
```sql
SELECT phone_number FROM user_state
WHERE stage IN (2, 3) 
AND last_updated_at < 1731553633000;
-- Returns all users inactive in shopping for 1+ hour
```

### Get all active users
```sql
SELECT COUNT(*) as active_users 
FROM user_state 
WHERE last_updated_at > (strftime('%s','now') * 1000 - 3600000);
```

---

## Common Tasks

### Task: Add a new menu item
**File**: `src/menu.js`
```javascript
export const menu = {
  1: { description: 'Chocolate Cake', price: 6 },
  2: { description: 'Vanilla Cake', price: 6 },
  3: { description: 'NEW ITEM', price: 8 }, // ← Add here
};
```

### Task: Change recovery message
**File**: `src/cron_jobs.js` (line 40)
```javascript
const message = `👋 You left these in your cart: ${items}. Want to complete your order?`;
// Change to your custom message
```

### Task: Change recovery check interval
**File**: `src/cron_jobs.js` (line 10)
```javascript
cron.schedule('*/10 * * * *', async () => {
  // ^^^^^^^^ Change to:
  // '*/5 * * * *'   = Every 5 minutes
  // '0 * * * *'     = Every hour
  // '0 0 * * *'     = Daily at midnight
```

### Task: Change abandoned cart timeout
**File**: `src/cron_jobs.js` (line 16)
```javascript
const ONE_HOUR_AGO = Date.now() - 3600000;
// ^^^^^^^^^^^^^^ 3600000 = 1 hour in milliseconds
// Change to:
// 1800000  = 30 minutes
// 7200000  = 2 hours
// 5400000  = 1.5 hours
```

### Task: Add custom stage
1. Create `src/stages/6.js`:
```javascript
import { setState } from '../storage.js';

export const myStage = {
  exec({ from, message, client, state }) {
    // Your logic here
    state.stage = 7;
    setState(from, state);
    return 'Your response';
  },
};
```

2. Add to `src/stages/index.js`:
```javascript
import { myStage } from './6.js';
export { ..., myStage };
```

3. Add to `src/stages.js`:
```javascript
export const stages = [
  // ... existing stages ...
  { descricao: 'My Stage', stage: myStage }, // ← Add here
];
```

---

## How to Debug

### Check what stage a user is in
```bash
# Query database
sqlite3 botwhatsapp.db
SELECT phone_number, stage FROM user_state WHERE phone_number = '5521987654321@s.us';
```

### Check user's cart items
```bash
SELECT state_data FROM user_state WHERE phone_number = '5521987654321@s.us';
# You'll see the JSON with all items
```

### Watch cron job logs
```bash
# Look at console output when bot is running
# You'll see: "🔍 Checking for abandoned carts..."
# And: "📦 Found 2 abandoned cart(s)"
```

### Test a stage directly
```javascript
// In any stage file, add at the end:
const testState = { stage: 2, itens: [], address: '' };
const response = stageTwo.exec({
  from: '5521987654321@s.us',
  message: '1',
  state: testState
});
console.log(response); // Should see bot's response
```

---

## Performance Notes

### Database
- ✅ SQLite is fast for < 100k users
- ✅ WAL mode allows concurrent reads
- ⚠️ For 1M+ users, consider PostgreSQL

### Cron Jobs
- ✅ Every 10 minutes is reasonable
- ⚠️ Shorter intervals = more database queries
- ✅ Can be optimized with indexes

### Memory
- ✅ State is not kept in memory
- ✅ Only loaded when needed
- ✅ Bot can handle 100+ concurrent users

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot read property 'stage' of undefined` | User data missing | Check `getState()` returns default state |
| `stages[X] is not defined` | Stage number doesn't exist | Add stage to `src/stages.js` array |
| `Database is locked` | Concurrent writes | Already handled with WAL mode |
| `client.sendText is not a function` | Wrong library API | If using Baileys, use `client.sendMessage()` |
| `QR code not showing` | Venom-bot connection | Check venom-bot logs |

---

## Metrics & Monitoring

### Key Metrics
```javascript
// Total users
SELECT COUNT(*) FROM user_state;

// Users by stage
SELECT stage, COUNT(*) FROM user_state GROUP BY stage;

// Abandoned carts
SELECT COUNT(*) FROM user_state 
WHERE stage IN (2, 3) 
AND last_updated_at < (strftime('%s','now') * 1000 - 3600000);

// Active today
SELECT COUNT(*) FROM user_state 
WHERE last_updated_at > (strftime('%s','now') * 1000 - 86400000);
```

### Add Monitoring
```javascript
// In cron_jobs.js, after recovery:
const stats = {
  total_users: db.prepare('SELECT COUNT(*) FROM user_state').get(),
  abandoned: carts.length,
  messages_sent: sentCount,
  timestamp: new Date().toISOString()
};
console.log('📊 Stats:', stats);
// Log to file or external service
```

---

## Production Checklist

- [ ] Test all stages with real WhatsApp
- [ ] Verify abandoned cart recovery works
- [ ] Monitor database size
- [ ] Set up error logging
- [ ] Back up database regularly
- [ ] Test message sending under load
- [ ] Set up auto-restart (PM2, Docker)
- [ ] Monitor bot logs
- [ ] Test cancellation flow
- [ ] Verify state persistence

---

## Deployment

### Using PM2 (Production)
```bash
npm install -g pm2

# Start bot
pm2 start src/server.js --name "whatsapp-bot"

# Auto-restart on crash
pm2 start src/server.js --restart-delay 5000

# View logs
pm2 logs whatsapp-bot

# Monitor
pm2 monit
```

### Using Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
```

---

## Next Steps

1. **Fix WhatsApp Connection** - Use whatsapp-web.js or Twilio
2. **Add Database Backups** - Daily SQLite backups
3. **Add Analytics** - Track user journeys
4. **Improve Messages** - Use rich formatting
5. **Multi-language** - Support Portuguese, English, etc
6. **Admin Dashboard** - Monitor orders in real-time
7. **Payment Integration** - Accept payments
8. **Inventory Management** - Track stock levels

---

## Resources

- **Venom-bot Docs**: https://github.com/orkestral/venom
- **SQLite Docs**: https://www.sqlite.org/
- **Node-cron Docs**: https://github.com/kelektiv/node-cron
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp

---

**Made with ❤️ - Now you understand the whole bot!** 🚀
