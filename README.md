# API платформы «ЭФИР» для управления музыкальным лейблом

## Описание проекта

API платформы «ЭФИР» предоставляет backend-решение для управления музыкальным лейблом. Основные возможности:

- Управление артистами, менеджерами и договорами
- Обработка релизов и отслеживание роялти
- Загрузка и обработка медиафайлов
- Автоматизация бизнес-процессов

Платформа обеспечивает безопасное взаимодействие между участниками лейбла через REST API с использованием современных технологий.

---

## Стек технологий

- **Основные зависимости**:

  - Express.js — веб-фреймворк
  - MongoDB + Mongoose — база данных
  - AWS S3 — работа с Yandex Cloud Object Storage
  - JWT + BcryptJS — аутентификация и безопасность
  - Multer — загрузчик файлов
  - Sharp — обработка изображений
  - Music-metadata — анализ аудиофайлов
  - Joi — валидация данных
  - Helmet + CORS — защита API

- **Разработка**:
  - Nodemon — горячая перезагрузка
  - Dotenv — управление переменными окружения

---

## Запуск проекта

1. Установите зависимости:

```bash
yarn install
```

2. Создайте файл `.env` в корне проекта:

```env
NODE_ENV=dev
PORT=3000
CLIENT_URL=https://example.com/
MONGO_URL=mongodb://localhost:27017/db_name
JWT_ACCESS_SECRET=your_secure_secret_key
JWT_REFRESH_SECRET=your_secure_secret_key
YC_ACCESS_KEY_ID=your_yc_key
YC_SECRET_ACCESS_KEY=your_yc_secret
YC_BUCKET_NAME=bucket_name
YC_ENDPOINT=https://storage.yandexcloud.net
```

3. Запуск в режиме разработки:

```bash
yarn dev
```

4. Сборка и запуск в production:

```bash
yarn start
```

---

## Структура проекта

```
├── config/          # Конфигурация (http-статусы, AWS)
├── controllers/     # Обработчики запросов
├── dtos/            # Data Transfer Objects
├── exceptions/      # Обработчики исключений
├── middleware/      # Пользовательские middleware
├── models/          # Mongoose-модели
├── routes/          # Маршруты API
├── services/        # Бизнес-логика
├── validators/      # Валидаторы данных
└── app.js           # Основной файл приложения
```

---

## Функциональные возможности

- **Аутентификация**: Аккаунты с ролями (артист/менеджер/управляющий)
- **Релизы**: Загрузка и управление релизами
- **Финансы**: Управление роялти
- **Документы**: Работа с договорами и приложениями к ним
