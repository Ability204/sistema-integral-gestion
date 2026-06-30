import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Crea el usuario administrador inicial si no existe.
// Canales por defecto del chat de equipos.
async function crearCanales() {
  const canales = [
    { nombre: "General", descripcion: "Comunicación de toda la empresa" },
    { nombre: "Ventas", descripcion: "Equipo de ventas" },
    { nombre: "Bodega", descripcion: "Coordinación de almacén y bodega" },
    { nombre: "Dirección", descripcion: "Avisos de la dirección" },
  ];
  for (const c of canales) {
    await prisma.channel.upsert({
      where: { nombre: c.nombre },
      update: {},
      create: c,
    });
  }
  console.log(`Canales del chat listos: ${canales.map((c) => c.nombre).join(", ")}`);
}

async function main() {
  await crearCanales();

  const existente = await prisma.user.findUnique({ where: { username: "admin" } });
  if (existente) {
    console.log("El usuario 'admin' ya existe. Nada que hacer (canales verificados).");
    return;
  }

  const passwordHash = await bcrypt.hash("Admin123!", 10);
  await prisma.user.create({
    data: {
      username: "admin",
      passwordHash,
      rol: "ADMIN",
      nombre: "Administrador",
      apellidoPaterno: "del",
      apellidoMaterno: "Sistema",
      curp: "AAAA800101HDFLRN09",
      correo: "admin@sistemaintegral.mx",
      telefono1: "5512345678",
      fechaContratacion: new Date("2024-01-01"),
      areaContratacion: "Sistemas",
      numeroSeguroSocial: "12345678901",
      fechaAltaSalud: new Date("2024-01-01"),
      direccion: "Av. Principal 100",
      colonia: "Centro",
      codigoPostal: "06000",
      ciudad: "Ciudad de México",
      estado: "CDMX",
    },
  });

  console.log("Usuario administrador creado:");
  console.log("  Usuario: admin");
  console.log("  Contraseña: Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
