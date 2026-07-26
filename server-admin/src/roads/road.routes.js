import { Router } from 'express';
import {
    getRoads,
    getAllRoads,
    getRoadById,
    createRoad,
    updateRoad,
    changeRoadStatus
} from './road.controller.js';
import { validatePagination, validateRoadFilters } from "../../middlewares/data-validators.js";
import {
    validateCreateRoad,
    validateUpdateRoad,
    validateGetRoadById,
    validateRoadStatusChange
} from "../../middlewares/roads-validators.js";
import { validateJWT, requireAdminRole } from "../../middlewares/auth-validators.js";

const router = Router();

router.use(validateJWT);

// GET: Lectura disponible para todos los usuarios autenticados
router.get('/', [validatePagination, validateRoadFilters], getRoads);
router.get('/all', [validateRoadFilters], getAllRoads);
router.get('/:id', [validateGetRoadById], getRoadById);

// POST / PUT: Mutaciones protegidas para Administradores
router.post('/', [requireAdminRole, validateCreateRoad], createRoad);
router.put('/:id', [requireAdminRole, validateUpdateRoad], updateRoad);
router.put('/:id/status', [requireAdminRole, validateRoadStatusChange], changeRoadStatus);

export default router;