'use strict';

import Bus from './bus.model.js';
import Alert from '../alerts/alert.model.js';
import mongoose from 'mongoose';

// 1. Obtener todos los buses
export const getBuses = async (req, res) => {
    try {
        const { status, assignedRoad } = req.query;

        const filter = {};
        if (status) filter.status = status.toUpperCase();
        if (assignedRoad) {
            if (mongoose.Types.ObjectId.isValid(assignedRoad)) {
                filter.assignedRoad = assignedRoad;
            }
        }

        const buses = await Bus.find(filter)
            .populate('assignedRoad', 'name routeCode')
            .sort({ createdAt: -1 });

        const total = await Bus.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: buses,
            summary: {
                totalBuses: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los buses',
            error: error.message
        });
    }
};

// 2. Obtener bus por ID
export const getBusById = async (req, res) => {
    try {
        const { id } = req.params;
        let bus;

        if (mongoose.Types.ObjectId.isValid(id)) {
            bus = await Bus.findById(id).populate('assignedRoad', 'name routeCode');
        } else {
            bus = await Bus.findOne({ busNumber: id.toUpperCase() }).populate('assignedRoad', 'name routeCode');
        }

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: bus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el bus',
            error: error.message
        });
    }
};

// 3. Crear bus
export const createBus = async (req, res) => {
    try {
        const { busNumber, licensePlate, capacity, assignedRoad } = req.body;

        const busData = {
            busNumber,
            licensePlate,
            capacity
        };

        if (assignedRoad && mongoose.Types.ObjectId.isValid(assignedRoad)) {
            busData.assignedRoad = assignedRoad;
        }

        const bus = new Bus(busData);
        await bus.save();
        await bus.populate('assignedRoad', 'name routeCode');

        // Alerta
        try {
            await Alert.create({
                title: 'Nuevo Bus Registrado',
                description: `El bus ${bus.busNumber} (Placa: ${bus.licensePlate}) ha sido ingresado a la flota.`,
                typeAlert: 'INFO',
                status: 'ACTIVE'
            });
        } catch (e) {
            console.error(e);
        }

        res.status(201).json({
            success: true,
            message: 'Bus creado exitosamente',
            data: bus
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'El número de bus o placa ya está registrado',
                error: error.keyValue
            });
        }
        res.status(400).json({
            success: false,
            message: 'Error de validación al crear el bus',
            error: error.message
        });
    }
};

// 4. Actualizar bus
export const updateBus = async (req, res) => {
    try {
        const { id } = req.params;
        const { busNumber, licensePlate, capacity, assignedRoad } = req.body;
        
        const updateData = {};
        if (busNumber) updateData.busNumber = busNumber;
        if (licensePlate) updateData.licensePlate = licensePlate;
        if (capacity) updateData.capacity = capacity;
        
        if (assignedRoad === null || assignedRoad === "") {
            updateData.$unset = { assignedRoad: 1 };
        } else if (assignedRoad && mongoose.Types.ObjectId.isValid(assignedRoad)) {
            updateData.assignedRoad = assignedRoad;
        }

        let query = { _id: id };
        if (!mongoose.Types.ObjectId.isValid(id)) {
            query = { busNumber: id.toUpperCase() };
        }

        const bus = await Bus.findOneAndUpdate(query, updateData, {
            new: true,
            runValidators: true
        }).populate('assignedRoad', 'name routeCode');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus no encontrado'
            });
        }

        // Alerta
        try {
            await Alert.create({
                title: 'Bus Actualizado',
                description: `Se han modificado los datos del bus ${bus.busNumber}.`,
                typeAlert: 'INFO',
                status: 'ACTIVE'
            });
        } catch (e) {
            console.error(e);
        }

        res.status(200).json({
            success: true,
            message: 'Bus actualizado exitosamente',
            data: bus
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el bus',
            error: error.message
        });
    }
};

// 5. Cambiar estado
export const changeBusStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 
        const statusUpper = status.toUpperCase();

        if (!['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(statusUpper)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        let query = { _id: id };
        if (!mongoose.Types.ObjectId.isValid(id)) {
            query = { busNumber: id.toUpperCase() };
        }

        const bus = await Bus.findOneAndUpdate(
            query,
            { status: statusUpper },
            { new: true }
        );

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus no encontrado'
            });
        }

        // Alerta
        try {
            let alertType = statusUpper === 'MAINTENANCE' ? 'MAINTENANCE' : 'INFO';
            let alertTitle = statusUpper === 'MAINTENANCE' ? 'Bus en Mantenimiento' : 'Estado de Bus Cambiado';
            
            await Alert.create({
                title: alertTitle,
                description: `El bus ${bus.busNumber} cambió su estado a ${statusUpper}.`,
                typeAlert: alertType,
                status: 'ACTIVE'
            });
        } catch (e) {
            console.error(e);
        }

        res.status(200).json({
            success: true,
            message: `Estado del bus cambiado a ${statusUpper}`,
            data: bus
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado del bus',
            error: error.message
        });
    }
};
