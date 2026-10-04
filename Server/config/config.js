const dotenv = require('dotenv');
dotenv.config();

if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME || !process.env.DB_HOST || !process.env.DB_PORT) {
    throw new Error("Missing required environment variables for database configuration");
}

if (!process.env.JWT_SECRET) {
    throw new Error("Missing required environment variable for JWT secret");
}

const config = {
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    JWT_SECRET: process.env.JWT_SECRET
}

module.exports = config;