const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

const db = new sqlite3.Database('./dopewars_data.db');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'DopeWars> '
});

// Helper function to execute queries
function executeQuery(query) {
  return new Promise((resolve, reject) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to format results
function formatResults(rows) {
  if (rows.length === 0) {
    console.log('No results found.');
    return;
  }

  // Get column names
  const columns = Object.keys(rows[0]);
  
  // Calculate column widths
  const widths = columns.map(col => Math.max(col.length, ...rows.map(row => String(row[col]).length)));
  
  // Print header
  const header = columns.map((col, i) => col.padEnd(widths[i])).join(' | ');
  console.log(header);
  console.log('-'.repeat(header.length));
  
  // Print rows
  rows.forEach(row => {
    const rowStr = columns.map((col, i) => String(row[col]).padEnd(widths[i])).join(' | ');
    console.log(rowStr);
  });
  
  console.log(`\n${rows.length} row(s) returned.`);
}

// Predefined queries
const predefinedQueries = {
  '1': {
    name: 'All Drugs',
    query: 'SELECT * FROM drugs ORDER BY name;'
  },
  '2': {
    name: 'Cheap Drugs Only',
    query: 'SELECT * FROM drugs WHERE is_cheap = 1 ORDER BY min_price;'
  },
  '3': {
    name: 'Expensive Drugs Only',
    query: 'SELECT * FROM drugs WHERE is_expensive = 1 ORDER BY max_price DESC;'
  },
  '4': {
    name: 'All Locations (by Police Presence)',
    query: 'SELECT * FROM locations ORDER BY police_presence;'
  },
  '5': {
    name: 'All Guns (by Price)',
    query: 'SELECT * FROM guns ORDER BY price;'
  },
  '6': {
    name: 'All Cops',
    query: 'SELECT * FROM cops ORDER BY armor;'
  },
  '7': {
    name: 'Drug Prices Day 1 (Manhattan)',
    query: `SELECT d.name as drug, dp.price 
            FROM drug_prices dp 
            JOIN drugs d ON dp.drug_id = d.id 
            JOIN locations l ON dp.location_id = l.id 
            WHERE dp.day = 1 AND l.name = 'Manhattan' 
            ORDER BY dp.price;`
  },
  '8': {
    name: 'Drug Prices Day 1 (Bronx - Cheaper)',
    query: `SELECT d.name as drug, dp.price 
            FROM drug_prices dp 
            JOIN drugs d ON dp.drug_id = d.id 
            JOIN locations l ON dp.location_id = l.id 
            WHERE dp.day = 1 AND l.name = 'Bronx' 
            ORDER BY dp.price;`
  },
  '9': {
    name: 'Drug Availability by Location',
    query: `SELECT l.name as location, 
                   GROUP_CONCAT(d.name, ', ') as available_drugs
            FROM location_drugs ld
            JOIN locations l ON ld.location_id = l.id
            JOIN drugs d ON ld.drug_id = d.id
            WHERE ld.is_available = 1
            GROUP BY l.id, l.name
            ORDER BY l.name;`
  },
  '10': {
    name: 'Price Comparison: Manhattan vs Bronx (Day 1)',
    query: `SELECT d.name as drug,
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
            ORDER BY savings DESC;`
  },
  '11': {
    name: 'Most Profitable Drugs (Day 1, Manhattan)',
    query: `SELECT d.name as drug,
                   dp.price,
                   (dp.price - d.min_price) as potential_profit
            FROM drug_prices dp
            JOIN drugs d ON dp.drug_id = d.id
            JOIN locations l ON dp.location_id = l.id
            WHERE dp.day = 1 AND l.name = 'Manhattan'
            ORDER BY potential_profit DESC;`
  },
  '12': {
    name: 'Database Statistics',
    query: `SELECT 
              (SELECT COUNT(*) FROM drugs) as total_drugs,
              (SELECT COUNT(*) FROM locations) as total_locations,
              (SELECT COUNT(*) FROM guns) as total_guns,
              (SELECT COUNT(*) FROM cops) as total_cop_types,
              (SELECT COUNT(*) FROM drug_prices) as total_price_records;`
  }
};

// Show help
function showHelp() {
  console.log('\n🎮 DopeWars Database Query Interface');
  console.log('=====================================\n');
  console.log('Available commands:');
  console.log('  help, h     - Show this help');
  console.log('  exit, quit  - Exit the program');
  console.log('  list        - List all predefined queries');
  console.log('  <number>    - Run predefined query by number');
  console.log('  <sql>       - Execute custom SQL query\n');
  
  console.log('Predefined Queries:');
  Object.entries(predefinedQueries).forEach(([num, query]) => {
    console.log(`  ${num.padStart(2)}. ${query.name}`);
  });
  console.log('');
}

// List predefined queries
function listQueries() {
  console.log('\nPredefined Queries:');
  Object.entries(predefinedQueries).forEach(([num, query]) => {
    console.log(`${num.padStart(2)}. ${query.name}`);
  });
  console.log('');
}

// Main prompt handler
rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim().toLowerCase();
  
  if (input === '' || input === 'help' || input === 'h') {
    showHelp();
  } else if (input === 'exit' || input === 'quit') {
    console.log('Goodbye!');
    rl.close();
    db.close();
    process.exit(0);
  } else if (input === 'list') {
    listQueries();
  } else if (predefinedQueries[input]) {
    console.log(`\n🔍 Running: ${predefinedQueries[input].name}`);
    console.log('Query:', predefinedQueries[input].query);
    console.log('');
    
    try {
      const results = await executeQuery(predefinedQueries[input].query);
      formatResults(results);
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  } else {
    // Try to execute as custom SQL
    console.log(`\n🔍 Executing custom query...`);
    console.log('Query:', line);
    console.log('');
    
    try {
      const results = await executeQuery(line);
      formatResults(results);
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.log('💡 Tip: Use "help" to see predefined queries or check your SQL syntax.');
    }
  }
  
  console.log('');
  rl.prompt();
});

rl.on('close', () => {
  console.log('\nGoodbye!');
  db.close();
  process.exit(0);
});

// Show initial help
showHelp();
