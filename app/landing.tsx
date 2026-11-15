"use client";

import { useRef, useState } from 'react';
import { episodes } from './episodes';

type Playback = { id: string; episode: string; progress: number };

export default function Landing() {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const playback = useRef<Playback | null>(null);
  const episode = episodes[index];

  function openEpisode(nextIndex: number) {
    playback.current = null;
    video.current?.pause();
    setIndex(nextIndex);
    if (!dialog.current?.open) dialog.current?.showModal();
  }

  function record(progress: number) {
    const watch = playback.current;
    if (!watch || progress <= watch.progress) return;
    watch.progress = progress;
    void fetch('/api/watch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playbackId: watch.id, episode: watch.episode, progress }),
      keepalive: true,
    }).catch(() => {});
  }

  function startPlayback() {
    if (playback.current) return;
    playback.current = { id: crypto.randomUUID(), episode: episode.id, progress: -1 };
    record(0);
  }

  function trackProgress() {
    const media = video.current;
    if (!media || !Number.isFinite(media.duration) || media.duration <= 0) return;
    let seconds = 0;
    for (let i = 0; i < media.played.length; i++) seconds += media.played.end(i) - media.played.start(i);
    const percent = seconds / media.duration * 100;
    const milestone = percent >= 95 ? 100 : Math.floor(percent / 25) * 25;
    record(milestone);
  }

  return <>
    <a className="skip" href="#episodes">Skip to episodes</a>
    <header className="masthead">
      <a className="brand" href="/"><img src="/assets/logo.svg" width="45" height="45" alt="" /><span>Katha <i>&amp;</i> Kahini</span></a>
      <nav aria-label="Main navigation"><a href="#episodes">Episodes</a><a className="outline" href="https://www.instagram.com/kathaandkahini/">Instagram ↗</a></nav>
    </header>
    <main>
      <section className="hero" aria-labelledby="headline">
        <div className="hero-art" aria-hidden="true" />
        <div className="orbit" aria-hidden="true" />
        <div className="intro">
          <p className="eyebrow">THE MAHABHARATA COLLECTION</p>
          <h1 id="headline">Stories from<br />the <em>epics.</em></h1>
          <p className="lede">Follow Abhimanyu into the Chakravyuh and Arjuna into a race against sunset. Illustrated short films, narrated in Hindi.</p>
          <div className="actions"><button className="primary" onClick={() => openEpisode(0)}>▶ &nbsp; Watch Part 1</button><a className="outline" href="#episodes">Explore episodes ↓</a></div>
          <p className="hindi" lang="hi">महाकाव्यों की कहानियाँ, हिंदी में</p>
        </div>
        <p className="credit">KURUKSHETRA &nbsp; ◆ &nbsp; THE CHAKRAVYUH ARC</p>
      </section>
      <section id="episodes" className="library" aria-labelledby="library-title">
        <div className="section-head"><div><p className="eyebrow">THE EPISODE LIBRARY</p><h2 id="library-title">Abhimanyu &amp;<br />the Chakravyuh</h2></div><p>Seven chapters from the Drona Parva, from Abhimanyu’s charge to Ashwatthama’s Narayanastra.</p></div>
        <div className="cards">{episodes.slice(0, -1).map((item, i) => <article key={item.id} id={item.id}>
          <button className="cover" onClick={() => openEpisode(i)} aria-label={`Watch Part ${i + 1}: ${item.title}`}>
            <img src={`/assets/${item.id}.jpg`} alt="" width="1080" height="1920" loading="lazy" /><span aria-hidden="true">▶</span>
          </button>
          <div className="card-copy"><p className="meta">PART {item.number} <span>{item.duration}</span></p><h3>{item.title}</h3><p>{item.text}</p></div>
        </article>)}</div>
      </section>
      <section id={episodes[episodes.length - 1].id} className="library festival" aria-labelledby="festival-title">
        <button className="cover" onClick={() => openEpisode(episodes.length - 1)} aria-label="Watch The First Arghya">
          <img src="/assets/chhath.jpg" alt="" width="1080" height="1920" loading="lazy" /><span aria-hidden="true">▶</span>
        </button>
        <div><p className="eyebrow">FESTIVAL STORIES</p><h2 id="festival-title">The First Arghya</h2>
          <p className="lede">From the evening offering to the first light of dawn at the Chhath ghat.</p>
          <button className="primary" onClick={() => openEpisode(episodes.length - 1)}>Watch Chhath Puja</button></div>
      </section>
      <section className="follow"><img src="/assets/logo.svg" width="78" height="78" alt="" /><h2>Follow the next chapter.</h2><a className="outline" href="https://www.instagram.com/kathaandkahini/">@kathaandkahini ↗</a></section>
    </main>
    <footer><span>Katha &amp; Kahini · Illustrated Indian mythology</span><a href="/admin">Studio analytics ↗</a></footer>
    <dialog ref={dialog} aria-labelledby="player-title" onClose={() => { video.current?.pause(); playback.current = null; }}>
      <div className="player-head"><div><p className="meta">{episode.id === 'chhath' ? 'CHHATH PUJA' : 'PART ' + episode.number}</p><h2 id="player-title">{episode.title}</h2></div><form method="dialog"><button aria-label="Close video" autoFocus>×</button></form></div>
      <video key={episode.id} ref={video} controls playsInline preload="none" poster={`/assets/${episode.id}.jpg`} src={`/assets/${episode.id}.mp4`} onPlay={startPlayback} onTimeUpdate={trackProgress} onEnded={trackProgress} />
      <div className="player-head"><button disabled={index === 0} onClick={() => openEpisode(index - 1)}>← Previous</button><button disabled={index === episodes.length - 1} onClick={() => openEpisode(index + 1)}>Next episode →</button></div>
    </dialog>
  </>;
}
