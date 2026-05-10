import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      walker: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
      dog: true,
      client: { select: { name: true, avatar: true } },
      walkPhotos: { orderBy: { createdAt: "asc" } },
      review: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });

  return NextResponse.json({ booking });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const data: Record<string, unknown> = { status };
  if (status === "in_progress") data.startedAt = new Date();
  if (status === "completed") data.completedAt = new Date();

  const booking = await prisma.booking.update({
    where: { id },
    data,
    include: {
      walker: { include: { user: { select: { name: true, avatar: true } } } },
      dog: true,
    },
  });

  return NextResponse.json({ booking });
}
