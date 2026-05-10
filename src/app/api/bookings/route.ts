import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SERVICES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { walkerId, dogId, serviceType, scheduledAt, notes } = await req.json();

  const service = SERVICES.find(s => s.id === serviceType);
  if (!service) return NextResponse.json({ error: "Servicio inválido" }, { status: 400 });

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!clientProfile) return NextResponse.json({ error: "Perfil cliente no encontrado" }, { status: 404 });

  const booking = await prisma.booking.create({
    data: {
      clientId: session.userId,
      walkerId,
      dogId,
      serviceType,
      price: service.price,
      scheduledAt: new Date(scheduledAt),
      notes,
      status: "accepted",
    },
    include: {
      walker: { include: { user: { select: { name: true, avatar: true } } } },
      dog: true,
    },
  });

  return NextResponse.json({ booking });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where =
    session.role === "client"
      ? { clientId: session.userId, ...(status ? { status } : {}) }
      : {
          walker: { userId: session.userId },
          ...(status ? { status } : {}),
        };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      walker: { include: { user: { select: { name: true, avatar: true } } } },
      dog: true,
      client: { select: { name: true, avatar: true } },
      walkPhotos: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
