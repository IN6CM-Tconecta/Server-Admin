import { query } from 'express-validator';
import { checkValidators } from './check-validators.js';

export const validatePagination = [
    query('page')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('El parámetro "page" debe ser un número entero mayor a 0')
        .toInt(),
    query('limit')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 100 })
        .withMessage('El parámetro "limit" debe ser un número entero entre 1 y 100')
        .toInt(),
    checkValidators
];

export const validateRoadFilters = [
    query('status')
        .optional({ checkFalsy: true })
        .isString()
        .toUpperCase()
        .isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'])
        .withMessage('El filtro "status" debe ser ACTIVE, INACTIVE, MAINTENANCE o CLOSED'),
    query('typeRoad')
        .optional({ checkFalsy: true })
        .isString()
        .toUpperCase()
        .isIn(['EXPRESS', 'RELEVOS', 'CENTRALES'])
        .withMessage('El filtro "typeRoad" debe ser EXPRESS, RELEVOS o CENTRALES'),
    checkValidators
];

export const validateStationFilters = [
    query('status')
        .optional({ checkFalsy: true })
        .isString()
        .toUpperCase()
        .isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'])
        .withMessage('El filtro "status" debe ser ACTIVE, INACTIVE, MAINTENANCE o CLOSED'),
    query('typeStation')
        .optional({ checkFalsy: true })
        .isString()
        .toUpperCase()
        .isIn(['CENTRALES', 'CARRIL LATERAL', 'TRASBORDO', 'TERMINALES'])
        .withMessage('El filtro "typeStation" debe ser CENTRALES, CARRIL LATERAL, TRASBORDO o TERMINALES'),
    checkValidators
];