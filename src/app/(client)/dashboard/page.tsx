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
import { Search, PawPrint, Clock, CheckCircle, MapPin, Plus } from "lucide-react";
import { SERVICES } from "@/lib/constants";

type Booking = {
  id: string;
  status: string;
  serviceType: string;
  price: number;
  scheduledAt: string;
  dog: { name: string; breed: string };
  walker: { user: { name: string; avatar: string | null } };
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: <Clock size={12} /> },
  accepted: { label: "Confirmado", color: "bg-blue-100 text-blue-700", icon: <CheckCircle size={12} /> },
  in_progress: { label: "En curso", color: "bg-orange-100 text-orange-700", icon: <PawPrint size={12} /> },
  completed: { label: "Completado", color: "bg-green-100 text-green-700", icon: <CheckCircle size={12} /> },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-600", icon: null },
};

export default function ClientDashboard() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (!isLoading && user?.role === "walker") router.push("/walker-dashboard");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/bookings")
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .finally(() => setLoadingBookings(false));
  }, [user]);

  if (isLoading || !user) return null;

  const activeBooking = bookings.find(b => b.status === "in_progress");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-white to-emerald-50/40">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-4 ring-orange-100">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-orange-500 text-white text-lg font-bold">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-slate-500">Buenos días,</p>
              <h1 className="text-2xl font-bold text-slate-900">{user.name} 👋</h1>
            </div>
          </div>
          <Link href="/search">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2">
              <Search size={16} />
              Buscar paseador
            </Button>
          </Link>
        </motion.div>

        {/* Active walk banner */}
        {activeBooking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Link href={`/tracking/${activeBooking.id}`}>
              <div className="bg-orange-500 text-white rounded-2xl p-5 flex items-center justify-between hover:bg-orange-600 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🐕</div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="font-semibold text-sm">Paseo en curso</span>
                    </div>
                    <p className="text-orange-100 text-xs">
                      {activeBooking.dog.name} con {activeBooking.walker.user.name}
                    </p>
                  </div>
                </div>
                <div className="text-sm font-semibold flex items-center gap-1">
                  <MapPin size={14} />
                  Ver en mapa
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total paseos", value: bookings.filter(b => b.status === "completed").length, icon: "🏆" },
            { label: "En curso", value: bookings.filter(b => b.status === "in_progress").length, icon: "🐾" },
            { label: "Reservas", value: bookings.filter(b => b.status === "accepted").length, icon: "📅" },
          ].map(({ label, value, icon }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-4 text-center"
            >
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Bookings */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900 flex items-center justify-between">
              Mis reservas
              <Link href="/search">
                <Button variant="ghost" size="sm" className="text-orange-500 gap-1">
                  <Plus size={14} />
                  Nueva
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🐶</div>
                <p className="text-slate-600 font-medium mb-1">Aún no tienes reservas</p>
                <p className="text-slate-400 text-sm mb-4">¡Encuentra un paseador para tu peludo!</p>
                <Link href="/search">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                    Buscar paseador
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(booking => {
                  const service = SERVICES.find(s => s.id === booking.serviceType);
                  const status = statusConfig[booking.status] || statusConfig.pending;
                  return (
                    <Link key={booking.id} href={booking.status === "in_progress" ? `/tracking/${booking.id}` : "#"}>
                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.walker.user.avatar || undefined} />
                          <AvatarFallback className="bg-orange-100 text-orange-700 text-sm">
                            {booking.walker.user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-slate-900 text-sm truncate">
                              {booking.walker.user.name}
                            </p>
                            <span className="text-slate-400 text-xs">·</span>
                            <p className="text-xs text-slate-500">{booking.dog.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </span>
                            <span className="text-xs text-slate-400">{service?.label}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-sm text-slate-900">
                            ${booking.price.toLocaleString("es-CO")}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(booking.scheduledAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    </Link>
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
