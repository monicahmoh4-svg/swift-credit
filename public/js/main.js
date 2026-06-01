/* SwiftCredit — main.css FINAL */
:root {
  --g:       #059669;
  --gd:      #047857;
  --gp:      #064E3B;
  --gpale:   #ECFDF5;
  --gmid:    #A7F3D0;
  --amb:     #F59E0B;
  --ambd:    #B45309;
  --ambp:    #FFFBEB;
  --ink:     #0F172A;
  --ink2:    #1E293B;
  --ink3:    #334155;
  --slate:   #475569;
  --muted:   #64748B;
  --muted2:  #94A3B8;
  --bd:      #E2E8F0;
  --surf:    #F8FAFC;
  --surf2:   #F1F5F9;
  --red:     #DC2626;
}

/* ── Reset (safe — no button strip) ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--ink); background: #fff;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  line-height: 1.6;
}
h1, h2, h3 { font-family: 'Syne', sans-serif; line-height: 1.12; }
a { text-decoration: none; color: inherit; }
/* NOTE: no global button reset — buttons keep default so explicit styles work */

/* ── Pages ── */
.page { display: none; min-height: 100vh; }
.page.active { display: block; }

/* ════════════════════════════════
   NAV
════════════════════════════════ */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 48px;
  background: rgba(15,23,42,0.93);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.brand-mark {
  width: 34px; height: 34px; border-radius: 8px;
  background: linear-gradient(135deg, #047857, #059669);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.brand-name {
  font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800;
  color: #fff; letter-spacing: -.3px;
}
.brand-name em { color: #6EE7B7; font-style: normal; }
.nav-links { display: flex; align-items: center; gap: 8px; }
.nav-link {
  padding: 8px 14px; border-radius: 8px;
  color: rgba(255,255,255,.6); font-size: 14px; font-weight: 500;
  transition: color .18s, background .18s;
  text-decoration: none;
}
.nav-link:hover { color: #fff; background: rgba(255,255,255,.08); }
.btn-nav {
  padding: 9px 22px; border-radius: 50px; border: none;
  background: linear-gradient(135deg, #047857, #059669);
  color: #fff; font-size: 14px; font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(5,150,105,.35);
  transition: transform .18s, box-shadow .18s;
}
.btn-nav:hover { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(5,150,105,.45); }

/* ════════════════════════════════
   HERO
════════════════════════════════ */
.hero {
  position: relative; min-height: 100vh;
  display: flex; align-items: center;
  padding-top: 64px; background: var(--ink);
  overflow: hidden;
}
.hero-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; object-position: center;
  opacity: 0.32;
}
.hero-dim {
  position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(
    110deg,
    rgba(15,23,42,0.97) 0%,
    rgba(15,23,42,0.88) 40%,
    rgba(15,23,42,0.55) 70%,
    rgba(15,23,42,0.22) 100%
  );
}
.hero-inner {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: 1fr 400px;
  gap: 52px; align-items: center;
  max-width: 1160px; margin: 0 auto;
  padding: 80px 48px 72px; width: 100%;
}
.hero-tag {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(5,150,105,.13); border: 1px solid rgba(5,150,105,.3);
  border-radius: 50px; padding: 6px 14px;
  color: #6EE7B7; font-size: 12px; font-weight: 600;
  letter-spacing: .5px; text-transform: uppercase;
  margin-bottom: 20px;
}
.tag-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #4ADE80;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
.hero-h1 {
  font-size: clamp(40px, 5.5vw, 66px); font-weight: 800;
  color: #fff; letter-spacing: -2px; line-height: 1.05;
  margin-bottom: 18px;
}
.hero-h1 .accent {
  background: linear-gradient(90deg, #6EE7B7, #34D399);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-desc {
  font-size: 17px; color: rgba(255,255,255,.55);
  max-width: 460px; line-height: 1.75; margin-bottom: 34px; font-weight: 300;
}
.hero-ctas { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 30px; }
.btn-hero-primary {
  display: inline-flex; align-items: center; gap: 10px;
  background: linear-gradient(135deg, #064E3B, #059669);
  color: #fff; border: none; border-radius: 50px;
  padding: 15px 32px; cursor: pointer;
  font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
  box-shadow: 0 6px 22px rgba(5,150,105,.42);
  transition: transform .2s, box-shadow .2s;
}
.btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(5,150,105,.52); }
.btn-hero-secondary {
  display: inline-flex; align-items: center;
  color: rgba(255,255,255,.65); font-size: 14px;
  border: 1px solid rgba(255,255,255,.2); border-radius: 50px;
  padding: 14px 22px; background: rgba(255,255,255,.06);
  text-decoration: none;
  transition: color .18s, border-color .18s, background .18s;
}
.btn-hero-secondary:hover { color: #fff; border-color: rgba(255,255,255,.35); background: rgba(255,255,255,.1); }
.hero-badges { display: flex; gap: 16px; flex-wrap: wrap; }
.hero-badges span { font-size: 12px; color: rgba(255,255,255,.32); font-weight: 500; }

/* Hero card */
.hero-card {
  background: rgba(30,41,59,.92);
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 20px; padding: 24px;
  box-shadow: 0 20px 52px rgba(0,0,0,.38);
}
.hcard-chips { display: flex; gap: 8px; margin-bottom: 16px; }
.hcard-chip {
  font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 50px;
  background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
  color: rgba(255,255,255,.5);
}
.hcard-chip.green { background: rgba(5,150,105,.15); border-color: rgba(5,150,105,.3); color: #6EE7B7; }
.hcard-lbl { font-size: 11px; color: rgba(255,255,255,.32); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
.hcard-amount { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -1px; margin-bottom: 12px; }
.hcard-bar { height: 4px; background: rgba(255,255,255,.09); border-radius: 2px; overflow: hidden; margin-bottom: 16px; }
.hcard-bar-fill { height: 100%; width: 60%; background: linear-gradient(90deg, #059669, #34D399); border-radius: 2px; }
.hcard-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.hcard-stat { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.07); border-radius: 10px; padding: 12px; }
.hcs-v { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #fff; }
.hcs-l { font-size: 11px; color: rgba(255,255,255,.3); margin-top: 3px; }
.btn-hcard {
  width: 100%; padding: 13px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #047857, #059669);
  color: #fff; cursor: pointer;
  font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
  box-shadow: 0 4px 14px rgba(5,150,105,.32);
  transition: transform .18s, box-shadow .18s;
  margin-bottom: 12px;
}
.btn-hcard:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(5,150,105,.42); }
.hcard-note { text-align: center; font-size: 12px; color: rgba(255,255,255,.32); }

/* ════════════════════════════════
   STATS BAR
════════════════════════════════ */
.stats-bar {
  background: #07101F;
  border-top: 1px solid rgba(255,255,255,.05);
  border-bottom: 1px solid rgba(255,255,255,.05);
  display: flex; align-items: center; justify-content: center;
  padding: 28px 48px; flex-wrap: wrap; gap: 0;
}
.stat { text-align: center; padding: 8px 44px; }
.stat-n { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -1px; }
.stat-n strong { color: #6EE7B7; }
.stat-l { font-size: 12px; color: rgba(255,255,255,.32); margin-top: 3px; }
.stat-sep { width: 1px; height: 40px; background: rgba(255,255,255,.07); }

/* ════════════════════════════════
   CONTENT SECTIONS
════════════════════════════════ */
.section { padding: 88px 48px; }
.section-white { background: #fff; }
.section-dark  { background: var(--ink2); }
.section-wrap  { max-width: 1100px; margin: 0 auto; }
.section-eye   { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; color: var(--g); margin-bottom: 10px; }
.section-h     { font-size: clamp(26px, 3.5vw, 42px); font-weight: 800; color: var(--ink); letter-spacing: -1px; margin-bottom: 48px; }

/* Steps */
.steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; position: relative; }
.steps::before {
  content: ''; position: absolute; top: 43px; left: 11%; width: 78%; height: 2px;
  background: linear-gradient(90deg, var(--gmid), rgba(167,243,208,.1));
}
.step { text-align: center; padding: 0 12px; position: relative; z-index: 1; }
.step-icon {
  width: 86px; height: 86px; border-radius: 50%;
  background: #fff; border: 2px solid var(--bd);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px; font-size: 26px;
  box-shadow: 0 2px 12px rgba(0,0,0,.07);
  position: relative;
  transition: border-color .25s, box-shadow .25s, transform .25s;
}
.step:hover .step-icon { border-color: var(--g); box-shadow: 0 6px 20px rgba(5,150,105,.18); transform: translateY(-4px); }
.step-badge {
  position: absolute; top: -5px; right: -5px;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--g); color: #fff;
  font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff;
}
.step-name  { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
.step-text  { font-size: 13px; color: var(--muted); line-height: 1.65; }

/* Features */
.feats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  border: 1px solid rgba(255,255,255,.07); border-radius: 16px; overflow: hidden;
  background: rgba(255,255,255,.03);
}
.feat { padding: 30px 26px; border-right: 1px solid rgba(255,255,255,.05); border-bottom: 1px solid rgba(255,255,255,.05); transition: background .2s; }
.feat:hover { background: rgba(255,255,255,.055); }
.feat-ic   { font-size: 24px; margin-bottom: 12px; }
.feat-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 7px; }
.feat-text { font-size: 13px; color: rgba(255,255,255,.42); line-height: 1.65; }

/* CTA */
.cta-strip {
  padding: 76px 48px; text-align: center;
  background: linear-gradient(135deg, #064E3B, #047857, #059669);
  position: relative; overflow: hidden;
}
.cta-strip::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 70% at 50% 50%, rgba(255,255,255,.04), transparent);
}
.cta-wrap { position: relative; z-index: 1; max-width: 540px; margin: 0 auto; }
.cta-h    { font-size: clamp(24px, 4vw, 42px); font-weight: 800; color: #fff; letter-spacing: -1px; margin-bottom: 12px; }
.cta-p    { font-size: 16px; color: rgba(255,255,255,.68); margin-bottom: 32px; line-height: 1.7; }
.btn-cta  {
  display: inline-flex; align-items: center; gap: 8px;
  background: #fff; color: #064E3B; border: none; border-radius: 50px;
  padding: 15px 36px; cursor: pointer;
  font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
  box-shadow: 0 6px 22px rgba(0,0,0,.2);
  transition: transform .2s, box-shadow .2s;
}
.btn-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,.28); }

/* Footer */
.footer { background: #060A14; border-top: 1px solid rgba(255,255,255,.04); padding: 44px 48px 28px; }
.footer-inner { max-width: 1100px; margin: 0 auto; }
.footer-top {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 20px; margin-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,.05);
}
.footer-links { display: flex; gap: 4px; }
.footer-link { padding: 6px 12px; border-radius: 7px; color: rgba(255,255,255,.3); font-size: 13px; transition: color .18s; text-decoration: none; }
.footer-link:hover { color: rgba(255,255,255,.7); }
.footer-bottom { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,.18); }

/* ════════════════════════════════
   APPLY FLOW LAYOUT
════════════════════════════════ */
.flow-layout {
  display: grid; grid-template-columns: 270px 1fr;
  min-height: 100vh; background: var(--surf);
}

/* Sidebar */
.sidebar {
  background: var(--ink); display: flex; flex-direction: column;
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
}
.sidebar-top {
  padding: 18px 18px 16px;
  border-bottom: 1px solid rgba(255,255,255,.07);
  display: flex; align-items: center; gap: 10px;
}
.back-btn {
  width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1);
  color: rgba(255,255,255,.6); font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background .18s, color .18s;
  font-family: inherit;
}
.back-btn:hover { background: rgba(255,255,255,.14); color: #fff; }

.sidebar-steps { padding: 22px 16px; flex: 1; }
.sb-step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
.sb-left { display: flex; flex-direction: column; align-items: center; }
.sb-circle {
  width: 34px; height: 34px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.14);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
  color: rgba(255,255,255,.22); flex-shrink: 0;
  transition: background .3s, border-color .3s, color .3s;
}
.sb-line { width: 2px; height: 24px; margin: 4px 0; background: rgba(255,255,255,.08); transition: background .3s; }
.sb-info { padding-top: 6px; }
.sb-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,.2); margin-bottom: 2px; }
.sb-name  { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: rgba(255,255,255,.28); transition: color .3s; }

.sb-step.active .sb-circle { border-color: #F59E0B; background: rgba(245,158,11,.15); color: #F59E0B; }
.sb-step.active .sb-name   { color: #fff; }
.sb-step.done   .sb-circle { background: var(--g); border-color: var(--g); color: #fff; }
.sb-step.done   .sb-line   { background: var(--g); }
.sb-step.done   .sb-name   { color: rgba(255,255,255,.55); }

.sidebar-trust {
  margin: 0 12px 16px;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px; padding: 15px;
}
.trust-row { display: flex; align-items: center; gap: 9px; font-size: 12px; color: rgba(255,255,255,.38); margin-bottom: 9px; line-height: 1.4; }
.trust-row:last-child { margin-bottom: 0; }
.trust-ic {
  width: 24px; height: 24px; flex-shrink: 0;
  background: rgba(5,150,105,.12); border-radius: 6px;
  display: flex; align-items: center; justify-content: center; font-size: 12px;
}

/* Main panel */
.flow-main { overflow-y: auto; padding: 44px 56px; background: var(--surf); }
.flow-step { display: none; max-width: 620px; }
.flow-step.active { display: block; }

/* Step header */
.step-head { margin-bottom: 30px; }
.step-crumb {
  display: inline-block;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
  color: var(--g); background: var(--gpale); border: 1px solid var(--gmid);
  border-radius: 50px; padding: 4px 12px; margin-bottom: 11px;
}
.step-title { font-size: clamp(20px, 3vw, 28px); font-weight: 800; color: var(--ink); letter-spacing: -.5px; margin-bottom: 5px; }
.step-sub   { font-size: 14px; color: var(--muted); line-height: 1.6; }

/* ════════════════════════════════
   FORM ELEMENTS
════════════════════════════════ */
.form-sec { margin-bottom: 24px; }
.fsec-title {
  font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 1.8px; color: var(--muted2);
  margin-bottom: 13px; display: flex; align-items: center; gap: 10px;
}
.fsec-title::after { content: ''; flex: 1; height: 1px; background: var(--bd); }
.frow { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.fgroup { margin-bottom: 13px; }

.flabel { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--ink3); margin-bottom: 6px; }
.freq { color: var(--red); font-size: 12px; }
.fopt { color: var(--muted2); font-size: 11px; font-weight: 400; }

.finput, .fselect {
  width: 100%; padding: 11px 14px;
  border: 1.5px solid var(--bd); border-radius: 9px;
  font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink);
  background: #fff; outline: none;
  box-shadow: 0 1px 2px rgba(0,0,0,.05);
  transition: border-color .18s, box-shadow .18s;
  appearance: none;
}
.finput::placeholder { color: var(--muted2); }
.finput:hover, .fselect:hover { border-color: #C5D0DC; }
.finput:focus, .fselect:focus { border-color: var(--g); box-shadow: 0 0 0 3px rgba(5,150,105,.1); }
.finput.err { border-color: var(--red); }
.fselect {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='8'%3E%3Cpath d='M1 1l5.5 5.5L12 1' stroke='%2394A3B8' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 13px center;
  padding-right: 38px;
}

.ph-row { display: flex; }
.ph-pre {
  padding: 11px 12px; background: var(--surf2);
  border: 1.5px solid var(--bd); border-right: none;
  border-radius: 9px 0 0 9px;
  font-size: 13px; font-weight: 600; color: var(--slate);
  white-space: nowrap; display: flex; align-items: center; gap: 5px;
}
.ph-input { border-radius: 0 9px 9px 0 !important; }

.fhint  { font-size: 12px; color: var(--muted2); margin-top: 4px; }
.ferror { font-size: 12px; color: var(--red); margin-top: 4px; font-weight: 500; display: none; }
.ferror.on { display: block; }

.consent-wrap {
  display: flex; gap: 11px; align-items: flex-start;
  background: var(--gpale); border: 1px solid var(--gmid);
  border-radius: 9px; padding: 13px 15px; margin-bottom: 22px;
  font-size: 13px; color: var(--ink3); line-height: 1.6;
}
.consent-cb { accent-color: var(--g); margin-top: 2px; flex-shrink: 0; width: 15px; height: 15px; cursor: pointer; }
.tlink { color: var(--g); font-weight: 600; }
.tlink:hover { text-decoration: underline; }

/* PRIMARY BUTTON — explicit, no inheritance issues */
.btn-primary {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px 22px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #064E3B, #059669);
  color: #fff; cursor: pointer;
  font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
  box-shadow: 0 4px 14px rgba(5,150,105,.28);
  transition: transform .18s, box-shadow .18s;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(5,150,105,.38); }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }

/* ════════════════════════════════
   ELIGIBILITY
════════════════════════════════ */
.ck-body    { padding: 28px 0; }
.ck-spin-r  { display: flex; justify-content: center; margin-bottom: 20px; }
.ring-spin  { width: 50px; height: 50px; border: 3px solid var(--gmid); border-top-color: var(--g); border-radius: 50%; animation: spin .85s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.ck-status  { text-align: center; font-size: 15px; color: var(--muted); font-weight: 500; margin-bottom: 20px; min-height: 22px; }
.ck-list    { list-style: none; max-width: 340px; margin: 0 auto; }
.ck-item    { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 9px; font-size: 14px; color: var(--muted); margin-bottom: 3px; transition: background .25s, color .25s; }
.ck-item.running { background: var(--gpale); color: #064E3B; font-weight: 500; }
.ck-item.done    { color: var(--ink3); }
.ck-dot {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid var(--bd); display: flex; align-items: center; justify-content: center; font-size: 11px;
  transition: background .25s, border-color .25s;
}
.ck-item.running .ck-dot { border-color: var(--g); border-top-color: transparent; animation: spin .7s linear infinite; }
.ck-item.done    .ck-dot { background: var(--g); border-color: var(--g); color: #fff; }

.res-card { background: #fff; border: 1.5px solid var(--bd); border-radius: 15px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,.07); }
.res-head { padding: 20px 22px; display: flex; gap: 14px; align-items: center; }
.res-head.ok   { background: linear-gradient(135deg, #ECFDF5, #D1FAE5); }
.res-head.fail { background: linear-gradient(135deg, #FEF2F2, #FEE2E2); }
.res-ico  { font-size: 32px; }
.res-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; }
.res-title.ok   { color: #064E3B; }
.res-title.fail { color: #991B1B; }
.res-sub  { font-size: 13px; color: var(--muted); margin-top: 3px; }
.res-metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--bd); }
.res-metric  { background: #fff; padding: 16px 20px; text-align: center; }
.rm-v { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--g); }
.rm-l { font-size: 11px; color: var(--muted); margin-top: 3px; text-transform: uppercase; letter-spacing: .5px; }

.note-amber { background: var(--ambp); border: 1px solid #FDE68A; border-radius: 9px; padding: 11px 14px; font-size: 13px; color: #78350F; line-height: 1.55; margin-bottom: 16px; }
.note-blue  { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 9px; padding: 11px 14px; font-size: 13px; color: #1E3A8A; line-height: 1.55; margin-bottom: 16px; }

/* ════════════════════════════════
   LOAN SELECTOR
════════════════════════════════ */
.amount-card {
  background: linear-gradient(155deg, #0F172A, #1E293B);
  border-radius: 16px; padding: 26px; margin-bottom: 20px;
  position: relative; overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,.18);
}
.amount-card::before {
  content: ''; position: absolute; top: -50px; right: -50px;
  width: 160px; height: 160px; border-radius: 50%;
  background: radial-gradient(circle, rgba(5,150,105,.1), transparent 70%);
}
.ac-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,.32); margin-bottom: 7px; position: relative; }
.ac-val {
  font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 900;
  color: #fff; letter-spacing: -3px; line-height: 1; margin-bottom: 20px; position: relative;
}
.ac-kes { font-size: 20px; font-weight: 600; letter-spacing: 0; color: rgba(255,255,255,.5); margin-right: 3px; vertical-align: super; }
.loan-range {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 5px;
  background: rgba(255,255,255,.12); border-radius: 3px; outline: none;
}
.loan-range::-webkit-slider-thumb {
  -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
  background: #fff; cursor: pointer; border: 3px solid var(--g);
  box-shadow: 0 2px 8px rgba(0,0,0,.25); transition: transform .15s;
}
.loan-range::-webkit-slider-thumb:hover { transform: scale(1.12); }
.loan-range::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: #fff; cursor: pointer; border: 3px solid var(--g); }
.ac-range-lbls { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,.28); margin-top: 7px; }

.grid-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted2); margin-bottom: 9px; }
.quick-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 7px; margin-bottom: 18px; }
.qbtn {
  padding: 11px 6px; border: 1.5px solid var(--bd); border-radius: 9px;
  background: #fff; text-align: center; font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 600; color: var(--ink3); cursor: pointer;
  transition: border-color .18s, color .18s, background .18s;
}
.qbtn:hover  { border-color: var(--g); color: var(--g); }
.qbtn.on     { border-color: var(--g); background: var(--g); color: #fff; }

.tenor-row  { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 20px; }
.tbtn {
  padding: 9px 16px; border: 1.5px solid var(--bd); border-radius: 50px;
  background: #fff; font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 500; color: var(--slate); cursor: pointer;
  transition: border-color .18s, color .18s, background .18s;
}
.tbtn:hover { border-color: var(--g); color: var(--g); }
.tbtn.on    { border-color: var(--g); background: var(--g); color: #fff; font-weight: 600; }

.sum-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 16px; }
.sum-box  { background: #fff; border: 1.5px solid var(--bd); border-radius: 9px; padding: 14px 16px; }
.sum-box.amber { border-color: var(--amb); background: var(--ambp); }
.sum-lbl  { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .6px; color: var(--muted2); margin-bottom: 5px; }
.sum-lbl small { font-size: 10px; font-weight: 400; opacity: .7; }
.sum-val  { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800; color: var(--ink); }
.sum-box.amber .sum-val { color: var(--ambd); }

.fee-box  { display: flex; align-items: stretch; background: #fff; border: 1.5px solid var(--bd); border-radius: 9px; overflow: hidden; margin-bottom: 14px; }
.fee-box-body { padding: 14px 16px; flex: 1; }
.fee-box-title{ font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--ink3); margin-bottom: 4px; }
.fee-box-text { font-size: 12px; color: var(--muted); line-height: 1.55; }
.fee-box-aside{ background: var(--ambp); border-left: 1.5px solid #FDE68A; padding: 14px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 96px; text-align: center; }
.fba-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .9px; color: var(--ambd); margin-bottom: 4px; }
.fba-val { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 900; color: var(--ambd); }

/* ════════════════════════════════
   MPESA PAYMENT
════════════════════════════════ */
.mp-card { background: #fff; border: 1.5px solid var(--bd); border-radius: 16px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,.07); }
.mp-top  { background: linear-gradient(135deg, #004d24, #00A651); padding: 18px 22px; display: flex; align-items: center; gap: 14px; }
.mp-logo { background: #fff; border-radius: 7px; padding: 4px 12px; font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 900; color: #00A651; letter-spacing: 1px; }
.mp-tag     { font-size: 14px; font-weight: 600; color: #fff; }
.mp-tag-sub { font-size: 12px; color: rgba(255,255,255,.55); margin-top: 2px; }
.mp-body    { padding: 22px; }

.fee-tbl { background: var(--surf); border: 1px solid var(--bd); border-radius: 9px; overflow: hidden; margin-bottom: 18px; }
.fee-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 14px; color: var(--slate); border-bottom: 1px solid var(--bd); }
.fee-row:last-child { border: none; }
.fee-row.total { background: #fff; font-weight: 700; font-size: 15px; color: var(--ink); }
.fee-v { font-weight: 600; color: var(--ink); }
.fee-total-v { color: var(--g); font-family: 'Syne', sans-serif; font-size: 16px; }

.mp-secure { display: flex; align-items: flex-start; gap: 9px; background: var(--gpale); border: 1px solid var(--gmid); border-radius: 9px; padding: 11px 14px; font-size: 13px; color: #064E3B; margin-bottom: 16px; line-height: 1.55; }

/* MPESA BUTTON — explicit */
.btn-mpesa {
  width: 100%; padding: 15px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #003d1f, #00A651);
  color: #fff; cursor: pointer;
  font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  box-shadow: 0 4px 16px rgba(0,120,50,.3);
  transition: transform .18s, box-shadow .18s;
}
.btn-mpesa:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,120,50,.4); }
.btn-mpesa:disabled { opacity: .55; cursor: not-allowed; transform: none; }

.stk-card { text-align: center; padding: 40px 22px; background: #fff; border: 1.5px solid var(--bd); border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,.07); }
.stk-ph { font-size: 50px; display: inline-block; margin-bottom: 16px; }
.stk-title { font-family: 'Syne', sans-serif; font-size: 21px; font-weight: 800; color: var(--ink); margin-bottom: 9px; }
.stk-desc { font-size: 14px; color: var(--muted); line-height: 1.65; margin-bottom: 20px; max-width: 340px; margin-left: auto; margin-right: auto; }
.stk-dots { display: flex; justify-content: center; gap: 7px; margin-bottom: 13px; }
.stk-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--g); animation: dp 1.1s ease-in-out infinite; }
.stk-dots span:nth-child(2) { animation-delay: .14s; }
.stk-dots span:nth-child(3) { animation-delay: .28s; }
.stk-dots span:nth-child(4) { animation-delay: .42s; }
@keyframes dp { 0%, 100% { opacity: .15; transform: scale(.8); } 50% { opacity: 1; transform: scale(1); } }
.stk-timer { font-size: 13px; color: var(--muted2); margin-bottom: 16px; }
.stk-timer strong { color: var(--ink3); }
.btn-outline {
  background: #fff; border: 1.5px solid var(--bd); border-radius: 50px;
  padding: 9px 20px; font-size: 13px; font-weight: 600; color: var(--slate);
  cursor: pointer; font-family: inherit;
  transition: border-color .18s, color .18s;
}
.btn-outline:hover { border-color: var(--g); color: var(--g); }
.confirmed-ico { width: 80px; height: 80px; border-radius: 50%; background: var(--gpale); border: 3px solid var(--gmid); display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 16px; animation: popIn .45s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* ════════════════════════════════
   SUCCESS
════════════════════════════════ */
.success-wrap { min-height: 100vh; background: linear-gradient(160deg, #0F172A 0%, #064E3B 100%); display: flex; align-items: center; justify-content: center; padding: 36px 20px; }
.success-card { background: #fff; border-radius: 22px; padding: 46px 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 22px 56px rgba(0,0,0,.3); position: relative; overflow: hidden; }
.success-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #059669, #34D399, #F59E0B); }
.succ-emoji { font-size: 46px; margin-bottom: 14px; animation: popIn .6s cubic-bezier(0.34,1.56,0.64,1) .1s both; }
.succ-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 900; color: var(--ink); letter-spacing: -.5px; margin-bottom: 9px; }
.succ-desc  { font-size: 14px; color: var(--muted); margin-bottom: 22px; line-height: 1.65; }
.ref-box { background: var(--surf); border: 1.5px solid var(--bd); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; }
.ref-lbl  { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted2); margin-bottom: 5px; }
.ref-code { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 900; color: var(--g); letter-spacing: 3px; }
.succ-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 22px; text-align: left; }
.succ-item { background: var(--surf); border: 1px solid var(--bd); border-radius: 9px; padding: 12px 14px; }
.succ-lbl  { font-size: 11px; color: var(--muted2); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
.succ-val  { font-size: 14px; font-weight: 700; color: var(--ink); }

/* ════════════════════════════════
   TOAST
════════════════════════════════ */
.toast {
  position: fixed; bottom: 22px; right: 22px; z-index: 9999;
  background: var(--ink2); color: #fff;
  padding: 12px 18px; border-radius: 12px; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; gap: 10px;
  transform: translateY(120px); opacity: 0;
  transition: transform .3s ease, opacity .3s ease;
  box-shadow: 0 10px 30px rgba(0,0,0,.25); max-width: 340px;
  border: 1px solid rgba(255,255,255,.07);
}
.toast.on  { transform: translateY(0); opacity: 1; }
.toast.ok  { background: #064E3B; }
.toast.err { background: #991B1B; }

/* ════════════════════════════════
   RESPONSIVE
════════════════════════════════ */
@media (max-width: 1060px) {
  .nav { padding: 0 26px; }
  .hero-inner { grid-template-columns: 1fr; padding: 72px 26px 56px; }
  .hero-card { display: none; }
  .stats-bar { padding: 24px 26px; }
  .stat { padding: 6px 26px; }
  .section { padding: 68px 26px; }
  .cta-strip, .footer { padding-left: 26px; padding-right: 26px; }
  .flow-layout { grid-template-columns: 240px 1fr; }
  .flow-main { padding: 34px 36px; }
  .steps { grid-template-columns: repeat(2,1fr); }
  .steps::before { display: none; }
  .feats { grid-template-columns: repeat(2,1fr); }
}
@media (max-width: 768px) {
  .nav-link { display: none; }
  .stats-bar { flex-wrap: wrap; gap: 14px; padding: 20px 18px; }
  .stat-sep { display: none; }
  .stat { padding: 4px; flex: 1 1 40%; }
  .steps { grid-template-columns: 1fr; }
  .feats { grid-template-columns: 1fr; }
  .footer-top { flex-direction: column; gap: 14px; }
  .footer-bottom { flex-direction: column; gap: 6px; text-align: center; }
  .flow-layout { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .flow-main { padding: 20px 16px; }
  .frow { grid-template-columns: 1fr; }
  .sum-grid { grid-template-columns: 1fr; }
  .res-metrics { grid-template-columns: 1fr; }
  .succ-grid { grid-template-columns: 1fr; }
  .success-card { padding: 32px 18px; }
  .section { padding: 50px 18px; }
  .cta-strip { padding: 58px 18px; }
  .hero-inner { padding: 72px 18px 52px; }
}
