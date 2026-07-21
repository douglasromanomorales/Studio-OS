import { signIn } from "@/lib/auth/auth";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-page)]">
      <form
        action={async (formData) => {
          "use server";
          await signIn("resend", { email: formData.get("email"), redirectTo: "/" });
        }}
        className="flex flex-col gap-4 w-full max-w-sm p-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)]"
      >
        <h1 className="font-[var(--font-display)] text-xl text-[var(--text-primary)]">Studio OS</h1>
        <p className="text-sm text-[var(--text-secondary)]">Entre com seu e-mail — sem senha, você recebe um link de acesso.</p>
        <input
          name="email"
          type="email"
          required
          placeholder="seu@email.com"
          className="h-11 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-card)] px-4 text-sm"
        />
        <button
          type="submit"
          className="h-11 rounded-[var(--radius-pill)] bg-[var(--brand)] text-[var(--text-on-brand)] text-sm font-medium"
        >
          Enviar link de acesso
        </button>
      </form>
    </div>
  );
}
