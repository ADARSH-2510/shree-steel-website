const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createClient } = require('@libsql/client');

function loadEnv(file = path.join(__dirname, '.env')) {
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
      }
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

loadEnv();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SECRET = process.env.SESSION_SECRET;
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!ADMIN_PASSWORD || !SECRET) {
  console.error('Missing ADMIN_PASSWORD or SESSION_SECRET.');
  process.exit(1);
}

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN.');
  process.exit(1);
}

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN
});

const sessions = new Set();

async function initializeDatabase() {
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        brands TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        available INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS brands(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        accent TEXT NOT NULL DEFAULT '#087fe3',
        logo TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0
      )`
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS enquiries(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        product TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'New',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    }
  ]);

  const officialBrands = [
    ['Bangur Cement','CEMENT','Cement products','#d51f28','/assets/brands/bangur-cement.jpeg',1],
    ['Everest','ROOFING SOLUTION','Roofing solutions','#d62b25','/assets/brands/everest-roofing.webp',2],
    ['GK TMT','TMT BARS','TMT reinforcement steel','#e32728','/assets/brands/gk-tmt.jpeg',3],
    ['HIL / BirlaNu','ROOFING SHEETS','Roofing sheets','#1677b8','/assets/brands/hil-birla-nu.png',4],
    ['Jindal Panther','TMT BARS','TMT reinforcement steel','#f57b20','/assets/brands/jindal-panther.png',5],
    ['MSP','TMT BARS · STRUCTURALS · PIPES','TMT bars, structurals and pipes','#27398e','/assets/brands/msp-steel.png',6],
    ['Jindal Cement','CEMENT','Cement products','#27398e','',7],
    ['Jindal Bricks','BRICKS','Construction bricks','#c45732','',8]
  ];

  for (const x of officialBrands) {
    const existing = await db.execute({
      sql: 'SELECT id FROM brands WHERE name=?',
      args: [x[0]]
    });

    if (existing.rows.length) {
      await db.execute({
        sql: 'UPDATE brands SET category=?,description=?,accent=?,logo=?,sort_order=? WHERE name=?',
        args: [x[1], x[2], x[3], x[4], x[5], x[0]]
      });
    } else {
      await db.execute({
        sql: 'INSERT INTO brands(name,category,description,accent,logo,sort_order) VALUES(?,?,?,?,?,?)',
        args: x
      });
    }
  }

  const coreProducts = [
    ['TMT Bars','Steel','MSP, GK TMT, Jindal Panther','Reinforcement steel for strong, durable RCC construction.',1,1],
    ['Cement','Cement','Bangur Cement, Jindal Cement','Trusted cement solutions for foundations, slabs, columns and general construction.',1,2],
    ['Roofing Sheets','Roofing','Everest, HIL / BirlaNu','Roofing options for residential, commercial, agricultural and industrial applications.',1,3],
    ['Structural Steel','Steel','MSP, Jindal Steel & Power','Beams, channels, angles and structural steel for fabrication and construction requirements.',1,4],
    ['Bricks','Masonry','Jindal Bricks','Construction bricks for walls, foundations and building work.',1,5],
    ['Pipes & Steel Products','Steel','MSP','Steel pipes and related steel products for construction and industrial requirements.',1,6]
  ];

  for (const x of coreProducts) {
    const existing = await db.execute({
      sql: 'SELECT id FROM products WHERE name=?',
      args: [x[0]]
    });

    if (existing.rows.length) {
  await db.execute({
    sql: `
      UPDATE products
      SET category=?,
          brands=?,
          description=?,
          sort_order=?
      WHERE name=?
    `,
    args: [
      x[1],
      x[2],
      x[3],
      x[5],
      x[0]
    ]
  });
} else {
      await db.execute({
        sql: 'INSERT INTO products(name,category,brands,description,available,sort_order) VALUES(?,?,?,?,?,?)',
        args: x
      });
    }
  }
}

function send(res, status, obj, headers = {}) {
  const b = Buffer.from(
    typeof obj === 'string' ? obj : JSON.stringify(obj)
  );

  res.writeHead(status, {
    'Content-Type':
      typeof obj === 'string'
        ? 'text/plain; charset=utf-8'
        : 'application/json; charset=utf-8',
    'Content-Length': b.length,
    ...headers
  });

  res.end(b);
}

function body(req) {
  return new Promise((resolve, reject) => {
    let d = '';

    req.on('data', c => {
      d += c;
      if (d.length > 2e6) req.destroy();
    });

    req.on('end', () => {
      try {
        resolve(d ? JSON.parse(d) : {});
      } catch {
        resolve({});
      }
    });

    req.on('error', reject);
  });
}

function sig(v) {
  return crypto.createHmac('sha256', SECRET).update(v).digest('hex');
}

function admin(req) {
  const c = req.headers.cookie || '';
  const x = c
    .split(';')
    .map(s => s.trim())
    .find(s => s.startsWith('ss_admin='));

  if (!x) return false;

  const token = decodeURIComponent(x.slice(9));
  return sessions.has(token);
}

function need(req, res) {
  if (!admin(req)) {
    send(res, 401, { error: 'Unauthorized' });
    return false;
  }

  return true;
}

function staticFile(res, file) {
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
  };

  fs.readFile(file, (e, b) => {
    if (e) return send(res, 404, 'Not found');

    res.writeHead(200, {
      'Content-Type':
        map[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });

    res.end(b);
  });
}

async function startServer() {
  await initializeDatabase();

  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(
        req.url,
        `http://${req.headers.host || 'localhost'}`
      );

      const p = u.pathname;

      if (req.method === 'GET' && p === '/api/products') {
        const r = await db.execute(
          'SELECT * FROM products ORDER BY sort_order,id'
        );

        return send(res, 200, r.rows);
      }

      if (req.method === 'GET' && p === '/api/brands') {
        const r = await db.execute(
          'SELECT * FROM brands ORDER BY sort_order,id'
        );

        return send(res, 200, r.rows);
      }

      if (req.method === 'GET' && p === '/api/quote-data') {
        const productRows = await db.execute({
          sql: `
            SELECT id, name, category, description, default_unit
            FROM products
            WHERE available=1 AND visible=1
            ORDER BY sort_order,id
          `
        });

        const products = [];

        for (const product of productRows.rows) {
          const brandRows = await db.execute({
            sql: `
              SELECT b.id, b.name
              FROM product_brands pb
              JOIN brands b ON b.id=pb.brand_id
              WHERE pb.product_id=? AND b.visible=1
              ORDER BY b.sort_order,b.id
            `,
            args: [Number(product.id)]
          });

          const optionRows = await db.execute({
            sql: `
              SELECT id, option_name, option_value
              FROM product_options
              WHERE product_id=? AND available=1
              ORDER BY sort_order,id
            `,
            args: [Number(product.id)]
          });

          products.push({
            id: Number(product.id),
            name: product.name,
            category: product.category,
            description: product.description,
            unit: product.default_unit,
            brands: brandRows.rows.map(b => ({
              id: Number(b.id),
              name: b.name
            })),
            options: optionRows.rows.map(o => ({
              id: Number(o.id),
              name: o.option_name,
              value: o.option_value
            }))
          });
        }

        return send(res, 200, { products });
      }
      if (req.method === 'POST' && p === '/api/quote') {
        const x = await body(req);

        const name = String(x.name || '').trim();
        const phone = String(x.phone || '').trim();
        const location = String(x.location || '').trim();
        const additionalRequirement =
          String(x.additionalRequirement || '').trim();

        const items = Array.isArray(x.items) ? x.items : [];

        if (!name || !phone) {
          return send(res, 400, {
            error: 'Name and phone are required'
          });
        }

        if (items.length === 0) {
          return send(res, 400, {
            error: 'At least one product is required'
          });
        }

        if (items.length > 50) {
          return send(res, 400, {
            error: 'Too many quote items'
          });
        }

        // --------------------------------------------------------
        // Validate customer phone
        // --------------------------------------------------------

        const cleanPhone = phone.replace(/[\s-]/g, '');

        if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
          return send(res, 400, {
            error: 'Please enter a valid mobile number'
          });
        }

        // --------------------------------------------------------
        // Find or create customer
        // --------------------------------------------------------

        let customer = await db.execute({
          sql: `
            SELECT id
            FROM customers
            WHERE phone=?
            LIMIT 1
          `,
          args: [cleanPhone]
        });

        let customerId;

        if (customer.rows.length) {
          customerId = Number(customer.rows[0].id);

          await db.execute({
            sql: `
              UPDATE customers
              SET name=?, location=?
              WHERE id=?
            `,
            args: [
              name,
              location,
              customerId
            ]
          });
        } else {
          const r = await db.execute({
            sql: `
              INSERT INTO customers(
                name,
                phone,
                location
              )
              VALUES(?,?,?)
            `,
            args: [
              name,
              cleanPhone,
              location
            ]
          });

          customerId = Number(r.lastInsertRowid);
        }

        // --------------------------------------------------------
        // Validate and prepare every quote item
        // --------------------------------------------------------

        const preparedItems = [];

        for (const item of items) {
          const productId = Number(item.productId);
          const brandId =
            item.brandId === null ||
            item.brandId === undefined ||
            item.brandId === ''
              ? null
              : Number(item.brandId);

          const quantity = Number(item.quantity);

          if (!Number.isInteger(productId) || productId <= 0) {
            return send(res, 400, {
              error: 'Invalid product'
            });
          }

          if (
            brandId !== null &&
            (!Number.isInteger(brandId) || brandId <= 0)
          ) {
            return send(res, 400, {
              error: 'Invalid brand'
            });
          }

          if (!Number.isFinite(quantity) || quantity <= 0) {
            return send(res, 400, {
              error: 'Quantity must be greater than zero'
            });
          }

          if (quantity > 1000000) {
            return send(res, 400, {
              error: 'Quantity is too large'
            });
          }

          // ------------------------------------------------------
          // Product must be customer-available
          // ------------------------------------------------------

          const product = await db.execute({
            sql: `
              SELECT
                id,
                name,
                default_unit,
                available,
                visible
              FROM products
              WHERE id=?
              LIMIT 1
            `,
            args: [productId]
          });

          if (!product.rows.length) {
            return send(res, 400, {
              error: 'Product not found'
            });
          }

          const pRow = product.rows[0];

          if (!Number(pRow.available) || !Number(pRow.visible)) {
            return send(res, 400, {
              error: `${pRow.name} is currently unavailable`
            });
          }

          // ------------------------------------------------------
          // Validate brand ↔ product relationship
          // ------------------------------------------------------

          if (brandId !== null) {
            const relationship = await db.execute({
              sql: `
                SELECT 1
                FROM product_brands
                WHERE product_id=? AND brand_id=?
                LIMIT 1
              `,
              args: [
                productId,
                brandId
              ]
            });

            if (!relationship.rows.length) {
              return send(res, 400, {
                error: 'Selected brand is not available for this product'
              });
            }

            const brand = await db.execute({
              sql: `
                SELECT id, name, visible
                FROM brands
                WHERE id=?
                LIMIT 1
              `,
              args: [brandId]
            });

            if (
              !brand.rows.length ||
              !Number(brand.rows[0].visible)
            ) {
              return send(res, 400, {
                error: 'Selected brand is unavailable'
              });
            }
          }

          // ------------------------------------------------------
          // Product-specific option
          // ------------------------------------------------------

          const specification =
            String(item.specification || '').trim();

          if (specification) {
            const option = await db.execute({
              sql: `
                SELECT id
                FROM product_options
                WHERE product_id=?
                  AND option_value=?
                  AND available=1
                LIMIT 1
              `,
              args: [
                productId,
                specification
              ]
            });

            if (!option.rows.length) {
              return send(res, 400, {
                error: 'Invalid product specification'
              });
            }
          }

          // ------------------------------------------------------
          // Unit comes from the database, NOT the browser
          // ------------------------------------------------------

          const unit = String(pRow.default_unit);

          preparedItems.push({
            productId,
            brandId,
            specification,
            quantity,
            unit
          });
        }

        // --------------------------------------------------------
        // Generate unique enquiry number
        // --------------------------------------------------------

        let enquiryNo;

        for (let attempt = 0; attempt < 5; attempt++) {
          const stamp = new Date()
            .toISOString()
            .replace(/\D/g, '')
            .slice(0, 14);

          const random = crypto
            .randomBytes(4)
            .toString('hex')
            .toUpperCase();

          const candidate = `SS-${stamp}-${random}`;

          const existing = await db.execute({
            sql: `
              SELECT id
              FROM quote_enquiries
              WHERE enquiry_no=?
              LIMIT 1
            `,
            args: [candidate]
          });

          if (!existing.rows.length) {
            enquiryNo = candidate;
            break;
          }
        }

        if (!enquiryNo) {
          return send(res, 500, {
            error: 'Could not create enquiry number'
          });
        }

        // --------------------------------------------------------
        // Create quote
        // --------------------------------------------------------

        const quote = await db.execute({
          sql: `
            INSERT INTO quote_enquiries(
              enquiry_no,
              customer_id,
              additional_requirement,
              status
            )
            VALUES(?,?,?,?)
          `,
          args: [
            enquiryNo,
            customerId,
            additionalRequirement,
            'NEW'
          ]
        });

        const enquiryId =
          Number(quote.lastInsertRowid);

        // --------------------------------------------------------
        // Insert all quote items
        // --------------------------------------------------------

        for (const item of preparedItems) {
          await db.execute({
            sql: `
              INSERT INTO quote_items(
                enquiry_id,
                product_id,
                brand_id,
                specification,
                quantity,
                unit
              )
              VALUES(?,?,?,?,?,?)
            `,
            args: [
              enquiryId,
              item.productId,
              item.brandId,
              item.specification,
              item.quantity,
              item.unit
            ]
          });
        }

        return send(res, 200, {
          ok: true,
          enquiryNo,
          enquiryId,
          itemCount: preparedItems.length
        });
      }
      if (req.method === 'POST' && p === '/api/enquiries') {
        const x = await body(req);

        if (!x.name || !x.phone) {
          return send(res, 400, {
            error: 'Name and phone are required'
          });
        }

        const r = await db.execute({
          sql: `INSERT INTO enquiries(name,phone,product,message)
                VALUES(?,?,?,?)`,
          args: [
            String(x.name).trim(),
            String(x.phone).trim(),
            String(x.product || ''),
            String(x.message || '')
          ]
        });

        return send(res, 200, {
          ok: true,
          id: Number(r.lastInsertRowid)
        });
      }

      if (req.method === 'POST' && p === '/api/admin/login') {
        const x = await body(req);

        if (String(x.password || '') !== ADMIN_PASSWORD) {
          return send(res, 401, {
            error: 'Incorrect password'
          });
        }

        const cookie = crypto.randomBytes(32).toString('hex');
        sessions.add(cookie);

        return send(
          res,
          200,
          { ok: true },
          {
            'Set-Cookie':
              `ss_admin=${cookie}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
          }
        );
      }

      if (req.method === 'POST' && p === '/api/admin/logout') {
        const c = req.headers.cookie || '';

        const m = c
          .split(';')
          .map(s => s.trim())
          .find(s => s.startsWith('ss_admin='));

        if (m) {
          sessions.delete(
            decodeURIComponent(m.slice(9))
          );
        }

        return send(
          res,
          200,
          { ok: true },
          {
            'Set-Cookie':
              'ss_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
          }
        );
      }

      if (req.method === 'GET' && p === '/api/admin/me') {
        return send(res, 200, {
          authenticated: admin(req)
        });
      }

      if (p.startsWith('/api/admin/')) {
        if (!need(req, res)) return;

        const parts = p.split('/').filter(Boolean);
        const type = parts[2];
        const id = parts[3] ? Number(parts[3]) : null;

        if (req.method === 'GET' && type === 'quotes') {
          const quotes = await db.execute(`
            SELECT
              qe.id,
              qe.enquiry_no,
              qe.status,
              qe.created_at,
              c.name AS customer_name,
              c.phone,
              c.location,
              qe.additional_requirement
            FROM quote_enquiries qe
            JOIN customers c
              ON c.id = qe.customer_id
            ORDER BY qe.id DESC
          `);

          const result = [];

          for (const q of quotes.rows) {
            const items = await db.execute({
              sql: `
                SELECT
                  qi.id,
                  p.name AS product,
                  b.name AS brand,
                  qi.specification,
                  qi.quantity,
                  qi.unit
                FROM quote_items qi
                JOIN products p
                  ON p.id = qi.product_id
                LEFT JOIN brands b
                  ON b.id = qi.brand_id
                WHERE qi.enquiry_id=?
                ORDER BY qi.id
              `,
              args: [Number(q.id)]
            });

            result.push({
              id: Number(q.id),
              enquiry_no: q.enquiry_no,
              status: q.status,
              created_at: q.created_at,
              customer_name: q.customer_name,
              phone: q.phone,
              location: q.location,
              additional_requirement:
                q.additional_requirement || '',
              items: items.rows
            });
          }

          return send(res, 200, result);
        }
        if (req.method === 'GET' && type === 'enquiries') {
          const r = await db.execute(
            'SELECT * FROM enquiries ORDER BY id DESC'
          );

          return send(res, 200, r.rows);
        }

        if (
          req.method === 'PATCH' &&
          type === 'enquiries' &&
          id
        ) {
          const x = await body(req);

          await db.execute({
            sql: 'UPDATE enquiries SET status=? WHERE id=?',
            args: [String(x.status || 'New'), id]
          });

          return send(res, 200, { ok: true });
        }

        if (
          req.method === 'DELETE' &&
          type === 'enquiries' &&
          id
        ) {
          await db.execute({
            sql: 'DELETE FROM enquiries WHERE id=?',
            args: [id]
          });

          return send(res, 200, { ok: true });
        }

        if (
          req.method === 'POST' &&
          type === 'products'
        ) {
          const x = await body(req);

          if (!x.name || !x.category) {
            return send(res, 400, {
              error: 'Name and category are required'
            });
          }

          const r = await db.execute({
            sql: `INSERT INTO products(
              name,category,brands,description,available,sort_order
            ) VALUES(?,?,?,?,?,?)`,
            args: [
              x.name,
              x.category,
              x.brands || '',
              x.description || '',
              x.available ? 1 : 0,
              Number(x.sort_order) || 0
            ]
          });

          return send(res, 200, {
            id: Number(r.lastInsertRowid)
          });
        }

        if (
          req.method === 'PUT' &&
          type === 'products' &&
          id
        ) {
          const x = await body(req);

          await db.execute({
            sql: `UPDATE products
                  SET name=?,category=?,brands=?,description=?,available=?,sort_order=?
                  WHERE id=?`,
            args: [
              x.name,
              x.category,
              x.brands || '',
              x.description || '',
              x.available ? 1 : 0,
              Number(x.sort_order) || 0,
              id
            ]
          });

          return send(res, 200, { ok: true });
        }

        if (
          req.method === 'DELETE' &&
          type === 'products' &&
          id
        ) {
          await db.execute({
            sql: 'DELETE FROM products WHERE id=?',
            args: [id]
          });

          return send(res, 200, { ok: true });
        }

        if (
          req.method === 'POST' &&
          type === 'brands'
        ) {
          const x = await body(req);

          if (!x.name || !x.category) {
            return send(res, 400, {
              error: 'Name and category are required'
            });
          }

          const r = await db.execute({
            sql: `INSERT INTO brands(
              name,category,description,accent,logo,sort_order
            ) VALUES(?,?,?,?,?,?)`,
            args: [
              x.name,
              x.category,
              x.description || '',
              x.accent || '#087fe3',
              x.logo || '',
              Number(x.sort_order) || 0
            ]
          });

          return send(res, 200, {
            id: Number(r.lastInsertRowid)
          });
        }

        if (
          req.method === 'PUT' &&
          type === 'brands' &&
          id
        ) {
          const x = await body(req);

          await db.execute({
            sql: `UPDATE brands
                  SET name=?,category=?,description=?,accent=?,logo=?,sort_order=?
                  WHERE id=?`,
            args: [
              x.name,
              x.category,
              x.description || '',
              x.accent || '#087fe3',
              x.logo || '',
              Number(x.sort_order) || 0,
              id
            ]
          });

          return send(res, 200, { ok: true });
        }

        if (
          req.method === 'DELETE' &&
          type === 'brands' &&
          id
        ) {
          await db.execute({
            sql: 'DELETE FROM brands WHERE id=?',
            args: [id]
          });

          return send(res, 200, { ok: true });
        }

        return send(res, 404, {
          error: 'Not found'
        });
      }

      if (req.method === 'GET') {
        if (p === '/admin') {
          return staticFile(
            res,
            path.join(PUBLIC, 'admin.html')
          );
        }

        const file = path.normalize(
          path.join(
            PUBLIC,
            p === '/' ? 'index.html' : p
          )
        );

        if (!file.startsWith(PUBLIC)) {
          return send(res, 403, 'Forbidden');
        }

        return staticFile(res, file);
      }

      send(res, 404, {
        error: 'Not found'
      });

    } catch (e) {
      console.error(e);
      send(res, 500, {
        error: 'Server error'
      });
    }
  });

  server.listen(PORT, () => {
    console.log(
      `Shree Steel Turso test server: http://localhost:${PORT}`
    );
  });
}

startServer().catch(error => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});



