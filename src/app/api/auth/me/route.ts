import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      clientProfile: { include: { dogs: true } },
      walkerProfile: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const { password: _, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}

export async function DELETE() {
  const cookieStore = await import("next/headers").then(m => m.cookies());
  cookieStore.delete("token");
  return NextResponse.json({ ok: true });
}
