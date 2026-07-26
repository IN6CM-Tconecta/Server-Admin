import { body, param } from "express-validator";
import { checkValidators } from "./check-validators.js";
import Bus from "../src/buses/bus.model.js";

// Validaciones personalizadas
const checkAssignedRoadUnique = async (assignedRoad, { req }) => {
    if (!assignedRoad) return true; // Es opcional, por lo que null/undefined está bien

    // Buscar si hay otro bus que ya tenga esta ruta asignada
    let query = { assignedRoad };
    // Si estamos actualizando, excluir el bus actual
    if (req.params && req.params.id) {
        query._id = { $ne: req.params.id };
    }

    const busConRuta = await Bus.findOne(query);
    if (busConRuta) {
        throw new Error(`Esta ruta ya está asignada al bus ${busConRuta.busNumber}. Solo puede haber un bus por ruta.`);
    }
    return true;
};

export const validateCreateBus = [
    body("busNumber")
        .trim()
        .notEmpty()
        .withMessage("El número/código de bus es obligatorio (ej. BUS-1)"),
    body("licensePlate")
        .trim()
        .notEmpty()
        .withMessage("La placa es obligatoria")
        .matches(/^[UCP]\d{3,4}[A-Z]{3}$/i)
        .withMessage("La placa no tiene un formato válido (Ej. U123ABC o U0123BCC)"),
    body("capacity")
        .notEmpty()
        .withMessage("La capacidad es obligatoria")
        .isInt({ min: 10, max: 200 })
        .withMessage("La capacidad debe ser un número entre 10 y 200"),
    body("assignedRoad")
        .optional({ checkFalsy: true })
        .isMongoId()
        .withMessage("ID de ruta no válido")
        .custom(checkAssignedRoadUnique),
    checkValidators
];

export const validateUpdateBus = [
    param("id")
        .notEmpty()
        .withMessage("El ID del bus es obligatorio"),
    body("busNumber")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("El número de bus no puede estar vacío si se envía"),
    body("licensePlate")
        .optional()
        .trim()
        .matches(/^[UCP]\d{3,4}[A-Z]{3}$/i)
        .withMessage("La placa no tiene un formato válido (Ej. U123ABC o U0123BCC)"),
    body("capacity")
        .optional()
        .isInt({ min: 10, max: 200 })
        .withMessage("La capacidad debe ser un número entre 10 y 200"),
    body("assignedRoad")
        .optional({ checkFalsy: true })
        .isMongoId()
        .withMessage("ID de ruta no válido")
        .custom(checkAssignedRoadUnique),
    checkValidators
];

export const validateBusStatusChange = [
    param("id")
        .notEmpty()
        .withMessage("El identificador del bus es obligatorio"),
    body("status")
        .notEmpty()
        .withMessage("El estado es obligatorio")
        .isIn(["ACTIVE", "INACTIVE", "MAINTENANCE"])
        .withMessage("El estado debe ser ACTIVE, INACTIVE o MAINTENANCE"),
    checkValidators
];
