import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { obtenerSocket } from "../api/socket";
import { useAuth } from "../auth/AuthContext";

interface Canal {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface Autor {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  rol: string;
}

interface Mensaje {
  id: string;
  contenido: string;
  createdAt: string;
  autor: Autor;
}

export function ChatPage() {
  const { usuario } = useAuth();
  const [canales, setCanales] = useState<Canal[]>([]);
  const [canalActivo, setCanalActivo] = useState<Canal | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const finRef = useRef<HTMLDivElement>(null);

  // Carga la lista de canales al entrar.
  useEffect(() => {
    api.get("/chat/canales").then((r) => {
      setCanales(r.data);
      if (r.data.length) setCanalActivo(r.data[0]);
    });
  }, []);

  // Escucha mensajes nuevos en tiempo real (una sola vez).
  useEffect(() => {
    const socket = obtenerSocket();
    function alRecibir(msg: Mensaje & { channelId: string }) {
      // Solo añade el mensaje si pertenece al canal que estamos viendo.
      setCanalActivo((actual) => {
        if (actual && msg.channelId === actual.id) {
          setMensajes((prev) => [...prev, msg]);
        }
        return actual;
      });
    }
    socket.on("mensaje", alRecibir);
    return () => {
      socket.off("mensaje", alRecibir);
    };
  }, []);

  // Al cambiar de canal: carga el historial y se une a la sala del socket.
  useEffect(() => {
    if (!canalActivo) return;
    api.get(`/chat/canales/${canalActivo.id}/mensajes`).then((r) => setMensajes(r.data));
    obtenerSocket().emit("unirse", canalActivo.id);
  }, [canalActivo]);

  // Auto-scroll al último mensaje.
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || !canalActivo) return;
    obtenerSocket().emit("mensaje", { channelId: canalActivo.id, contenido });
    setTexto("");
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] gap-4">
      {/* Lista de canales */}
      <aside className="w-56 shrink-0 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Canales
        </h2>
        <ul className="space-y-1">
          {canales.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setCanalActivo(c)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  canalActivo?.id === c.id
                    ? "bg-marca-50 text-marca-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-slate-400"># </span>
                {c.nombre}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Conversación */}
      <section className="flex flex-1 flex-col rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <header className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-bold text-slate-800"># {canalActivo?.nombre ?? "—"}</h3>
          {canalActivo?.descripcion && (
            <p className="text-xs text-slate-400">{canalActivo.descripcion}</p>
          )}
        </header>

        {/* Mensajes */}
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {mensajes.length === 0 ? (
            <p className="text-center text-sm text-slate-400">
              Aún no hay mensajes. ¡Sé el primero en escribir!
            </p>
          ) : (
            mensajes.map((m) => {
              const propio = m.autor.id === usuario?.id;
              return (
                <div key={m.id} className={`flex ${propio ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    propio ? "bg-marca-600 text-white" : "bg-slate-100 text-slate-800"
                  }`}>
                    {!propio && (
                      <div className="mb-0.5 text-xs font-semibold text-marca-700">
                        {m.autor.nombre} {m.autor.apellidoPaterno}
                      </div>
                    )}
                    <div className="text-sm">{m.contenido}</div>
                    <div className={`mt-0.5 text-right text-[10px] ${propio ? "text-marca-100" : "text-slate-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={finRef} />
        </div>

        {/* Caja de envío */}
        <form onSubmit={enviar} className="flex gap-2 border-t border-slate-100 p-3">
          <input
            className="input"
            placeholder={`Escribe en #${canalActivo?.nombre ?? ""}…`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button className="btn-primary" disabled={!texto.trim()}>
            Enviar
          </button>
        </form>
      </section>
    </div>
  );
}
