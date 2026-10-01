import { redirect } from "next/navigation";
import { login } from "@/actions/auth";
import { getSession } from "@/lib/auth";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-military-dark px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mb-2 text-2xl font-bold tracking-wide text-military-green-dark">TG</div>
          <h1 className="text-lg font-semibold text-military-green-dark">Tiro de Guerra</h1>
          <p className="text-sm text-gray-500">Sistema de Gerenciamento de Escalas</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form action={login} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="identifier">Usuário ou e-mail</Label>
            <Input id="identifier" name="identifier" type="text" required autoFocus />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="mt-2 w-full">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
