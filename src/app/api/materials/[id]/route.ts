import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { authContext, requireRole } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const materials = {
  aluno: { filename: 'Curso_Aluno_Violao_Gospel_v5.pdf', teacherOnly: false },
  professor: { filename: 'Manual_Professor_Violao_Gospel_v5.pdf', teacherOnly: true },
} as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const headers = { 'Cache-Control': 'private, no-store', 'X-Request-Id': requestId, 'X-Content-Type-Options': 'nosniff' };
  try {
    const context = await authContext();
    const { id } = await params;
    if (!Object.prototype.hasOwnProperty.call(materials, id)) throw new AppError(404, 'NOT_FOUND', 'Material não encontrado.');
    const material = materials[id as keyof typeof materials];
    if (material.teacherOnly) requireRole(context, 'teacher');
    // Only static, allowlisted basenames are used. The URL parameter is never a path.
    const bytes = await readFile(path.join(process.cwd(), 'materials', material.filename));
    return new NextResponse(new Uint8Array(bytes), { headers: {
      ...headers, 'Content-Type': 'application/pdf', 'Content-Length': String(bytes.byteLength),
      'Content-Disposition': `attachment; filename="${material.filename}"`,
    } });
  } catch (error) {
    const known = error instanceof AppError ? error : new AppError(503, 'MATERIAL_UNAVAILABLE', 'Não foi possível carregar o material. Tente novamente.');
    return NextResponse.json({ error: { code: known.code, message: known.message, requestId } }, { status: known.status, headers });
  }
}
