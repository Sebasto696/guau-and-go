"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Phone, MessageCircle, Clock, PawPrint, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { BOGOTA_CENTER } from "@/lib/constants";
import { useLocation } from "@/hooks/use-location";

const WalkMap = dynamic(() => import("@/components/maps/walk-map").then(m => m.WalkMap), { ssr: false });

type Coord = { lat: number; lng: number };

type Booking = {
  id: string;
  status: string;
  serviceType: string;
  price: number;
  startedAt: string | null;
  dog: { name: string; breed: string; age: number };
  walker: {
    lat: number;
    lng: number;
    user: { name: string; avatar: string | null; phone: string | null };
  };
  client: { name: string; avatar: string | null };
  walkPhotos: Array<{ id: string; url: string; caption: string | null; createdAt: string }>;
};

function formatDuration(startedAt: string | null) {
  if (!startedAt) return "00:00";
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const m = Math.floor(diff / 60).toString().padStart(2, "0");
  const s = (diff % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function TrackingPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;
  const { position: clientPos } = useLocation();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [walkerPos, setWalkerPos] = useState<Coord>(BOGOTA_CENTER);
  const [routeHistory, setRouteHistory] = useState<Coord[]>([]);
  const [duration, setDuration] = useState("00:00");
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const loadBooking = useCallback(async () => {
    const res = await fetch(`/api/bookings/${bookingId}`);
    const data = await res.json();
    if (data.booking) {
      setBooking(data.booking);
      setWalkerPos({ lat: data.booking.walker.lat, lng: data.booking.walker.lng });
      setRouteHistory(prev => prev.length === 0
        ? [{ lat: data.booking.walker.lat, lng: data.booking.walker.lng }]
        : prev
      );
    }
    setLoading(false);
  }, [bookingId]);

  useEffect(() => { loadBooking(); }, [loadBooking]);

  // GPS simulation: move walker slowly
  useEffect(() => {
    if (!booking || booking.status !== "in_progress") return;

    const startPos = { lat: booking.walker.lat, lng: booking.walker.lng };
    let step = 0;

    simulationRef.current = setInterval(() => {
      step++;
      const angle = (step * 15 * Math.PI) / 180;
      const radius = 0.002;
      const newPos = {
        lat: startPos.lat + Math.sin(angle) * radius,
        lng: startPos.lng + Math.cos(angle) * radius,
      };
      setWalkerPos(newPos);
      setRouteHistory(prev => [...prev.slice(-30), newPos]);
    }, 3000);

    durationRef.current = setInterval(() => {
      setDuration(formatDuration(booking.startedAt));
    }, 1000);

    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, [booking]);

  async function handleStartWalk() {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    if (res.ok) {
      toast.success("¡Paseo iniciado! 🐾");
      loadBooking();
    }
  }

  async function handleCompleteWalk() {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    if (res.ok) {
      toast.success("¡Paseo completado! 🎉");
      loadBooking();
    }
  }

  async function handleSendPhoto() {
    setSendingPhoto(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.photo) {
        toast.success("📸 ¡Foto enviada!");
        setBooking(prev => prev ? {
          ...prev,
          walkPhotos: [...prev.walkPhotos, data.photo],
        } : prev);
      }
    } finally {
      setSendingPhoto(false);
    }
  }

  if (loading || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-3">🐾</div>
          <p className="text-slate-500">Cargando seguimiento...</p>
        </div>
      </div>
    );
  }

  const resolvedClientPos = clientPos ?? { lat: BOGOTA_CENTER.lat + 0.01, lng: BOGOTA_CENTER.lng + 0.01 };
  const isWalking = booking.status === "in_progress";
  const isWalker = user?.role === "walker";

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <button
            onClick={() => router.back()}
            className="text-white/70 hover:text-white p-1 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">Seguimiento del paseo</h1>
            <p className="text-slate-400 text-xs">{booking.dog.name} · {booking.dog.breed}</p>
          </div>
          {isWalking && (
            <div className="flex items-center gap-2 bg-orange-500 text-white px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <Clock size={13} />
              <span className="text-sm font-mono font-bold">{duration}</span>
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl overflow-hidden bg-slate-800" style={{ height: "440px" }}>
              <WalkMap
                walkerPosition={walkerPos}
                clientPosition={resolvedClientPos}
                isWalking={isWalking}
                routeHistory={routeHistory}
              />
            </div>

            {/* Map legend */}
            <div className="flex items-center gap-4 mt-3 px-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <span className="text-base">🐕</span> Paseador
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <span className="text-base">🏠</span> Tu hogar
              </div>
              {routeHistory.length > 1 && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <div className="w-6 h-0.5 bg-orange-400 rounded" style={{ backgroundImage: "repeating-linear-gradient(90deg, #f97316 0, #f97316 4px, transparent 4px, transparent 8px)" }} />
                  Ruta
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Walker info */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12 ring-2 ring-orange-500/30">
                  <AvatarImage src={booking.walker.user.avatar || undefined} />
                  <AvatarFallback className="bg-orange-500 text-white font-bold">
                    {booking.walker.user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold">{booking.walker.user.name}</p>
                  <Badge className={`text-xs mt-0.5 ${isWalking ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-slate-700 text-slate-400 border-slate-600"}`}>
                    {isWalking ? "🐕 Paseando ahora" : booking.status === "completed" ? "✅ Completado" : "⏳ Esperando"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                {booking.walker.user.phone && (
                  <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5">
                    <Phone size={13} />
                    Llamar
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5">
                  <MessageCircle size={13} />
                  Mensaje
                </Button>
              </div>
            </motion.div>

            {/* Walker controls */}
            {isWalker && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-slate-800 rounded-2xl p-4 space-y-2"
              >
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Controles del paseador</p>
                {booking.status === "accepted" && (
                  <Button onClick={handleStartWalk} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2">
                    <PawPrint size={15} />
                    Iniciar paseo
                  </Button>
                )}
                {isWalking && (
                  <>
                    <Button
                      onClick={handleSendPhoto}
                      disabled={sendingPhoto}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl gap-2"
                    >
                      <Camera size={15} />
                      {sendingPhoto ? "Enviando..." : "Enviar foto"}
                    </Button>
                    <Button
                      onClick={handleCompleteWalk}
                      className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2"
                    >
                      ✅ Finalizar paseo
                    </Button>
                  </>
                )}
              </motion.div>
            )}

            {/* Client: send photo request */}
            {!isWalker && isWalking && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-slate-800 rounded-2xl p-4"
              >
                <Button
                  onClick={handleSendPhoto}
                  disabled={sendingPhoto}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2"
                >
                  <Camera size={15} />
                  {sendingPhoto ? "Solicitando..." : "Pedir foto de mi perro"}
                </Button>
              </motion.div>
            )}

            {/* Photos */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-white text-sm font-semibold">Fotos del paseo</p>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                  {booking.walkPhotos.length} fotos
                </Badge>
              </div>

              {booking.walkPhotos.length === 0 ? (
                <div className="text-center py-6">
                  <Camera size={24} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-xs">Las fotos aparecerán aquí</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {booking.walkPhotos.slice().reverse().map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo.url)}
                      className="relative aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <img src={photo.url} alt={photo.caption || "Foto del paseo"} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Photo lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedPhoto}
              alt="Foto del paseo"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
