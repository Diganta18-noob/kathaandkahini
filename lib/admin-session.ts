import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "kahini-admin";
const lifetime = 8 * 60 * 60;
const minimumPasswordLength = 12;

function settings() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  return email && password && password.length >= minimumPasswordLength ? { email, password } : null;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function signature(password: string, email: string, expires: number) {
  return createHmac("sha256", password).update(JSON.stringify([email, expires])).digest("hex");
}

export async function startAdminSession(input: string) {
  const admin = settings();
  if (!admin || !timingSafeEqual(digest(input), digest(admin.password))) return false;

  const expires = Math.floor(Date.now() / 1000) + lifetime;
  const cookieStore = await cookies();
  cookieStore.set(cookieName, `${expires}.${signature(admin.password, admin.email, expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: lifetime,
    path: "/",
  });
  return true;
}

export async function getAdminSessionEmail() {
  const admin = settings();
  if (!admin) return null;

  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value ?? "";
  const match = /^(\d{1,12})\.([a-f0-9]{64})$/.exec(value);
  if (!match) return null;

  const expires = Number(match[1]);
  if (expires <= Math.floor(Date.now() / 1000)) return null;
  const expected = signature(admin.password, admin.email, expires);
  return timingSafeEqual(Buffer.from(match[2], "hex"), Buffer.from(expected, "hex"))
    ? admin.email
    : null;
}
