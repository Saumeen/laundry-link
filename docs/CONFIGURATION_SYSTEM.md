# Configuration System

The application now uses a flexible key-value configuration system that replaces the previous `TimeSlotConfig` table. This allows for easy addition of new configuration options without requiring database schema changes.

## Database Schema

The `Configuration` table has the following structure:

```sql
CREATE TABLE configurations (
  id SERIAL PRIMARY KEY,
  key VARCHAR UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category VARCHAR DEFAULT 'general',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## Current Time Slot Configurations

The following configurations are seeded for time slots:

| Key | Value | Description | Category |
|-----|-------|-------------|----------|
| `time_slot_duration` | `3` | Duration of each time slot in hours | `time_slots` |
| `business_start_time` | `09:00` | Business start time for time slots | `time_slots` |
| `business_end_time` | `21:00` | Business end time for time slots | `time_slots` |

## Usage

### Using ConfigurationManager

```typescript
import { ConfigurationManager } from '@/lib/utils/configuration';

// Get a single configuration value
const maxOrders = await ConfigurationManager.getConfig('max_orders_per_day');

// Get all configurations in a category
const timeSlotConfigs = await ConfigurationManager.getConfigsByCategory('time_slots');

// Get time slot configuration as structured object
const timeSlotConfig = await ConfigurationManager.getTimeSlotConfig();

// Set or update a configuration
await ConfigurationManager.setConfig(
  'max_orders_per_day', 
  '50', 
  'business_rules', 
  'Maximum orders allowed per day'
);
```

### Adding New Configurations

To add new configurations, you can:

1. **Via Migration** (Recommended for initial setup):
   ```sql
   INSERT INTO configurations (key, value, description, category) VALUES
   ('new_config_key', 'new_value', 'Description of this config', 'category_name');
   ```

2. **Via API** (For runtime updates):
   ```typescript
   const response = await fetch('/api/admin/configurations', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       key: 'new_config_key',
       value: 'new_value',
       category: 'category_name',
       description: 'Description of this config'
     })
   });
   ```

3. **Via ConfigurationManager**:
   ```typescript
   await ConfigurationManager.setConfig(
     'new_config_key', 
     'new_value', 
     'category_name', 
     'Description of this config'
   );
   ```

## Categories

Use categories to organize related configurations:

- `time_slots` - Time slot related configurations
- `business_rules` - Business logic configurations
- `pricing` - Pricing related configurations
- `notifications` - Notification settings
- `general` - General application settings

## Best Practices

1. **Use descriptive keys**: Use snake_case for keys (e.g., `max_orders_per_day`)
2. **Provide descriptions**: Always include a description for new configurations
3. **Use appropriate categories**: Group related configurations together
4. **Validate values**: Always validate configuration values before using them
5. **Provide defaults**: Always provide fallback values in case configurations are missing

## Migration from TimeSlotConfig

The old `TimeSlotConfig` table has been replaced with the new `Configuration` table. The existing time slot functionality remains the same, but now uses the new system:

- `slotDuration` → `time_slot_duration`
- `startTime` → `business_start_time`
- `endTime` → `business_end_time`

All existing code continues to work without changes, as the API responses maintain the same structure. 