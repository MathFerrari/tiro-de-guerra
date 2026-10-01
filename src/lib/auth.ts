import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "session";
const SECRET = process.env.AUTH_SECRET || "dev-secret-troque-em-producao";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export type SessionPayload = {
  userId: string;
  name: string;
  role: "ADMIN" | "USER";
};

function sign(base64: string): string {
  return crypto.createHmac("sha256", SECRET).update(base64).digest("hex");
}

function encode(payload: SessionPayload): string {
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${base64}.${sign(base64)}`;
}

function decode(token: string): SessionPayload | null {
  const [base64, signature] = token.split(".");
  if (!base64 || !signature) return null;
  if (sign(base64) !== signature) return null;

  try {
    const json = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

// Cria o cookie de sessão HTTP-only após um login válido.
export async function createSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encode(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Lê a sessão atual, se existir. Não redireciona.
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decode(token);
}

// Usado nas páginas/layouts que exigem usuário logado.
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

// Usado nas server actions que só o ADMIN pode executar.
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "ADMIN") {
    throw new Error("Apenas administradores podem realizar esta ação.");
  }
  return session;
}
