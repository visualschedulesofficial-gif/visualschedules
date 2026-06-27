import { NextRequest, NextResponse } from "next/server";

// GET /api/schedules — list user's schedules
export async function GET(request: NextRequest) {
  // TODO: Get user from session, query D1
  // For now, return empty list
  return NextResponse.json({ schedules: [] });
}

// POST /api/schedules — create a new schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, scheduleType, language, gender, gridCols, customColNames, weekMode, cardStyle, data } = body;

    // TODO: Get user from session, insert into D1
    const id = crypto.randomUUID();

    return NextResponse.json({
      id,
      title,
      scheduleType,
      language,
      gender,
      gridCols,
      customColNames,
      weekMode,
      cardStyle,
      data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
