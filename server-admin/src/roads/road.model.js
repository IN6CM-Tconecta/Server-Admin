'use strict';

import mongoose from 'mongoose';

const roadSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre de la ruta es obligatorio'],
            trim: true,
            unique: true,
            maxLength: [100, 'El nombre de la ruta no puede exceder los 100 caracteres']
        },
        routeCode: {
            type: String,
            required: [true, 'El código de la ruta es obligatorio (ej. L1, L12)'],
            unique: true,
            trim: true,
            uppercase: true
        },
        typeRoad: {
            type: String,
            required: true,
            enum: ['EXPRESS', 'RELEVOS', 'CENTRALES'],
            default: 'CENTRALES'
        },
        color: {
            type: String,
            required: true,
            default: '#3388ff' // Azul genérico por defecto
        },
        status: {
            type: String,
            required: true,
            enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'],
            default: 'ACTIVE'
        },
        stations: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Station'
            }
        ],
        path: {
            type: {
                type: String,
                enum: ['LineString'],
                required: true,
                default: 'LineString'
            },
            coordinates: {
                type: [[Number]],
                required: [true, 'Las coordenadas de la ruta son obligatorias'],
                validate: {
                    validator: function(coordinates) {
                        return coordinates && coordinates.length >= 2;
                    },
                    message: 'Una ruta debe tener al menos 2 puntos (inicio y fin)'
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

roadSchema.index({ path: '2dsphere' });

export default mongoose.model('Road', roadSchema);