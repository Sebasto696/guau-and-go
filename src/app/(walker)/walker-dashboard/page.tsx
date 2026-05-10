"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, TrendingUp, Clock, CheckCircle, PawPrint, MapPin } from "lucide-react";
import { SERVICES } from "@/lib/constants";
import { toast } from "sonner";

type Booking = {
  id: string;
  status: string;
  serviceType: string;
  price: number;
  scheduledAt: string;
  notes: string | null;
  dog: { name: string; breed: string; age: number; weight: number; notes: string | null };
  client: { name: string; avatar: string | null };
  walkPhotos: Array<{ url: string }>;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  accepted: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "En curso", color: "bg-orange-100 text-orange-700" },
  completed: { label: "Completado", color: "bg-green-100 text-green-700" },
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
};

export default function WalkerDashboard() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [walkerProfile, setWalkerProfile] = useState<{ rating: number; totalWalks: number; isAvailable: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (!isLoading && user?.role === "client") router.push("/dashboard");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/bookings").then(r => r.json()),
      fetch("/api/auth/me").then(r => r.json()),
    ]).then(([bookData, userData]) => {
      setBookings(bookData.bookings || []);
      setWalkerProfile(userData.user?.walkerProfile || null);
    }).finally(() => setLoading(false));
  }, [user]);

  async function handleAction(id: string, status: string) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(status === "in_progress" ? "¡Paseo iniciado! 🐾" : "¡Paseo completado! 🎉");
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
  }

  if (isLoading || !user) return null;

  const activeBooking = bookings.find(b => b.status === "in_progress");
  const upcoming = bookings.filter(b => b.status === "accepted");
  const completed = bookings.filter(b => b.status === "completed");
  const earnings = completed.reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-4 ring-orange-500/30">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-orange-500 text-white text-lg font-bold">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-slate-400 text-sm">Hola,</p>
              <h1 className="text-2xl font-bold text-white">{user.name} 🦮</h1>
            </div>
          </div>
          {walkerProfile && (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold">{walkerProfile.rating.toFixed(1)}</span>
                </div>
                <span className="text-slate-400 text-xs">{walkerProfile.totalWalks} paseos</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Active walk */}
        {activeBooking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Link href={`/tracking/${activeBooking.id}`}>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 hover:opacity-95 transition-opacity cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🐕</div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="font-bold text-white">Paseo en curso</span>
                      </div>
                      <p className="text-orange-100 text-sm">
                        {activeBooking.dog.name} para {activeBooking.client.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                      onClick={async (e) => { e.preventDefault(); await handleAction(activeBooking.id, "completed"); }}
                    >
                      ✅ Finalizar
                    </Button>
                    <div className="bg-white/20 text-white text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <MapPin size={13} />
                      Ver mapa
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Ganancias", value: `$${earnings.toLocaleString("es-CO")}`, icon: TrendingUp, color: "text-green-400" },
            { label: "Próximos", value: upcoming.length, icon: Clock, color: "text-blue-400" },
            { label: "Completados", value: completed.length, icon: CheckCircle, color: "text-orange-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 rounded-2xl border border-slate-700 p-4 text-center"
            >
              <Icon size={20} className={`${color} mx-auto mb-2`} />
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Bookings list */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Mis paseos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-700 rounded-xl animate-pulse" />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <PawPrint size={36} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No tienes paseos aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(booking => {
                  const service = SERVICES.find(s => s.id === booking.serviceType);
                  const status = statusConfig[booking.status] || statusConfig.pending;
                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-slate-700/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.client.avatar || undefined} />
                          <AvatarFallback className="bg-slate-600 text-white text-sm">
                            {booking.client.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-medium text-sm">{booking.client.name}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs mb-2">
                            🐶 {booking.dog.name} ({booking.dog.breed}, {booking.dog.weight}kg) · {service?.label}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-xs">
                              {new Date(booking.scheduledAt).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="text-orange-400 font-semibold text-sm">
                              ${booking.price.toLocaleString("es-CO")}
                            </span>
                          </div>
                          {booking.notes && (
                            <p className="text-slate-500 text-xs mt-1 italic">"{booking.notes}"</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {booking.status === "accepted" && (
                        <div className="flex gap-2 mt-3">
                          <Link href={`/tracking/${booking.id}`} className="flex-1">
                            <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg gap-1.5">
                              <PawPrint size={13} />
                              Iniciar paseo
                            </Button>
                          </Link>
                        </div>
                      )}
                      {booking.status === "in_progress" && (
                        <div className="flex gap-2 mt-3">
                          <Link href={`/tracking/${booking.id}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full border-orange-500/50 text-orange-400 hover:bg-orange-500/10 rounded-lg">
                              Ver mapa
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                            onClick={() => handleAction(booking.id, "completed")}
                          >
                            ✅ Finalizar
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
