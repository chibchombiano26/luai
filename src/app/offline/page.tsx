export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-zinc-50 text-zinc-900">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-xl font-semibold">Sin conexion</h1>
        <p className="text-sm text-zinc-600">
          La aplicacion esta instalada, pero necesitas internet para usar el chat y generar cotizaciones.
        </p>
      </div>
    </main>
  );
}
