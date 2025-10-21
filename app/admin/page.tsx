"use client";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Bell, CalendarDays, CheckCircle2, Clock, Filter, Flag, Layers, LayoutGrid, ListChecks, Plus, Settings, Timer, Zap } from "lucide-react";

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
  atrasadaHoras?: number;
}

interface Curso {
  id: string;
  nombre: string;
  periodo: string;
  docente_nombre?: string;
}

// ====== Utilidades ======
function cn(...classes: (string | undefined | false)[]) { return classes.filter(Boolean).join(" "); }

const Badge = ({
  children,
  tone = "default",
}: {
  children?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) => (
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
const TareaCard = ({ item, onUpdateEstado, onUpdateProgreso }: { 
  item: TareaItem;
  onUpdateEstado: (id: string, estado: TareaItem["estado"]) => void;
  onUpdateProgreso: (id: string, progreso: number) => void;
}) => {
  const days = daysDiffFromNow(item.hard_due_at);
  const atrasada = days < 0 || !!item.atrasadaHoras;
  const diasTexto = atrasada ? `${Math.abs(days)} día(s) atrasado` : `${days} día(s)`;

  const handleMarcarAvance = () => {
    const nuevoProgreso = Math.min(100, item.progresoPct + 25);
    onUpdateProgreso(item.id, nuevoProgreso);
  };

  const handleMarcarCompletada = () => {
    onUpdateEstado(item.id, "completada");
    onUpdateProgreso(item.id, 100);
  };

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
        <button 
          onClick={handleMarcarAvance}
          disabled={item.estado === "completada"}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ListChecks className="h-4 w-4" /> Marcar avance
        </button>
        <button 
          onClick={handleMarcarCompletada}
          disabled={item.estado === "completada"}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="h-4 w-4" /> Marcar completada
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500">
          Ver Detalles
        </button>
      </div>
    </div>
  );
};

// ====== Página Principal con Supabase ======
export default function PanelEstudiantePage() {
  const [tab, setTab] = useState<"todas" | "pendientes" | "urgentes">("todas");
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal / Form estado
  const [openNew, setOpenNew] = useState(false);
  const [cursoId, setCursoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [hardDueAt, setHardDueAt] = useState(""); // datetime-local value
  const [prioridad, setPrioridad] = useState<TareaItem["prioridad"]>("media");
  const [tipo, setTipo] = useState("tarea");
  const [peso, setPeso] = useState(1);

  useEffect(() => {
    loadTareas();
    loadCursos();
  }, []);

  async function loadCursos() {
    try {
      const { data, error } = await supabase
        .from("curso")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error cargando cursos:", error);
      } else if (data) {
        setCursos(data);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  async function loadTareas() {
    setLoading(true);
    try {
      // Cargar tareas sin JOIN
      const { data: tareasData, error: tareasError } = await supabase
        .from("tarea")
        .select("*")
        .order("hard_due_at", { ascending: true });

      if (tareasError) {
        console.error("Error cargando tareas:", tareasError);
        alert("Error cargando tareas desde Supabase");
        return;
      }

      // Cargar cursos para mapear nombres
      const { data: cursosData, error: cursosError } = await supabase
        .from("curso")
        .select("*");

      if (cursosError) {
        console.error("Error cargando cursos:", cursosError);
      }

      // Crear mapa de cursos para lookup rápido
      const cursosMap = new Map();
      if (cursosData) {
        cursosData.forEach(curso => cursosMap.set(curso.id, curso));
      }

      // Mapear tareas con nombres de curso
      const tareasConCurso = tareasData?.map(tarea => ({
        ...tarea,
        curso: cursosMap.get(tarea.curso_id)
      })) || [];

      setTareas(tareasConCurso.map(mapRowToTarea));
    } finally {
      setLoading(false);
    }
  }

  function mapRowToTarea(row: any): TareaItem {
    // Mapear según tu esquema de BD
    const cursoNombre = row.curso?.nombre || "Curso desconocido";
    
    // Calcular progreso basado en progreso_tarea si existe
    let progreso = Math.floor(Math.random() * 101); // Progreso aleatorio por ahora
    let estado: TareaItem["estado"] = progreso === 100 ? "completada" : progreso > 0 ? "en_progreso" : "pendiente";
    
    return {
      id: String(row.id),
      curso: cursoNombre,
      titulo: row.titulo || "",
      descripcion: row.descripcion || undefined,
      hard_due_at: row.hard_due_at || new Date().toISOString(),
      prioridad: (row.peso && row.peso > 1.5) ? "alta" : (row.peso && row.peso > 0.8) ? "media" : "baja",
      estado: estado,
      progresoPct: progreso,
    };
  }

  const stats = useMemo(() => {
    const tot = tareas.length;
    const enProgreso = tareas.filter(t => t.estado === "en_progreso").length;
    const completadas = tareas.filter(t => t.estado === "completada").length;
    const alta = tareas.filter(t => t.prioridad === "alta").length;
    const pendientes = tareas.filter(t => t.estado === "pendiente").length;
    return { tot, enProgreso, completadas, alta, pendientes };
  }, [tareas]);

  const tareasFiltradas = useMemo(() => {
    let list = [...tareas];
    if (tab === "pendientes") list = list.filter(t => t.estado !== "completada");
    if (tab === "urgentes") list = list.filter(t => t.prioridad === "alta");
    return list;
  }, [tab, tareas]);

  async function handleCreateTarea(e?: React.FormEvent) {
    e?.preventDefault();
    if (!titulo || !cursoId || !hardDueAt) {
      alert("Completa curso, título y fecha límite.");
      return;
    }

    // Convertir datetime-local a ISO
    const iso = new Date(hardDueAt).toISOString();
    
    // Mapear prioridad a peso numérico
    const pesoNumerico = prioridad === "alta" ? 2 : prioridad === "media" ? 1 : 0.5;
    
    const payload = {
      curso_id: cursoId,
      titulo,
      descripcion: descripcion || null,
      hard_due_at: iso,
      tipo,
      peso: pesoNumerico,
    };

    try {
      const { data, error } = await supabase
        .from("tarea")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Error creando tarea:", error);
        alert("Error creando tarea");
        return;
      }

      // Buscar el curso para la nueva tarea
      const curso = cursos.find(c => c.id === cursoId);
      const newTareaWithCurso = {
        ...data,
        curso: curso
      };

      const newT = mapRowToTarea(newTareaWithCurso);
      setTareas(prev => [newT, ...prev]);
      
      // reset form
      setCursoId("");
      setTitulo("");
      setDescripcion("");
      setHardDueAt("");
      setPrioridad("media");
      setTipo("tarea");
      setPeso(1);
      setOpenNew(false);
    } catch (err) {
      console.error("Error al crear tarea:", err);
      alert("Error al crear tarea");
    }
  }

  async function handleUpdateEstado(tareaId: string, nuevoEstado: TareaItem["estado"]) {
    // Actualizar en el estado local inmediatamente
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: nuevoEstado } : t));
    
    // Aquí podrías actualizar progreso_tarea en la BD si implementas esa funcionalidad
    console.log(`Actualizando estado de tarea ${tareaId} a ${nuevoEstado}`);
  }

  async function handleUpdateProgreso(tareaId: string, nuevoProgreso: number) {
    // Actualizar en el estado local inmediatamente
    setTareas(prev => prev.map(t => t.id === tareaId ? { 
      ...t, 
      progresoPct: nuevoProgreso,
      estado: nuevoProgreso === 100 ? "completada" : nuevoProgreso > 0 ? "en_progreso" : "pendiente"
    } : t));
    
    // Aquí podrías actualizar progreso_tarea en la BD si implementas esa funcionalidad
    console.log(`Actualizando progreso de tarea ${tareaId} a ${nuevoProgreso}%`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Panel de Tareas</h1>
            <div className="flex items-center gap-4">
              <button className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

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
            <QuickAction icon={Plus} label="Nueva Tarea" tone="default" onClick={() => setOpenNew(true)}/>
            <QuickAction icon={CalendarDays} label="Sincronizar" tone="success" onClick={() => loadTareas()}/>
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
            {loading && <div className="text-sm text-slate-500">Cargando tareas...</div>}
            {!loading && tareasFiltradas.length === 0 && <div className="text-sm text-slate-500">No hay tareas.</div>}
            {tareasFiltradas.map((t) => (
              <TareaCard 
                key={t.id} 
                item={t} 
                onUpdateEstado={handleUpdateEstado}
                onUpdateProgreso={handleUpdateProgreso}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Modal Nueva Tarea */}
      {openNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nueva Tarea</h3>
              <button onClick={() => setOpenNew(false)} className="text-slate-500 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTarea} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-600">Curso</label>
                <select 
                  value={cursoId} 
                  onChange={(e) => setCursoId(e.target.value)} 
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  <option value="">Seleccionar curso...</option>
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre} - {curso.periodo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">Título</label>
                <input 
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)} 
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Título de la tarea"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600">Descripción</label>
                <textarea 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)} 
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Descripción opcional"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Fecha límite</label>
                  <input
                    type="datetime-local"
                    value={hardDueAt}
                    onChange={(e) => setHardDueAt(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Prioridad</label>
                  <select 
                    value={prioridad} 
                    onChange={(e) => setPrioridad(e.target.value as any)} 
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Tipo</label>
                  <select 
                    value={tipo} 
                    onChange={(e) => setTipo(e.target.value)} 
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="tarea">Tarea</option>
                    <option value="examen">Examen</option>
                    <option value="proyecto">Proyecto</option>
                    <option value="laboratorio">Laboratorio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Peso</label>
                  <input 
                    type="number" 
                    min={0.1} 
                    max={10} 
                    step={0.1}
                    value={peso} 
                    onChange={e => setPeso(Number(e.target.value))} 
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setOpenNew(false)} 
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}