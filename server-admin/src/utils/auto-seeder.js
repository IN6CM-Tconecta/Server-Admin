import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// Modelos
import Road from '../roads/road.model.js';
import Station from '../stations/station.model.js';
import Bus from '../buses/bus.model.js';

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
  // Ajustar la ruta relativa porque ahora estamos en src/utils
  const geojsonPath = path.join(__dirname, '..', 'data', 'transmetro.geojson');
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
      let coords = feature.geometry.coordinates;
      if (coords.length > 2) coords = [coords[0], coords[1]];

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
      let coords = feature.geometry.coordinates;
      
      if (geomType === 'Polygon') {
        coords = coords[0];
      } else if (geomType === 'MultiLineString') {
        coords = coords[0];
      }

      coords = coords.map(c => c.length > 2 ? [c[0], c[1]] : c);

      let routeCode = `L${Math.floor(Math.random() * 100)}`;
      if (props.name) {
        const match = props.name.match(/Línea\s*(\d+)/i);
        if (match) routeCode = `L${match[1]}`;
      }

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

export const seedTransmetroData = async () => {
  try {
    const stationCount = await Station.countDocuments();
    const roadCount = await Road.countDocuments();

    if (stationCount > 0 || roadCount > 0) {
      console.log('✅ Auto-Seeder: Las colecciones de Transmetro ya contienen datos. Saltando siembra inicial.');
      return;
    }

    console.log('\n--- 🚀 Iniciando Auto-Seeder de Transmetro (GeoJSON) ---\n');
    console.log('🧹 Limpiando colecciones existentes (Buses vacíos)...');
    await Bus.deleteMany({});
    
    console.log('🗺️ Leyendo archivo transmetro.geojson...');
    const { stations, roads } = parseGeoJSON();
    console.log(`Encontradas: ${stations.length} estaciones y ${roads.length} rutas en el GeoJSON.`);

    console.log('\n📍 Insertando Estaciones...');
    const insertedStations = await Station.insertMany(stations);
    console.log(`✅ ${insertedStations.length} estaciones insertadas.`);

    console.log('\n🛣️ Insertando Rutas y asignando Buses...');
    for (const roadData of roads) {
      const road = await Road.create(roadData);
      console.log(`   - Creada ruta: ${road.name} (Code: ${road.routeCode})`);

      const numBuses = Math.floor(Math.random() * 2) + 2;
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

    console.log('\n🎉 ¡Auto-Seeder finalizado con éxito! La base de datos está poblada con el GeoJSON.\n');

  } catch (error) {
    console.error('\n❌ Error durante el auto-sembrado de datos:', error);
  }
};
