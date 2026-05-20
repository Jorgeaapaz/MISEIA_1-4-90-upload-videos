import Link from 'next/link';

const features = [
  {
    title: 'Subida Directa',
    description: 'Arrastra y suelta tus videos. Subida directa al almacenamiento con barra de progreso en tiempo real.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    title: 'Busqueda Inteligente',
    description: 'Encuentra cualquier video por nombre, descripcion o tags. Busqueda full-text instantanea.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    title: 'Reproductor HTML5',
    description: 'Reproduce tus videos directamente en el navegador con controles nativos y streaming optimizado.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
  {
    title: 'Tags y Metadatos',
    description: 'Organiza con tags, pares clave-valor personalizados, descripciones y categorias flexibles.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
  },
  {
    title: 'Dashboard Analitico',
    description: 'Visualiza estadisticas de tus videos: espacio usado, tags populares y actividad reciente.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: 'Seguridad Total',
    description: 'Autenticacion JWT, aislamiento por usuario. Solo tu puedes ver y gestionar tus videos.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

const steps = [
  {
    number: '01',
    title: 'Sube',
    description: 'Arrastra tus videos o seleccionalos desde tu dispositivo. Subida directa con progreso en tiempo real.',
  },
  {
    number: '02',
    title: 'Organiza',
    description: 'Agrega tags, metadatos personalizados y descripciones para mantener tu biblioteca ordenada.',
  },
  {
    number: '03',
    title: 'Reproduce',
    description: 'Busca, filtra y reproduce cualquier video al instante desde tu navegador.',
  },
];

export default function LandingPage() {
  return (
    <div className="noise-overlay relative min-h-screen overflow-hidden bg-gray-950">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-pulse-glow absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="animate-pulse-glow absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-fuchsia-600/8 blur-[150px]" style={{ animationDelay: '2s' }} />
        <div className="animate-pulse-glow absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-violet-500/5 blur-[100px]" style={{ animationDelay: '4s' }} />
      </div>

      {/* ───── NAV ───── */}
      <header className="relative z-10 border-b border-white/[0.04]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">VideoVault</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-5 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-white/[0.07] px-5 py-2 text-sm font-medium text-white ring-1 ring-white/[0.1] transition-all hover:bg-white/[0.12] hover:ring-white/[0.2]"
            >
              Crear Cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* ───── HERO ───── */}
      <section className="relative z-10 px-6 pb-24 pt-28 lg:pt-36">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="animate-slide-up mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.07] px-4 py-1.5 text-sm text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Plataforma de gestion de videos
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up-d1 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-white">Tus videos,</span>
            <br />
            <span className="gradient-text">bajo tu control</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-slide-up-d2 mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/45 sm:text-xl">
            Sube, organiza con tags y metadatos, busca al instante y reproduce tus videos
            desde cualquier navegador. Todo en un solo lugar, seguro y privado.
          </p>

          {/* CTAs */}
          <div className="animate-slide-up-d3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/20 transition-all hover:shadow-violet-500/30"
            >
              <span className="relative z-10">Comenzar Gratis</span>
              <svg className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-8 py-3.5 text-sm font-semibold text-white/70 transition-all hover:border-white/[0.15] hover:text-white"
            >
              Ya tengo cuenta
            </Link>
          </div>

          {/* Hero visual — abstract video interface mockup */}
          <div className="animate-slide-up-d4 relative mx-auto mt-20 max-w-3xl">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-violet-500/10 via-transparent to-transparent blur-2xl" />
            <div className="glass-card relative overflow-hidden rounded-2xl p-1.5">
              <div className="relative overflow-hidden rounded-xl bg-gray-900/80">
                {/* Mock video player header */}
                <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <div className="ml-4 h-2.5 flex-1 rounded-full bg-white/[0.04]" />
                </div>
                {/* Mock content area */}
                <div className="flex aspect-[16/8] items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950/30">
                  <div className="relative">
                    <div className="animate-pulse-glow absolute -inset-6 rounded-full bg-violet-500/20 blur-xl" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] backdrop-blur-sm">
                      <svg className="ml-1 h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Mock progress bar */}
                <div className="px-5 py-3">
                  <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section className="relative z-10 border-t border-white/[0.04] px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="animate-slide-up mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">Funcionalidades</p>
            <h2 className="animate-slide-up-d1 text-3xl font-bold text-white sm:text-4xl">Todo lo que necesitas</h2>
            <p className="animate-slide-up-d2 mx-auto mt-4 max-w-xl text-white/40">
              Una plataforma completa para gestionar tu biblioteca de videos con herramientas potentes y una interfaz intuitiva.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`animate-slide-up-d${Math.min(i + 2, 8)} glass-card group rounded-2xl p-7 transition-all duration-300`}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20 transition-colors group-hover:bg-violet-500/15 group-hover:text-violet-300">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/35">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="relative z-10 border-t border-white/[0.04] px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-20 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-fuchsia-400">Como funciona</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Tres pasos simples</h2>
          </div>

          <div className="relative grid gap-12 lg:grid-cols-3 lg:gap-8">
            <div className="step-connector pointer-events-none absolute left-0 right-0 top-16 hidden h-px lg:block" />

            {steps.map((step, i) => (
              <div key={step.number} className={`animate-slide-up-d${Math.min(i + 3, 8)} relative text-center`}>
                <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5" />
                  <div className="absolute inset-2 rounded-full border border-white/[0.06]" />
                  <span className="text-4xl font-black tracking-tight text-white/15">{step.number}</span>
                </div>

                <h3 className="mb-3 text-xl font-bold text-white">{step.title}</h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/35">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA BANNER ───── */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.06]">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 via-fuchsia-600/10 to-transparent" />
            <div className="relative px-8 py-16 text-center sm:px-16">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Empieza a gestionar tus videos
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/40">
                Crea tu cuenta gratis y sube tu primer video en menos de un minuto.
              </p>
              <Link
                href="/register"
                className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-gray-950 transition-all hover:bg-white/90"
              >
                Crear Cuenta Gratis
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="relative z-10 border-t border-white/[0.04] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white/60">VideoVault</span>
          </div>
          <p className="text-xs text-white/25">
            Plataforma segura de gestion de videos. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
