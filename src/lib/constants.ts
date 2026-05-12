export const SERVICES = [
  {
    id: "individual",
    label: "Plan Individual",
    description: "1 paseo de 1 hora con grupo de 4 perritos",
    price: 22000,
    walks: 1,
    duration: "1 hora",
    discount: 0,
    icon: "🐾",
    highlight: false,
    perks: ["1 paseo incluido", "Grupo máx. 4 perros", "Foto del paseo", "Reporte al finalizar"],
  },
  {
    id: "basico",
    label: "Plan Básico",
    description: "8 paseos de 1 hora con grupo de 4 perritos",
    price: 228000,
    walks: 8,
    duration: "1 hora c/u",
    discount: 5,
    icon: "🌿",
    highlight: false,
    perks: ["8 paseos incluidos", "Grupo máx. 4 perros", "5% de descuento", "Fotos del paseo", "Reporte diario"],
  },
  {
    id: "frecuente",
    label: "Plan Frecuente",
    description: "12 paseos de 1 hora con grupo de 4 perritos",
    price: 331200,
    walks: 12,
    duration: "1 hora c/u",
    discount: 8,
    icon: "⭐",
    highlight: true,
    perks: ["12 paseos incluidos", "Grupo máx. 4 perros", "8% de descuento", "Fotos + videos", "Reporte diario", "Paseador preferido"],
  },
  {
    id: "premium",
    label: "Plan Premium",
    description: "20 paseos de 1 hora con grupo de 4 perritos",
    price: 540000,
    walks: 20,
    duration: "1 hora c/u",
    discount: 10,
    icon: "👑",
    highlight: false,
    perks: ["20 paseos incluidos", "Grupo máx. 4 perros", "10% de descuento", "Prioridad en asignación", "Fotos + videos", "Reporte diario", "Paseador dedicado"],
  },
] as const;

export type ServiceId = "individual" | "basico" | "frecuente" | "premium";

export const BOGOTA_CENTER = { lat: 4.6097, lng: -74.0817 };

export const WALKER_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=walker1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=walker2",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=walker3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=walker4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=walker5",
];
