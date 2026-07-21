export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-page)] p-8 text-center">
      <div className="max-w-sm">
        <h1 className="font-[var(--font-display)] text-xl text-[var(--text-primary)] mb-2">Verifique seu e-mail</h1>
        <p className="text-sm text-[var(--text-secondary)]">Enviamos um link de acesso. Ele expira em alguns minutos.</p>
      </div>
    </div>
  );
}
