import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { dbConnection } from '../configs/db.js';

// Modelos
import Road from './roads/road.model.js';
import Station from './stations/station.model.js';
import Bus from './buses/bus.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera una placa ficticia guatemalteca válida: Letra + 4 números + 3 letras (ej. U0123BCC)
 */
const generatePlate = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = Math.floor(1000 + Math.random() * 9000);
  const end = Array(3).fill().map(() => letters[Math.floor(Math.random() * letters.length)]).join('');
  return `U${nums}${end}`;
};

/**
 * Determina el color oficial de la línea de Transmetro
 */
const getLineColor = (lineName) => {
  const name = lineName.toLowerCase();
  if (name.includes('línea 1') && !name.includes('12') && !name.includes('13') && !name.includes('18')) return '#6A1B9A'; // Morado
  if (name.includes('línea 2')) return '#AB47BC'; // Magenta
  if (name.includes('línea 5')) return '#1565C0'; // Azul Marino
  if (name.includes('línea 6') || name.includes('polígono 6')) return '#FBC02D'; // Amarillo
  if (name.includes('línea 7')) return '#757575'; // Gris
  if (name.includes('línea 12')) return '#E65100'; // Naranja
  if (name.includes('línea 13')) return '#4CAF50'; // Verde
  if (name.includes('línea 18')) return '#00ACC1'; // Celeste
  return '#3388ff'; // Default fallback
};

/**
 * Parsea el archivo GeoJSON y clasifica en Rutas y Estaciones.
 */
const parseGeoJSON = () => {
  const geojsonPath = path.join(__dirname, 'data', 'transmetro.geojson');
  if (!fs.existsSync(geojsonPath)) {
    throw new Error(`No se encontró el archivo GeoJSON en: ${geojsonPath}`);
  }

  const rawData = fs.readFileSync(geojsonPath, 'utf8');
  const parsed = JSON.parse(rawData);

  const stations = [];
  const roads = [];

  for (const feature of parsed.features) {
    const geomType = feature.geometry.type;
    const props = feature.properties;

    if (geomType === 'Point') {
      // Las coordenadas GeoJSON Point ya vienen como [Longitud, Latitud]
      let coords = feature.geometry.coordinates;
      // Remover altitud si existe (ej. [lng, lat, 0])
      if (coords.length > 2) coords = [coords[0], coords[1]];

      // Manejar nombres duplicados (MongoDB tiene unique index en name)
      let stName = props.name || 'Estación Desconocida';
      if (stations.some(s => s.name === stName)) {
        stName = `${stName} - ${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }

      stations.push({
        name: stName,
        stationCode: `EST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        typeStation: 'CENTRALES',
        location: {
          type: 'Point',
          coordinates: coords
        }
      });
    } 
    else if (geomType === 'LineString' || geomType === 'Polygon' || geomType === 'MultiLineString') {
      // Es una ruta
      let coords = feature.geometry.coordinates;
      
      // Si es un Polygon, el primer elemento es el anillo exterior (arreglo de puntos)
      if (geomType === 'Polygon') {
        coords = coords[0];
      } else if (geomType === 'MultiLineString') {
        // Tomamos el primer segmento para simplificar
        coords = coords[0];
      }

      // Remover altitudes de las coordenadas si existen
      coords = coords.map(c => c.length > 2 ? [c[0], c[1]] : c);

      // Extraer un código de ruta (ej. 'L1' a partir de 'Línea 1')
      let routeCode = `L${Math.floor(Math.random() * 100)}`;
      if (props.name) {
        const match = props.name.match(/Línea\s*(\d+)/i);
        if (match) routeCode = `L${match[1]}`;
      }

      // Manejar nombres y códigos duplicados
      let rdName = props.name || 'Ruta Desconocida';
      if (roads.some(r => r.name === rdName)) {
        rdName = `${rdName} - ${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }
      
      let finalRouteCode = routeCode;
      if (roads.some(r => r.routeCode === finalRouteCode)) {
         finalRouteCode = `${finalRouteCode}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }

      const roadColor = getLineColor(props.name || '');

      roads.push({
        name: rdName,
        routeCode: finalRouteCode,
        typeRoad: 'CENTRALES',
        status: 'ACTIVE',
        color: roadColor,
        path: {
          type: 'LineString',
          coordinates: coords
        }
      });
    }
  }

  return { stations, roads };
};

const runSeeder = async () => {
  console.log('\n--- 🚀 Iniciando Transmetro Data Seeder (GeoJSON) ---\n');
  
  try {
    // 1. Conectar a la base de datos
    await dbConnection();

    // 2. Limpieza Idempotente
    console.log('🧹 Limpiando colecciones existentes...');
    await Bus.deleteMany({});
    await Station.deleteMany({});
    await Road.deleteMany({});
    console.log('✅ Colecciones limpias.');

    // 3. Leer y parsear el GeoJSON
    console.log('🗺️ Leyendo archivo transmetro.geojson...');
    const { stations, roads } = parseGeoJSON();
    console.log(`Encontradas: ${stations.length} estaciones y ${roads.length} rutas en el GeoJSON.`);

    // 4. Insertar Estaciones
    console.log('\n📍 Insertando Estaciones...');
    const insertedStations = await Station.insertMany(stations);
    console.log(`✅ ${insertedStations.length} estaciones insertadas.`);

    // 5. Insertar Rutas (y opcionalmente vincular estaciones)
    console.log('\n🛣️ Insertando Rutas y asignando Buses...');
    for (const roadData of roads) {
      // Vincular todas las estaciones a todas las rutas (por simplicidad, dado que 
      // el GeoJSON plano no agrupa qué estación es de qué ruta).
      // Si el modelo requiere stations: [], le pasamos algunas aleatorias o todas.
      // Para optimizar rendimiento, asignaremos referencias vacías o parciales.
      
      const road = await Road.create(roadData);
      console.log(`   - Creada ruta: ${road.name} (Code: ${road.routeCode})`);

      // 6. Insertar 2-3 unidades de Bus para esta ruta
      const numBuses = Math.floor(Math.random() * 2) + 2; // 2 o 3 buses
      for (let i = 1; i <= numBuses; i++) {
        const busNum = `TM-${road.routeCode.replace('L', '')}${i.toString().padStart(2, '0')}-${Math.floor(Math.random() * 100)}`;
        const bus = await Bus.create({
          busNumber: busNum,
          licensePlate: generatePlate(),
          capacity: Math.floor(Math.random() * (120 - 80 + 1) + 80),
          assignedRoad: road._id
        });
        console.log(`      🚍 Asignado Bus: ${bus.busNumber} (Placa: ${bus.licensePlate})`);
      }
    }

    console.log('\n🎉 ¡Data Seeder finalizado con éxito! La base de datos está poblada con el GeoJSON.');

  } catch (error) {
    console.error('\n❌ Error durante el sembrado de datos:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión limpiamente
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Conexión a MongoDB cerrada.');
    }
    process.exit(0);
  }
};

// Ejecutar
runSeeder();
