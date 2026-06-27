import { NextRequest, NextResponse } from "next/server";

// GET /api/schedules/:id — get a single schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: Query D1 for schedule by id, verify ownership
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// PUT /api/schedules/:id — update a schedule (auto-save)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    // TODO: Update in D1, verify ownership
    return NextResponse.json({
      id,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// DELETE /api/schedules/:id — delete a schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: Delete from D1, verify ownership
  return NextResponse.json({ deleted: true });
}
