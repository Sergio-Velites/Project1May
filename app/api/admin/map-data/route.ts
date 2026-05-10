import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'public/editor/map-data.json');

function readData() {
  if (!fs.existsSync(DATA_PATH)) return {};
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

export async function GET() {
  try {
    const data = readData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'No se pudo leer map-data.json. ¿Has ejecutado npm run editor:setup?' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { mapId, trainers } = await request.json();
    if (!mapId) {
      return NextResponse.json({ error: 'mapId requerido' }, { status: 400 });
    }

    const data = readData();
    if (!data[mapId]) {
      return NextResponse.json({ error: `Mapa "${mapId}" no encontrado` }, { status: 404 });
    }

    data[mapId].trainers = trainers;
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
