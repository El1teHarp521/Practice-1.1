const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const ACCESS_SECRET = "super_secret_access_key";
const REFRESH_SECRET = "super_secret_refresh_key";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"], 
}));

// --- Базы данных ---
let users = [];
const refreshTokens = new Set(); 

let products = [
    { id: nanoid(6), title: 'iPhone 15 Pro Max', category: 'Смартфоны', description: 'Мощный процессор A17', price: 78000, stock: 89, image: 'https://p.turbosquid.com/ts-thumb/0M/yPA1jD/Lt/iphone_15_pro_05/jpg/1698233977/1920x1080/fit_q87/136f586679ef9dc4f5334bbe659f185c73b69882/iphone_15_pro_05.jpg' },
    { id: nanoid(6), title: 'Samsung Galaxy S25 Ultra', category: 'Смартфоны', description: 'Зачем тебе он за такую цену? Купи iPhone', price: 155000, stock: 58, image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&q=80&w=800' },
    { id: nanoid(6), title: 'Apple MacBook Pro 16 M4', category: 'Ноутбуки', description: 'Цена убила, но бери', price: 1099990, stock: 67, image: 'https://avatars.mds.yandex.net/get-mpic/12168282/2a00000192cd6fabde16264089349d8d6fe2/orig' },
    { id: nanoid(6), title: 'ASUS ROG Strix G835', category: 'Ноутбуки', description: 'Игровой монстр', price: 455999 , stock: 52, image: 'https://avatars.mds.yandex.net/get-altay/13220782/2a000001916830e59aa8f500bdecf6027946/XXL_height' },
    { id: nanoid(6), title: 'Logitech G435', category: 'Наушники', description: 'Лучшие в своем роде', price: 4899, stock: 120, image: 'https://ir.ozone.ru/s3/multimedia-1-o/w1200/6924052176.jpg' },
    { id: nanoid(6), title: 'Apple AirPods Pro 3', category: 'Наушники', description: 'Шумоподавление пушка', price: 25699, stock: 261, image: 'https://ir.ozone.ru/s3/multimedia-q/6559594970.jpg' },
    { id: nanoid(6), title: 'Apple iPad Pro (M4)', category: 'Планшеты', description: 'Идеален для учебы', price: 121999, stock: 0, image: 'https://frankfurt.apollo.olxcdn.com/v1/files/ey53r12bxakk1-KZ/image' },
    { id: nanoid(6), title: 'ARDOR GAMING Phantom PRO V2', category: 'Аксессуары', description: 'Мышь для профи', price: 4199, stock: 273, image: 'https://basket-32.wbbasket.ru/vol6561/part656132/656132951/images/big/1.webp' },
    { id: nanoid(6), title: 'WLmouse Ying75', category: 'Аксессуары', description: 'Механическая клавиатура', price: 36000, stock: 189, image: 'https://avatars.mds.yandex.net/get-mpic/16388639/2a0000019a7b50756e793e82137de976a538/orig' },
    { id: nanoid(6), title: 'MSI MAG 274QF X24', category: 'Мониторы', description: '2K монитор для игр в 240 кадров', price: 20199, stock: 131, image: 'https://dbklik.co.id/public/uploads/all/mnL5pdf8ov6jHXf9jwsn6ElZpncAQIoRNrPomBRJ.png' },
];

// --- Тестовые аккаунты ---
(async () => {
    users.push({ id: nanoid(6), email: "admin@mail.ru", first_name: "Иван", last_name: "Грозный", hashedPassword: await bcrypt.hash("123", 10), role: "admin", isBlocked: false });
    users.push({ id: nanoid(6), email: "seller@mail.ru", first_name: "Олег", last_name: "Тиньков", hashedPassword: await bcrypt.hash("123", 10), role: "seller", isBlocked: false });
    users.push({ id: nanoid(6), email: "user@mail.ru", first_name: "Обычный", last_name: "Парень", hashedPassword: await bcrypt.hash("123", 10), role: "user", isBlocked: false });
})();

// --- Функции токенов ---
function generateAccessToken(user) { return jwt.sign({ sub: user.id, email: user.email, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN }); }
function generateRefreshToken(user) { return jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN }); }

// --- Middlewares ---
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Нет доступа" });
    try {
      const payload = jwt.verify(token, ACCESS_SECRET);
      const user = users.find(u => u.id === payload.sub);
      if (!user || user.isBlocked) return res.status(403).json({ error: "Аккаунт заблокирован" });
      req.user = payload; 
      next();
    } catch (err) { res.status(401).json({ error: "Токен просрочен" }); }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: "Недостаточно прав" });
      }
      next();
    };
}

// --- Настройка Swagger ---
const swaggerOptions = {
    definition: { 
        openapi: '3.0.0', 
        info: { title: 'API Магазина (RBAC)', version: '1.0.0' }, 
        servers: [{ url: `http://localhost:${port}` }], 
        components: { 
            securitySchemes: { 
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } 
            } 
        } 
    },
    apis: ['./app.js'], // Swagger будет искать комментарии в этом файле
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==========================================
//           АВТОРИЗАЦИЯ
// ==========================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: "Успешно" }
 */
app.post("/api/auth/register", async (req, res) => {
    const { email, first_name, last_name, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Поля!" });
    if (users.some(u => u.email === email)) return res.status(400).json({ error: "Email занят" });
    const newUser = { id: nanoid(6), email, first_name, last_name, role: "user", isBlocked: false, hashedPassword: await bcrypt.hash(password, 10) };
    users.push(newUser);
    res.status(201).json({ message: "Успешно" });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: "Успешно" }
 */
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) return res.status(401).json({ error: "Данные!" });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);
    res.status(200).json({ accessToken, refreshToken });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление токенов
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-refresh-token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "ОК" }
 */
app.post("/api/auth/refresh", (req, res) => {
    const refreshToken = req.headers['x-refresh-token'];
    if (!refreshToken || !refreshTokens.has(refreshToken)) return res.status(401).json({ error: "Токен!" });
    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find(u => u.id === payload.sub);
        refreshTokens.delete(refreshToken);
        const newAccess = generateAccessToken(user);
        const newRefresh = generateRefreshToken(user);
        refreshTokens.add(newRefresh);
        res.json({ accessToken: newAccess, refreshToken: newRefresh });
    } catch (err) { res.status(401).json({ error: "Просрочен" }); }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Данные текущего пользователя
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "ОК" }
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    res.json({ id: user.id, email: user.email, first_name: user.first_name, role: user.role });
});

// ==========================================
//         ПОЛЬЗОВАТЕЛИ (Админ)
// ==========================================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Список пользователей (Админ)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "ОК" }
 */
app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    res.json(users.map(u => ({ id: u.id, email: u.email, first_name: u.first_name, role: u.role, isBlocked: u.isBlocked })));
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Изменить роль (Админ)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string }
 *     responses:
 *       200: { description: "ОК" }
 */
app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (user && req.body.role) user.role = req.body.role;
    res.json({ message: "OK" });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Блокировка (Админ)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "ОК" }
 */
app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (user) user.isBlocked = !user.isBlocked;
    res.json({ message: "OK" });
});

// ==========================================
//             ТОВАРЫ
// ==========================================

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Список товаров
 *     tags: [Products]
 *     responses:
 *       200: { description: "ОК" }
 */
app.get('/api/products', (req, res) => res.json(products));

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (Продавец)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               price: { type: number }
 *     responses:
 *       201: { description: "ОК" }
 */
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const newP = { id: nanoid(6), ...req.body, price: Number(req.body.price) };
    products.push(newP);
    res.status(201).json(newP);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (Админ)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       204: { description: "ОК" }
 */
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`✅ СЕРВЕР ЗАПУЩЕН: http://localhost:${port}`);
    console.log(`✅ SWAGGER: http://localhost:${port}/api-docs`);
});