# Sistema Integral de Gestión

Plataforma CRM para gestionar **usuarios (empleados)**, **clientes/proveedores**, **nóminas**
y **proyectos**, con un **chat interno** para la organización y comunicación de los equipos.

> Proyecto académico — Sistema de control de gestión de proyectos.

---

## 1. ¿Qué incluye? (módulos)

| Módulo | Para qué sirve |
| ------ | -------------- |
| **Usuarios** | Empleados que operan el sistema (identificados por CURP). Alta, consultas, listados, exportar a PDF y eliminación **autorizada por un supervisor**. |
| **Clientes / Proveedores** | Personas físicas o morales identificadas por RFC. Mismas operaciones (alta, consulta, PDF, eliminación autorizada). |
| **Nóminas** | Cálculo mensual de nómina: ISR (tabla del SAT) + subsidio al empleo + cuota IMSS o ISSSTE. Genera recibo individual y reporte, ambos en PDF. |
| **Proyectos** | Proyección, objetivos, metas, estado, presupuesto y **empleados involucrados con su salario**. Reporte en PDF. |
| **Chat de equipos** | Canales (salas) con mensajería **en tiempo real**, para comunicar a los equipos dentro de la misma plataforma. |

---

## 2. Tecnologías (arquitectura)

| Capa | Tecnología | Por qué |
| ---- | ---------- | ------- |
| Backend (servidor) | Node + Express + TypeScript | API REST estándar |
| Base de datos | SQLite + Prisma ORM | Sin instalar nada extra; migrable a PostgreSQL |
| Autenticación | JWT + bcrypt, con roles | Seguridad y "eliminación con supervisor" |
| Validación | Zod | Valida CURP, RFC, contraseñas, etc. |
| Reportes PDF | PDFKit | Requisito de listados imprimibles |
| Tiempo real | socket.io (WebSockets) | El chat al instante |
| Frontend (interfaz) | React + Vite + TypeScript + Tailwind | Interfaz moderna en el navegador |

El proyecto tiene **dos partes** que corren por separado:

```
Sistema Integral/
├── server/   → la API (el "cerebro": datos, cálculos, seguridad). Puerto 4000.
└── client/   → la interfaz web (lo que se ve en el navegador). Puerto 5173.
```

---

## 3. Requisitos previos

- **Node.js 18 o superior** instalado (verifícalo con `node --version`).
- Eso es todo. La base de datos es un archivo y no requiere instalación.

---

## 4. Cómo correr el proyecto (paso a paso)

> Necesitas **DOS terminales abiertas a la vez**: una para el servidor y otra para la interfaz.
> En VS Code: menú **Terminal → New Terminal**, y para la segunda, el icono **+**.

### Terminal 1 — Backend (el servidor)

```bash
cd server
npm install                  # (solo la PRIMERA vez) instala las dependencias
cp .env.example .env         # (solo la primera vez) crea el archivo de configuración
#   En Windows PowerShell:   Copy-Item .env.example .env
npm run db:push              # (solo la primera vez) crea la base de datos
npm run db:seed              # (solo la primera vez) crea el admin y los canales del chat
npm run dev                  # arranca el servidor
```

Cuando veas este mensaje, el servidor está listo:

```
API del Sistema Integral escuchando en http://localhost:4000
```

**Deja esta terminal abierta.** Si la cierras, el sistema deja de funcionar.

### Terminal 2 — Frontend (la interfaz)

```bash
cd client
npm install        # (solo la PRIMERA vez)
npm run dev        # arranca la interfaz
```

Cuando aparezca `Local: http://localhost:5173/`, abre esa dirección en el navegador.

> **En días posteriores** (cuando ya instalaste todo) solo necesitas, en cada terminal:
> `cd server` → `npm run dev` y `cd client` → `npm run dev`.

---

## 5. Cómo iniciar sesión

1. Abre **http://localhost:5173** en el navegador.
2. Aparece la pantalla de inicio de sesión. Usa la cuenta de administrador:

   | Campo | Valor |
   | ----- | ----- |
   | Usuario | `admin` |
   | Contraseña | `Admin123!` |

3. Haz clic en **Entrar**. Llegarás al **Inicio**, con el menú de las secciones arriba.

> El `admin` tiene rol **Administrador**: puede crear, editar, **eliminar** y **autorizar
> eliminaciones**. Desde Usuarios puedes crear más empleados con rol Supervisor o Usuario.

### Roles y permisos

| Rol | Puede ver/crear/editar | Puede eliminar / autorizar bajas |
| --- | ---------------------- | -------------------------------- |
| **Usuario** | Sí | No (ni siquiera ve el botón Eliminar) |
| **Supervisor** | Sí | Sí, y puede autorizar bajas |
| **Admin** | Sí | Sí, y puede autorizar bajas |

> **Eliminar requiere autorización:** al borrar un usuario o cliente, se pide el usuario y
> contraseña de un **Supervisor o Admin**. Queda registrado quién pidió la baja y quién la
> autorizó (auditoría).

---

## 6. Cómo usar cada sección

- **Usuarios / Clientes:** botón **+ Nuevo** para dar de alta (con validaciones). Usa la barra
  de **búsqueda y filtros** para consultar. **⬇ Exportar PDF** genera el listado **con los filtros
  aplicados**. **Editar** y **Eliminar** (este último pide autorización) en cada fila.
- **Nóminas:** **+ Generar nómina** → elige empleado, mes y sueldo. El sistema **calcula solo**
  el ISR, la cuota IMSS/ISSSTE y el neto, mostrando el **desglose en vivo**. Cada nómina tiene su
  botón **Recibo** (PDF).
- **Proyectos:** **+ Nuevo proyecto** → captura objetivos, metas, estado y **agrega empleados
  involucrados con su salario**. Se calcula el costo de nómina del proyecto.
- **Chat:** ver siguiente sección.

---

## 7. El chat de equipos (cómo funciona)

Es un chat por **canales** (salas tipo Slack: General, Ventas, Bodega, Dirección) con mensajes
**en tiempo real** gracias a **WebSockets** (socket.io).

**Cómo usarlo:** entra a la pestaña **Chat**, elige un canal a la izquierda, escribe abajo y
presiona **Enviar**. Tus mensajes salen a la derecha (morado) y los de otros a la izquierda (gris).

**Cómo verlo en tiempo real (para la demo):** abre el sistema en **dos navegadores** (o una
ventana normal y otra de incógnito), inicia sesión con dos usuarios distintos, entra al mismo
canal y escribe en uno → el mensaje aparece **al instante** en el otro.

**Qué pasa por dentro al enviar un mensaje:**
1. El navegador envía el texto por una conexión permanente abierta con el servidor.
2. El servidor lo **guarda** en la base de datos (queda historial).
3. El servidor lo **reenvía a todos** los conectados a ese canal.
4. La pantalla de cada quien **agrega el mensaje solo**, sin recargar.

La conexión exige el **token de sesión** del login: nadie sin sesión puede entrar al chat.

---

## 8. Solución de problemas comunes

| Problema | Causa y solución |
| -------- | ---------------- |
| `EADDRINUSE: address already in use :::4000` | El servidor ya estaba corriendo. No abras dos veces el backend; cierra la terminal anterior o reinicia. |
| La interfaz carga pero no entra / da error de red | El **backend (Terminal 1) no está corriendo**. Arráncalo primero. |
| `EPERM ... query_engine.dll` al hacer db:push | Es OneDrive bloqueando archivos. Vuelve a correr el comando; si persiste, mueve el proyecto fuera de OneDrive (ej. `C:\Proyectos\`). |
| El chat no envía mensajes | Revisa que el backend esté corriendo; el chat necesita el servidor activo. |

---

## 9. Credenciales y datos iniciales

- **Usuario:** `admin` · **Contraseña:** `Admin123!` · **Rol:** Administrador
- Al sembrar la base se crean los **canales del chat** (General, Ventas, Bodega, Dirección).
