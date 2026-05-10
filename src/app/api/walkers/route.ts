import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const walkers = await prisma.walkerProfile.findMany({
    where: { isAvailable: true },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
      reviews: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    orderBy: { rating: "desc" },
  });

  return NextResponse.json({ walkers });
}
