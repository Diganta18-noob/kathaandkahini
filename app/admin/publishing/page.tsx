import { env } from '@/lib/runtime';
import { notFound } from 'next/navigation';
import { requireChatGPTUser } from '../../chatgpt-auth';
import PublishingDesk from './publishing-desk';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Publishing desk | Katha & Kahini',
  robots: { index: false, follow: false },
};

export default async function PublishingPage() {
  const user = await requireChatGPTUser('/admin/publishing');
  if (!env.ADMIN_EMAIL || user.email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) notFound();

  return <>
    <header className="masthead">
      <a className="brand" href="/"><img src="/assets/logo.svg" width="42" height="42" alt="" />Katha &amp; Kahini</a>
      <nav><a href="/admin">Audience analytics</a></nav>
    </header>
    <PublishingDesk />
  </>;
}
