const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads mappa létrehozása
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Multer konfiguráció képfeltöltéshez
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Csak képfájlok engedélyezettek (JPG, PNG, GIF, WebP)'));
  }
});

const db = new Database();

// === MIDDLEWARE ===

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Hozzáférés megtagadva - Token hiányzik' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification error:', err.message);
      return res.status(403).json({ error: 'Érvénytelen vagy lejárt token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin jogosultság szükséges' });
  }
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'A fájl túl nagy (max 5MB)' });
    }
    return res.status(400).json({ error: 'Fájlfeltöltési hiba: ' + err.message });
  }
  
  res.status(500).json({ error: err.message || 'Szerver hiba történt' });
};

// === AUTH ROUTES ===

// Regisztráció
app.post('/api/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validáció
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Minden mező kitöltése kötelező' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'A felhasználónévnek legalább 3 karakter hosszúnak kell lennie' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A jelszónak legalább 6 karakter hosszúnak kell lennie' });
    }

    // Email formátum ellenőrzés
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Érvénytelen email formátum' });
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Ez az email cím már használatban van' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await db.createUser(username, email, hashedPassword, 'user');

    const token = jwt.sign({ id: userId, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });

    console.log(`✅ Új felhasználó regisztrálva: ${email}`);

    res.status(201).json({
      token,
      user: { id: userId, username, email, role: 'user' }
    });
  } catch (error) {
    next(error);
  }
});

// Bejelentkezés
app.post('/api/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email és jelszó megadása kötelező' });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      console.log(`❌ Sikertelen bejelentkezés: ${email} - Felhasználó nem létezik`);
      return res.status(401).json({ error: 'Hibás email vagy jelszó' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`❌ Sikertelen bejelentkezés: ${email} - Hibás jelszó`);
      return res.status(401).json({ error: 'Hibás email vagy jelszó' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    console.log(`✅ Sikeres bejelentkezés: ${email} (${user.role})`);

    res.json({
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (error) {
    next(error);
  }
});

// Aktuális felhasználó lekérése
app.get('/api/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Felhasználó nem található' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
});

// === EQUIPMENT ROUTES ===

// Összes gép lekérése (publikus)
app.get('/api/equipment', async (req, res, next) => {
  try {
    const equipment = await db.getAllEquipment();
    res.json(equipment);
  } catch (error) {
    next(error);
  }
});

// Egy gép lekérése
app.get('/api/equipment/:id', async (req, res, next) => {
  try {
    const equipment = await db.getEquipmentById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ error: 'Gép nem található' });
    }
    res.json(equipment);
  } catch (error) {
    next(error);
  }
});

// Új gép hozzáadása (csak admin)
app.post('/api/equipment', authenticateToken, requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { name, description, contact } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !description || !contact) {
      return res.status(400).json({ error: 'Minden mező kitöltése kötelező' });
    }

    if (name.length < 3) {
      return res.status(400).json({ error: 'A gép nevének legalább 3 karakter hosszúnak kell lennie' });
    }

    const id = await db.createEquipment(name, description, contact, image);
    const equipment = await db.getEquipmentById(id);
    
    console.log(`✅ Új gép hozzáadva: ${name} (ID: ${id})`);
    
    res.status(201).json(equipment);
  } catch (error) {
    next(error);
  }
});

// Gép módosítása (csak admin)
app.put('/api/equipment/:id', authenticateToken, requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { name, description, contact } = req.body;
    const equipment = await db.getEquipmentById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Gép nem található' });
    }

    if (!name || !description || !contact) {
      return res.status(400).json({ error: 'Minden mező kitöltése kötelező' });
    }

    let image = equipment.image;
    if (req.file) {
      // Régi kép törlése (csak lokális fájlok esetén)
      if (equipment.image && !equipment.image.startsWith('http')) {
        const oldImagePath = path.join(__dirname, equipment.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`🗑️  Régi kép törölve: ${oldImagePath}`);
        }
      }
      image = `/uploads/${req.file.filename}`;
    }

    await db.updateEquipment(req.params.id, name, description, contact, image);
    const updated = await db.getEquipmentById(req.params.id);
    
    console.log(`✅ Gép módosítva: ${name} (ID: ${req.params.id})`);
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Gép törlése (csak admin)
app.delete('/api/equipment/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const equipment = await db.getEquipmentById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Gép nem található' });
    }

    // Kép törlése (csak lokális fájlok esetén)
    if (equipment.image && !equipment.image.startsWith('http')) {
      const imagePath = path.join(__dirname, equipment.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`🗑️  Kép törölve: ${imagePath}`);
      }
    }

    await db.deleteEquipment(req.params.id);
    
    console.log(`🗑️  Gép törölve: ${equipment.name} (ID: ${req.params.id})`);
    
    res.json({ message: 'Gép sikeresen törölve' });
  } catch (error) {
    next(error);
  }
});

// === USER MANAGEMENT (Admin only) ===

// Összes felhasználó
app.get('/api/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const users = await db.getAllUsers();
    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      created_at: u.created_at
    })));
  } catch (error) {
    next(error);
  }
});

// Felhasználó törlése
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Nem törölheted a saját fiókodat' });
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Felhasználó nem található' });
    }

    await db.deleteUser(userId);
    
    console.log(`🗑️  Felhasználó törölve: ${user.email} (ID: ${userId})`);
    
    res.json({ message: 'Felhasználó sikeresen törölve' });
  } catch (error) {
    next(error);
  }
});

// Felhasználó szerepkör módosítása
app.post('/api/users/:id/role', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = parseInt(req.params.id);
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Érvénytelen szerepkör. Csak "user" vagy "admin" lehet.' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Nem módosíthatod a saját szerepkörödet' });
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Felhasználó nem található' });
    }

    await db.updateUserRole(userId, role);
    const updated = await db.getUserById(userId);
    
    console.log(`✅ Felhasználó szerepkör módosítva: ${user.email} -> ${role}`);
    
    res.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role
    });
  } catch (error) {
    next(error);
  }
});

// === UTILITY ROUTES ===

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'NehézGép Bérlés API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      equipment: 'GET /api/equipment',
      login: 'POST /api/login',
      register: 'POST /api/register',
      me: 'GET /api/me (protected)'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint nem található',
    path: req.path,
    method: req.method
  });
});

// Error handler (ez legyen az utolsó middleware)
app.use(errorHandler);

// Szerver indítása
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════');
      console.log('  🚀 NehézGép Bérlés Backend Server');
      console.log('═══════════════════════════════════════════');
      console.log(`  ✅ Server: http://localhost:${PORT}`);
      console.log(`  📁 Uploads: ${uploadsDir}`);
      console.log(`  🔐 Admin: admin@nehezgep.hu / admin123`);
      console.log('═══════════════════════════════════════════');
    });
  })
  .catch(err => {
    console.error('❌ Database initialization error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Server shutting down...');
  process.exit(0);
});