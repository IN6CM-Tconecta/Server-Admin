'use strict';

import mongoose from 'mongoose';

const busSchema = new mongoose.Schema(
    {
        busNumber: {
            type: String,
            required: [true, 'El número/código de bus es obligatorio (ej. BUS-1)'],
            trim: true,
            unique: true,
            uppercase: true
        },
        licensePlate: {
            type: String,
            required: [true, 'La placa es obligatoria'],
            trim: true,
            uppercase: true,
            unique: true,
            validate: {
                // Placas de Guatemala: Letra (U, C, P) + 3 o 4 números + 3 letras (ej. U0123BCC)
                validator: function(v) {
                    return /^[UCP]\d{3,4}[A-Z]{3}$/i.test(v);
                },
                message: 'La placa no tiene un formato válido (Ej. U123ABC o U0123BCC)'
            }
        },
        capacity: {
            type: Number,
            required: [true, 'La capacidad de pasajeros es obligatoria'],
            min: [10, 'La capacidad mínima es de 10 pasajeros'],
            max: [200, 'La capacidad máxima es de 200 pasajeros']
        },
        status: {
            type: String,
            required: true,
            enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
            default: 'ACTIVE'
        },
        assignedRoad: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Road',
            required: false // Puede existir un bus sin ruta asignada temporalmente
        }
    },
    {
        versionKey: false,
        timestamps: true 
    }
);

export default mongoose.model('Bus', busSchema);
