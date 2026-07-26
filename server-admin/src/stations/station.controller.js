"use strict";

import mongoose from "mongoose";
import Station from "./station.model.js";
import Alert from "../alerts/alert.model.js";


// 1. Obtener TODAS las estaciones
export const getAllStations = async (req, res) => {
    try {
        const { status, typeStation } = req.query;

        const filter = {};
        if (status) filter.status = status.toUpperCase();
        if (typeStation) filter.typeStation = typeStation.toUpperCase();

        const stations = await Station.find(filter).sort({ createdAt: -1 });
        const total = await Station.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Estaciones obtenidas exitosamente',
            totalRecords: total,
            data: stations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener todas las estaciones',
            error: error.message
        });
    }
};

// 2. Obtener todas las estaciones (Con paginación y filtros)
export const getStations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, typeStation } = req.query;

    const filter = {};
    if (status) filter.status = status.toUpperCase();
    if (typeStation) filter.typeStation = typeStation.toUpperCase();

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const stations = await Station.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 }); 

    const total = await Station.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: stations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener las estaciones",
      error: error.message,
    });
  }
};

// 3. Obtener una estación por ID o Código
export const getStationById = async (req, res) => {
  try {
    const { id } = req.params;
    let station;

    if (mongoose.Types.ObjectId.isValid(id)) {
      station = await Station.findById(id);
    }
    if (!station) {
      station = await Station.findOne({ stationCode: id.toUpperCase() });
    }

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Estación no encontrada (buscado por ID o Código de Estación)",
      });
    }

    res.status(200).json({
      success: true,
      data: station,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener la estación",
      error: error.message,
    });
  }
};

// 4. Crear una nueva estación
export const createStation = async (req, res) => {
  try {
    const { name, stationCode, typeStation, coordinates } = req.body;

    const stationData = {
      name,
      stationCode,
      typeStation,
      location: {
        type: "Point",
        coordinates: coordinates, 
      },
    };

    const station = new Station(stationData);
    await station.save();

    res.status(201).json({
      success: true,
      message: "Estación creada exitosamente",
      data: station,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "El nombre o código de la estación ya existe",
        error: error.keyValue,
      });
    }
    res.status(500).json({
      success: false,
      message: "Error al crear la estación",
      error: error.message,
    });
  }
};

// 6. Actualizar estación
export const updateStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinates, ...otherData } = req.body;

    const updateData = { ...otherData };

    if (coordinates) {
      updateData.location = {
        type: "Point",
        coordinates: coordinates,
      };
    }

    let query = { _id: id };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      query = { stationCode: id.toUpperCase() };
    }

    const station = await Station.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Estación no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      message: "Estación actualizada exitosamente",
      data: station,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error al actualizar la estación",
      error: error.message,
    });
  }
};

// 7. Cambiar el estado de la estación (Activar / Inactivar / Mantenimiento)
export const changeStationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    if (
      !["ACTIVE", "INACTIVE", "MAINTENANCE", "CLOSED"].includes(
        status.toUpperCase(),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido proporcionado",
      });
    }

    let query = { _id: id };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      query = { stationCode: id.toUpperCase() };
    }

    const station = await Station.findOneAndUpdate(
      query,
      { status: status.toUpperCase() },
      { new: true },
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Estación no encontrada",
      });
    }

    // CREATE AUTOMATIC ALERT
    let typeAlert = 'INFO';
    let title = `Actualización de Estado: ${station.name}`;
    let description = `La estación ${station.name} (${station.stationCode}) ha cambiado su estado a ${status.toUpperCase()}.`;

    if (status.toUpperCase() === 'MAINTENANCE') {
        typeAlert = 'MAINTENANCE';
        title = `Mantenimiento en Estación: ${station.name}`;
        description = `La estación ${station.name} (${station.stationCode}) se encuentra en mantenimiento temporal.`;
    } else if (status.toUpperCase() === 'CLOSED' || status.toUpperCase() === 'INACTIVE') {
        typeAlert = 'INCIDENT';
        title = `Estación Inactiva/Cerrada: ${station.name}`;
        description = `La estación ${station.name} (${station.stationCode}) ha cambiado su estado a ${status.toUpperCase()}.`;
    }

    try {
        const autoAlert = new Alert({
            title,
            description,
            typeAlert
        });
        await autoAlert.save();
    } catch (alertError) {
        console.error("Error al crear alerta automática:", alertError);
    }

    res.status(200).json({
      success: true,
      message: `El estado de la estación cambió a ${status.toUpperCase()} exitosamente`,
      data: station,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al cambiar el estado de la estación",
      error: error.message,
    });
  }
};
