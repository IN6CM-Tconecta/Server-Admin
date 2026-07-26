'use strict';

import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre de la estación es obligatorio'],
            trim: true,
            unique: true,
            maxLength: [100, 'El nombre no puede exceder los 100 caracteres']
        },
        stationCode: {
            type: String,
            required: [true, 'El código de la estación es obligatorio (ej. EST-01)'],
            unique: true,
            trim: true,
            uppercase: true
        },
        typeStation: {
            type: String,
            required: true,
            enum: ['CENTRALES', 'CARRIL LATERAL', 'TRASBORDO', 'TERMINALES'],
            default: 'CENTRALES'
        },
        status: {
            type: String,
            required: true,
            enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'],
            default: 'ACTIVE'
        },
        location: {
            type: {
                type: String,
                enum: ['Point'], 
                required: true,
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: [true, 'Las coordenadas son obligatorias'],
                validate: {
                    validator: function(coordenates) {
                        return coordenates && coordenates.length === 2;
                    },
                    message: 'Las coordenadas deben contener exactamente longitud y latitud'
                }
            }
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        versionKey: false,
        timestamps: true 
    }
);

stationSchema.index({ location: '2dsphere' });

export default mongoose.model('Station', stationSchema);