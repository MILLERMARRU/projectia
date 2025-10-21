"use client";
import React, { useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, Clock, Filter, Flag, Layers, LayoutGrid, ListChecks, Plus, Settings, Timer, Zap } from "lucide-react";

/**
 * Panel Administrativo (Estudiante) – Next.js + Tailwind + lucide-react
 * - UI responsiva inspirada en la imagen proporcionada.
 * - Incluye: Navbar local, cards de métricas, Acciones rápidas, Tabs de filtro,
 *   listado de tareas con badges, fechas, estado, prioridad y barra de progreso.
 * - Datos de ejemplo en memoria; deja TODO donde conectar Supabase.
 *
 * Uso: copia este archivo como `app/estudiante/panel/page.tsx` y asegúrate de tener Tailwind y lucide-react instalados.
 *   npm i lucide-react
 *
 * Tailwind (si no lo tienes): https://tailwindcss.com/docs/guides/nextjs
 */

// ====== Tipos ======
interface TareaItem {
  id: string;
  curso: string;
  titulo: string;
  descripcion?: string;
  hard_due_at: string; // ISO
  prioridad: "alta" | "media" | "baja";
  estado: "pendiente" | "en_progreso" | "completada";
  progresoPct: number; // 0..100
  atrasadaHoras?: number; // si existe, muestra aviso
}

// ====== Datos Mock ======
const MOCK_TAREAS: TareaItem[] = [
  {
    id: "1",
    curso: "Filosofía Contemporánea",
    titulo: "Ensayo de Filosofía Moderna",
    descripcion: "Análisis crítico sobre el pensamiento de Descartes y su influencia en la filosofía moderna",
    hard_due_at: "2024-01-14T23:59:00Z",
    prioridad: "alta",
    estado: "pendiente",
    progresoPct: 30,
    atrasadaHoras: 645 * 24, // 645 días (según imagen), para demo
  },
  {
    id: "2",
    curso: "Cálculo I",
    titulo: "Guía #3: Límites",
    hard_due_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    prioridad: "media",
    estado: "en_progreso",
    progresoPct: 60,
  },
  {
    id: "3",
    curso: "Programación",
    titulo: "Proyecto: ToDo API",
    hard_due_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    prioridad: "alta",
    estado: "pendiente",
    progresoPct: 10,
  },
  {
    id: "4",
    curso: "Historia",
    titulo: "Lectura Cap. 5",
    hard_due_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    prioridad: "baja",
    estado: "completada",
    progresoPct: 100,
  },
];

// ====== Utilidades ======
function cn(...classes: (string | undefined | false)[]) { return classes.filter(Boolean).join(" "); }

const Badge = ({ children, tone = "default" as "default" | "success" | "warning" | "danger" }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      tone === "success" && "bg-emerald-50 text-emerald-700",
      tone === "warning" && "bg-amber-50 text-amber-700",
      tone === "danger" && "bg-rose-50 text-rose-700",
      tone === "default" && "bg-slate-100 text-slate-700"
    )}
  >
    {children}
  </span>
);

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-slate-50 p-2"><Icon className="h-5 w-5" /></div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
    <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
  </div>
);

const QuickAction = ({ icon: Icon, label, tone = "default" as "default" | "primary" | "success" | "warning", onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition hover:shadow-sm",
      tone === "primary" && "border-indigo-200 bg-indigo-50",
      tone === "success" && "border-emerald-200 bg-emerald-50",
      tone === "warning" && "border-amber-200 bg-amber-50",
      tone === "default" && "border-slate-200 bg-white"
    )}
  >
    <Icon className="h-5 w-5" />
    <span className="font-medium">{label}</span>
  </button>
);

function daysDiffFromNow(iso: string) {
  const now = new Date();
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
    <div style={{ width: `${Math.min(100, Math.max(0, value))}%` }} className="h-full bg-indigo-500" />
  </div>
);

const PriorityPill = ({ p }: { p: TareaItem["prioridad"] }) => (
  <Badge tone={p === "alta" ? "danger" : p === "media" ? "warning" : "default"}>
    {p === "alta" ? "Alta" : p === "media" ? "Media" : "Baja"}
  </Badge>
);

const EstadoPill = ({ e }: { e: TareaItem["estado"] }) => (
  <Badge tone={e === "completada" ? "success" : e === "en_progreso" ? "warning" : "default"}>
    {e === "completada" ? "Completada" : e === "en_progreso" ? "En Progreso" : "Pendiente"}
  </Badge>
);

// ====== Tarjeta Tarea ======
const TareaCard = ({ item }: { item: TareaItem }) => {
  const days = daysDiffFromNow(item.hard_due_at);
  const atrasada = days < 0 || !!item.atrasadaHoras;
  const diasTexto = atrasada ? `${Math.abs(days)} día(s) atrasado` : `${days} día(s)`;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{item.titulo}</h3>
          <div className="text-sm text-slate-500">{item.curso}</div>
          {item.descripcion && (
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{item.descripcion}</p>
          )}
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4" />
            <span>
              {new Date(item.hard_due_at).toLocaleDateString()} {" • "}
              <span className={cn(atrasada && "text-rose-600 font-medium")}>{diasTexto}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityPill p={item.prioridad} />
          <EstadoPill e={item.estado} />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
          <span>Progreso</span>
          <span>{item.progresoPct}%</span>
        </div>
        <ProgressBar value={item.progresoPct} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
          <ListChecks className="h-4 w-4" /> Marcar avance
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
          <CheckCircle2 className="h-4 w-4" /> Marcar completada
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500">
          Ver Detalles
        </button>
      </div>
    </div>
  );
};

// ====== Página Principal ======
export default function PanelEstudiantePage() {
  const [tab, setTab] = useState<"todas" | "pendientes" | "urgentes">("todas");

  const stats = useMemo(() => {
    const tot = MOCK_TAREAS.length;
    const enProgreso = MOCK_TAREAS.filter(t => t.estado === "en_progreso").length;
    const completadas = MOCK_TAREAS.filter(t => t.estado === "completada").length;
    const alta = MOCK_TAREAS.filter(t => t.prioridad === "alta").length;
    const pendientes = MOCK_TAREAS.filter(t => t.estado === "pendiente").length;
    return { tot, enProgreso, completadas, alta, pendientes };
  }, []);

  const tareasFiltradas = useMemo(() => {
    let list = [...MOCK_TAREAS];
    if (tab === "pendientes") list = list.filter(t => t.estado !== "completada");
    if (tab === "urgentes") list = list.filter(t => t.prioridad === "alta");
    return list;
  }, [tab]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      

      {/* Contenido */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ListChecks} label="Tareas Pendientes" value={stats.pendientes} />
          <StatCard icon={Clock} label="En Progreso" value={stats.enProgreso} />
          <StatCard icon={CheckCircle2} label="Completadas" value={stats.completadas} />
          <StatCard icon={Timer} label="Prioridad Alta" value={stats.alta} />
        </section>

        {/* Acciones rápidas */}
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <QuickAction icon={Plus} label="Nueva Tarea" tone="default" onClick={() => alert("TODO: abrir modal de tarea")}/>
            <QuickAction icon={CalendarDays} label="Sincronizar" tone="success" onClick={() => alert("TODO: sincronizar calendario")}/>
            <QuickAction icon={Bell} label="Recordatorios" tone="primary" onClick={() => alert("TODO: preferencias de recordatorios")}/>
            <QuickAction icon={Settings} label="Configurar" tone="warning" onClick={() => alert("TODO: abrir configuración")}/>
          </div>
        </section>

        {/* Lista tareas */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Mis Tareas</h2>
            <div className="flex items-center gap-2">
              {([
                { key: "todas", label: "Todas" },
                { key: "pendientes", label: "Pendientes" },
                { key: "urgentes", label: "Urgentes" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm",
                    tab === key ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {label}
                </button>
              ))}
              <button className="ml-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                <Filter className="h-4 w-4" /> Filtros
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {tareasFiltradas.map((t) => (
              <TareaCard key={t.id} item={t} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
