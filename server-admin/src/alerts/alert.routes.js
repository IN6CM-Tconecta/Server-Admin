import { Router } from 'express';
import { createAlert, getActiveAlerts, resolveAlert } from './alert.controller.js';
import { createAlertValidator, updateAlertStatusValidator } from '../../middlewares/alerts-validators.js';
import { validateJWT, requireAdminRole } from '../../middlewares/auth-validators.js';

const router = Router();

/**
 * @swagger
 * /alerts:
 *   get:
 *     tags:
 *       - Alerts
 *     summary: Get active alerts
 *     description: Retrieve a list of all active alerts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active alerts retrieved successfully
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
 *                     $ref: '#/components/schemas/Alert'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalAlerts:
 *                       type: integer
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Alerts
 *     summary: Create a new alert
 *     description: Create a new alert for a road or station incident
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - severity
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the alert
 *               description:
 *                 type: string
 *                 description: Detailed description of the alert
 *               type:
 *                 type: string
 *                 enum: [CONGESTIÓN, ACCIDENTE, MANTENIMIENTO, OTRO]
 *                 description: Type of alert
 *               severity:
 *                 type: string
 *                 enum: [BAJA, MEDIA, ALTA]
 *                 description: Severity level of the alert
 *               location:
 *                 type: object
 *                 properties:
 *                   road:
 *                     type: string
 *                     description: Road ID
 *                   station:
 *                     type: string
 *                     description: Station ID
 *     responses:
 *       201:
 *         description: Alert created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Internal server error
 * 
 * /alerts/{id}/status:
 *   put:
 *     tags:
 *       - Alerts
 *     summary: Resolve an alert
 *     description: Mark an alert as resolved and close it
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
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
 *                 enum: [ACTIVA, RESUELTA]
 *                 description: New status for the alert
 *               resolution:
 *                 type: string
 *                 description: Description of how the alert was resolved
 *     responses:
 *       200:
 *         description: Alert status updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Internal server error
 */

router.use(validateJWT);

router.get('/', getActiveAlerts);
router.post('/', requireAdminRole, createAlertValidator, createAlert);
router.put('/:id/status', requireAdminRole, updateAlertStatusValidator, resolveAlert);

export default router;