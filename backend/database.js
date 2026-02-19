const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, 'database.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('✅ Connected to SQLite database');
        // Foreign key támogatás engedélyezése
        this.db.run('PRAGMA foreign_keys = ON');
      }
    });
  }

  init() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Foreign key támogatás engedélyezése
        this.db.run('PRAGMA foreign_keys = ON');

        // Users tábla
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating users table:', err);
            reject(err);
          }
        });

        // Equipment tábla
        this.db.run(`
          CREATE TABLE IF NOT EXISTS equipment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            contact TEXT NOT NULL,
            image TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating equipment table:', err);
            reject(err);
          }
        });

        // Rentals tábla – users és equipment közötti kapcsolótábla
        this.db.run(`
          CREATE TABLE IF NOT EXISTS rentals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            equipment_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending'
              CHECK(status IN ('pending', 'active', 'completed', 'cancelled')),
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) {
            console.error('Error creating rentals table:', err);
            reject(err);
          } else {
            console.log('Rentals tábla kész');
          }
        });

        // Alapértelmezett admin felhasználó létrehozása
        this.db.get('SELECT * FROM users WHERE email = ?', ['admin@nehezgep.hu'], async (err, row) => {
          if (err) {
            console.error('Error checking admin:', err);
            return;
          }
          
          if (!row) {
            try {
              const hashedPassword = await bcrypt.hash('admin123', 10);
              this.db.run(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin', 'admin@nehezgep.hu', hashedPassword, 'admin'],
                (err) => {
                  if (err) {
                    console.error('Admin létrehozási hiba:', err);
                  } else {
                    console.log('✅ Alapértelmezett admin létrehozva: admin@nehezgep.hu / admin123');
                  }
                }
              );
            } catch (error) {
              console.error('Error hashing admin password:', error);
            }
          } else {
            console.log('ℹ️  Admin felhasználó már létezik');
          }
        });

        // Példa gépek hozzáadása ha üres az adatbázis
        this.db.get('SELECT COUNT(*) as count FROM equipment', [], (err, row) => {
          if (err) {
            console.error('Error checking equipment:', err);
            return;
          }
          
          if (!err && row.count === 0) {
            const sampleEquipment = [
              [
                'CAT 320D Lánctalpas Kotrógép', 
                'Közepes méretű kotrógép, ideális földmunkákhoz és építkezésekhez. 20 tonna üzemi tömeg, 1.2 m³ kanálkapacitás. Megbízható Caterpillar motor, precíz hidraulikus rendszer, légkondicionált fülke.', 
                '+36 30 123 4567', 
                'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=500&h=300&fit=crop'
              ],
              [
                'Volvo L120H Homlokrakodó', 
                'Erőteljes homlokrakodó 11 tonna üzemi tömeggel. Kiváló anyagmozgatáshoz és rakodási munkákhoz. Modern fülke, kiváló látótér, alacsony üzemanyag-fogyasztás.', 
                '+36 30 234 5678', 
                'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=500&h=300&fit=crop'
              ],
              [
                'JCB 8085 Midi Kotrógép', 
                'Kompakt méretű kotrógép városi és szűk terű munkákhoz. 8.5 tonna üzemi tömeg. Gazdaságos üzemeltetés, alacsony zajszint, kiváló manőverezhetőség.', 
                '+36 30 345 6789', 
                'https://images.unsplash.com/photo-1625527575307-616f0bb84ad2?w=500&h=300&fit=crop'
              ],
              [
                'Liebherr R956 Bányászati Kotrógép',
                'Nagy teljesítményű bányászati kotrógép 56 tonnás üzemi tömeggel. 3.5 m³ kanálkapacitás, extrém terhelésre tervezve. Kiváló bányászati és nagy földmunkákhoz.',
                '+36 30 456 7890',
                'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&h=300&fit=crop'
              ],
              [
                'Komatsu D65PX Lánctalpas Buldózer',
                'Megbízható buldózer minden típusú földmunkához. 20 tonna üzemi tömeg, 4.5m széles tolólap. Erős húzóerő, stabil működés nehéz terepviszonyok között.',
                '+36 30 567 8901',
                'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=500&h=300&fit=crop'
              ],
              [
                'Hitachi ZX350 Lánctalpas Kotrógép',
                'Univerzális kotrógép 35 tonnás üzemi tömeggel. Tökéletes egyensúly a teljesítmény és az üzemanyag-hatékonyság között. 1.8 m³ kanálkapacitás.',
                '+36 30 678 9012',
                'https://images.unsplash.com/photo-1572981558068-e3b19ea54b33?w=500&h=300&fit=crop'
              ]
            ];

            const stmt = this.db.prepare(
              'INSERT INTO equipment (name, description, contact, image) VALUES (?, ?, ?, ?)'
            );

            sampleEquipment.forEach(eq => {
              stmt.run(eq, (err) => {
                if (err) console.error('Error inserting sample equipment:', err);
              });
            });

            stmt.finalize(() => {
              console.log(' Példa gépek hozzáadva képekkel (6 db)');
            });
          } else if (row.count > 0) {
            console.log(`  ${row.count} gép már létezik az adatbázisban`);
          }
        });

        resolve();
      });
    });
  }

  // === USER METHODS ===

  getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  createUser(username, email, password, role = 'user') {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, password, role],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  deleteUser(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  updateUserRole(id, role) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE users SET role = ? WHERE id = ?', [role, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // === EQUIPMENT METHODS ===

  getAllEquipment() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM equipment ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getEquipmentById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM equipment WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  createEquipment(name, description, contact, image) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO equipment (name, description, contact, image) VALUES (?, ?, ?, ?)',
        [name, description, contact, image],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  updateEquipment(id, name, description, contact, image) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE equipment SET name = ?, description = ?, contact = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, contact, image, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  deleteEquipment(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM equipment WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // === RENTAL METHODS ===

  // Új bérlési kérelem létrehozása
  createRental(userId, equipmentId, startDate, endDate, notes = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO rentals (user_id, equipment_id, start_date, end_date, notes, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [userId, equipmentId, startDate, endDate, notes],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // Egy bérlés lekérése ID alapján (felhasználó és gép adataival együtt)
  getRentalById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT r.*,
                u.username, u.email,
                e.name AS equipment_name, e.image AS equipment_image
         FROM rentals r
         JOIN users u ON r.user_id = u.id
         JOIN equipment e ON r.equipment_id = e.id
         WHERE r.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // Összes bérlés lekérése (admin nézethez)
  getAllRentals() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT r.*,
                u.username, u.email,
                e.name AS equipment_name, e.image AS equipment_image
         FROM rentals r
         JOIN users u ON r.user_id = u.id
         JOIN equipment e ON r.equipment_id = e.id
         ORDER BY r.created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Egy felhasználó bérlései
  getRentalsByUserId(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT r.*,
                e.name AS equipment_name, e.image AS equipment_image
         FROM rentals r
         JOIN equipment e ON r.equipment_id = e.id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Egy géphez tartozó bérlések
  getRentalsByEquipmentId(equipmentId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT r.*,
                u.username, u.email
         FROM rentals r
         JOIN users u ON r.user_id = u.id
         WHERE r.equipment_id = ?
         ORDER BY r.created_at DESC`,
        [equipmentId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Bérlés státuszának frissítése (admin)
  updateRentalStatus(id, status) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE rentals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Bérlés törlése (csak admin, vagy a kérelmező ha még 'pending')
  deleteRental(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM rentals WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Ütközésvizsgálat: adott gépre van-e már aktív/függő bérlés a kért időszakban
  checkRentalConflict(equipmentId, startDate, endDate, excludeRentalId = null) {
    return new Promise((resolve, reject) => {
      const excludeClause = excludeRentalId ? 'AND r.id != ?' : '';
      const params = excludeRentalId
        ? [equipmentId, startDate, endDate, startDate, endDate, excludeRentalId]
        : [equipmentId, startDate, endDate, startDate, endDate];

      this.db.get(
        `SELECT COUNT(*) as count FROM rentals r
         WHERE r.equipment_id = ?
           AND r.status IN ('pending', 'active')
           AND (
             (r.start_date <= ? AND r.end_date >= ?) OR
             (r.start_date <= ? AND r.end_date >= ?) OR
             (r.start_date >= ? AND r.end_date <= ?)
           )
           ${excludeClause}`,
        [...params, startDate, endDate],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count > 0);
        }
      );
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

module.exports = Database;