import { Router } from 'express';
import { 
    getStations, 
    getAllStations, 
    getStationById, 
    createStation, 
    updateStation, 
    changeStationStatus 
} from './station.controller.js';
import { validatePagination, validateStationFilters } from "../../middlewares/data-validators.js";

import {
    validateCreateStation, 
    validateUpdateStation,
    validateGetStationById,
    validateStationStatusChange
} from "../../middlewares/stations-validators.js";
import { validateJWT, requireAdminRole } from "../../middlewares/auth-validators.js";

const router = Router();

router.use(validateJWT);

/**
 * @swagger
 * /stations:
 *   get:
 *     tags:
 *       - Stations
 *     summary: Get all stations with pagination
 *     description: Retrieve a paginated list of stations with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVO, INACTIVO]
 *         description: Filter by station status
 *       - in: query
 *         name: typeStation
 *         schema:
 *           type: string
 *           enum: [TERMINAL, PARADA, INTERMEDIA]
 *         description: Filter by station type
 *     responses:
 *       200:
 *         description: List of stations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Station'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalStations:
 *                       type: integer
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Stations
 *     summary: Create a new station
 *     description: Create a new station with the provided details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - stationCode
 *               - typeStation
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the station
 *               stationCode:
 *                 type: string
 *                 description: Code identifier for the station
 *               typeStation:
 *                 type: string
 *                 enum: [TERMINAL, PARADA, INTERMEDIA]
 *                 description: Type of station
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               capacity:
 *                 type: integer
 *                 description: Capacity of the station
 *     responses:
 *       201:
 *         description: Station created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Internal server error
 * 
 * /stations/all:
 *   get:
 *     tags:
 *       - Stations
 *     summary: Get all stations without pagination
 *     description: Retrieve all stations without pagination, useful for dropdowns or complete listings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVO, INACTIVO]
 *         description: Filter by station status
 *       - in: query
 *         name: typeStation
 *         schema:
 *           type: string
 *           enum: [TERMINAL, PARADA, INTERMEDIA]
 *         description: Filter by station type
 *     responses:
 *       200:
 *         description: All stations retrieved successfully
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Internal server error
 * 
 * /stations/{id}:
 *   get:
 *     tags:
 *       - Stations
 *     summary: Get station by ID
 *     description: Retrieve a specific station by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Station ID
 *     responses:
 *       200:
 *         description: Station retrieved successfully
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Station not found
 *       500:
 *         description: Internal server error
 *   put:
 *     tags:
 *       - Stations
 *     summary: Update station
 *     description: Update an existing station's information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Station ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               stationCode:
 *                 type: string
 *               typeStation:
 *                 type: string
 *               location:
 *                 type: object
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Station updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Station not found
 *       500:
 *         description: Internal server error
 * 
 * /stations/{id}/status:
 *   put:
 *     tags:
 *       - Stations
 *     summary: Change station status
 *     description: Activate or deactivate a station
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Station ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVO, INACTIVO]
 *                 description: New status
 *     responses:
 *       200:
 *         description: Station status updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Station not found
 *       500:
 *         description: Internal server error
 */

// GET

// Listar con paginación y filtros
router.get('/', [
    validatePagination,
    validateStationFilters
], getStations);

// Listar sin paginación, para dropdowns o listados completos)
router.get('/all', [
    validateStationFilters
], getAllStations); 

// Obtener por ID
router.get('/:id', [
    validateGetStationById
], getStationById);

// POST

// Crear nueva estación
router.post('/', [
    requireAdminRole,
    validateCreateStation
], createStation);

// PUT 

// Actualizar estación existente
router.put('/:id', [
    requireAdminRole,
    validateUpdateStation
], updateStation);

// Cambiar estado de la estación (activar/desactivar)
router.put('/:id/status', [
    requireAdminRole,
    validateStationStatusChange
], changeStationStatus);

export default router;