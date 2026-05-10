"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { PawPrint, MapPin, Camera, Star, Shield, Clock, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SERVICES } from "@/lib/constants";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-to-br from-orange-50 via-white to-emerald-50">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, #f97316 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.12 } } }}
            className="space-y-6"
          >
            <motion.div variants={fadeUp}>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 mb-4">
                🐾 Bogotá · Paseadores verificados
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
              Tu perro feliz,<br />
              <span className="text-orange-500">tú tranquilo</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-slate-600 max-w-md leading-relaxed">
              Conectamos dueños con paseadores verificados en Bogotá. Sigue el paseo en tiempo real,
              recibe fotos y lleva a tu mascota feliz.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200 gap-2 rounded-full px-8">
                  Buscar paseador <ChevronRight size={18} />
                </Button>
              </Link>
              <Link href="/register?role=walker">
                <Button size="lg" variant="outline" className="border-slate-200 rounded-full px-8">
                  Soy paseador
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-center gap-6 pt-2">
              {[
                { value: "500+", label: "Paseadores" },
                { value: "4.9★", label: "Calificación" },
                { value: "10k+", label: "Paseos" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-slate-900">{value}</div>
                  <div className="text-sm text-slate-500">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 opacity-10 transform rotate-6" />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-10 transform -rotate-3" />
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-50 to-emerald-50 p-8 flex items-center justify-center">
                <div className="text-[180px] leading-none select-none">🐕</div>
              </div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-lg">✅</div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">Paseo iniciado</div>
                  <div className="text-xs text-slate-400">Hace 5 min</div>
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3.5, delay: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2">
                <div className="text-2xl">📸</div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">¡Nueva foto!</div>
                  <div className="text-xs text-slate-400">Luna en el parque</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MISIÓN & VISIÓN ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Quiénes somos</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
              <span className="text-orange-500 font-semibold">Guau &amp; Go</span> es una empresa dedicada al bienestar
              y cuidado de mascotas, ofreciendo servicios confiables, seguros y de calidad. Brindamos atención
              personalizada para perros, enfocándonos en la comodidad, salud y felicidad de cada mascota.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Misión",
                color: "from-orange-50 to-orange-100/50 border-orange-200",
                titleColor: "text-orange-600",
                icon: "🎯",
                text: "Brindamos un servicio confiable y seguro de paseo de perros mediante una plataforma digital que conecta a dueños de mascotas en Bogotá con paseadores capacitados, garantizando bienestar animal, acompañamiento responsable y tranquilidad para las familias, apoyados en tecnología y alianzas con centros veterinarios.",
              },
              {
                title: "Visión",
                color: "from-emerald-50 to-emerald-100/50 border-emerald-200",
                titleColor: "text-emerald-600",
                icon: "🔭",
                text: "Para el año 2030, GUAU & GO será una plataforma líder en Colombia en servicios de paseo y cuidado de perros, conocida por su calidad, seguridad y confianza, con presencia nacional y una red de paseadores y aliados veterinarios que promueven el bienestar de las mascotas y la tranquilidad de sus dueños.",
              },
            ].map(({ title, color, titleColor, icon, text }, i) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border bg-gradient-to-br ${color} p-7`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{icon}</span>
                  <h3 className={`font-bold text-xl ${titleColor}`}>{title}</h3>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA (flujo Didi) ── */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mb-4">Así de fácil</Badge>
            <h2 className="text-3xl font-bold mb-3">¿Cómo funciona?</h2>
            <p className="text-slate-400">El proceso más sencillo para cuidar a tu mascota</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-orange-500/20 via-orange-500 to-orange-500/20" />

            {[
              { step: "1", icon: "🔍", title: "Elige tu plan", desc: "Selecciona el plan que mejor se adapte a tu rutina y la de tu perro." },
              { step: "2", icon: "🦮", title: "Escoge paseador", desc: "Revisa perfiles, calificaciones y elige al paseador ideal para tu mascota." },
              { step: "3", icon: "📍", title: "GPS en vivo", desc: "Sigue el paseo en el mapa en tiempo real. Tu perro siempre a la vista." },
              { step: "4", icon: "📸", title: "Recibe fotos", desc: "El paseador te envía fotos durante el recorrido para que veas cómo está tu peludo." },
            ].map(({ step, icon, title, desc }, i) => (
              <motion.div key={step}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center relative z-10">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-orange-500/30">
                  {icon}
                </div>
                <div className="w-6 h-6 bg-slate-700 border-2 border-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-orange-400 mx-auto mb-3">
                  {step}
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.4 }} className="text-center mt-12">
            <Link href="/register">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-10">
                Empezar ahora
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Todo lo que necesitas</h2>
            <p className="text-slate-500">Una app pensada para la tranquilidad de tu mascota y la tuya</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, color: "bg-orange-50 text-orange-500", title: "GPS en tiempo real", desc: "Sigue el paseo de tu perro en el mapa, ve exactamente por dónde va y cuánto falta." },
              { icon: Camera, color: "bg-emerald-50 text-emerald-500", title: "Fotos del paseo", desc: "El paseador te envía fotos durante el recorrido para que veas cómo está tu peludo." },
              { icon: Shield, color: "bg-blue-50 text-blue-500", title: "Paseadores verificados", desc: "Todos nuestros paseadores pasan por verificación de identidad y capacitación." },
              { icon: Star, color: "bg-yellow-50 text-yellow-500", title: "Calificaciones reales", desc: "Lee reseñas de otros dueños y elige al paseador con mejor historial." },
              { icon: Clock, color: "bg-purple-50 text-purple-500", title: "Agenda fácil", desc: "Reserva paseos con antelación o pide uno en el momento según tu necesidad." },
              { icon: PawPrint, color: "bg-pink-50 text-pink-500", title: "Múltiples mascotas", desc: "Agrega todos tus perros y gestiona sus paseos desde un solo lugar." },
            ].map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all group">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANES / PRECIOS ── */}
      <section className="py-20 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Nuestros servicios</h2>
            <p className="text-slate-500">Planes diseñados para cada tipo de dueño. Precios en COP, sin costos ocultos.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((service, i) => (
              <motion.div key={service.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-6 border-2 flex flex-col ${
                  service.highlight
                    ? "border-orange-400 bg-orange-500 text-white shadow-xl shadow-orange-200"
                    : "border-slate-100 bg-white hover:border-orange-200 hover:shadow-md transition-all"
                }`}>
                {service.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-slate-900 text-white text-xs px-3">Más popular</Badge>
                  </div>
                )}
                <div className="text-3xl mb-3">{service.icon}</div>
                <h3 className={`font-bold text-lg mb-1 ${service.highlight ? "text-white" : "text-slate-900"}`}>
                  {service.label}
                </h3>
                <p className={`text-xs mb-4 leading-relaxed ${service.highlight ? "text-orange-100" : "text-slate-500"}`}>
                  {service.description}
                </p>

                <div className="mt-auto">
                  <div className={`text-2xl font-extrabold mb-0.5 ${service.highlight ? "text-white" : "text-orange-500"}`}>
                    ${service.price.toLocaleString("es-CO")}
                  </div>
                  <div className={`text-xs mb-4 ${service.highlight ? "text-orange-100" : "text-slate-400"}`}>
                    COP · {service.walks} {service.walks === 1 ? "paseo" : "paseos"} · {service.duration}
                    {service.discount > 0 && (
                      <span className={`ml-1 font-semibold ${service.highlight ? "text-white" : "text-green-600"}`}>
                        · {service.discount}% OFF
                      </span>
                    )}
                  </div>

                  <ul className="space-y-1.5 mb-5">
                    {service.perks.map(perk => (
                      <li key={perk} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle size={12} className={service.highlight ? "text-orange-200" : "text-orange-400"} />
                        <span className={service.highlight ? "text-orange-50" : "text-slate-600"}>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/register">
                    <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      service.highlight
                        ? "bg-white text-orange-500 hover:bg-orange-50"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}>
                      Elegir plan
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
            <div className="text-6xl">🐾</div>
            <h2 className="text-4xl font-bold">¿Listo para empezar?</h2>
            <p className="text-slate-400 text-lg">Únete a miles de dueños que ya confían en GUAU &amp; GO en Bogotá.</p>
            <Link href="/register">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-10 shadow-lg shadow-orange-900/30">
                Crear cuenta gratis
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 bg-slate-950 text-slate-500 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <PawPrint size={16} className="text-orange-500" />
          <span className="font-semibold text-white">GUAU &amp; GO</span>
        </div>
        <p className="mb-1">© 2025 GUAU &amp; GO · Bogotá, Colombia</p>
        <p className="text-xs text-slate-600">
          Socios: Juan Sebastián Abello Rey · Fredy Orlando Marín Gómez · Sebastian Granados Portela · Valeria Vargas Quiñones
        </p>
        <p className="text-xs text-slate-600 mt-1">Tu perro feliz, tú tranquilo.</p>
      </footer>
    </div>
  );
}
