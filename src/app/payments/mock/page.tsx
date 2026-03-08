import Link from 'next/link';

export default async function MockPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = params.plan === 'ultra' ? 'ultra' : 'basic';
  const planLabel = plan === 'ultra' ? 'Plan Ultra' : 'Plan Basico';

  return (
    <main className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-xl mx-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Pasarela de pago demo</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Esta es una pasarela simulada para <span className="font-semibold">{planLabel}</span>.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No se realiza ningun cobro por ahora. Integracion real pendiente.
        </p>
        <Link
          href="/profile"
          className="inline-flex rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm"
        >
          Volver a perfil
        </Link>
      </div>
    </main>
  );
}
