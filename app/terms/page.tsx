import { PublicPage } from "@/components/public-frame";
import { copy } from "@/lib/i18n";
import { Instrument_Serif, Playfair_Display } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"] });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

const clauses = [
  {
    title: "El diario es tuyo",
    body: "Cada apunte es de quien creó la cuenta. SIRA no vende perfiles de gasto ni cede la lista a anunciantes.",
  },
  {
    title: "Cifrado, no custodia ciega",
    body: "Los importes y los datos personales se cifran con AES-256-GCM. La clave está en el servidor de la aplicación. Por eso no es cero conocimiento: quien administra ese entorno puede usar la clave.",
  },
  {
    title: "El dúo pide acuerdo",
    body: "Compartir una cuenta exige invitación. La otra persona ve el nombre visible y las cuentas marcadas. No ve el teléfono ni el nombre legal.",
  },
  {
    title: "Borrar es borrar la cuenta",
    body: "Hoy no hay un botón de pulverización con comprobante. Cuando exista la baja, debe borrar la cuenta y sus apuntes. No prometemos un sello criptográfico descargable.",
  },
];

const sections = [
  {
    title: "Qué es el diario",
    body: "SIRA anota ingresos, gastos, presupuestos y metas. No es un banco, no custodia dinero y no se conecta a tu entidad. Los cálculos no son consejo de inversión.",
  },
  {
    title: "La contraseña",
    body: "Se entra con correo y contraseña. La contraseña no se guarda en claro. No hay frase semilla de recuperación. Si se pierde, esta versión no puede abrir la bóveda por otro camino.",
  },
  {
    title: "Edad y país",
    body: "Para crear la cuenta hay que cumplir la edad mínima digital del país indicado. En España son 14 años. La fecha de nacimiento se guarda cifrada y se usa para esa comprobación.",
  },
  {
    title: "Modo dúo",
    body: "El dúo admite como máximo dos personas. Se invita con un código. Cada quien puede dejar de compartir. Las cuentas privadas siguen privadas.",
  },
  {
    title: "Sin conexión",
    body: "La aplicación necesita la base para entrar y guardar. El modo desconectado completo del diseño aún no existe.",
  },
  {
    title: "Ley aplicable",
    body: "Este texto es un borrador de desarrollo. Antes de abrir el registro al público hay que revisarlo. No fija un arbitraje en Suiza ni un delegado de protección con plazo de 24 horas.",
  },
];

export default async function TermsPage() {
  const jar = await cookies();
  const text = copy(jar.get("sira_locale")?.value ?? "es");
  return (
    <PublicPage text={text}>
      <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 pb-8 sm:px-6 lg:px-10">
        <header className="grid gap-3">
          <p className={`${instrument.className} text-accent`}>Documento de producto · 2026-09-28</p>
          <h1 className={`${playfair.className} text-3xl font-semibold leading-tight text-ink sm:text-5xl`}>Marco y condiciones</h1>
          <p className="max-w-3xl text-sm leading-6 text-pine/80 sm:text-base">
            Condiciones de uso de SIRA, Sistema de Ingresos, Rentas y Ahorro. Describen el producto que existe, no la bóveda institucional del diseño.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {clauses.map((clause) => (
            <article key={clause.title} className="rounded-[2rem] border border-ink/15 bg-white/90 p-5">
              <h2 className="font-semibold">{clause.title}</h2>
              <p className="mt-2 text-sm leading-6 text-pine/80">{clause.body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4">
          {sections.map((section) => (
            <article key={section.title} className="grid gap-2 border-t border-ink/15 pt-4">
              <h2 className={`${playfair.className} text-2xl font-semibold`}>{section.title}</h2>
              <p className="max-w-3xl text-sm leading-6 text-pine/80 sm:text-base">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-3 rounded-[2rem] bg-ink p-6 text-paper lg:grid-cols-2">
          <div>
            <h2 className={`${playfair.className} text-2xl`}>Lo que hace la aplicación</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-white/80">
              <li>Cifra las tablas patrimoniales con la clave del entorno.</li>
              <li>No muestra publicidad ni comisiones ocultas.</li>
              <li>Guarda la versión de términos aceptada: 2026-09-28.</li>
            </ul>
          </div>
          <div>
            <h2 className={`${playfair.className} text-2xl`}>Lo que haces tú</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-white/80">
              <li>Custodiar la contraseña. No hay frase de papel que la sustituya.</li>
              <li>No anotar actividad ilícita.</li>
              <li>Pedir consentimiento antes de invitar a un dúo.</li>
              <li>Entender que un extracto de SIRA no sustituye a un asesor fiscal.</li>
            </ul>
          </div>
        </section>

        <p className="text-sm text-pine/80">
          Al crear la cuenta marcas la casilla y queda registrada la versión 2026-09-28.
          {" "}
          <Link href="/register" className="underline">Crear la bóveda</Link>
          {" · "}
          <Link href="/privacy" className="underline">Privacidad</Link>
        </p>
      </main>
    </PublicPage>
  );
}
