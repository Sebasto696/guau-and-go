"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, Phone, MessageCircle, MapPin, Clock, Camera, ChevronRight, CheckCircle, Navigation, X } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { SERVICES } from "@/lib/constants";
import { useLocation, nearbyWalkerPositions, type Coord } from "@/hooks/use-location";

const WalkMap = dynamic(
  () => import("@/components/maps/walk-map").then(m => m.WalkMap),
  { ssr: false }
);

type Booking = {
  id: string;
  status: string;
  serviceType: string;
  price: number;
  scheduledAt: string;
  startedAt: string | null;
  dog: { name: string; breed: string; age: number; weight: number };
  walker: {
    id: string;
    rating: number;
    totalWalks: number;
    experience: number;
    lat: number;
    lng: number;
    user: { name: string; avatar: string | null; phone: string | null };
  };
  walkPhotos: Array<{ id: string; url: string; caption: string | null; createdAt: string }>;
};

type FlowStep = "locating" | "searching" | "found" | "arriving" | "walking" | "completed" | "cancelled";

function elapsed(startedAt: string | null) {
  if (!startedAt) return "00:00";
  const s = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function BookingFlowPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const { bookingId } = useParams() as { bookingId: string };

  const { position: clientPos, zoneName, loading: locLoading } = useLocation();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [step, setStep] = useState<FlowStep>("locating");
  const [walkerPos, setWalkerPos] = useState<Coord | null>(null);
  const [routeHistory, setRouteHistory] = useState<Coord[]>([]);
  const [duration, setDuration] = useState("00:00");
  const [eta, setEta] = useState(4);
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  // Once we have location, load booking and start Didi flow
  useEffect(() => {
    if (locLoading || !clientPos) return;

    setStep("searching");

    fetch(`/api/bookings/${bookingId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.booking) return;
        const b: Booking = data.booking;
        setBooking(b);

        if (b.status === "cancelled") {
          setStep("cancelled");
          return;
        }
        if (b.status === "completed") {
          setStep("completed");
          setWalkerPos({ lat: b.walker.lat, lng: b.walker.lng });
          return;
        }
        if (b.status === "in_progress") {
          const startPos = nearbyWalkerPositions(clientPos, 1)[0];
          setWalkerPos(startPos);
          setRouteHistory([startPos]);
          setStep("walking");
          return;
        }

        // Place walker nearby the client (not at DB's fixed coords)
        const nearbyStart = nearbyWalkerPositions(clientPos, 1)[0];
        setWalkerPos(nearbyStart);

        setTimeout(() => setStep("found"), 2800);
        setTimeout(() => setStep("arriving"), 6500);
      });
  }, [locLoading, clientPos, bookingId]);

  // Animate walker approaching client while "arriving"
  useEffect(() => {
    if (step !== "arriving" || !walkerPos || !clientPos) return;

    const start = { ...walkerPos };
    const target = clientPos;
    let progress = 0;

    // ETA countdown: 4 min simulated
    let etaVal = 4;
    const etaTimer = setInterval(() => {
      etaVal = Math.max(0, etaVal - 1);
      setEta(etaVal);
    }, 8000); // step down every 8s (demo speed)

    simRef.current = setInterval(() => {
      progress = Math.min(progress + 0.025, 1);
      setWalkerPos({
        lat: start.lat + (target.lat - start.lat) * progress,
        lng: start.lng + (target.lng - start.lng) * progress,
      });
      if (progress >= 1) clearInterval(simRef.current!);
    }, 1500);

    return () => {
      clearInterval(simRef.current!);
      clearInterval(etaTimer);
    };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // GPS simulation while walking
  useEffect(() => {
    if (step !== "walking" || !clientPos || !booking) return;

    const base = clientPos;
    let tick = 0;

    simRef.current = setInterval(() => {
      tick++;
      const angle = (tick * 20 * Math.PI) / 180;
      const r = 0.0015 + (tick % 5) * 0.0002;
      const newPos: Coord = {
        lat: base.lat + Math.sin(angle) * r,
        lng: base.lng + Math.cos(angle) * r,
      };
      setWalkerPos(newPos);
      setRouteHistory(prev => [...prev.slice(-50), newPos]);
    }, 2500);

    durRef.current = setInterval(() => {
      setDuration(elapsed(booking.startedAt));
    }, 1000);

    return () => {
      clearInterval(simRef.current!);
      clearInterval(durRef.current!);
    };
  }, [step, booking]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cancelBooking() {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) {
      clearInterval(simRef.current!);
      clearInterval(durRef.current!);
      setStep("cancelled");
      toast.info("Recogida cancelada");
    }
  }

  async function startWalk() {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    if (res.ok) {
      const data = await res.json();
      setBooking(prev => prev ? { ...prev, ...data.booking } : prev);
      if (clientPos) setRouteHistory([clientPos]);
      setStep("walking");
      toast.success("¡Paseo iniciado! 🐾");
    }
  }

  async function completeWalk() {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    if (res.ok) {
      setStep("completed");
      toast.success("¡Paseo completado! 🎉");
    }
  }

  async function sendPhoto() {
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
        setBooking(prev => prev ? { ...prev, walkPhotos: [...prev.walkPhotos, data.photo] } : prev);
      }
    } finally {
      setSendingPhoto(false);
    }
  }

  const service = SERVICES.find(s => s.id === booking?.serviceType);
  const mapClientPos = clientPos ?? { lat: 4.6532, lng: -74.0560 };
  const mapWalkerPos = walkerPos ?? mapClientPos;

  // ─────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col">
      <AnimatePresence mode="wait">

        {/* ── LOCATING ── */}
        {(step === "locating") && (
          <motion.div key="locating"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Navigation size={32} className="text-blue-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Obteniendo ubicación...</h2>
              <p className="text-slate-400 text-sm">Necesitamos tu ubicación para encontrar paseadores cercanos</p>
            </div>
          </motion.div>
        )}

        {/* ── SEARCHING ── */}
        {step === "searching" && (
          <motion.div key="searching"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-orange-500/10 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-2xl">🐕</div>
                </div>
              </div>
              <motion.div className="absolute inset-0 rounded-full border-2 border-orange-500/40"
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2 }} />
              <motion.div className="absolute -inset-5 rounded-full border border-orange-500/20"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Buscando paseador...</h2>
              <p className="text-slate-400 text-sm">
                <MapPin size={12} className="inline mr-1 text-orange-400" />
                {zoneName} · Conectando con paseadores cercanos
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  className="w-2 h-2 bg-orange-500 rounded-full" />
              ))}
            </div>
            <button onClick={cancelBooking}
              className="text-slate-500 hover:text-slate-300 text-sm underline underline-offset-2 transition-colors">
              Cancelar recogida
            </button>
          </motion.div>
        )}

        {/* ── FOUND ── */}
        {step === "found" && booking && (
          <motion.div key="found"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40">
              <CheckCircle size={30} className="text-white" />
            </motion.div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">¡Paseador encontrado!</h2>
              <p className="text-slate-400 text-sm flex items-center justify-center gap-1">
                <MapPin size={12} className="text-orange-400" /> {zoneName}
              </p>
            </div>

            {/* Walker card */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="w-full max-w-sm bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-2xl">
              <div className="flex items-center gap-4 mb-5">
                <Avatar className="h-16 w-16 ring-2 ring-orange-500/50 shadow-lg">
                  <AvatarImage src={booking.walker.user.avatar || undefined} />
                  <AvatarFallback className="bg-orange-500 text-white text-xl font-bold">
                    {booking.walker.user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{booking.walker.user.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-semibold text-sm">{booking.walker.rating.toFixed(1)}</span>
                    <span className="text-slate-400 text-xs">· {booking.walker.totalWalks} paseos</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{booking.walker.experience} años · Verificado ✓</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: "🐶", label: booking.dog.name, sub: booking.dog.breed },
                  { icon: "⏱️", label: service?.duration ?? "1 h", sub: "duración" },
                  { icon: "💰", label: `$${(booking.price / 1000).toFixed(0)}k`, sub: "COP" },
                ].map(({ icon, label, sub }) => (
                  <div key={sub} className="bg-slate-700/60 rounded-xl p-2.5 text-center">
                    <div className="text-lg mb-0.5">{icon}</div>
                    <div className="text-white text-xs font-semibold truncate">{label}</div>
                    <div className="text-slate-400 text-xs">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl gap-1.5">
                  <Phone size={13} /> Llamar
                </Button>
                <Button variant="outline" size="sm"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl gap-1.5">
                  <MessageCircle size={13} /> Mensaje
                </Button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="flex flex-col items-center gap-3">
              <p className="text-slate-500 text-sm flex items-center gap-2">
                <Clock size={13} className="text-orange-400" />
                Tu paseador está en camino...
              </p>
              <button onClick={cancelBooking}
                className="text-slate-500 hover:text-slate-300 text-sm underline underline-offset-2 transition-colors">
                Cancelar recogida
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ── ARRIVING (mapa con walker acercándose) ── */}
        {step === "arriving" && booking && (
          <motion.div key="arriving"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col">

            {/* MAP */}
            <div className="relative" style={{ height: "54vh" }}>
              <WalkMap
                walkerPosition={mapWalkerPos}
                clientPosition={mapClientPos}
                isWalking={false}
                routeHistory={[]}
              />
              {/* ETA chip on map */}
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg">
                  <p className="text-slate-400 text-xs mb-0.5">Llega en</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white font-black text-3xl">{eta}</span>
                    <span className="text-slate-400 text-sm">min</span>
                  </div>
                </div>
                <div className="bg-orange-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-2xl flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  En camino
                </div>
              </div>
            </div>

            {/* BOTTOM SHEET */}
            <motion.div initial={{ y: 120 }} animate={{ y: 0 }}
              transition={{ type: "spring", bounce: 0.15, delay: 0.1 }}
              className="bg-slate-900 rounded-t-3xl px-5 pt-4 pb-8 border-t border-slate-800 flex-1">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5" />

              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-14 w-14 ring-2 ring-orange-500/40">
                  <AvatarImage src={booking.walker.user.avatar || undefined} />
                  <AvatarFallback className="bg-orange-500 text-white font-bold text-lg">
                    {booking.walker.user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{booking.walker.user.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-sm font-semibold">{booking.walker.rating.toFixed(1)}</span>
                    <span className="text-slate-400 text-xs">· Paseador verificado ✓</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors">
                    <Phone size={16} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors">
                    <MessageCircle size={16} />
                  </button>
                </div>
              </div>

              {/* Dog + service summary */}
              <div className="bg-slate-800 rounded-2xl p-4 flex items-center gap-3 mb-5">
                <span className="text-2xl">🐕</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {booking.dog.name} · {booking.dog.breed}
                  </p>
                  <p className="text-slate-400 text-xs">{service?.label} · {booking.dog.weight} kg</p>
                </div>
                <span className="text-orange-400 font-bold text-sm shrink-0">
                  ${booking.price.toLocaleString("es-CO")}
                </span>
              </div>

              <Button onClick={startWalk}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-6 text-base font-bold gap-2 shadow-lg shadow-orange-500/20">
                <MapPin size={18} /> Iniciar paseo ahora
              </Button>
              <button onClick={cancelBooking}
                className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors">
                Cancelar recogida
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ── WALKING (GPS en vivo + fotos) ── */}
        {step === "walking" && booking && (
          <motion.div key="walking"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col">

            {/* MAP */}
            <div className="relative" style={{ height: "52vh" }}>
              <WalkMap
                walkerPosition={mapWalkerPos}
                clientPosition={mapClientPos}
                isWalking={true}
                routeHistory={routeHistory}
              />
              {/* Overlays */}
              <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none">
                <div className="bg-orange-500 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-orange-500/30">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <Clock size={14} />
                  <span className="font-mono font-black text-lg">{duration}</span>
                </div>
                <div className="bg-slate-900/90 backdrop-blur-md text-slate-300 text-xs px-3 py-2.5 rounded-2xl flex items-center gap-1.5">
                  <MapPin size={12} className="text-orange-400" />
                  {zoneName}
                </div>
              </div>
            </div>

            {/* BOTTOM SHEET */}
            <motion.div initial={{ y: 120 }} animate={{ y: 0 }}
              transition={{ type: "spring", bounce: 0.15 }}
              className="bg-slate-900 rounded-t-3xl px-5 pt-4 pb-8 border-t border-slate-800 flex-1">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4" />

              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-11 w-11 ring-2 ring-orange-500/50">
                  <AvatarImage src={booking.walker.user.avatar || undefined} />
                  <AvatarFallback className="bg-orange-500 text-white font-bold">
                    {booking.walker.user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{booking.walker.user.name}</p>
                  <p className="text-slate-400 text-xs">Paseando a {booking.dog.name} · en vivo 🐾</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"><Phone size={14} /></button>
                  <button className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"><MessageCircle size={14} /></button>
                </div>
              </div>

              {/* Photos */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-white text-sm font-semibold flex items-center gap-1.5">
                    <Camera size={14} className="text-orange-400" />
                    Fotos del paseo
                    <span className="text-slate-500 text-xs">({booking.walkPhotos.length})</span>
                  </p>
                  <button onClick={sendPhoto} disabled={sendingPhoto}
                    className="text-orange-400 text-xs font-semibold hover:text-orange-300 disabled:opacity-50 transition-colors flex items-center gap-1">
                    {sendingPhoto ? "Enviando..." : "📸 Pedir foto"}
                  </button>
                </div>

                {booking.walkPhotos.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {booking.walkPhotos.slice().reverse().map(photo => (
                      <button key={photo.id} onClick={() => setSelectedPhoto(photo.url)}
                        className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden ring-1 ring-slate-700 hover:ring-orange-500 transition-all">
                        <img src={photo.url} alt="Foto" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700 border-dashed">
                    <p className="text-slate-500 text-xs">Pide una foto y aparecerá aquí 📸</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={sendPhoto} disabled={sendingPhoto} variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl py-5 gap-2">
                  <Camera size={16} /> {sendingPhoto ? "..." : "Pedir foto"}
                </Button>
                <Button onClick={completeWalk}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-5 gap-2 font-semibold shadow-lg shadow-green-500/20">
                  <CheckCircle size={16} /> Finalizar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── COMPLETED ── */}
        {step === "completed" && booking && (
          <motion.div key="completed"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.6, delay: 0.1 }}
              className="text-7xl mb-5">🎉</motion.div>

            <h2 className="text-3xl font-bold text-white mb-2">¡Paseo completado!</h2>
            <p className="text-slate-400 mb-1">{booking.dog.name} llegó a casa feliz 🐾</p>
            <p className="text-slate-500 text-sm mb-6">Con {booking.walker.user.name} en {zoneName}</p>

            {booking.walkPhotos.length > 0 && (
              <div className="w-full max-w-sm mb-8">
                <p className="text-slate-400 text-sm mb-3 text-left font-medium">
                  📸 Fotos del paseo ({booking.walkPhotos.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {booking.walkPhotos.slice(0, 6).map(photo => (
                    <button key={photo.id} onClick={() => setSelectedPhoto(photo.url)}
                      className="aspect-square rounded-xl overflow-hidden ring-1 ring-slate-700 hover:ring-orange-500 transition-all">
                      <img src={photo.url} alt="Foto" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="w-full max-w-sm space-y-3">
              <Button onClick={() => router.push("/dashboard")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-6 font-bold gap-2">
                Volver al inicio <ChevronRight size={18} />
              </Button>
              <Button onClick={() => router.push("/search")} variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 rounded-2xl py-6">
                Reservar otro paseo
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── CANCELLED ── */}
        {step === "cancelled" && (
          <motion.div key="cancelled"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
              className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
              <X size={36} className="text-red-400" />
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Recogida cancelada</h2>
              <p className="text-slate-400 text-sm max-w-xs">
                Cancelaste esta recogida. Puedes pedir otro paseador cuando quieras.
              </p>
            </div>

            <div className="w-full max-w-sm space-y-3">
              <Button onClick={() => router.push("/search")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-6 font-bold gap-2">
                🐕 Pedir otro paseador
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 rounded-2xl py-6">
                Volver al inicio
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-pointer">
            <motion.img initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              src={selectedPhoto} alt="Foto del paseo"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
