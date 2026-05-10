"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, Award, PawPrint, MapPin, Phone, Calendar } from "lucide-react";
import { SERVICES } from "@/lib/constants";
import { toast } from "sonner";

type WalkerProfile = {
  id: string;
  bio: string | null;
  experience: number;
  rating: number;
  totalWalks: number;
  isAvailable: boolean;
  user: { id: string; name: string; email: string; avatar: string | null; phone: string | null };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    booking: { dog: { name: string }; client: { name: string; avatar: string | null } };
  }>;
};

type UserProfile = {
  clientProfile: { dogs: Array<{ id: string; name: string; breed: string }> } | null;
};

export default function WalkerProfilePage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const walkerId = params.id as string;

  const [walker, setWalker] = useState<WalkerProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    serviceType: "60min",
    dogId: "",
    scheduledAt: "",
    notes: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/walkers/${walkerId}`).then(r => r.json()),
      fetch("/api/auth/me").then(r => r.json()),
    ]).then(([walkerData, userData]) => {
      setWalker(walkerData.walker);
      setUserProfile(userData.user);
      if (userData.user?.clientProfile?.dogs?.length > 0) {
        setBooking(b => ({ ...b, dogId: userData.user.clientProfile.dogs[0].id }));
      }
    }).finally(() => setLoading(false));
  }, [walkerId]);

  async function handleBook() {
    if (!booking.dogId || !booking.scheduledAt) {
      toast.error("Selecciona un perro y una fecha");
      return;
    }
    setBookingLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walkerId, ...booking }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("¡Reserva confirmada! 🐾 Redirigiendo...");
      setTimeout(() => router.push(`/booking/${data.booking.id}`), 1200);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading || !walker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-3">🐾</div>
          <p className="text-slate-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const dogs = userProfile?.clientProfile?.dogs || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Walker profile */}
          <div className="lg:col-span-2 space-y-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-slate-100 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-orange-400 to-orange-500" />
                <CardContent className="pt-0">
                  <div className="flex items-end gap-4 -mt-10 mb-4">
                    <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                      <AvatarImage src={walker.user.avatar || undefined} />
                      <AvatarFallback className="bg-orange-500 text-white text-2xl font-bold">
                        {walker.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="pb-1">
                      <h1 className="text-xl font-bold text-slate-900">{walker.user.name}</h1>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-50 text-green-700 border-green-200">Disponible</Badge>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-bold text-slate-700">{walker.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed mb-4">{walker.bio || "Paseador comprometido con el bienestar de tu mascota."}</p>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Award, label: "Experiencia", value: `${walker.experience} años` },
                      { icon: PawPrint, label: "Paseos", value: walker.totalWalks.toString() },
                      { icon: MapPin, label: "Zona", value: "Bogotá" },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="text-center p-3 rounded-xl bg-slate-50">
                        <Icon size={18} className="text-orange-500 mx-auto mb-1" />
                        <div className="font-bold text-slate-900 text-sm">{value}</div>
                        <div className="text-xs text-slate-400">{label}</div>
                      </div>
                    ))}
                  </div>

                  {walker.user.phone && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                      <Phone size={14} />
                      {walker.user.phone}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Reviews */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-900">Reseñas</CardTitle>
                </CardHeader>
                <CardContent>
                  {walker.reviews.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">Sin reseñas aún</p>
                  ) : (
                    <div className="space-y-4">
                      {walker.reviews.map(review => (
                        <div key={review.id}>
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.booking.client.avatar || undefined} />
                              <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                                {review.booking.client.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-slate-900">{review.booking.client.name}</span>
                                <div className="flex">
                                  {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} size={11} className="text-yellow-400 fill-yellow-400" />
                                  ))}
                                </div>
                              </div>
                              {review.comment && <p className="text-sm text-slate-500">{review.comment}</p>}
                            </div>
                          </div>
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Booking panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-1"
          >
            {bookingSuccess ? (
              <Card className="border-green-200 bg-green-50 shadow-sm sticky top-20">
                <CardContent className="pt-6 text-center">
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="font-bold text-green-800 text-lg mb-1">¡Reserva confirmada!</h3>
                  <p className="text-green-600 text-sm">Redirigiendo a tu dashboard...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-100 shadow-sm sticky top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                    <Calendar size={16} className="text-orange-500" />
                    Reservar paseo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Service type */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Servicio</label>
                    <div className="space-y-2 mt-2">
                      {SERVICES.map(service => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => setBooking(b => ({ ...b, serviceType: service.id }))}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                            booking.serviceType === service.id
                              ? "border-orange-400 bg-orange-50"
                              : "border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{service.icon}</span>
                              <div>
                                <div className="text-sm font-medium text-slate-900">{service.label}</div>
                                <div className="text-xs text-slate-400">{service.duration}</div>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-orange-500">
                              ${service.price.toLocaleString("es-CO")}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dog selector */}
                  {dogs.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tu perro</label>
                      <select
                        value={booking.dogId}
                        onChange={e => setBooking(b => ({ ...b, dogId: e.target.value }))}
                        className="w-full mt-2 p-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:border-orange-400 outline-none"
                      >
                        {dogs.map(dog => (
                          <option key={dog.id} value={dog.id}>
                            {dog.name} — {dog.breed}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {dogs.length === 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-600">No tienes perros registrados. Agrega uno desde tu perfil.</p>
                    </div>
                  )}

                  {/* Date */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha y hora</label>
                    <input
                      type="datetime-local"
                      value={booking.scheduledAt}
                      onChange={e => setBooking(b => ({ ...b, scheduledAt: e.target.value }))}
                      className="w-full mt-2 p-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:border-orange-400 outline-none"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notas (opcional)</label>
                    <textarea
                      value={booking.notes}
                      onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                      placeholder="Instrucciones especiales..."
                      className="w-full mt-2 p-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:border-orange-400 outline-none resize-none"
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleBook}
                    disabled={bookingLoading || dogs.length === 0}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-5 font-semibold"
                  >
                    {bookingLoading ? "Reservando..." : "Confirmar reserva"}
                  </Button>

                  <p className="text-xs text-slate-400 text-center">
                    Se enviará confirmación al paseador
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
