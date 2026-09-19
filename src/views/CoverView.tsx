import { useEffect, useRef } from 'react';

const PHRASES = [
  'The first draft of anything is just you',
  'Write the sentence you are afraid of',
  'Nobody ever regretted the quiet hour',
  'Notice the thing. Then say it plainly',
];

type Props = { onSignIn: () => void; onGetStarted: () => void };

/**
 * Landing page. Markup carried over from the original prototype;
 * the typewriter text cycles on a timer instead of a global setInterval.
 */
export default function CoverView({ onSignIn, onGetStarted }: Props) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let phrase = 0;
    let char = PHRASES[0].length;
    let deleting = true;
    let timer: number;

    const tick = () => {
      const full = PHRASES[phrase];
      if (deleting) {
        char -= 1;
        if (char <= 0) { deleting = false; phrase = (phrase + 1) % PHRASES.length; }
      } else {
        char += 1;
        if (char >= full.length) { deleting = true; timer = window.setTimeout(tick, 2400); return; }
      }
      if (textRef.current) textRef.current.textContent = PHRASES[phrase].slice(0, Math.max(0, char));
      timer = window.setTimeout(tick, deleting ? 28 : 58);
    };

    timer = window.setTimeout(tick, 2400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="view active" id="view-cover" style={{ display: 'flex' }}>
        {/* Gradient blobs */}
        <div className="cover-grad-1"></div>
        <div className="cover-grad-2"></div>
        <div className="cover-grad-3"></div>

        {/* Nav */}
        <nav className="cover-nav">
          <div className="cover-nav-logo">
            <svg width={30} height={30} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: "0" }}>
              <rect width={32} height={32} rx="8" fill="var(--ink)" />
              <path d="M16 6 L24 14 L16 26 L8 14 Z" fill="none" stroke="var(--amber)" strokeWidth="1.4" strokeLinejoin="round" />
              <line x1="16" y1="14" x2="16" y2="26" stroke="var(--amber)" strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
              <circle cx="16" cy="13" r="2.5" fill="var(--amber)" />
            </svg>
            <span className="logo-text">TH<span className="logo-dash">-</span>INK</span>
          </div>
          <div className="cover-nav-links">
            <span className="cover-nav-link" onClick={onSignIn}>Sign in</span>
            <span className="cover-nav-link" onClick={onGetStarted}>Get started</span>
          </div>
        </nav>

        {/* Two-column grid */}
        <div className="cover-content">

          {/* LEFT: copy */}
          <div className="cover-copy">
            <div className="cover-kicker">— a space for writers</div>
            <h1 className="cover-headline">Think deeply.<br /><em>Write honestly.</em></h1>
            <p className="cover-subhead">TH-INK is a quiet place on the internet for people who believe writing is still one of the most human things we do.</p>
            <div className="cover-cta-row">
              <button className="btn-cover-primary" onClick={onGetStarted}>Start writing free</button>
              <button className="btn-cover-secondary" onClick={onSignIn}>Sign in</button>
            </div>
            <div className="cover-proof">
              <div className="proof-avatars">
                <div className="proof-av" style={{ background: "#d4e8d0", color: "#3a7a50" }}>SC</div>
                <div className="proof-av" style={{ background: "#dde8f5", color: "#2860a0" }}>MR</div>
                <div className="proof-av" style={{ background: "#f5e8d8", color: "#a06020" }}>AP</div>
                <div className="proof-av" style={{ background: "#ecddf5", color: "#7040a0" }}>LT</div>
              </div>
              <span className="proof-text">Joined by <strong>2,400+</strong> writers this month</span>
            </div>
          </div>

          {/* RIGHT: typewriter + stats */}
          <div className="cover-visual">
            <div className="typewriter-wrap">
              <svg className="tw-machine" width={460} height={350} viewBox="0 0 340 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="170" cy="248" rx="120" ry="8" fill="rgba(14,11,9,0.07)" />
                <rect x="30" y="150" width={280} height={88} rx="10" fill="#2a2218" />
                <rect x="30" y="150" width={280} height={88} rx="10" fill="url(#bodyGrad2)" />
                <rect x="30" y="150" width={280} height={12} rx="10" fill="rgba(255,255,255,0.05)" />
                <rect x="38" y="172" width={18} height={2} rx="1" fill="rgba(255,255,255,0.06)" />
                <rect x="38" y="177" width={18} height={2} rx="1" fill="rgba(255,255,255,0.06)" />
                <rect x="38" y="182" width={18} height={2} rx="1" fill="rgba(255,255,255,0.06)" />
                <rect x="284" y="172" width={18} height={2} rx="1" fill="rgba(255,255,255,0.06)" />
                <rect x="284" y="177" width={18} height={2} rx="1" fill="rgba(255,255,255,0.06)" />
                <rect x="284" y="182" width={18} height={2} rx="1" fill="rgba(255,255,255,0.06)" />
                <g className="tw-key-1">
                  <rect x="56" y="198" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="76" y="198" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="96" y="198" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="116" y="198" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="136" y="198" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="156" y="198" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="176" y="198" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="196" y="198" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="216" y="198" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="236" y="198" width={16} height={12} rx="2.5" fill="#c8620a" opacity="0.8" />
                </g>
                <g className="tw-key-2">
                  <rect x="64" y="214" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="84" y="214" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="104" y="214" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="124" y="214" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="144" y="214" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="164" y="214" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="184" y="214" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="204" y="214" width={16} height={12} rx="2.5" fill="#3d3228" />
                  <rect x="224" y="214" width={16} height={12} rx="2.5" fill="#c8620a" opacity="0.8" />
                </g>
                <g className="tw-key-3">
                  <rect x="56" y="230" width={16} height={10} rx="2.5" fill="#3d3228" />
                  <rect x="76" y="230" width={16} height={10} rx="2.5" fill="#3d3228" />
                  <rect x="100" y="230" width={96} height={10} rx="2.5" fill="#3d3228" />
                  <rect x="202" y="230" width={16} height={10} rx="2.5" fill="#3d3228" />
                  <rect x="222" y="230" width={16} height={10} rx="2.5" fill="#3d3228" />
                  <rect x="248" y="230" width={16} height={10} rx="2.5" fill="#c8620a" opacity="0.65" />
                </g>
                <rect x="32" y="128" width={276} height={8} rx="4" fill="#1a1410" />
                <rect x="32" y="128" width={276} height={4} rx="4" fill="rgba(255,255,255,0.05)" />
                <g className="tw-carriage">
                  <rect x="60" y="108" width={180} height={30} rx="5" fill="#342b1e" />
                  <rect x="60" y="108" width={180} height={10} rx="5" fill="rgba(255,255,255,0.04)" />
                  <rect x="68" y="112" width={164} height={3} rx="1.5" fill="rgba(0,0,0,0.25)" />
                  <g className="tw-paper">
                    <rect x="104" y="22" width={92} height={98} rx="2" fill="#fef8f0" />
                    <rect x="104" y="22" width={92} height={98} rx="2" fill="none" stroke="rgba(200,160,100,0.2)" strokeWidth="0.5" />
                    <line x1="112" y1="42" x2="188" y2="42" stroke="rgba(200,160,100,0.28)" strokeWidth="0.75" />
                    <line x1="112" y1="52" x2="188" y2="52" stroke="rgba(200,160,100,0.28)" strokeWidth="0.75" />
                    <line x1="112" y1="62" x2="188" y2="62" stroke="rgba(200,160,100,0.28)" strokeWidth="0.75" />
                    <line x1="112" y1="72" x2="188" y2="72" stroke="rgba(200,160,100,0.28)" strokeWidth="0.75" />
                    <line x1="112" y1="82" x2="188" y2="82" stroke="rgba(200,160,100,0.28)" strokeWidth="0.75" />
                    <rect x="114" y="39" width={50} height={2} rx="1" fill="rgba(14,11,9,0.45)" />
                    <rect x="114" y="49" width={64} height={2} rx="1" fill="rgba(14,11,9,0.45)" />
                    <rect x="114" y="59" width={44} height={2} rx="1" fill="rgba(14,11,9,0.45)" />
                    <rect x="114" y="69" width={58} height={2} rx="1" fill="rgba(14,11,9,0.45)" />
                    <rect x="114" y="79" width={28} height={2} rx="1" fill="rgba(200,98,10,0.65)" />
                  </g>
                  <circle cx="66" cy="123" r="6" fill="#1a1410" />
                  <circle cx="66" cy="123" r="3.5" fill="#2a2218" />
                  <circle cx="234" cy="123" r="6" fill="#1a1410" />
                  <circle cx="234" cy="123" r="3.5" fill="#2a2218" />
                  <rect x="70" y="118" width={160} height={12} rx="6" fill="#1e1810" />
                  <rect x="70" y="118" width={160} height={5} rx="6" fill="rgba(255,255,255,0.035)" />
                  <g className="tw-key-4">
                    <line x1="150" y1="138" x2="150" y2="108" stroke="#c8620a" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
                    <rect x="145" y="104" width={10} height={6} rx="1.5" fill="#c8620a" opacity="0.85" />
                  </g>
                </g>
                <circle cx="170" cy="105" r="4.5" fill="#c8620a" opacity="0.35" />
                <circle cx="170" cy="105" r="2" fill="#c8620a" opacity="0.6" />
                <circle cx="90" cy="142" r="7" fill="#1a1410" />
                <circle cx="90" cy="142" r="4" fill="#342b1e" />
                <circle cx="90" cy="142" r="1.5" fill="#1a1410" />
                <circle cx="250" cy="142" r="7" fill="#1a1410" />
                <circle cx="250" cy="142" r="4" fill="#342b1e" />
                <circle cx="250" cy="142" r="1.5" fill="#1a1410" />
                <path d="M97 142 Q170 138 243 142" stroke="#1a0810" strokeWidth="2" fill="none" opacity="0.7" />
                <defs>
                  <linearGradient id="bodyGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="tw-typed-text" id="twText" ref={textRef}>The first draft of anything is just you</div>
            </div>

            <div className="cover-stats">
              <div className="stat-card">
                <div className="stat-card-label">Today's streak</div>
                <div className="stat-card-value">12 days ✦</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Words written</div>
                <div className="stat-card-value">1,842</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Reading now</div>
                <div className="stat-card-value">47 writers</div>
              </div>
            </div>
          </div>

        </div>

        {/* Features strip */}
        <div className="cover-features">
          <div className="cf-item">
            <div className="cf-icon"><svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="5" cy="5" r="2.5" /><circle cx="9" cy="5" r="2.5" /><path d="M1 11c0-1.8 1.6-3 3.5-3s3.5 1.2 3.5 3" /><path d="M8.5 8.5c1 .5 1.5 1.3 1.5 2.5" /></svg></div>
            <div className="cf-text"><strong>Reading Rooms</strong>Read together, live</div>
          </div>
          <div className="cf-item">
            <div className="cf-icon"><svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M4 2c0 3 5 3 5 6.5s-5 3-5 6.5" /><path d="M9 2c0 3-5 3-5 6.5s5 3 5 6.5" /><path d="M2 5h9M2 8h9" /></svg></div>
            <div className="cf-text"><strong>Writing DNA</strong>Your literary fingerprint</div>
          </div>
          <div className="cf-item">
            <div className="cf-icon"><svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="5" /><path d="M6.5 3v3.5l2 2" /></svg></div>
            <div className="cf-text"><strong>Time Capsule</strong>Letters to the future</div>
          </div>
          <div className="cf-item">
            <div className="cf-icon"><svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1 10l2.5-3.5 2.5 2 2.5-5 2.5 2.5" /><rect x=".5" y=".5" width={12} height={12} rx="1.5" /></svg></div>
            <div className="cf-text"><strong>Craft Insights</strong>Know how you write</div>
          </div>
        </div>


    </div>
  );
}
