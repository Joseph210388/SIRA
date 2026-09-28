import { PublicPage } from "@/components/public-frame";
import { copy } from "@/lib/i18n";
import { Instrument_Serif, Playfair_Display } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"] });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

const pillars = [
  {
    title: "Cifrado en reposo",
    body: "Nombre legal, teléfono, ciudad, población, fecha de nacimiento, nombres de cuenta, conceptos e importes se guardan con AES-256-GCM. La clave está en el entorno de la aplicación, no en Postgres.",
  },
  {
    title: "Lo que queda en claro",
    body: "El correo queda en claro porque sirve para entrar. La categoría y la hora del movimiento también, para poder filtrar. La contraseña se guarda solo como huella bcrypt.",
  },
  {
    title: "Tus datos se pueden sacar",
    body: "La cuenta es tuya. Hoy el borrado de la cuenta y la exportación completa aún no están en la interfaz. El cifrado no te ata a un formato secreto de banco.",
  },
  {
    title: "Sin rastreadores de anuncios",
    body: "Esta versión no carga píxeles de publicidad ni SDKs de analítica de terceros. No es una auditoría publicada ni un repositorio abierto certificado.",
  },
];

const questions = [
  {
    q: "¿Qué pasa si olvido la contraseña?",
    a: "Hoy no hay recuperación por frase semilla. Si se pierde la contraseña, el acceso no se puede restablecer desde esta pantalla. No guardamos una llave maestra de recuperación.",
  },
  {
    q: "¿El modo dúo enseña mis cuentas privadas?",
    a: "No. Solo se comparten las cuentas que eliges. La otra persona no ve el teléfono, la edad ni el nombre legal. El dúo se invita dentro de la app, no en el acceso.",
  },
  {
    q: "¿Dónde están las copias?",
    a: "Los datos viven en la base Postgres de esta instalación. No hay centros en Suiza ni Frankfurt, ni copia automática en iCloud o Drive.",
  },
  {
    q: "¿La huella o el PIN descifra el dinero?",
    a: "No. El PIN o el Authenticator es un segundo paso para entrar. No es la clave que descifra los importes.",
  },
];

export default async function PrivacyPage() {
  const jar = await cookies();
  const text = copy(jar.get("sira_locale")?.value ?? "es");
  return (
    <PublicPage text={text}>
      <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 pb-8 sm:px-6 lg:px-10">
        <header className="grid gap-3">
          <p className={`${instrument.className} text-[#C88A36]`}>Seguridad y privacidad</p>
          <h1 className={`${playfair.className} text-3xl font-semibold leading-tight text-[#14271F] sm:text-5xl`}>Cómo viajan tus datos</h1>
          <p className="max-w-3xl text-sm leading-6 text-[#3F6756] sm:text-base">
            SIRA cifra en el servidor lo que no hace falta leer para entrar o filtrar. El diseño de referencia hablaba de cero conocimiento, frase de 24 palabras y bóveda solo en el dispositivo. Eso no está construido.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            ["En el equipo", "Escribes el movimiento en el navegador. La página lo envía a la aplicación."],
            ["Al guardarse", "La aplicación cifra importes y datos personales antes de escribir la fila."],
            ["Quién lo ve", "Quien entra en tu cuenta. En dúo, solo las cuentas que marcas como compartidas."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-[2rem] border border-[#E8DFC8] bg-white/90 p-5">
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#3F6756]">{body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-3">
          <h2 className={`${playfair.className} text-2xl font-semibold sm:text-3xl`}>Cuatro pilares de esta versión</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-[2rem] border border-[#E8DFC8] bg-white/90 p-5">
                <h3 className="font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#3F6756]">{pillar.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-[#14271F] p-6 text-[#F7F6F2]">
            <h2 className={`${playfair.className} text-2xl`}>Lo que SIRA no hace</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-white/80">
              <li>No vende tus gastos a aseguradoras ni a tarjetas.</li>
              <li>No deja el saldo en texto plano dentro de la base.</li>
              <li>No es un banco y no custodia depósitos.</li>
            </ul>
          </article>
          <article className="rounded-[2rem] border border-[#E8DFC8] bg-white/90 p-6">
            <h2 className={`${playfair.className} text-2xl`}>Lo que sí hace</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#3F6756]">
              <li>Pide correo, país, nombre, apellido, fecha de nacimiento, ciudad, población y teléfono para la cuenta y la edad mínima.</li>
              <li>Cifra identidad e importes. El correo sigue en claro.</li>
              <li>El modo dúo enseña solo las cuentas elegidas.</li>
            </ul>
          </article>
        </section>

        <section className="grid gap-3">
          <h2 className={`${playfair.className} text-2xl font-semibold sm:text-3xl`}>Preguntas</h2>
          {questions.map((item) => (
            <article key={item.q} className="rounded-[2rem] border border-[#E8DFC8] bg-white/90 p-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm leading-6 text-[#3F6756]">{item.a}</p>
            </article>
          ))}
        </section>

        <p className="text-sm text-[#3F6756]">
          Borrador de producto, versión de términos 2026-09-28. No sustituye una política revisada por asesoría legal.
          {" "}
          <Link href="/login" className="underline">Volver al acceso</Link>
        </p>
      </main>
    </PublicPage>
  );
}
