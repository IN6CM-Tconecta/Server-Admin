import { Router } from 'express';
import { 
    getBuses,
    getBusById,
    createBus,
    updateBus,
    changeBusStatus
} from './bus.controller.js';
import { 
    validateCreateBus, 
    validateUpdateBus, 
    validateBusStatusChange 
} from '../../middlewares/buses-validators.js';

const router = Router();

router.get('/', getBuses);
router.get('/:id', getBusById);
router.post('/', validateCreateBus, createBus);
router.put('/:id', validateUpdateBus, updateBus);
router.patch('/:id/status', validateBusStatusChange, changeBusStatus);

export default router;
