require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const mongoose = require('mongoose');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// ==========================================
//    1. SQL (PostgreSQL) - НАСТРОЙКА
// ==========================================
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
});

const SqlUser = sequelize.define('User', {
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false }
}, { underscored: true, timestamps: true });

sequelize.sync()
    .then(() => console.log('🐘 SQL (PostgreSQL): ПОДКЛЮЧЕНО'))
    .catch(err => console.log('⚠️ SQL (PostgreSQL): НЕ ДОСТУПЕН'));

// ==========================================
//    2. NoSQL (MongoDB) - НАСТРОЙКА
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🍃 NoSQL (MongoDB): ПОДКЛЮЧЕНО'))
    .catch(err => console.log('⚠️ NoSQL (MongoDB): ОШИБКА'));

const nosqlUserSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    age: { type: Number, required: true },
    created_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
    updated_at: { type: Number, default: () => Math.floor(Date.now() / 1000) }
}, { versionKey: false });

const NosqlUser = mongoose.model('NosqlUser', nosqlUserSchema);

// ==========================================
//    3. SWAGGER - НАСТРОЙКА
// ==========================================
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: { title: 'Practice 19 & 20: Full Hybrid API', version: '1.5.0' },
        servers: [{ url: `http://localhost:${port}` }],
    },
    apis: [path.join(__dirname, 'app.js')],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// ==========================================
//    МАРШРУТЫ SQL (PostgreSQL)
// ==========================================

/**
 * @swagger
 * /api/sql/users:
 *   post:
 *     summary: "[SQL] Создать пользователя"
 *     tags: [Users SQL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string, example: "Иван" }
 *               last_name: { type: string, example: "Иванов" }
 *               age: { type: integer, example: 25 }
 *     responses:
 *       201: { description: "Создано" }
 *   get:
 *     summary: "[SQL] Получить всех пользователей"
 *     tags: [Users SQL]
 *     responses:
 *       200: { description: "Список получен" }
 */
app.post('/api/sql/users', async (req, res) => {
    try {
        const user = await SqlUser.create(req.body);
        res.status(201).json(user);
    } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/sql/users', async (req, res) => {
    try {
        const users = await SqlUser.findAll();
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/sql/users/{id}:
 *   get:
 *     summary: "[SQL] Получить по ID"
 *     tags: [Users SQL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "OK" }
 *   patch:
 *     summary: "[SQL] Обновить информацию"
 *     tags: [Users SQL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               age: { type: integer }
 *     responses:
 *       200: { description: "Обновлено" }
 *   delete:
 *     summary: "[SQL] Удалить пользователя"
 *     tags: [Users SQL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: "Удалено" }
 */
app.get('/api/sql/users/:id', async (req, res) => {
    const user = await SqlUser.findByPk(req.params.id);
    user ? res.json(user) : res.status(404).json({ error: "Не найден" });
});

app.patch('/api/sql/users/:id', async (req, res) => {
    const user = await SqlUser.findByPk(req.params.id);
    if (user) {
        await user.update(req.body);
        res.json(user);
    } else res.status(404).json({ error: "Не найден" });
});

app.delete('/api/sql/users/:id', async (req, res) => {
    const deleted = await SqlUser.destroy({ where: { id: req.params.id } });
    deleted ? res.status(204).send() : res.status(404).json({ error: "Не найден" });
});


// ==========================================
//    МАРШРУТЫ NoSQL (MongoDB)
// ==========================================

/**
 * @swagger
 * /api/nosql/users:
 *   post:
 *     summary: "[NoSQL] Создать пользователя"
 *     tags: [Users NoSQL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string, example: "Михаил" }
 *               last_name: { type: string, example: "Монгов" }
 *               age: { type: integer, example: 30 }
 *     responses:
 *       201: { description: "Создано" }
 *   get:
 *     summary: "[NoSQL] Получить всех пользователей"
 *     tags: [Users NoSQL]
 *     responses:
 *       200: { description: "Список получен" }
 */
app.post('/api/nosql/users', async (req, res) => {
    try {
        const user = new NosqlUser(req.body);
        res.status(201).json(await user.save());
    } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/nosql/users', async (req, res) => {
    try {
        const users = await NosqlUser.find();
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/**
 * @swagger
 * /api/nosql/users/{id}:
 *   get:
 *     summary: "[NoSQL] Получить по ID"
 *     tags: [Users NoSQL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "OK" }
 *   patch:
 *     summary: "[NoSQL] Обновить информацию"
 *     tags: [Users NoSQL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               age: { type: integer }
 *     responses:
 *       200: { description: "Обновлено" }
 *   delete:
 *     summary: "[NoSQL] Удалить пользователя"
 *     tags: [Users NoSQL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: "Удалено" }
 */
app.get('/api/nosql/users/:id', async (req, res) => {
    try {
        const user = await NosqlUser.findById(req.params.id);
        user ? res.json(user) : res.status(404).json({ error: "Не найден" });
    } catch (e) { res.status(400).json({ error: "Невалидный ID" }); }
});

app.patch('/api/nosql/users/:id', async (req, res) => {
    try {
        req.body.updated_at = Math.floor(Date.now() / 1000);
        const user = await NosqlUser.findByIdAndUpdate(req.params.id, req.body, { new: true });
        user ? res.json(user) : res.status(404).json({ error: "Не найден" });
    } catch (e) { res.status(400).json({ error: "Ошибка данных" }); }
});

app.delete('/api/nosql/users/:id', async (req, res) => {
    try {
        const user = await NosqlUser.findByIdAndDelete(req.params.id);
        user ? res.status(204).send() : res.status(404).json({ error: "Не найден" });
    } catch (e) { res.status(400).json({ error: "Невалидный ID" }); }
});

app.listen(port, () => {
    console.log(`✅ СЕРВЕР: http://localhost:${port}`);
    console.log(`📖 SWAGGER: http://localhost:${port}/api-docs`);
});