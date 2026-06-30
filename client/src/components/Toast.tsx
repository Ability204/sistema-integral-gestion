import { useEffect } from "react";

interface Props {
  mensaje: string;
  onCerrar: () => void;
  tipo?: "exito" | "error";
}

// Notificación flotante que aparece abajo a la derecha y desaparece sola.
export function Toast({ mensaje, onCerrar, tipo = "exito" }: Props) {
  useEffect(() => {
    const t = setTimeout(onCerrar, 3500); // se cierra solo a los 3.5s
    return () => clearTimeout(t);
  }, [mensaje, onCerrar]);

  const esExito = tipo === "exito";

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-[fadeIn_0.2s_ease-out]">
      <div
        className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg ring-1 ${
          esExito
            ? "bg-green-600 text-white ring-green-700"
            : "bg-red-600 text-white ring-red-700"
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
          {esExito ? "✓" : "!"}
        </span>
        <span className="text-sm font-medium">{mensaje}</span>
        <button onClick={onCerrar} className="ml-2 text-white/70 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
