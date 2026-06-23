require("dotenv").config();
const connectDB = require("./config/db");
const Tenant = require("./models/Tenant");
const Product = require("./models/Product");
const { runWithTenant } = require("./plugins/tenantPlugin");

/**
 * Standalone seed: adds 15 tech products to store-a's catalog.
 * Does NOT delete anything — just inserts. Safe to run once.
 *
 * Prices are in CENTS (the model stores the smallest currency unit).
 * Images are left empty so you can add them from the admin afterwards.
 *
 * Run:  node src/seedTechProducts.js
 */

// price is in ARS, converted to cents below. stock + category included.
const TECH_PRODUCTS = [
  {
    name: "Auriculares Inalámbricos Pro",
    priceArs: 129990,
    stock: 25,
    category: "Audio",
    description:
      "Cancelación activa de ruido, 30h de batería y audio espacial.",
  },
  {
    name: "Auriculares In-Ear Buds",
    priceArs: 69990,
    stock: 40,
    category: "Audio",
    description: "Compactos, livianos y con estuche de carga rápida.",
  },
  {
    name: "Parlante Bluetooth Portátil",
    priceArs: 89990,
    stock: 30,
    category: "Audio",
    description:
      "Sonido envolvente, resistente al agua IPX7 y 20h de reproducción.",
  },
  {
    name: "Teclado Mecánico RGB",
    priceArs: 109990,
    stock: 20,
    category: "Periféricos",
    description: "Switches mecánicos, retroiluminación RGB y diseño compacto.",
  },
  {
    name: "Teclado Inalámbrico Slim",
    priceArs: 59990,
    stock: 35,
    category: "Periféricos",
    description: "Ultradelgado, silencioso y con conexión multidispositivo.",
  },
  {
    name: "Mouse Gamer Óptico",
    priceArs: 64990,
    stock: 28,
    category: "Periféricos",
    description: "Sensor de alta precisión, 6 botones programables y RGB.",
  },
  {
    name: "Mouse Inalámbrico Ergonómico",
    priceArs: 44990,
    stock: 45,
    category: "Periféricos",
    description: "Diseño ergonómico, silencioso y batería de larga duración.",
  },
  {
    name: 'Monitor 27" QHD',
    priceArs: 389990,
    stock: 12,
    category: "Monitores",
    description: "Panel IPS de 27 pulgadas, 144Hz y resolución 2K.",
  },
  {
    name: "Webcam Full HD 1080p",
    priceArs: 54990,
    stock: 33,
    category: "Accesorios",
    description: "Videollamadas nítidas con micrófono integrado y autofoco.",
  },
  {
    name: "Hub USB-C 7 en 1",
    priceArs: 49990,
    stock: 50,
    category: "Accesorios",
    description: "HDMI 4K, USB 3.0, lector SD y carga PD en un solo accesorio.",
  },
  {
    name: "Cargador Inalámbrico 3 en 1",
    priceArs: 79990,
    stock: 22,
    category: "Accesorios",
    description: "Cargá teléfono, auriculares y reloj a la vez.",
  },
  {
    name: "Power Bank 20.000mAh",
    priceArs: 69990,
    stock: 38,
    category: "Accesorios",
    description: "Carga rápida, doble puerto USB y diseño compacto.",
  },
  {
    name: "Smartwatch Deportivo",
    priceArs: 199990,
    stock: 18,
    category: "Wearables",
    description: "Monitoreo de salud, GPS y resistencia al agua.",
  },
  {
    name: "Soporte Notebook Aluminio",
    priceArs: 39990,
    stock: 42,
    category: "Accesorios",
    description: "Ergonómico, ajustable y con disipación de calor.",
  },
  {
    name: "Micrófono USB de Escritorio",
    priceArs: 94990,
    stock: 15,
    category: "Audio",
    description: "Calidad de estudio para streaming, podcasts y grabaciones.",
  },
];

// Build a URL-friendly slug from the product name.
function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function run() {
  await connectDB();

  const tenant = await Tenant.findOne({ slug: "store-a" });
  if (!tenant) {
    console.error(
      '❌ No se encontró el tenant "store-a". Corré el seed principal primero.',
    );
    process.exit(1);
  }

  const docs = TECH_PRODUCTS.map((p) => ({
    name: p.name,
    slug: slugify(p.name),
    description: p.description,
    price: p.priceArs * 100, // ARS -> cents
    currency: "ARS",
    stock: p.stock,
    category: p.category,
    images: [], // add from the admin later
    isActive: true,
  }));

  await runWithTenant(tenant._id, async () => {
    // Skip products whose slug already exists (so re-running doesn't duplicate).
    const existing = await Product.find({
      slug: { $in: docs.map((d) => d.slug) },
    }).select("slug");
    const existingSlugs = new Set(existing.map((e) => e.slug));
    const toInsert = docs.filter((d) => !existingSlugs.has(d.slug));

    if (toInsert.length === 0) {
      console.log("ℹ️  Todos los productos ya existían. Nada que insertar.");
    } else {
      await Product.insertMany(toInsert);
      console.log(
        `✅ Se agregaron ${toInsert.length} productos tecnológicos a store-a.`,
      );
    }
    if (existingSlugs.size > 0) {
      console.log(`   (${existingSlugs.size} ya existían y se saltearon)`);
    }
  });

  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
