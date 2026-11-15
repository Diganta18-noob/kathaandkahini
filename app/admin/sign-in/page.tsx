import { notFound, redirect } from "next/navigation";
import { usesVercelAuth } from "@/lib/runtime";
import { startAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Studio sign-in | Katha & Kahini",
  robots: { index: false, follow: false },
};

function destination(returnTo: unknown) {
  return returnTo === "/admin/publishing" ? returnTo : "/admin";
}

async function signIn(form: FormData) {
  "use server";
  if (!usesVercelAuth) notFound();

  const returnTo = destination(form.get("returnTo"));
  const password = form.get("password");
  if (typeof password !== "string" || !(await startAdminSession(password))) {
    redirect(`/admin/sign-in?failed=1&returnTo=${encodeURIComponent(returnTo)}`);
  }
  redirect(returnTo);
}

export default async function SignIn({ searchParams }: {
  searchParams: Promise<{ failed?: string; returnTo?: string }>;
}) {
  if (!usesVercelAuth) notFound();

  const { failed, returnTo } = await searchParams;
  return (
    <main className="studio">
      <h1>Studio sign-in</h1>
      <form action={signIn}>
        <input type="hidden" name="returnTo" value={destination(returnTo)} />
        <label htmlFor="password">Admin password</label>{" "}
        <input id="password" name="password" type="password" autoComplete="current-password" required />{" "}
        <button className="outline" type="submit">Sign in</button>
        {failed === "1" && <p role="alert">Sign-in failed.</p>}
      </form>
    </main>
  );
}
