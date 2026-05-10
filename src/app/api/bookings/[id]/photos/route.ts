import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80",
  "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400&q=80",
  "https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=400&q=80",
  "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&q=80",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80",
  "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&q=80",
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { caption } = await req.json();

  const randomPhoto = DEMO_PHOTOS[Math.floor(Math.random() * DEMO_PHOTOS.length)];

  const photo = await prisma.walkPhoto.create({
    data: {
      bookingId: id,
      url: randomPhoto,
      caption: caption || "¡Tu peludo lo está pasando genial! 🐾",
    },
  });

  return NextResponse.json({ photo });
}
