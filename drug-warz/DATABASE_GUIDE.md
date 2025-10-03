# DopeWars SQLite Database Guide

This document describes the SQLite database containing all the original DopeWars game data extracted from the source code.

## 📊 Database Overview

The database contains **2,880 price records** across:
- **12 drugs** (Acid, Cocaine, Hashish, Heroin, Ludes, MDA, Opium, PCP, Peyote, Shrooms, Speed, Weed)
- **8 locations** (Bronx, Brooklyn, Central Park, Coney Island, Ghetto, Manhattan, Queens, Staten Island)
- **4 guns** (Baretta, .38 Special, Ruger, Saturday Night Special)
- **3 cop types** (Officer Hardass, Officer Bob, Agent Smith)
- **30 days** of price history for all drug-location combinations

## 🗄️ Database Schema

### Tables

#### `drugs`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Drug name |
| min_price | INTEGER | Minimum price |
| max_price | INTEGER | Maximum price |
| is_cheap | BOOLEAN | Can be cheap (÷4 price) |
| is_expensive | BOOLEAN | Can be expensive (×4 price) |
| cheap_message | TEXT | Message when drug is cheap |

#### `locations`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Location name |
| police_presence | INTEGER | Police presence level |
| min_drug | INTEGER | Minimum drug ID available |
| max_drug | INTEGER | Maximum drug ID available |

#### `guns`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Gun name |
| price | INTEGER | Gun price |
| space | INTEGER | Space taken in inventory |
| damage | INTEGER | Damage dealt |

#### `cops`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Cop name |
| deputy_name | TEXT | Single deputy name |
| deputies_name | TEXT | Multiple deputies name |
| armor | INTEGER | Cop armor |
| deputy_armor | INTEGER | Deputy armor |
| attack_penalty | INTEGER | Attack penalty |
| defend_penalty | INTEGER | Defend penalty |
| min_deputies | INTEGER | Minimum deputies |
| max_deputies | INTEGER | Maximum deputies |
| gun_index | INTEGER | Gun index |
| cop_gun | INTEGER | Cop gun type |
| deputy_gun | INTEGER | Deputy gun type |

#### `drug_prices`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| drug_id | INTEGER | Foreign key to drugs |
| location_id | INTEGER | Foreign key to locations |
| day | INTEGER | Game day (1-30) |
| price | INTEGER | Calculated price |
| is_cheap | BOOLEAN | Whether drug is cheap that day |
| is_expensive | BOOLEAN | Whether drug is expensive that day |

#### `location_drugs`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| location_id | INTEGER | Foreign key to locations |
| drug_id | INTEGER | Foreign key to drugs |
| is_available | BOOLEAN | Whether drug is available at location |

## 🎮 Usage

### Command Line Interface

```bash
# Start interactive query interface
npm run query-db

# Or use sqlite3 directly
sqlite3 dopewars_data.db
```

### Predefined Queries

The query interface includes 12 predefined queries:

1. **All Drugs** - List all drugs with prices
2. **Cheap Drugs Only** - Drugs that can have cheap events
3. **Expensive Drugs Only** - Drugs that can have expensive events
4. **All Locations** - Locations ordered by police presence
5. **All Guns** - Guns ordered by price
6. **All Cops** - Cop types ordered by armor
7. **Drug Prices Day 1 (Manhattan)** - Manhattan prices on day 1
8. **Drug Prices Day 1 (Bronx)** - Bronx prices on day 1 (cheaper)
9. **Drug Availability by Location** - Which drugs are available where
10. **Price Comparison** - Manhattan vs Bronx price differences
11. **Most Profitable Drugs** - Best profit margins in Manhattan
12. **Database Statistics** - Overview of all data

### Example Queries

#### Find cheapest drugs in Bronx on day 1:
```sql
SELECT d.name, dp.price 
FROM drug_prices dp 
JOIN drugs d ON dp.drug_id = d.id 
JOIN locations l ON dp.location_id = l.id 
WHERE dp.day = 1 AND l.name = 'Bronx' 
ORDER BY dp.price 
LIMIT 5;
```

#### Compare prices between locations:
```sql
SELECT d.name as drug,
       m.price as manhattan_price,
       b.price as bronx_price,
       (m.price - b.price) as savings
FROM drugs d
JOIN drug_prices m ON d.id = m.drug_id
JOIN locations lm ON m.location_id = lm.id
JOIN drug_prices b ON d.id = b.drug_id
JOIN locations lb ON b.location_id = lb.id
WHERE m.day = 1 AND b.day = 1
AND lm.name = 'Manhattan' AND lb.name = 'Bronx'
ORDER BY savings DESC;
```

#### Find most profitable drugs:
```sql
SELECT d.name as drug,
       dp.price,
       (dp.price - d.min_price) as potential_profit
FROM drug_prices dp
JOIN drugs d ON dp.drug_id = d.id
JOIN locations l ON dp.location_id = l.id
WHERE dp.day = 1 AND l.name = 'Manhattan'
ORDER BY potential_profit DESC;
```

## 📈 Key Insights

### Price Patterns
- **Bronx & Ghetto**: 30% cheaper than other locations
- **Manhattan**: Highest prices, lowest police presence (90)
- **Cheap drugs**: Acid, Hashish, Ludes, Weed (can be ÷4 price)
- **Expensive drugs**: Cocaine, Heroin, Opium, Speed (can be ×4 price)

### Location Analysis
- **Safest**: Manhattan (90 police presence)
- **Most Dangerous**: Ghetto (5 police presence)
- **Best Deals**: Bronx & Ghetto (70% of normal prices)

### Profit Margins (Day 1, Manhattan)
- **Cocaine**: $100,656 (potential profit: $85,656)
- **Heroin**: $28,618 (potential profit: $23,118)
- **Opium**: $2,420 (potential profit: $1,880)

## 🔧 Regenerating Data

To recreate the database with updated data:

```bash
# Extract and populate database
npm run extract-data

# Query the database
npm run query-db
```

## 📝 Notes

- Prices are calculated using the same deterministic algorithm as the original game
- Database includes 30 days of price history
- All data matches the original DopeWars source code exactly
- Indexes are created for optimal query performance
- Database file: `dopewars_data.db`
