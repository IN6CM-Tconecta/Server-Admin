'use strict';

import mongoose from 'mongoose';
import Road from './road.model.js';
import Station from '../stations/station.model.js'; 
import Alert from '../alerts/alert.model.js'; // Importado para alertas automáticas

const processStations = async (stationsArray) => {
    if (!stationsArray || !Array.isArray(stationsArray) || stationsArray.length === 0) return [];
    
    const processedIds = [];
    for (const item of stationsArray) {
        if (mongoose.Types.ObjectId.isValid(item)) {
            processedIds.push(item); // Ya es un ID válido
        } else {
            const station = await Station.findOne({ stationCode: item.toUpperCase() });
            if (station) {
                processedIds.push(station._id.toString());
            }
        }
    }
    return processedIds;
};

// 1. Obtener todas las rutas 
export const getRoads = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, typeRoad } = req.query;

        const filter = {};
        if (status) filter.status = status.toUpperCase();
        if (typeRoad) filter.typeRoad = typeRoad.toUpperCase();

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const roads = await Road.find(filter)
            .populate('stations', 'name stationCode typeStation location') 
            .limit(parseInt(limit))
            .skip(skip)
            .sort({ createdAt: -1 });

        const total = await Road.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: roads,
            summary: {
                totalRoads: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las rutas',
            error: error.message
        });
    }
};

// 2. Obtener TODAS las rutas
export const getAllRoads = async (req, res) => {
    try {
        const { status, typeRoad } = req.query;

        const filter = {};
        if (status) filter.status = status.toUpperCase();
        if (typeRoad) filter.typeRoad = typeRoad.toUpperCase();

        const roads = await Road.find(filter)
            .populate('stations', 'name stationCode')
            .sort({ createdAt: -1 });
            
        const total = await Road.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Rutas obtenidas exitosamente',
            summary: {
                totalRoads: total
            },
            data: roads
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener todas las rutas',
            error: error.message
        });
    }
};

// 3. Obtener una ruta por ID o Código
export const getRoadById = async (req, res) => {
    try {
        const { id } = req.params;
        let road;

        if (mongoose.Types.ObjectId.isValid(id)) {
            road = await Road.findById(id).populate('stations', 'name stationCode location');
        }
        if (!road) {
            road = await Road.findOne({ routeCode: id.toUpperCase() }).populate('stations', 'name stationCode location');
        }

        if (!road) {
            return res.status(404).json({
                success: false,
                message: 'Ruta no encontrada (buscado por ID o Código de Ruta)'
            });
        }

        res.status(200).json({
            success: true,
            data: road
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener la ruta',
            error: error.message
        });
    }
};

// 4. Crear una nueva ruta
export const createRoad = async (req, res) => {
    try {
        const { name, routeCode, typeRoad, stations, coordinates } = req.body;
        const finalStations = await processStations(stations);

        const roadData = {
            name,
            routeCode,
            typeRoad,
            stations: finalStations,
            path: {
                type: 'LineString',
                coordinates: coordinates
            }
        };

        const road = new Road(roadData);
        await road.save();

        // --- ALERTA AUTOMÁTICA ---
        try {
            await Alert.create({
                title: 'Nueva Ruta Creada',
                description: `La ruta ${road.name} (${road.routeCode}) ha sido agregada exitosamente al sistema.`,
                typeAlert: 'INFO',
                status: 'ACTIVE'
            });
        } catch (alertError) {
            console.error('Error al crear alerta operativa:', alertError);
        }
        // -------------------------

        res.status(201).json({
            success: true,
            message: 'Ruta creada exitosamente',
            data: road
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'El nombre o código de la ruta ya existe',
                error: error.keyValue
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al crear la ruta',
            error: error.message
        });
    }
};

// 5. Actualizar ruta
export const updateRoad = async (req, res) => {
    try {
        const { id } = req.params;
        const { coordinates, stations, ...otherData } = req.body;
        
        const updateData = { ...otherData };
        
        if (coordinates) {
            updateData.path = {
                type: 'LineString',
                coordinates: coordinates
            };
        }

        if (stations !== undefined) {
            updateData.stations = await processStations(stations);
        }

        let query = { _id: id };
        if (!mongoose.Types.ObjectId.isValid(id)) {
            query = { routeCode: id.toUpperCase() };
        }

        const road = await Road.findOneAndUpdate(query, updateData, {
            new: true,
            runValidators: true
        });

        if (!road) {
            return res.status(404).json({
                success: false,
                message: 'Ruta no encontrada'
            });
        }

        // --- ALERTA AUTOMÁTICA ---
        try {
            await Alert.create({
                title: 'Ruta Actualizada',
                description: `La ruta ${road.name} (${road.routeCode}) ha sido modificada.`,
                typeAlert: 'INFO',
                status: 'ACTIVE'
            });
        } catch (alertError) {
            console.error('Error al crear alerta operativa:', alertError);
        }
        // -------------------------

        res.status(200).json({
            success: true,
            message: 'Ruta actualizada exitosamente',
            data: road
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la ruta',
            error: error.message
        });
    }
};

// 6. Cambiar el estado de la ruta (Activar / Inactivar / Suspender)
export const changeRoadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 
        const statusUpper = status.toUpperCase();

        if (!['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'].includes(statusUpper)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido proporcionado'
            });
        }

        let query = { _id: id };
        if (!mongoose.Types.ObjectId.isValid(id)) {
            query = { routeCode: id.toUpperCase() };
        }

        const road = await Road.findOneAndUpdate(
            query,
            { status: statusUpper },
            { new: true }
        );

        if (!road) {
            return res.status(404).json({
                success: false,
                message: 'Ruta no encontrada'
            });
        }

        // --- ALERTA AUTOMÁTICA ---
        try {
            let alertType = 'INFO';
            if (statusUpper === 'MAINTENANCE') alertType = 'MAINTENANCE';
            if (statusUpper === 'CLOSED') alertType = 'INCIDENT';
            
            let statusTitle = 'Estado de Ruta Cambiado';
            if (statusUpper === 'ACTIVE') statusTitle = 'Ruta Activada';
            if (statusUpper === 'INACTIVE') statusTitle = 'Ruta Desactivada';
            if (statusUpper === 'MAINTENANCE') statusTitle = 'Ruta en Mantenimiento';
            if (statusUpper === 'CLOSED') statusTitle = 'Ruta Clausurada';

            await Alert.create({
                title: statusTitle,
                description: `La ruta ${road.name} (${road.routeCode}) ha cambiado su estado a ${statusUpper}.`,
                typeAlert: alertType,
                status: 'ACTIVE'
            });
        } catch (alertError) {
            console.error('Error al crear alerta operativa:', alertError);
        }
        // -------------------------

        res.status(200).json({
            success: true,
            message: `El estado de la ruta cambió a ${statusUpper} exitosamente`,
            data: road
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado de la ruta',
            error: error.message
        });
    }
};