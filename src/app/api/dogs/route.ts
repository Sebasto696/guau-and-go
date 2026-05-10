import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { name, breed, age, weight, notes } = await req.json();

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!clientProfile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const dog = await prisma.dog.create({
    data: { name, breed, age: Number(age), weight: Number(weight), notes, clientProfileId: clientProfile.id },
  });

  return NextResponse.json({ dog });
}
