import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { analyzeBillWithVision, FilePayload } from '@/lib/vision/engine';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Check if multiple files or single file uploaded
    const files: File[] = [];
    const allFileEntries = formData.getAll('files') as File[];
    if (allFileEntries && allFileEntries.length > 0) {
      for (const f of allFileEntries) {
        if (f && typeof f.arrayBuffer === 'function') files.push(f);
      }
    }
    const singleFile = formData.get('file') as File | null;
    if (singleFile && typeof singleFile.arrayBuffer === 'function' && !files.includes(singleFile)) {
      files.push(singleFile);
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No bill image or PDF uploaded. Please provide at least one file.' },
        { status: 400 }
      );
    }

    // Optional user-specified overrides from client
    const customKey = (formData.get('apiKey') as string) || undefined;
    const customProvider = (formData.get('provider') as string) || undefined;
    const customModel = (formData.get('model') as string) || undefined;

    // 1. Save all uploaded files to public/uploads/bills/ when writable (safe on Vercel read-only fs)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'bills');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Read-only serverless environment (e.g. Vercel)
    }

    const filePayloads: FilePayload[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const originalName = file.name || `bill_${Date.now()}`;
      const ext = path.extname(originalName) || '.jpg';
      const cleanBaseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
      const uniqueFilename = `bill_${Date.now()}_${cleanBaseName}_p${i + 1}${ext}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      try {
        await writeFile(filePath, buffer);
      } catch {
        // Ignore EROFS on Vercel serverless
      }

      filePayloads.push({
        buffer,
        fileName: originalName,
        mimeType: file.type || (ext === '.pdf' ? 'application/pdf' : 'image/jpeg'),
        fileUrl: `/uploads/bills/${uniqueFilename}`,
      });
    }

    // 2. Multimodal AI Document Vision Understanding
    const visionResult = await analyzeBillWithVision(
      filePayloads,
      customKey,
      customProvider,
      customModel
    );

    return NextResponse.json({
      success: true,
      data: visionResult,
    });
  } catch (error: any) {
    console.error('AI Bill Vision Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process document with AI Vision model.',
      },
      { status: 500 }
    );
  }
}
