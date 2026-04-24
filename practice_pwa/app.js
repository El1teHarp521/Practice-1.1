require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

//    1. ПОДКЛЮЧЕНИЕ К POSTGRES (через .env)
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false
    }
);

sequelize.authenticate()
    .then(() => console.log(`✅ БД "${process.env.DB_NAME}" подключена!`))
    .catch(err => console.error('❌ Ошибка подключения к БД:', err.message));

//    2. МОДЕЛЬ USER
const User = sequelize.define('User', {
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false }
}, {
    underscored: true,
    timestamps: true
});

sequelize.sync();

//    3. SWAGGER КОНФИГУРАЦИЯ
const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: { title: 'Practice 18: PostgreSQL API', version: '1.0.0' },
        servers: [{ url: `http://localhost:${port}` }],
    },
    apis: ['./app.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//    4. МАРШРУТЫ USERS

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Создание нового пользователя
 *     tags: [Users]
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
 *       201: { description: "Пользователь создан" }
 */
app.post('/api/users', async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получение списка пользователей
 *     tags: [Users]
 *     responses:
 *       200: { description: "Список получен" }
 */
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получение конкретного пользователя по id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Данные пользователя" }
 */
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) res.json(user);
        else res.status(404).json({ error: 'Не найден' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Обновление информации пользователя
 *     tags: [Users]
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
 */
app.patch('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            await user.update(req.body);
            res.json(user);
        } else {
            res.status(404).json({ error: 'Не найден' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удаление пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: "Удалено" }
 */
app.delete('/api/users/:id', async (req, res) => {
    try {
        const deleted = await User.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(204).send();
        else res.status(404).json({ error: 'Не найден' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 */
app.get('/api/products', (req, res) => {
    res.json([{ id: 1, title: "Товар из П18", price: 100 }]);
});

app.listen(port, () => {
    console.log(`✅ Сервер запущен: http://localhost:${port}`);
    console.log(`📖 Swagger: http://localhost:${port}/api-docs`);
});