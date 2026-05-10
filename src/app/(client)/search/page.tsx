"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Star, MapPin, Award } from "lucide-react";

type Walker = {
  id: string;
  bio: string | null;
  experience: number;
  rating: number;
  totalWalks: number;
  isAvailable: boolean;
  lat: number;
  lng: number;
  user: { id: string; name: string; email: string; avatar: string | null };
};

export default function SearchPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    fetch("/api/walkers")
      .then(r => r.json())
      .then(data => setWalkers(data.walkers || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = walkers.filter(w =>
    w.user.name.toLowerCase().includes(query.toLowerCase()) ||
    (w.bio?.toLowerCase().includes(query.toLowerCase()) ?? false)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Encuentra un paseador</h1>
          <p className="text-slate-500 text-sm">Bogotá · {walkers.length} paseadores disponibles</p>
        </motion.div>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl border-slate-200"
          />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((walker, i) => (
              <motion.div
                key={walker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/walker/${walker.id}`}>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-14 w-14 ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all">
                        <AvatarImage src={walker.user.avatar || undefined} />
                        <AvatarFallback className="bg-orange-500 text-white font-bold text-lg">
                          {walker.user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{walker.user.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={13} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-semibold text-slate-700">{walker.rating.toFixed(1)}</span>
                          <span className="text-xs text-slate-400">· {walker.totalWalks} paseos</span>
                        </div>
                      </div>
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs shrink-0">
                        Disponible
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {walker.bio || "Paseador comprometido con el bienestar de tu mascota."}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-50 pt-3">
                      <div className="flex items-center gap-1">
                        <Award size={12} className="text-orange-400" />
                        <span>{walker.experience} años exp.</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-orange-400" />
                        <span>Bogotá</span>
                      </div>
                      <span className="font-semibold text-orange-500">Desde $15.000</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-slate-600 font-medium">No se encontraron paseadores</p>
            <p className="text-slate-400 text-sm mt-1">Intenta con otro nombre</p>
          </div>
        )}
      </div>
    </div>
  );
}
