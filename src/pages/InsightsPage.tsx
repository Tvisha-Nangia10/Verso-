import { useEffect, useMemo, useState } from 'react';
import { fetchArticlesByAuthor, fetchSessions } from '../lib/api';
import type { ArticleWithAuthor, WritingSession } from '../lib/database.types';
import { useAuth } from '../context/AuthContext';

type Period = 'Week' | 'Month' | 'Year';
const SPAN: Record<Period, number> = { Week: 7, Month: 30, Year: 365 };
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function InsightsPage() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [period, setPeriod] = useState<Period>('Week');

  useEffect(() => {
    if (!profile) return;
    void fetchSessions(profile.id, 365).then(setSessions).catch(console.error);
    void fetchArticlesByAuthor(profile.id, 'published').then(setArticles).catch(console.error);
  }, [profile]);

  const stats = useMemo(() => {
    const span = SPAN[period];
    const cutoff = Date.now() - span * 86_400_000;
    const inPeriod = sessions.filter(s => new Date(s.day).getTime() >= cutoff);
    const prior = sessions.filter(s => {
      const t = new Date(s.day).getTime();
      return t >= cutoff - span * 86_400_000 && t < cutoff;
    });

    const words = inPeriod.reduce((n, s) => n + s.words, 0);
    const priorWords = prior.reduce((n, s) => n + s.words, 0);
    const change = priorWords > 0 ? Math.round(((words - priorWords) / priorWords) * 100) : 0;

    const minutes = inPeriod.reduce((n, s) => n + s.minutes, 0);
    const activeDays = inPeriod.filter(s => s.words > 0).length;

    const avgRead =
      articles.length > 0
        ? articles.reduce((n, a) => n + parseFloat(a.read_time) || 0, 0) / articles.length
        : 0;

    // "Completion rate": a rough proxy — how consistently the writer shows up.
    const completion = span > 0 ? Math.round((activeDays / Math.min(span, sessions.length || span)) * 100) : 0;

    // Most productive weekday.
    const byWeekday = new Array(7).fill(0);
    for (const s of inPeriod) byWeekday[new Date(s.day).getDay()] += s.words;
    const bestDay = byWeekday.indexOf(Math.max(...byWeekday));

    return { words, change, minutes, activeDays, avgRead, completion, bestDay, byWeekday };
  }, [sessions, articles, period]);

  // Last 7 calendar days for the activity chart.
  const week = useMemo(() => {
    const out: { label: string; words: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      const s = sessions.find(r => r.day === key);
      out.push({ label: DAY_LABELS[d.getDay()], words: s?.words ?? 0 });
    }
    return out;
  }, [sessions]);

  const maxWeek = Math.max(1, ...week.map(d => d.words));

  return (
    <div className="page active" id="page-insights">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 className="serif-h" style={{ fontSize: '28px' }}>Craft <em>Insights</em></h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['Week', 'Month', 'Year'] as Period[]).map(p => (
            <button
              className={`period-btn${period === p ? ' active' : ''}`}
              key={p}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="insights-grid">
        <div className="ins-card">
          <div className="ins-card-lbl">Words written</div>
          <div className="ins-big">{stats.words.toLocaleString()}</div>
          <div className="ins-sub">
            {stats.change === 0
              ? 'No prior period to compare'
              : `${stats.change > 0 ? '↑' : '↓'} ${Math.abs(stats.change)}% from the period before`}
          </div>
        </div>

        <div className="ins-card">
          <div className="ins-card-lbl">Avg. reading time</div>
          <div className="ins-big">
            {stats.avgRead.toFixed(1)}<span style={{ fontSize: '22px' }}>min</span>
          </div>
          <div className="ins-sub">Across {articles.length} published piece{articles.length === 1 ? '' : 's'}</div>
        </div>

        <div className="ins-card">
          <div className="ins-card-lbl">Days you showed up</div>
          <div className="ins-big">
            {stats.activeDays}<span style={{ fontSize: '22px' }}>d</span>
          </div>
          <div className="ins-sub">{stats.completion}% of this {period.toLowerCase()}</div>
        </div>

        <div className="ins-card">
          <div className="ins-card-lbl">Best writing day</div>
          <div className="ins-big" style={{ fontSize: '30px' }}>{DAY_LABELS[stats.bestDay]}</div>
          <div className="ins-sub">
            {Math.round(stats.minutes / 60)} hours at the desk this {period.toLowerCase()}
          </div>
        </div>
      </div>

      <div className="section-bar">
        <h2 className="serif-h" style={{ fontSize: '19px' }}>Writing <em>activity</em></h2>
      </div>
      <div className="gold-rule"><div className="gold-dot" /></div>

      <div style={{
        background: 'var(--white)', border: '1px solid var(--cream-3)',
        borderRadius: 'var(--r)', padding: '24px',
      }}>
        <div className="bar-chart" style={{ height: '140px', alignItems: 'flex-end' }}>
          {week.map((d, i) => {
            const pct = Math.round((d.words / maxWeek) * 100);
            return (
              <div className="bar-wrap" key={`${d.label}-${i}`} title={`${d.words.toLocaleString()} words`}>
                <div
                  className="bar"
                  style={{
                    height: `${Math.max(4, pct)}%`,
                    background: pct >= 60 ? 'var(--amber)' : 'var(--cream-3)',
                  }}
                />
                <div className="bar-lbl">{d.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--ink-3)',
          marginTop: '16px', textAlign: 'center',
        }}>
          {week.reduce((n, d) => n + d.words, 0).toLocaleString()} words over the last seven days
        </div>
      </div>
    </div>
  );
}
