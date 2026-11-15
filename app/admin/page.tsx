import { env, usesVercelAuth } from '@/lib/runtime';
import { notFound } from 'next/navigation';
import { getChatGPTUser, requireChatGPTUser } from '../chatgpt-auth';
import { episodes } from '../episodes';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Studio analytics | Kotha & Kahini', robots: { index: false, follow: false } };
const DAY = 86_400_000;
const ranges = [7, 30, 90];

type EpisodeRow = { episode: string; starts: number; finishes: number; totalProgress: number };
type DayRow = { day: string; starts: number };

export default async function Admin({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const user = usesVercelAuth ? await requireChatGPTUser('/admin') : await getChatGPTUser();
  if (!user || !env.ADMIN_EMAIL || user.email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) notFound();

  const requested = Number((await searchParams).days);
  const days = ranges.includes(requested) ? requested : 30;
  const today = Math.floor(Date.now() / DAY) * DAY;
  const cutoff = today - (days - 1) * DAY;
  let grouped: EpisodeRow[] = [];
  let daily: DayRow[] = [];
  let unavailable = false;
  try {
    if (!env.DB) throw new Error('Missing analytics database');
    const [episodeStats, dailyStats] = await env.DB.batch<EpisodeRow | DayRow>([
      env.DB.prepare(`SELECT episode, COUNT(*) starts, SUM(progress=100) finishes,
        SUM(progress) totalProgress FROM watches WHERE started_at>=? GROUP BY episode`).bind(cutoff),
      env.DB.prepare(`SELECT date(started_at/1000,'unixepoch') day, COUNT(*) starts
        FROM watches WHERE started_at>=? GROUP BY day`).bind(cutoff),
    ]);
    grouped = episodeStats.results as EpisodeRow[];
    daily = dailyStats.results as DayRow[];
  } catch {
    unavailable = true;
  }

  const rows = episodes.map(episode => ({
    ...episode,
    ...(grouped.find(row => row.episode === episode.id) ?? { starts: 0, finishes: 0, totalProgress: 0 }),
  }));
  const starts = rows.reduce((sum, row) => sum + row.starts, 0);
  const finishes = rows.reduce((sum, row) => sum + row.finishes, 0);
  const progress = rows.reduce((sum, row) => sum + row.totalProgress, 0);
  const percent = (value: number, count: number) => count ? Math.round(value / count) + '%' : '—';
  const chart = Array.from({ length: days }, (_, i) => {
    const date = new Date(cutoff + i * DAY).toISOString().slice(0, 10);
    return { date, count: daily.find(row => row.day === date)?.starts ?? 0 };
  });
  const max = Math.max(1, ...chart.map(day => day.count));
  const csv = ['Episode,Starts,Completed,Completion rate,Average milestone',
    ...rows.map(row => [row.title, row.starts, row.finishes, percent(row.finishes * 100, row.starts), percent(row.totalProgress, row.starts)].join(',')),
  ].join('\n');

  return <>
    <header className="masthead"><a className="brand" href="/"><img src="/assets/logo.svg" width="42" height="42" alt="" />Kotha &amp; Kahini</a><nav><a href="/admin/publishing">Publishing desk</a> · <a href="/">← Watch site</a></nav></header>
    <main className="studio">
      <div className="studio-head">
        <div><p className="eyebrow">CREATOR STUDIO</p><h1>Audience analytics</h1><p>Playback activity on the Kotha &amp; Kahini website.</p></div>
        <nav className="ranges" aria-label="Analytics date range">{ranges.map(range => <a key={range} href={`/admin?days=${range}`} aria-current={range === days ? 'page' : undefined}>{range} days</a>)}</nav>
      </div>
      {unavailable ? <p className="notice" role="status">Analytics are temporarily unavailable. Reload to try again.</p> : <>
        <div className="metrics">
          <div className="metric"><strong>{starts}</strong><p>Playback starts</p></div>
          <div className="metric"><strong>{finishes}</strong><p>Completed plays</p></div>
          <div className="metric"><strong>{percent(finishes * 100, starts)}</strong><p>Completion rate</p></div>
          <div className="metric"><strong>{percent(progress, starts)}</strong><p>Average watch milestone</p></div>
        </div>
        <section className="report" aria-labelledby="trend">
          <h2 id="trend">Daily starts</h2>
          {starts ? <>
            <div className="plot" role="img" aria-label={chart.map(day => `${day.date}: ${day.count} starts`).join('; ')}>
              {chart.map(day => <span key={day.date} style={{ height: day.count ? `${day.count / max * 100}%` : '2px' }} title={`${day.date}: ${day.count}`} />)}
            </div>
            <div className="plot-labels"><span>{chart[0].date}</span><span>{chart.at(-1)?.date} (UTC)</span></div>
          </> : <p className="notice">No plays recorded in this period. Playback activity will appear here as episodes are watched.</p>}
        </section>
        <section className="report" aria-labelledby="performance">
          <div className="report-head"><h2 id="performance">Episode performance</h2><a className="outline" download={`kahini-${days}-days.csv`} href={'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)}>Export CSV ↓</a></div>
          <div className="table-scroll"><table>
            <thead><tr><th scope="col">Episode</th><th scope="col">Starts</th><th scope="col">Completed</th><th scope="col">Completion rate</th><th scope="col">Avg. milestone</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.id}><th scope="row">{row.title}</th><td>{row.starts}</td><td>{row.finishes}</td><td>{percent(row.finishes * 100, row.starts)}</td><td>{percent(row.totalProgress, row.starts)}</td></tr>)}</tbody>
          </table></div>
          <p>Completion means at least 95% of the video played. Watch milestones record 25%, 50%, 75%, and completion. Counts cover this site’s player.</p>
        </section>
      </>}
    </main>
  </>;
}

