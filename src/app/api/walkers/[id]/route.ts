import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const walker = await prisma.walkerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { booking: { include: { dog: true, client: { select: { name: true, avatar: true } } } } },
      },
    },
  });

  if (!walker) return NextResponse.json({ error: "Paseador no encontrado" }, { status: 404 });

  return NextResponse.json({ walker });
}
