import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DRAFTS_FILE = path.join(process.cwd(), 'data', 'invoice-drafts.json');

function ensureDraftsDir() {
  const dir = path.dirname(DRAFTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DRAFTS_FILE)) {
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify([]), 'utf-8');
  }
}

function readServerDrafts(): any[] {
  try {
    ensureDraftsDir();
    const data = fs.readFileSync(DRAFTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeServerDrafts(drafts: any[]) {
  try {
    ensureDraftsDir();
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write server drafts:', e);
  }
}

export async function GET() {
  try {
    const drafts = readServerDrafts();
    return NextResponse.json({ success: true, data: drafts });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.id) {
      return NextResponse.json({ success: false, error: 'Draft ID is required' }, { status: 400 });
    }

    const drafts = readServerDrafts();
    const filtered = drafts.filter((d) => d.id !== body.id);
    const updated = [body, ...filtered].slice(0, 50); // Keep latest 50 drafts
    writeServerDrafts(updated);

    return NextResponse.json({ success: true, data: body });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const drafts = readServerDrafts();
    const updated = drafts.filter((d) => d.id !== id);
    writeServerDrafts(updated);

    return NextResponse.json({ success: true, message: 'Draft deleted' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
