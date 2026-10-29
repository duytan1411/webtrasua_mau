/**
 * =========================================================================
 * BACKEND SERVER CHO CỔNG ĐẶT TRÀ SỮA SINH VIÊN (IMT MILK TEA) & ADMIN PORTAL
 * =========================================================================
 * - Cơ sở dữ liệu: SQLite (sử dụng thư viện chuẩn node:sqlite native của Node.js)
 * - File database: imt_teashop.db
 * - Phân quyền người dùng: cột `admin` (1: Quản trị viên toàn năng, 0: Khách hàng)
 * - Tài khoản Admin mặc định: tk: admin | mk: 1
 * - Bảo mật mật khẩu: Thuật toán mã hóa băm Scrypt (Salt 16 bytes + Scrypt 64 bytes)
 * - Quản trị toàn năng: Dashboard, Khách hàng, Thực đơn/Sản phẩm, Đơn hàng, Database SQLite
 * =========================================================================
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'imt_teashop.db');

// Khởi tạo kết nối SQLite
const db = new DatabaseSync(DB_FILE);

// =========================================================================
// 1. KHỞI TẠO CẤU TRÚC BẢNG DATABASE (SCHEMA & MIGRATION)
// =========================================================================
function initDatabase() {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Bảng 1: Người dùng / Sinh viên (có cột admin = 1 hoặc 0)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mssv TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      admin INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // Migration an toàn nếu bảng users đã tồn tại từ trước mà chưa có cột admin
  try {
    db.exec('ALTER TABLE users ADD COLUMN admin INTEGER DEFAULT 0;');
  } catch (e) {
    // Cột đã tồn tại
  }

  // Bảng 2: Sản phẩm / Thực đơn trà sữa (Cho phép Admin Thêm, Sửa, Xóa)
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      tag TEXT DEFAULT '',
      desc TEXT DEFAULT '',
      cup_color TEXT DEFAULT '#d4a373',
      bg TEXT DEFAULT 'linear-gradient(135deg, #fdf3e7 0%, #f3d5b5 100%)',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // Bảng 3: Lịch sử đặt hàng theo tài khoản người dùng
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      mssv TEXT NOT NULL,
      full_name TEXT NOT NULL,
      drink_name TEXT NOT NULL,
      size TEXT NOT NULL,
      sugar TEXT NOT NULL,
      ice TEXT NOT NULL,
      note TEXT DEFAULT '',
      order_time TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  // Bảng 4: Quản lý phiên đăng nhập (Sessions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      mssv TEXT NOT NULL,
      full_name TEXT NOT NULL,
      admin INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  try {
    db.exec('ALTER TABLE sessions ADD COLUMN admin INTEGER DEFAULT 0;');
  } catch (e) {}

  seedInitialData();
}

// =========================================================================
// 2. MÃ HÓA BẢO MẬT MẬT KHẨU (SCRYPT HASHING)
// =========================================================================
function hashPassword(plainPassword, salt) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(plainPassword, storedHash, storedSalt) {
  try {
    const testHash = crypto.scryptSync(plainPassword, storedSalt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch (err) {
    return false;
  }
}

// =========================================================================
// 3. TẠO DỮ LIỆU MẪU BAN ĐẦU & TÀI KHOẢN ADMIN
// =========================================================================
function seedInitialData() {
  // 3.1. Đảm bảo tài khoản ADMIN (tk: admin, mk: 1, admin: 1) luôn tồn tại
  const adminUser = db.prepare('SELECT id, admin FROM users WHERE mssv = ?').get('admin');
  if (!adminUser) {
    console.log('[SQLite] Đang tạo tài khoản ADMIN (admin / 1) trên Database...');
    const adminAuth = hashPassword('1');
    db.prepare(`
      INSERT INTO users (mssv, full_name, password_hash, salt, admin, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run('admin', 'Quản Trị Viên Hệ Thống', adminAuth.hash, adminAuth.salt, new Date().toISOString());
  } else if (adminUser.admin !== 1) {
    db.prepare('UPDATE users SET admin = 1 WHERE mssv = ?').run('admin');
  }

  // 3.2. Tạo 2 tài khoản sinh viên mẫu (admin: 0) nếu chưa có
  const normalUserCount = db.prepare('SELECT COUNT(*) AS count FROM users WHERE admin = 0').get().count;
  if (normalUserCount === 0) {
    console.log('[SQLite] Đang tạo tài khoản khách hàng / sinh viên mẫu...');
    const insertUser = db.prepare(`
      INSERT INTO users (mssv, full_name, password_hash, salt, admin, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
    const acc1 = hashPassword('123456');
    insertUser.run('20012345', 'Nguyễn Văn An', acc1.hash, acc1.salt, new Date().toISOString());

    const acc2 = hashPassword('123456');
    insertUser.run('20067890', 'Trần Thị Bích', acc2.hash, acc2.salt, new Date().toISOString());
  }

  // 3.3. Nạp danh mục sản phẩm trà sữa ban đầu vào SQLite
  const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
  if (productCount === 0) {
    console.log('[SQLite] Đang nạp danh mục sản phẩm vào bảng products...');
    const defaultProducts = [
      { name: "Trà sữa truyền thống", price: "25.000đ", tag: "Bán chạy", bg: "linear-gradient(135deg, #fdf3e7 0%, #f3d5b5 100%)", cupColor: "#d4a373", desc: "Hương vị hồng trà truyền thống hòa quyện cùng sữa béo thơm dịu." },
      { name: "Trà sữa trân châu đen", price: "30.000đ", tag: "Signature", bg: "linear-gradient(135deg, #faedcd 0%, #e6ccb2 100%)", cupColor: "#b08968", desc: "Trà sữa đậm vị kết hợp trân châu đường đen nấu ấm dẻo mềm." },
      { name: "Trà sữa matcha", price: "35.000đ", tag: "Yêu thích", bg: "linear-gradient(135deg, #e9f5db 0%, #cfe1b9 100%)", cupColor: "#71a95a", desc: "Bột trà xanh Matcha Nhật Bản thanh mát pha chút sữa tươi béo nhẹ." },
      { name: "Trà sữa khoai môn", price: "32.000đ", tag: "Thơm bùi", bg: "linear-gradient(135deg, #f3e8ff 0%, #ddd6fe 100%)", cupColor: "#9d7cd8", desc: "Hương khoai môn tím thơm bùi tự nhiên, vị ngọt dịu dễ uống." },
      { name: "Trà sữa socola", price: "32.000đ", tag: "Đậm đà", bg: "linear-gradient(135deg, #f5ebe0 0%, #d5bdaf 100%)", cupColor: "#7f5539", desc: "Vị socola nguyên chất đậm đà hòa quyện cùng kem sữa mịn màng." },
      { name: "Hồng trà sữa", price: "28.000đ", tag: "Truyền thống", bg: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)", cupColor: "#c26d38", desc: "Cốt hồng trà ủ lạnh thơm nồng với hậu vị ngọt thanh tao nhã." },
      { name: "Trà sữa thái xanh", price: "30.000đ", tag: "Thanh mát", bg: "linear-gradient(135deg, #d8f3dc 0%, #b7e4c7 100%)", cupColor: "#40916c", desc: "Hương trà thảo mộc Thái Lan đặc trưng, sắc xanh bắt mắt." },
      { name: "Trà sữa Oolong", price: "33.000đ", tag: "Cao cấp", bg: "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)", cupColor: "#d99b26", desc: "Trà Oolong cao sơn rang thơm kết hợp sữa tươi chuẩn vị." }
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (name, price, tag, desc, cup_color, bg, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const now = new Date().toISOString();
    for (const p of defaultProducts) {
      insertProd.run(p.name, p.price, p.tag, p.desc, p.cupColor, p.bg, now);
    }
  }

  // 3.4. Nạp đơn hàng mẫu cộng đồng nếu rỗng
  const orderCount = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
  if (orderCount === 0) {
    console.log('[SQLite] Đang nạp đơn hàng mẫu vào bảng orders...');
    const user1 = db.prepare('SELECT id FROM users WHERE mssv = ?').get('20012345');
    const uId = user1 ? user1.id : 1;

    const sampleOrders = [
      { id: "mau-1", mssv: "20011001", fullName: "Nguyễn Minh Anh", drink: "Trà sữa trân châu đen", size: "L", sugar: "50%", ice: "ít", note: "Thêm trân châu", time: "08:15 29/10/2026", createdAt: "2026-10-29T08:15:00.000Z" },
      { id: "mau-2", mssv: "20011002", fullName: "Trần Hoàng Nam", drink: "Trà sữa truyền thống", size: "M", sugar: "100%", ice: "bình thường", note: "", time: "08:30 29/10/2026", createdAt: "2026-10-29T08:30:00.000Z" },
      { id: "mau-3", mssv: "20011003", fullName: "Lê Thu Hà", drink: "Trà sữa matcha", size: "L", sugar: "50%", ice: "ít", note: "Ít ngọt", time: "09:05 29/10/2026", createdAt: "2026-10-29T09:05:00.000Z" },
      { id: "mau-4", mssv: "20011004", fullName: "Phạm Quốc Bảo", drink: "Trà sữa Oolong", size: "M", sugar: "0%", ice: "bình thường", note: "Không đường", time: "09:20 29/10/2026", createdAt: "2026-10-29T09:20:00.000Z" },
      { id: "mau-5", mssv: "20011005", fullName: "Võ Thanh Trúc", drink: "Trà sữa khoai môn", size: "M", sugar: "50%", ice: "không", note: "Lấy liền", time: "09:45 29/10/2026", createdAt: "2026-10-29T09:45:00.000Z" },
      { id: "mau-6", mssv: "20011006", fullName: "Đặng Gia Huy", drink: "Trà sữa trân châu đen", size: "L", sugar: "100%", ice: "bình thường", note: "", time: "10:10 29/10/2026", createdAt: "2026-10-29T10:10:00.000Z" },
      { id: "mau-7", mssv: "20011007", fullName: "Bùi Ngọc Linh", drink: "Hồng trà sữa", size: "M", sugar: "50%", ice: "ít", note: "", time: "10:35 29/10/2026", createdAt: "2026-10-29T10:35:00.000Z" },
      { id: "mau-8", mssv: "20011008", fullName: "Hoàng Văn Kiên", drink: "Trà sữa thái xanh", size: "L", sugar: "100%", ice: "bình thường", note: "Đá để riêng", time: "11:00 29/10/2026", createdAt: "2026-10-29T11:00:00.000Z" }
    ];

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, user_id, mssv, full_name, drink_name, size, sugar, ice, note, order_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of sampleOrders) {
      insertOrder.run(item.id, uId, item.mssv, item.fullName, item.drink, item.size, item.sugar, item.ice, item.note, item.time, item.createdAt);
    }
  }
}

initDatabase();

// =========================================================
// 4. TIỆN ÍCH HELPER XỬ LÝ REQUEST & AUTH
// =========================================================
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload quá lớn (giới hạn 2MB)'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Dữ liệu JSON không hợp lệ'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function getAuthSession(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const session = db.prepare(`
    SELECT s.token, s.user_id, s.mssv, s.full_name, u.full_name AS db_full_name, u.admin
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token);

  if (!session) return null;
  return {
    token: session.token,
    userId: session.user_id,
    mssv: session.mssv,
    fullName: session.db_full_name || session.full_name,
    admin: session.admin === 1
  };
}

// =========================================================================
// 5. MÁY CHỦ HTTP & REST API ENDPOINTS
// =========================================================================
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  try {
    // -------------------------------------------------------------
    // [PUBLIC] LẤY DANH MỤC SẢN PHẨM (CHO INDEX.HTML & ADMIN)
    // -------------------------------------------------------------
    if (pathname === '/api/products' && req.method === 'GET') {
      const rows = db.prepare(`
        SELECT id, name, price, tag, desc, cup_color AS cupColor, bg, is_active
        FROM products
        WHERE is_active = 1
        ORDER BY id ASC
      `).all();
      return sendJson(res, 200, { success: true, products: rows });
    }

    // -------------------------------------------------------------
    // API: ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG (Mặc định admin = 0)
    // -------------------------------------------------------------
    if (pathname === '/api/register' && req.method === 'POST') {
      const { mssv, password, fullName } = await parseJsonBody(req);

      if (!mssv || !password || !fullName) {
        return sendJson(res, 400, { success: false, message: 'Vui lòng điền đầy đủ MSSV, Mật khẩu và Họ tên!' });
      }
      if (password.length < 4) {
        return sendJson(res, 400, { success: false, message: 'Mật khẩu phải có tối thiểu 4 ký tự.' });
      }

      const cleanMSSV = mssv.trim();
      const cleanName = fullName.trim();

      const existing = db.prepare('SELECT id FROM users WHERE mssv = ?').get(cleanMSSV);
      if (existing) {
        return sendJson(res, 400, { success: false, message: 'Mã số sinh viên (MSSV) này đã tồn tại trong hệ thống!' });
      }

      const { hash, salt } = hashPassword(password);
      const now = new Date().toISOString();

      const insertResult = db.prepare(`
        INSERT INTO users (mssv, full_name, password_hash, salt, admin, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
      `).run(cleanMSSV, cleanName, hash, salt, now);

      const userId = Number(insertResult.lastInsertRowid);
      const token = crypto.randomBytes(32).toString('hex');

      db.prepare(`
        INSERT INTO sessions (token, user_id, mssv, full_name, admin, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
      `).run(token, userId, cleanMSSV, cleanName, now);

      return sendJson(res, 201, {
        success: true,
        message: 'Đăng ký tài khoản thành công!',
        token,
        user: { mssv: cleanMSSV, fullName: cleanName, admin: 0 }
      });
    }

    // -------------------------------------------------------------
    // API: ĐĂNG NHẬP (TRẢ VỀ ADMIN = 1 HOẶC 0)
    // -------------------------------------------------------------
    if (pathname === '/api/login' && req.method === 'POST') {
      const { mssv, password } = await parseJsonBody(req);

      if (!mssv || !password) {
        return sendJson(res, 400, { success: false, message: 'Vui lòng nhập tên đăng nhập / MSSV và Mật khẩu!' });
      }

      const cleanMSSV = mssv.trim();
      const user = db.prepare(`
        SELECT id, mssv, full_name, password_hash, salt, admin FROM users WHERE mssv = ?
      `).get(cleanMSSV);

      if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
        return sendJson(res, 401, { success: false, message: 'Tên đăng nhập / MSSV hoặc mật khẩu không chính xác!' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO sessions (token, user_id, mssv, full_name, admin, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(token, user.id, user.mssv, user.full_name, user.admin, now);

      return sendJson(res, 200, {
        success: true,
        message: 'Đăng nhập thành công!',
        token,
        user: {
          id: user.id,
          mssv: user.mssv,
          fullName: user.full_name,
          admin: user.admin === 1 ? 1 : 0
        }
      });
    }

    // -------------------------------------------------------------
    // API: LẤY THÔNG TIN PHIÊN ĐĂNG NHẬP HIỆN TẠI
    // -------------------------------------------------------------
    if (pathname === '/api/me' && req.method === 'GET') {
      const session = getAuthSession(req);
      if (!session) {
        return sendJson(res, 401, { success: false, message: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' });
      }
      return sendJson(res, 200, {
        success: true,
        user: {
          userId: session.userId,
          mssv: session.mssv,
          fullName: session.fullName,
          admin: session.admin ? 1 : 0
        }
      });
    }

    // -------------------------------------------------------------
    // API: ĐĂNG XUẤT
    // -------------------------------------------------------------
    if (pathname === '/api/logout' && req.method === 'POST') {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      }
      return sendJson(res, 200, { success: true, message: 'Đã đăng xuất.' });
    }

    // -------------------------------------------------------------
    // API: ĐƠN HÀNG CÁ NHÂN & CỘNG ĐỒNG
    // -------------------------------------------------------------
    if (pathname === '/api/orders/mine' && req.method === 'GET') {
      const session = getAuthSession(req);
      if (!session) {
        return sendJson(res, 401, { success: false, message: 'Vui lòng đăng nhập để xem đơn hàng.' });
      }

      const rows = db.prepare(`
        SELECT id, drink_name AS drink, size, sugar, ice, note, order_time AS time, created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at ASC
      `).all(session.userId);

      return sendJson(res, 200, { success: true, orders: rows });
    }

    if (pathname === '/api/orders/mine' && req.method === 'DELETE') {
      const session = getAuthSession(req);
      if (!session) return sendJson(res, 401, { success: false, message: 'Vui lòng đăng nhập.' });

      db.prepare('DELETE FROM orders WHERE user_id = ?').run(session.userId);
      return sendJson(res, 200, { success: true, message: 'Đã xóa toàn bộ lịch sử cá nhân.' });
    }

    if (pathname === '/api/orders/community' && req.method === 'GET') {
      const rows = db.prepare(`
        SELECT id, (full_name || ' (' || mssv || ')') AS userName, drink_name AS drink, size, sugar, ice, note, order_time AS time, created_at
        FROM orders
        ORDER BY created_at ASC
      `).all();

      return sendJson(res, 200, { success: true, orders: rows });
    }

    if (pathname === '/api/orders' && req.method === 'POST') {
      const session = getAuthSession(req);
      if (!session) return sendJson(res, 401, { success: false, message: 'Vui lòng đăng nhập trước khi order!' });

      const { drink, size, sugar, ice, note, time } = await parseJsonBody(req);
      if (!drink || !size) return sendJson(res, 400, { success: false, message: 'Thông tin đơn không hợp lệ.' });

      const orderId = 'order-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const now = new Date().toISOString();
      const displayTime = time || new Date().toLocaleString('vi-VN');

      db.prepare(`
        INSERT INTO orders (id, user_id, mssv, full_name, drink_name, size, sugar, ice, note, order_time, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        session.userId,
        session.mssv,
        session.fullName,
        drink,
        size,
        sugar || '100%',
        ice || 'bình thường',
        note || '',
        displayTime,
        now
      );

      return sendJson(res, 201, {
        success: true,
        message: 'Đã lưu đơn vào SQLite!',
        order: {
          id: orderId,
          userName: session.fullName + ' (' + session.mssv + ')',
          drink,
          size,
          sugar: sugar || '100%',
          ice: ice || 'bình thường',
          note: note || '',
          time: displayTime
        }
      });
    }

    // =============================================================
    // CÁC API QUẢN TRỊ ADMIN (YÊU CẦU QUYỀN ADMIN = 1)
    // =============================================================
    const isAdminRoute = pathname.startsWith('/api/admin/');
    if (isAdminRoute) {
      const session = getAuthSession(req);
      if (!session || !session.admin) {
        return sendJson(res, 403, {
          success: false,
          message: 'Từ chối truy cập! Thao tác này chỉ dành riêng cho tài khoản Quản trị viên (admin=1).'
        });
      }

      // -----------------------------------------------------------
      // ADMIN: DASHBOARD TỔNG QUAN
      // -----------------------------------------------------------
      if (pathname === '/api/admin/dashboard' && req.method === 'GET') {
        const totalUsers = db.prepare('SELECT COUNT(*) AS count FROM users WHERE admin = 0').get().count;
        const totalAdmins = db.prepare('SELECT COUNT(*) AS count FROM users WHERE admin = 1').get().count;
        const totalOrders = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
        const totalProducts = db.prepare('SELECT COUNT(*) AS count FROM products WHERE is_active = 1').get().count;

        // Ước tính doanh thu từ bảng orders và bảng products
        const ordersWithPrice = db.prepare(`
          SELECT o.drink_name, p.price
          FROM orders o
          LEFT JOIN products p ON o.drink_name = p.name
        `).all();

        let estimatedRevenue = 0;
        for (const item of ordersWithPrice) {
          if (item.price) {
            const num = parseInt(item.price.replace(/[^\d]/g, ''), 10);
            if (!isNaN(num)) estimatedRevenue += num;
          } else {
            estimatedRevenue += 30000; // Giá trung bình mặc định
          }
        }

        // Top 5 món bán chạy nhất
        const topDrinks = db.prepare(`
          SELECT drink_name, COUNT(*) AS count
          FROM orders
          GROUP BY drink_name
          ORDER BY count DESC
          LIMIT 5
        `).all();

        // 8 đơn hàng mới nhất
        const recentOrders = db.prepare(`
          SELECT id, mssv, full_name, drink_name, size, sugar, ice, note, order_time, created_at
          FROM orders
          ORDER BY created_at DESC
          LIMIT 8
        `).all();

        // 5 khách hàng mới nhất
        const recentCustomers = db.prepare(`
          SELECT id, mssv, full_name, created_at
          FROM users
          WHERE admin = 0
          ORDER BY id DESC
          LIMIT 5
        `).all();

        return sendJson(res, 200, {
          success: true,
          stats: {
            totalUsers,
            totalAdmins,
            totalOrders,
            totalProducts,
            estimatedRevenue,
            topDrinks,
            recentOrders,
            recentCustomers
          }
        });
      }

      // -----------------------------------------------------------
      // ADMIN: QUẢN LÝ KHÁCH HÀNG / TÀI KHOẢN
      // -----------------------------------------------------------
      if (pathname === '/api/admin/users' && req.method === 'GET') {
        const rows = db.prepare(`
          SELECT u.id, u.mssv, u.full_name, u.admin, u.created_at,
                 COUNT(o.id) AS total_orders
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id
          GROUP BY u.id
          ORDER BY u.admin DESC, u.id ASC
        `).all();

        return sendJson(res, 200, { success: true, users: rows });
      }

      // Xem chi tiết lịch sử mua hàng của 1 khách hàng theo MSSV
      if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/orders') && req.method === 'GET') {
        const mssvTarget = pathname.replace('/api/admin/users/', '').replace('/orders', '').trim();
        const customer = db.prepare('SELECT id, mssv, full_name, admin, created_at FROM users WHERE mssv = ?').get(mssvTarget);
        if (!customer) {
          return sendJson(res, 404, { success: false, message: 'Không tìm thấy người dùng này.' });
        }

        const orders = db.prepare(`
          SELECT id, drink_name AS drink, size, sugar, ice, note, order_time AS time, created_at
          FROM orders
          WHERE mssv = ?
          ORDER BY created_at DESC
        `).all(mssvTarget);

        return sendJson(res, 200, { success: true, customer, orders });
      }

      // Cập nhật quyền Admin (1 hoặc 0) cho tài khoản
      if (pathname.match(/^\/api\/admin\/users\/(\d+)\/role$/) && req.method === 'PUT') {
        const userId = parseInt(pathname.split('/')[4], 10);
        const { adminRole } = await parseJsonBody(req);

        const targetUser = db.prepare('SELECT id, mssv FROM users WHERE id = ?').get(userId);
        if (!targetUser) return sendJson(res, 404, { success: false, message: 'Người dùng không tồn tại.' });

        // Không cho phép tước quyền của tài khoản admin gốc
        if (targetUser.mssv === 'admin' && adminRole === 0) {
          return sendJson(res, 400, { success: false, message: 'Không thể tước quyền Quản trị viên của tài khoản admin mặc định!' });
        }

        db.prepare('UPDATE users SET admin = ? WHERE id = ?').run(adminRole === 1 ? 1 : 0, userId);
        return sendJson(res, 200, { success: true, message: 'Đã cập nhật quyền thành công.' });
      }

      // Xóa tài khoản khách hàng
      if (pathname.match(/^\/api\/admin\/users\/(\d+)$/) && req.method === 'DELETE') {
        const userId = parseInt(pathname.split('/')[4], 10);
        const targetUser = db.prepare('SELECT id, mssv FROM users WHERE id = ?').get(userId);
        if (!targetUser) return sendJson(res, 404, { success: false, message: 'Người dùng không tồn tại.' });

        if (targetUser.mssv === 'admin') {
          return sendJson(res, 400, { success: false, message: 'Không thể xóa tài khoản admin gốc của hệ thống!' });
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        return sendJson(res, 200, { success: true, message: 'Đã xóa người dùng và toàn bộ dữ liệu liên quan.' });
      }

      // -----------------------------------------------------------
      // ADMIN: QUẢN LÝ SẢN PHẨM / THỰC ĐƠN (THÊM, SỬA, XÓA)
      // -----------------------------------------------------------
      if (pathname === '/api/admin/products' && req.method === 'GET') {
        const rows = db.prepare(`
          SELECT id, name, price, tag, desc, cup_color AS cupColor, bg, is_active, created_at
          FROM products
          ORDER BY id ASC
        `).all();
        return sendJson(res, 200, { success: true, products: rows });
      }

      if (pathname === '/api/admin/products' && req.method === 'POST') {
        const { name, price, tag, desc, cupColor, bg } = await parseJsonBody(req);
        if (!name || !price) {
          return sendJson(res, 400, { success: false, message: 'Tên sản phẩm và Giá tiền không được để trống!' });
        }

        const now = new Date().toISOString();
        const resInsert = db.prepare(`
          INSERT INTO products (name, price, tag, desc, cup_color, bg, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        `).run(
          name.trim(),
          price.trim(),
          (tag || '').trim(),
          (desc || '').trim(),
          cupColor || '#d4a373',
          bg || 'linear-gradient(135deg, #fdf3e7 0%, #f3d5b5 100%)',
          now
        );

        return sendJson(res, 201, {
          success: true,
          message: 'Thêm sản phẩm trà sữa mới thành công!',
          productId: Number(resInsert.lastInsertRowid)
        });
      }

      if (pathname.match(/^\/api\/admin\/products\/(\d+)$/) && req.method === 'PUT') {
        const prodId = parseInt(pathname.split('/')[4], 10);
        const { name, price, tag, desc, cupColor, bg, isActive } = await parseJsonBody(req);

        const current = db.prepare('SELECT id FROM products WHERE id = ?').get(prodId);
        if (!current) return sendJson(res, 404, { success: false, message: 'Sản phẩm không tồn tại.' });

        db.prepare(`
          UPDATE products
          SET name = ?, price = ?, tag = ?, desc = ?, cup_color = ?, bg = ?, is_active = ?
          WHERE id = ?
        `).run(
          name ? name.trim() : '',
          price ? price.trim() : '',
          tag ? tag.trim() : '',
          desc ? desc.trim() : '',
          cupColor || '#d4a373',
          bg || 'linear-gradient(135deg, #fdf3e7 0%, #f3d5b5 100%)',
          isActive !== undefined ? (isActive ? 1 : 0) : 1,
          prodId
        );

        return sendJson(res, 200, { success: true, message: 'Đã cập nhật sản phẩm thành công!' });
      }

      if (pathname.match(/^\/api\/admin\/products\/(\d+)$/) && req.method === 'DELETE') {
        const prodId = parseInt(pathname.split('/')[4], 10);
        db.prepare('DELETE FROM products WHERE id = ?').run(prodId);
        return sendJson(res, 200, { success: true, message: 'Đã xóa sản phẩm khỏi thực đơn.' });
      }

      // -----------------------------------------------------------
      // ADMIN: QUẢN LÝ ĐƠN HÀNG TOÀN HỆ THỐNG
      // -----------------------------------------------------------
      if (pathname === '/api/admin/orders' && req.method === 'GET') {
        const rows = db.prepare(`
          SELECT id, mssv, full_name, drink_name, size, sugar, ice, note, order_time, created_at
          FROM orders
          ORDER BY created_at DESC
        `).all();

        return sendJson(res, 200, { success: true, orders: rows });
      }

      if (pathname.match(/^\/api\/admin\/orders\/(.+)$/) && req.method === 'DELETE') {
        const orderId = pathname.replace('/api/admin/orders/', '').trim();
        db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
        return sendJson(res, 200, { success: true, message: 'Đã xóa đơn hàng.' });
      }

      // -----------------------------------------------------------
      // ADMIN: QUẢN TRỊ TOÀN NĂNG CƠ SỞ DỮ LIỆU SQLITE
      // -----------------------------------------------------------
      if (pathname === '/api/admin/database/tables' && req.method === 'GET') {
        const tables = ['users', 'products', 'orders', 'sessions'];
        const info = tables.map(tbl => {
          const count = db.prepare(`SELECT COUNT(*) AS count FROM ${tbl}`).get().count;
          const cols = db.prepare(`PRAGMA table_info(${tbl})`).all().map(c => ({
            name: c.name,
            type: c.type,
            pk: c.pk === 1,
            notnull: c.notnull === 1
          }));
          return { table: tbl, count, columns: cols };
        });

        let fileSize = 0;
        try {
          fileSize = fs.statSync(DB_FILE).size;
        } catch (e) {}

        return sendJson(res, 200, {
          success: true,
          dbPath: DB_FILE,
          fileSize: (fileSize / 1024).toFixed(1) + ' KB',
          tables: info
        });
      }

      // Xem dữ liệu raw trực tiếp của 1 bảng
      if (pathname.startsWith('/api/admin/database/table/') && req.method === 'GET') {
        const tblName = pathname.replace('/api/admin/database/table/', '').trim();
        const allowedTables = ['users', 'products', 'orders', 'sessions'];
        if (!allowedTables.includes(tblName)) {
          return sendJson(res, 400, { success: false, message: 'Bảng không hợp lệ.' });
        }

        // Lấy 200 dòng mới nhất
        let rows = [];
        if (tblName === 'users') {
          // Ẩn bớt độ dài hash để hiển thị gọn gàng
          rows = db.prepare(`
            SELECT id, mssv, full_name, admin,
                   (substr(password_hash, 1, 16) || '...') AS password_hash_preview,
                   salt, created_at
            FROM users
            ORDER BY id ASC
          `).all();
        } else {
          rows = db.prepare(`SELECT * FROM ${tblName} LIMIT 200`).all();
        }

        return sendJson(res, 200, { success: true, table: tblName, rows });
      }
    }

    // -------------------------------------------------------------
    // PHỤC VỤ CÁC FILE TĨNH (STATIC FILES) & ROUTE /admin
    // -------------------------------------------------------------
    let filePath;
    if (pathname === '/admin' || pathname === '/admin.html') {
      filePath = path.join(__dirname, 'admin.html');
    } else if (pathname === '/' || pathname === '/index.html') {
      filePath = path.join(__dirname, 'index.html');
    } else {
      filePath = path.join(__dirname, pathname);
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.md': 'text/markdown; charset=utf-8'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);

  } catch (err) {
    console.error('[Server Error]', err);
    sendJson(res, 500, { success: false, message: 'Lỗi máy chủ nội bộ: ' + err.message });
  }
});

server.listen(PORT, () => {
  console.log('================================================================');
  console.log(`🚀 IMT MILK TEA SERVER ĐANG CHẠY: http://localhost:${PORT}`);
  console.log(`🛡️ CỔNG QUẢN TRỊ ADMIN PORTAL:   http://localhost:${PORT}/admin`);
  console.log(`🔑 TÀI KHOẢN ADMIN:               tk: admin | mk: 1 (admin=1)`);
  console.log(`📁 File Cơ sở dữ liệu SQLite:     ${DB_FILE}`);
  console.log(`🔒 Chuẩn mã hóa mật khẩu:         Scrypt Hashing (Salt + 64 bytes)`);
  console.log('================================================================');
});
