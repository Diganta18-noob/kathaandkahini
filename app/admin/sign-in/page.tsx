import { notFound, redirect } from "next/navigation";
import { usesVercelAuth } from "@/lib/runtime";
import { startAdminSession } from "@/lib/admin-session";
import styles from "./sign-in.module.css";
import PasswordField from "./password-field";

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
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.art}>
          <a href="/" className={styles.brand}>
            <img src="/assets/logo.svg" alt="" width="42" height="42" />
            Katha &amp; Kahini
          </a>
        </div>
        <section className={styles.panel} aria-labelledby="sign-in-title">
          <div className={styles.content}>
            <a href="/" className={styles.back}>← Back to website</a>
            <h1 id="sign-in-title" className={styles.title}>Studio sign-in</h1>
            <p className={styles.description}>Access audience analytics and the publishing desk.</p>
            <form action={signIn} className={styles.form}>
              <input type="hidden" name="returnTo" value={destination(returnTo)} />
              <label htmlFor="password">Admin password</label>
              <PasswordField invalid={failed === "1"} />
              {failed === "1" && <p id="sign-in-error" className={styles.error} role="alert">Couldn’t sign in. Check your password and try again.</p>}
              <button className={styles.submit} type="submit">Sign in <span aria-hidden="true">→</span></button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
