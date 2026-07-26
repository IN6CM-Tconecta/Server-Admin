import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Tconecta API Documentation',
            version: '1.0.0',
            description: 'API Documentation for Tconecta Admin Server',
            contact: {
                name: 'Tconecta Team',
                email: 'support@tconecta.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001/TCONECTA/v1',
                description: 'Development Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Bearer token required for authentication'
                }
            },
            schemas: {
                Road: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Unique identifier for the road' },
                        name: { type: 'string', description: 'Name of the road' },
                        routeCode: { type: 'string', description: 'Code identifier for the road (ej. L1, L12)' },
                        typeRoad: {
                            type: 'string',
                            enum: ['EXPRESS', 'RELEVOS', 'CENTRALES'],
                            description: 'Type of road'
                        },
                        status: {
                            type: 'string',
                            enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'],
                            description: 'Status of the road'
                        },
                        stations: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of station IDs'
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Station: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Unique identifier for the station' },
                        name: { type: 'string', description: 'Name of the station' },
                        stationCode: { type: 'string', description: 'Code identifier for the station (ej. EST-01)' },
                        typeStation: {
                            type: 'string',
                            enum: ['CENTRALES', 'CARRIL LATERAL', 'TRASBORDO', 'TERMINALES'],
                            description: 'Type of station'
                        },
                        status: {
                            type: 'string',
                            enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'],
                            description: 'Status of the station'
                        },
                        location: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', example: 'Point' },
                                coordinates: { type: 'array', items: { type: 'number' }, example: [-90.5132, 14.6407] }
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Alert: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'Unique identifier for the alert' },
                        title: { type: 'string', description: 'Title of the alert' },
                        description: { type: 'string', description: 'Detailed description of the alert' },
                        typeAlert: {
                            type: 'string',
                            enum: ['INCIDENT', 'MAINTENANCE', 'INFO'],
                            description: 'Type of alert'
                        },
                        status: {
                            type: 'string',
                            enum: ['ACTIVE', 'RESOLVED'],
                            description: 'Status of the alert'
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', description: 'Error message' },
                        error: { type: 'string', description: 'Error details' }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [
        './src/roads/road.routes.js',
        './src/stations/station.routes.js',
        './src/alerts/alert.routes.js',
        './configs/app.js'
    ]
};

export const specs = swaggerJsdoc(options);
