import { useEffect, useMemo, useState } from 'react';
import { fetchArticlesByAuthor, fetchDna } from '../lib/api';
import type { ArticleWithAuthor, WritingDna } from '../lib/database.types';
import { plainText } from '../lib/pages';
import { useAuth } from '../context/AuthContext';

const CHIP_COLORS: Record<string, { bg: string; fg: string }> = {
  amber: { bg: 'rgba(232,150,58,.12)', fg: 'var(--amber)' },
  lavender: { bg: 'rgba(138,114,200,.1)', fg: 'var(--lavender)' },
  sage: { bg: 'rgba(90,158,120,.1)', fg: 'var(--sage)' },
  sky: { bg: 'rgba(74,143,212,.1)', fg: 'var(--sky)' },
  rose: { bg: 'rgba(224,90,110,.1)', fg: 'var(--rose)' },
};

const INFLUENCE_BG = [
  'linear-gradient(135deg,#1a1020,#20152e)',
  'linear-gradient(135deg,#1a1008,#2a1e10)',
  'linear-gradient(135deg,#0f1a14,#142818)',
  'linear-gradient(135deg,#10141a,#182028)',
];

/** Sentence-length distribution, computed from what the writer has actually published. */
function sentenceBuckets(articles: ArticleWithAuthor[]) {
  const buckets = [0, 0, 0, 0]; // short (<10), med (<20), long (<32), very long
  for (const a of articles) {
    for (const s of plainText(a.body).split(/(?<=[.!?])\s+/)) {
      const n = s.split(/\s+/).filter(Boolean).length;
      if (n === 0) continue;
      if (n < 10) buckets[0]++;
      else if (n < 20) buckets[1]++;
      else if (n < 32) buckets[2]++;
      else buckets[3]++;
    }
  }
  const max = Math.max(1, ...buckets);
  return buckets.map(b => Math.round((b / max) * 100));
}

export default function DnaPage() {
  const { profile } = useAuth();
  const [dna, setDna] = useState<WritingDna | null>(null);
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);

  useEffect(() => {
    if (!profile) return;
    void fetchDna(profile.id).then(setDna).catch(console.error);
    void fetchArticlesByAuthor(profile.id, 'published').then(setArticles).catch(console.error);
  }, [profile]);

  const bars = useMemo(() => sentenceBuckets(articles), [articles]);
  const traits = dna?.traits ?? [];
  const words = dna?.signature_words ?? [];
  const influences = dna?.influences ?? [];

  return (
    <div className="page active" id="page-dna">
      <div className="dna-header">
        <div className="dna-header-left">
          <h1 className="serif-h" style={{ fontSize: '28px' }}>Your Writing <em>DNA</em></h1>
          <p style={{
            fontFamily: 'var(--sans)', fontSize: '13px',
            color: 'rgba(255,255,255,.4)', marginTop: '4px',
          }}>
            Your unique literary fingerprint — analysed across {articles.length} published piece
            {articles.length === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="dna-score-badge">
          <div className="dna-score-num">{dna?.craft_score ?? profile?.craft_score ?? 0}</div>
          <div className="dna-score-lbl">Craft score</div>
        </div>
      </div>

      <div className="dna-grid">
        <div className="dna-card">
          <div className="dna-card-title">Voice traits</div>
          {traits.map(t => (
            <div className="trait-row" key={t.name}>
              <div className="trait-name" style={{ fontFamily: 'var(--sans)', fontSize: '13px' }}>{t.name}</div>
              <div className="trait-bar-wrap">
                <div className="trait-bar" style={{ width: `${t.value}%`, background: t.color }} />
              </div>
              <div className="trait-val">{t.value}%</div>
            </div>
          ))}
          {traits.length === 0 && (
            <div style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'rgba(255,255,255,.4)' }}>
              Publish a few pieces and your voice profile will appear here.
            </div>
          )}
        </div>

        <div className="dna-card">
          <div className="dna-card-title">Your signature words</div>
          <div className="word-cloud">
            {words.map(w => {
              const c = CHIP_COLORS[w.c] ?? CHIP_COLORS.amber;
              return (
                <span
                  className="word-chip"
                  key={w.w}
                  style={{ background: c.bg, color: c.fg, fontSize: `${w.size}px` }}
                >
                  {w.w}
                </span>
              );
            })}
          </div>
        </div>

        <div className="dna-card">
          <div className="dna-card-title">Sentence rhythm</div>
          <div className="bar-chart">
            {(['Short', 'Med', 'Long', 'V.long'] as const).map((lbl, i) => (
              <div className="bar-wrap" key={lbl}>
                <div className="bar" style={{ height: `${Math.max(6, bars[i])}%`, background: 'var(--amber)' }} />
                <div className="bar-lbl">{lbl}</div>
              </div>
            ))}
          </div>
          <div style={{
            fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--ink-3)',
            marginTop: '12px', lineHeight: 1.6,
          }}>
            {dna?.rhythm
              ? `Average sentence ${dna.rhythm.avgSentence} words, paragraphs around ${dna.rhythm.avgParagraph} sentences. Variance score ${dna.rhythm.varianceScore} — ${dna.rhythm.readingLevel}.`
              : 'Write more and your rhythm profile will fill in.'}
          </div>
        </div>

        <div className="dna-card">
          <div className="dna-card-title">Writers you echo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            {influences.map((inf, i) => (
              <div key={inf.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: INFLUENCE_BG[i % INFLUENCE_BG.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--serif)', fontSize: '12px', color: 'rgba(255,255,255,.8)', flexShrink: 0,
                }}>
                  {inf.name.split(' ').map(p => p[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink)' }}>{inf.name}</div>
                  <div className="trait-bar-wrap" style={{ marginTop: '4px' }}>
                    <div className="trait-bar" style={{ width: `${inf.match}%`, background: 'var(--lavender)' }} />
                  </div>
                </div>
                <div className="trait-val">{inf.match}%</div>
              </div>
            ))}
            {influences.length === 0 && (
              <div style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--ink-3)' }}>
                Not enough writing yet to find your echoes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
