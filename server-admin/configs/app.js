'use strict';

//Importaciones
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { dbConnection } from './db.js'; 

//Rutas
//EJEMPLO: import accountRoutes from '../src/accounts/account.routes.js';
import roadRoutes from '../src/roads/road.routes.js';
import stationRoutes from '../src/stations/station.routes.js';
import alertRoutes from '../src/alerts/alert.routes.js';
import busRoutes from '../src/buses/bus.routes.js';

const BASE_URL = '/TCONECTA/v1';

//Configuración de mi aplicación
const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(helmet(helmetConfiguration));
    app.use(cors(corsOptions));
    app.use(morgan('dev'));
}

//Integracion de todas las rutas
const routes = (app) => {
    //EJEMPLO: app.use(`${BASE_URL}/accounts`, accountRoutes);
    app.use(`${BASE_URL}/roads`, roadRoutes);
    app.use(`${BASE_URL}/stations`, stationRoutes);
    app.use(`${BASE_URL}/alerts`, alertRoutes);
    app.use(`${BASE_URL}/buses`, busRoutes);
    
    // Swagger Documentation
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(specs, { 
        swaggerOptions: { 
            persistAuthorization: true 
        } 
    }));
}

//FUNCIÓN PARA INICIAR EL SERVIDOR
const initServer = async () => {
    //Creación de la instancia de la aplicaccion
    const app = express();
    const PORT = process.env.PORT || 3001;

    try {
        //Conexión a Base de Datos (Esperamos a que conecte)
        await dbConnection();

        //CONFIGURACIONES DEL MIDDLEWARES Y RUTAS
        middlewares(app);
        routes(app);
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
            console.log(`Base URL: http://localhost:${PORT}${BASE_URL}`);
        });

        //Primera ruta (Health Check)
        /**
         * @swagger
         * /TRANSMETRO-CONECTA/v1/health:
         *   get:
         *     tags:
         *       - Health Check
         *     summary: Check server health status
         *     description: Returns the current status of the API server
         *     responses:
         *       200:
         *         description: Server is healthy
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 status:
         *                   type: string
         *                   example: 'ok'
         *                 service:
         *                   type: string
         *                   example: 'TRANSMETRO-CONECTA Admin'
         *                 version:
         *                   type: string
         *                   example: '1.0.0'
         */
        app.get(`${BASE_URL}/health`, (req, res) => {
            res.status(200).json({
                status: 'ok',
                service: 'TRANSMETRO-CONECTA Admin',
                version: '1.0.0'
            });
        });

    } catch (error) {
        console.log('Error al iniciar el servidor:', error);
    }
}

export { initServer };