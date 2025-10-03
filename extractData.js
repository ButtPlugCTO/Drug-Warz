const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create SQLite database
const db = new sqlite3.Database('./dopewars_data.db');

// Raw data extracted from the original DopeWars source code
const drugs = [
  { id: 0, name: 'Acid', minPrice: 1000, maxPrice: 4400, cheap: true, expensive: false, cheapMessage: 'The market is flooded with cheap home-made acid!' },
  { id: 1, name: 'Cocaine', minPrice: 15000, maxPrice: 29000, cheap: false, expensive: true, cheapMessage: '' },
  { id: 2, name: 'Hashish', minPrice: 480, maxPrice: 1280, cheap: true, expensive: false, cheapMessage: 'The Marrakesh Express has arrived!' },
  { id: 3, name: 'Heroin', minPrice: 5500, maxPrice: 13000, cheap: false, expensive: true, cheapMessage: '' },
  { id: 4, name: 'Ludes', minPrice: 11, maxPrice: 60, cheap: true, expensive: false, cheapMessage: 'Rival drug dealers raided a pharmacy and are selling cheap ludes!' },
  { id: 5, name: 'MDA', minPrice: 1500, maxPrice: 4400, cheap: false, expensive: false, cheapMessage: '' },
  { id: 6, name: 'Opium', minPrice: 540, maxPrice: 1250, cheap: false, expensive: true, cheapMessage: '' },
  { id: 7, name: 'PCP', minPrice: 1000, maxPrice: 2500, cheap: false, expensive: false, cheapMessage: '' },
  { id: 8, name: 'Peyote', minPrice: 220, maxPrice: 700, cheap: false, expensive: false, cheapMessage: '' },
  { id: 9, name: 'Shrooms', minPrice: 630, maxPrice: 1300, cheap: false, expensive: false, cheapMessage: '' },
  { id: 10, name: 'Speed', minPrice: 90, maxPrice: 250, cheap: false, expensive: true, cheapMessage: '' },
  { id: 11, name: 'Weed', minPrice: 315, maxPrice: 890, cheap: true, expensive: false, cheapMessage: 'Colombian freighter dusted the Coast Guard! Weed prices have bottomed out!' }
];

// NUMDRUG = 12, so calculations are:
// NUMDRUG / 2 = 6
// NUMDRUG / 2 + 1 = 7
// NUMDRUG / 2 + 2 = 8
// NUMDRUG / 2 - 2 = 4
// NUMDRUG - 1 = 11
// NUMDRUG - 2 = 10
const locations = [
  { id: 0, name: 'Bronx', policePresence: 10, minDrug: 7, maxDrug: 12 },
  { id: 1, name: 'Ghetto', policePresence: 5, minDrug: 8, maxDrug: 12 },
  { id: 2, name: 'Central Park', policePresence: 15, minDrug: 6, maxDrug: 12 },
  { id: 3, name: 'Manhattan', policePresence: 90, minDrug: 4, maxDrug: 10 },
  { id: 4, name: 'Coney Island', policePresence: 20, minDrug: 6, maxDrug: 12 },
  { id: 5, name: 'Brooklyn', policePresence: 70, minDrug: 4, maxDrug: 11 },
  { id: 6, name: 'Queens', policePresence: 50, minDrug: 6, maxDrug: 12 },
  { id: 7, name: 'Staten Island', policePresence: 20, minDrug: 6, maxDrug: 12 }
];

const guns = [
  { id: 0, name: 'Baretta', price: 3000, space: 4, damage: 5 },
  { id: 1, name: '.38 Special', price: 3500, space: 4, damage: 9 },
  { id: 2, name: 'Ruger', price: 2900, space: 4, damage: 4 },
  { id: 3, name: 'Saturday Night Special', price: 3100, space: 4, damage: 7 }
];

const cops = [
  { 
    id: 0, 
    name: 'Officer Hardass', 
    deputyName: 'deputy', 
    deputiesName: 'deputies',
    armor: 4, 
    deputyArmor: 3, 
    attackPenalty: 30, 
    defendPenalty: 30,
    minDeputies: 2, 
    maxDeputies: 8, 
    gunIndex: 0, 
    copGun: 1, 
    deputyGun: 1
  },
  { 
    id: 1, 
    name: 'Officer Bob', 
    deputyName: 'deputy', 
    deputiesName: 'deputies',
    armor: 15, 
    deputyArmor: 4, 
    attackPenalty: 30, 
    defendPenalty: 20,
    minDeputies: 4, 
    maxDeputies: 10, 
    gunIndex: 0, 
    copGun: 2, 
    deputyGun: 1
  },
  { 
    id: 2, 
    name: 'Agent Smith', 
    deputyName: 'cop', 
    deputiesName: 'cops',
    armor: 50, 
    deputyArmor: 6, 
    attackPenalty: 20, 
    defendPenalty: 20,
    minDeputies: 6, 
    maxDeputies: 18, 
    gunIndex: 1, 
    copGun: 3, 
    deputyGun: 2
  }
];

// Create tables
function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Drop tables if they exist
      db.run('DROP TABLE IF EXISTS drugs');
      db.run('DROP TABLE IF EXISTS locations');
      db.run('DROP TABLE IF EXISTS guns');
      db.run('DROP TABLE IF EXISTS cops');
      db.run('DROP TABLE IF EXISTS drug_prices');
      db.run('DROP TABLE IF EXISTS location_drugs');
      
      // Create drugs table
      db.run(`
        CREATE TABLE drugs (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          min_price INTEGER NOT NULL,
          max_price INTEGER NOT NULL,
          is_cheap BOOLEAN NOT NULL,
          is_expensive BOOLEAN NOT NULL,
          cheap_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create locations table
      db.run(`
        CREATE TABLE locations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          police_presence INTEGER NOT NULL,
          min_drug INTEGER NOT NULL,
          max_drug INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create guns table
      db.run(`
        CREATE TABLE guns (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          price INTEGER NOT NULL,
          space INTEGER NOT NULL,
          damage INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create cops table
      db.run(`
        CREATE TABLE cops (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          deputy_name TEXT NOT NULL,
          deputies_name TEXT NOT NULL,
          armor INTEGER NOT NULL,
          deputy_armor INTEGER NOT NULL,
          attack_penalty INTEGER NOT NULL,
          defend_penalty INTEGER NOT NULL,
          min_deputies INTEGER NOT NULL,
          max_deputies INTEGER NOT NULL,
          gun_index INTEGER NOT NULL,
          cop_gun INTEGER NOT NULL,
          deputy_gun INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create drug prices table for historical tracking
      db.run(`
        CREATE TABLE drug_prices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          drug_id INTEGER NOT NULL,
          location_id INTEGER NOT NULL,
          day INTEGER NOT NULL,
          price INTEGER NOT NULL,
          is_cheap BOOLEAN NOT NULL,
          is_expensive BOOLEAN NOT NULL,
          calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (drug_id) REFERENCES drugs (id),
          FOREIGN KEY (location_id) REFERENCES locations (id)
        )
      `);
      
      // Create location-drug availability table
      db.run(`
        CREATE TABLE location_drugs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          location_id INTEGER NOT NULL,
          drug_id INTEGER NOT NULL,
          is_available BOOLEAN NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (location_id) REFERENCES locations (id),
          FOREIGN KEY (drug_id) REFERENCES drugs (id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

// Insert data
function insertData() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insert drugs
      const insertDrug = db.prepare(`
        INSERT INTO drugs (id, name, min_price, max_price, is_cheap, is_expensive, cheap_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      drugs.forEach(drug => {
        insertDrug.run(drug.id, drug.name, drug.minPrice, drug.maxPrice, 
                      drug.cheap, drug.expensive, drug.cheapMessage);
      });
      insertDrug.finalize();
      
      // Insert locations
      const insertLocation = db.prepare(`
        INSERT INTO locations (id, name, police_presence, min_drug, max_drug)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      locations.forEach(location => {
        insertLocation.run(location.id, location.name, location.policePresence, 
                          location.minDrug, location.maxDrug);
      });
      insertLocation.finalize();
      
      // Insert guns
      const insertGun = db.prepare(`
        INSERT INTO guns (id, name, price, space, damage)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      guns.forEach(gun => {
        insertGun.run(gun.id, gun.name, gun.price, gun.space, gun.damage);
      });
      insertGun.finalize();
      
      // Insert cops
      const insertCop = db.prepare(`
        INSERT INTO cops (id, name, deputy_name, deputies_name, armor, deputy_armor, 
                         attack_penalty, defend_penalty, min_deputies, max_deputies, 
                         gun_index, cop_gun, deputy_gun)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      cops.forEach(cop => {
        insertCop.run(cop.id, cop.name, cop.deputyName, cop.deputiesName, 
                     cop.armor, cop.deputyArmor, cop.attackPenalty, cop.defendPenalty,
                     cop.minDeputies, cop.maxDeputies, cop.gunIndex, cop.copGun, cop.deputyGun);
      });
      insertCop.finalize();
      
      // Insert location-drug availability
      const insertLocationDrug = db.prepare(`
        INSERT INTO location_drugs (location_id, drug_id, is_available)
        VALUES (?, ?, ?)
      `);
      
      locations.forEach(location => {
        drugs.forEach(drug => {
          const isAvailable = drug.id >= location.minDrug && drug.id <= location.maxDrug;
          insertLocationDrug.run(location.id, drug.id, isAvailable);
        });
      });
      insertLocationDrug.finalize();
      
      // Generate sample price data for the first 30 days
      const insertPrice = db.prepare(`
        INSERT INTO drug_prices (drug_id, location_id, day, price, is_cheap, is_expensive)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (let day = 1; day <= 30; day++) {
        drugs.forEach(drug => {
          locations.forEach(location => {
            // Use the same deterministic price calculation as the game
            const seed = drug.id * 100 + day;
            const randomFactor = (Math.sin(seed) + 1) / 2;
            let price = drug.minPrice + randomFactor * (drug.maxPrice - drug.minPrice);
            
            // Apply location modifiers
            if (location.name === 'Bronx' || location.name === 'Ghetto') {
              price *= 0.7;
            }
            
            // Apply cheap/expensive modifiers
            if (drug.cheap) price /= 4;
            if (drug.expensive) price *= 4;
            
            const finalPrice = Math.floor(price);
            
            insertPrice.run(drug.id, location.id, day, finalPrice, drug.cheap, drug.expensive);
          });
        });
      }
      insertPrice.finalize();
      
      resolve();
    });
  });
}

// Create indexes for better query performance
function createIndexes() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('CREATE INDEX idx_drug_prices_drug_location ON drug_prices(drug_id, location_id)');
      db.run('CREATE INDEX idx_drug_prices_day ON drug_prices(day)');
      db.run('CREATE INDEX idx_location_drugs_location ON location_drugs(location_id)');
      db.run('CREATE INDEX idx_location_drugs_drug ON location_drugs(drug_id)');
      resolve();
    });
  });
}

// Main execution
async function main() {
  try {
    console.log('Creating SQLite database tables...');
    await createTables();
    
    console.log('Inserting DopeWars data...');
    await insertData();
    
    console.log('Creating database indexes...');
    await createIndexes();
    
    console.log('✅ DopeWars SQLite database created successfully!');
    console.log('📊 Database contains:');
    console.log(`   - ${drugs.length} drugs`);
    console.log(`   - ${locations.length} locations`);
    console.log(`   - ${guns.length} guns`);
    console.log(`   - ${cops.length} cop types`);
    console.log('   - 30 days of price history for all drug-location combinations');
    console.log('   - Location-drug availability matrix');
    
    // Show some sample queries
    console.log('\n📝 Sample queries you can run:');
    console.log('   sqlite3 dopewars_data.db "SELECT * FROM drugs WHERE is_cheap = 1;"');
    console.log('   sqlite3 dopewars_data.db "SELECT * FROM locations ORDER BY police_presence;"');
    console.log('   sqlite3 dopewars_data.db "SELECT d.name, dp.price, l.name as location FROM drug_prices dp JOIN drugs d ON dp.drug_id = d.id JOIN locations l ON dp.location_id = l.id WHERE dp.day = 1 LIMIT 10;"');
    
  } catch (error) {
    console.error('❌ Error creating database:', error);
  } finally {
    db.close();
  }
}

main();
