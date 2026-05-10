"use client";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PawPrint, LogOut, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <PawPrint className="text-orange-500" size={28} />
          <span className="text-slate-800">GUAU</span>
          <span className="text-orange-500">&</span>
          <span className="text-slate-800">GO</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href={user.role === "client" ? "/dashboard" : "/walker-dashboard"}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Button>
              </Link>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500">
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Iniciar sesión</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
