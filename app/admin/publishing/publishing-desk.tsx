'use client';

import { useEffect, useState } from 'react';
import copy from './copy.json';
import styles from './publishing.module.css';

const drive = 'https://drive.google.com/drive/u/0/folders/1xVfF3CtT7IMacJByOkhKGtAW_OSEQ4qn';
const buffer = 'https://publish.buffer.com/';
const entries = [
  { id: '6', name: 'Which Ashwatthama Died?', series: 'MAHABHARATA · PART 6', file: 'Abhimanyu-Part-06-Rath-Cut-Edited-Audio.mp4' },
  { id: '5', name: 'Karna’s Shakti', series: 'MAHABHARATA · PART 5', file: 'Abhimanyu-Part-05-Edited.mp4' },
  { id: '4', name: 'Arjuna’s Last Shot', series: 'MAHABHARATA · PART 4', file: 'Abhimanyu-Part-04-Edited.mp4' },
  { id: '3', name: 'Arjuna’s Vow', series: 'MAHABHARATA · PART 3', file: 'Abhimanyu-Part-03-Edited.mp4' },
  { id: 'chhath', name: 'The First Arghya', series: 'CHHATH PUJA · PART 1', file: 'Chhath-Puja-Part-01-Edited.mp4' },
];
const platforms = ['Instagram', 'Facebook', 'YouTube'] as const;
const statusOptions = ['To prepare', 'Drafted', 'Scheduled', 'Published'];

function sections(id: string) {
  const source = id === 'chhath' ? copy.chhath :
    copy.episodes.split(/^## Part /m).find(section => section.startsWith(id + '\n') || section.startsWith(id + '\r\n')) ?? '';
  const blocks = [...source.matchAll(/^#{2,3} (.+)\r?\n([\s\S]*?)(?=^#{2,3} |$(?![\s\S]))/gm)];
  return blocks.map(([, heading, body]) => ({ heading: heading.trim(), body: body.trim() }));
}

export default function PublishingDesk() {
  const [selected, setSelected] = useState(entries[0].id);
  const [platform, setPlatform] = useState<(typeof platforms)[number]>('Instagram');
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const entry = entries.find(item => item.id === selected) ?? entries[0];
  const blocks = sections(selected);
  const fields = blocks.filter(block => block.heading.startsWith(platform));
  const pinned = blocks.find(block => block.heading === 'Pinned comment');
  const key = selected + ':' + platform;

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/publishing', { cache: 'no-store', signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Checklist unavailable');
        return response.json() as Promise<Record<string, string>>;
      })
      .then(saved => { setStatuses(saved); setReady(true); })
      .catch(() => {
        if (!controller.signal.aborted) setFeedback('Could not load the shared checklist. Reload to retry.');
      });
    return () => controller.abort();
  }, []);

  async function saveStatus(status: string) {
    setSaving(true);
    try {
      const response = await fetch('/api/publishing', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, status }),
      });
      if (!response.ok) throw new Error('Save failed');
      setStatuses(previous => ({ ...previous, [key]: status }));
      setFeedback('Checklist synced.');
    } catch {
      setFeedback('Could not save that change. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback('Copied to clipboard.');
    } catch {
      setFeedback('Clipboard unavailable. Select the text and copy it manually.');
    }
  }

  return <main className={styles.desk}>
    <section className={styles.hero}>
      <p className="eyebrow">KATHA &amp; KAHINI STUDIO</p>
      <h1>Publishing desk</h1>
      <p>Pick an episode, copy the platform caption, and schedule the finished video in Buffer.</p>
      <div className={styles.actions}>
        <a className={styles.primary} href={buffer} target="_blank" rel="noreferrer">Open Buffer ↗</a>
        <a href={drive} target="_blank" rel="noreferrer">Open content in Drive ↗</a>
      </div>
    </section>
    <div className={styles.grid}>
      <section aria-label="Episodes" className={styles.library}>
        <h2>Content library</h2>
        {entries.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id}
          onClick={() => { setSelected(item.id); setFeedback(''); }}>
          <small>{item.series}</small><strong>{item.name}</strong>
        </button>)}
      </section>
      <section aria-label="Publishing details" className={styles.details}>
        <p className="eyebrow">{entry.series}</p>
        <h2>{entry.name}</h2>
        <p className={styles.filename}>{entry.file}</p>
        <div className={styles.tabs} aria-label="Platforms">
          {platforms.map(item => <button type="button" key={item} aria-pressed={platform === item}
            onClick={() => { setPlatform(item); setFeedback(''); }}>{item}</button>)}
        </div>
        <label className={styles.status}>Publishing checklist
          <select value={statusOptions.includes(statuses[key]) ? statuses[key] : statusOptions[0]}
            disabled={!ready || saving} onChange={event => void saveStatus(event.target.value)}>
            {statusOptions.map(status => <option key={status}>{status}</option>)}
          </select>
        </label>
        <p className={styles.hint}>Checklist changes sync between devices. Schedule and publish in Buffer.</p>
        {fields.length ? fields.map(field => <div className={styles.copy} key={field.heading}>
          <div><h3>{field.heading}</h3><button onClick={() => copyText(field.body)}>Copy</button></div>
          <textarea readOnly aria-label={field.heading} rows={Math.min(11, Math.max(2, field.body.split('\n').length + 1))} value={field.body} />
        </div>) : <p>No saved caption for this platform.</p>}
        {pinned && <div className={styles.copy}>
          <div><h3>Pinned comment</h3><button onClick={() => copyText(pinned.body)}>Copy</button></div>
          <p>{pinned.body}</p>
        </div>}
        <p role="status" className={styles.hint}>{feedback}</p>
      </section>
    </div>
  </main>;
}

