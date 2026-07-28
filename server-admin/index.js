import dotenv from 'dotenv';
import { initServer } from './configs/app.js'

dotenv.config();

process.on('uncaughtException', (error) => {
    console.log(error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log(reason, promise);
    process.exit(1);
});

console.log(`Iniciando servidor de Tconecta...`);

import { app } from './configs/app.js';
import { dbConnection } from './configs/db.js';

if (process.env.VERCEL) {
    dbConnection();
} else {
    initServer();
}

export default app;