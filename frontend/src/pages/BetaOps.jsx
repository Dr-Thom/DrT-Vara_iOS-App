import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Rocket, Bug, MessageSquare, CheckCircle2, Circle, Download,
  AlertTriangle, Shield, ChevronDown, ChevronUp, Mail, Smartphone,
  ClipboardList, HelpCircle, Award, Play, BookOpen
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const PLAY_STORE_URL = process.env.REACT_APP_PLAY_STORE_URL || '#';
const BETA_GUIDE_URL = process.env.REACT_APP_BETA_GUIDE_URL || '#';
const FEEDBACK_FORM_URL = process.env.REACT_APP_FEEDBACK_FORM_URL || '#';

const BRAND = {
  deepBlue: '#0B2A5B',
  royal: '#1E4FBF',
  navy: '#082047',
  light: '#F5F7FB',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#475569',
};

const CHECKLIST_KEY = 'samson_beta_checklist_v1';
const CHECKLIST_ITEMS = [
  { id: 'login', label: 'Log in to SAMSON' },
  { id: 'task', label: 'Complete a task' },
  { id: 'ad', label: 'Watch a rewarded ad' },
  { id: 'offers', label: 'Open the Offers screen' },
  { id: 'dashboard', label: 'Check your Dashboard' },
  { id: 'report', label: 'Report any problems' },
];

const INSTRUCTIONS = [
  'Install SAMSON from Google Play Closed Testing',
  'Create an account or log in',
  'Complete at least one task daily',
  'Watch a rewarded ad',
  'Open Offers & Surveys',
  'Report bugs or suggestions here',
];

const KNOWN_ISSUES = [
  'Tasks may take a few seconds to refresh',
  'Offer availability varies by country',
  'Rewards may require verification',
  'Beta features may change before public launch',
];

const FAQ_ITEMS = [
  {
    q: 'How do I install SAMSON?',
    a: 'You will receive a Google Play Closed Testing link. Open it on your Android device, tap "Become a tester", then install from the Play Store like any regular app.',
  },
  {
    q: 'How do I qualify for the $100 bonus?',
    a: 'Actively participate throughout the full 14-day Closed Beta, complete the assigned testing activities, and submit meaningful feedback (bugs and suggestions). Bonus is subject to verification and beta guidelines compliance.',
  },
  {
    q: 'Why did my reward not appear immediately?',
    a: 'Some rewards (offerwall payouts, referral bonuses) run through third-party verification and can take a few minutes to a few hours. If a reward is missing after 24 hours, report it via the Bug Report form.',
  },
  {
    q: 'How do I report a bug?',
    a: 'Use the Bug Report form on this page. Include your device model, Android version, which screen you were on, and what happened. A screenshot or screen-recording link (Google Drive, Imgur, Dropbox) helps us fix it faster.',
  },
  {
    q: 'What countries are included in this beta?',
    a: 'Nigeria and the Philippines are the two focus regions for this Closed Beta. Testers from other countries may see reduced offer availability.',
  },
  {
    q: 'What happens after the 14-day test?',
    a: 'We review all feedback, ship fixes, verify participation, and prepare for the public launch. Qualifying testers receive their $100 SAMSON Launch Bonus after verification.',
  },
];

// ---------- Reusable atoms ---------------------------------------------------
const Section = ({ id, title, icon: Icon, children, subtitle }) => (
  <section id={id} className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
    <div className="mb-8 sm:mb-10">
      <div className="flex items-center gap-3 mb-3">
        {Icon && (
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ backgroundColor: BRAND.deepBlue, color: 'white' }}
          >
            <Icon size={20} />
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: BRAND.navy }}>
          {title}
        </h2>
      </div>
      {subtitle && <p className="text-base sm:text-lg" style={{ color: BRAND.muted }}>{subtitle}</p>}
    </div>
    {children}
  </section>
);

const Card = ({ children, className = '' }) => (
  <div
    className={`rounded-xl bg-white shadow-sm ${className}`}
    style={{ border: `1px solid ${BRAND.border}` }}
  >
    {children}
  </div>
);

const Badge = ({ children, color = BRAND.green, bg = BRAND.greenLight }) => (
  <span
    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
    style={{ color, backgroundColor: bg }}
  >
    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    {children}
  </span>
);

const PrimaryButton = ({ children, onClick, href, testId, icon: Icon }) => {
  const Cmp = href ? 'a' : 'button';
  const props = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : { onClick, type: 'button' };
  return (
    <Cmp
      {...props}
      data-testid={testId}
      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
      style={{ backgroundColor: BRAND.deepBlue }}
    >
      {Icon && <Icon size={18} />}
      {children}
    </Cmp>
  );
};

const SecondaryButton = ({ children, onClick, href, testId, icon: Icon }) => {
  const Cmp = href ? 'a' : 'button';
  const props = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : { onClick, type: 'button' };
  return (
    <Cmp
      {...props}
      data-testid={testId}
      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all hover:bg-slate-50 active:scale-[0.98]"
      style={{ color: BRAND.deepBlue, backgroundColor: 'white', border: `1.5px solid ${BRAND.deepBlue}` }}
    >
      {Icon && <Icon size={18} />}
      {children}
    </Cmp>
  );
};

const Field = ({ label, name, type = 'text', value, onChange, placeholder, required, testId, textarea, rows = 4, options }) => (
  <label className="flex flex-col gap-1.5" data-testid={`field-${testId || name}`}>
    <span className="text-sm font-medium" style={{ color: BRAND.text }}>
      {label} {required && <span style={{ color: BRAND.green }}>*</span>}
    </span>
    {textarea ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        data-testid={`input-${testId || name}`}
        className="rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-500"
        style={{ border: `1px solid ${BRAND.border}`, backgroundColor: 'white' }}
      />
    ) : options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        data-testid={`input-${testId || name}`}
        className="rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 bg-white"
        style={{ border: `1px solid ${BRAND.border}` }}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        data-testid={`input-${testId || name}`}
        className="rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-500"
        style={{ border: `1px solid ${BRAND.border}`, backgroundColor: 'white' }}
      />
    )}
  </label>
);

// ---------- Sections --------------------------------------------------------
const Hero = () => (
  <header
    className="relative overflow-hidden"
    style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.deepBlue} 60%, ${BRAND.royal} 100%)` }}
  >
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="flex items-center gap-2 mb-6">
        <Badge>Closed Beta Active</Badge>
        <span className="text-xs sm:text-sm font-medium" style={{ color: '#CBD5E1' }}>
          14-Day Beta Program
        </span>
      </div>

      <h1
        className="font-bold tracking-tight mb-4"
        style={{ color: 'white', fontSize: 'clamp(2rem, 6vw, 3.75rem)', lineHeight: 1.1 }}
        data-testid="hero-title"
      >
        SAMSON Closed Beta
      </h1>

      <p className="text-base sm:text-xl mb-8 max-w-2xl" style={{ color: '#DBEAFE' }}>
        Help us test SAMSON before public launch. Your feedback shapes what millions of earners across Nigeria and the Philippines get on day one.
      </p>

      <div className="flex flex-wrap gap-3 mb-10">
        <PrimaryButton href={PLAY_STORE_URL} icon={Play} testId="btn-install-samson">
          Install SAMSON
        </PrimaryButton>
        <SecondaryButton href={BETA_GUIDE_URL} icon={BookOpen} testId="btn-beta-guide">
          Read Beta Guide
        </SecondaryButton>
        <SecondaryButton href="#bug-report" icon={Bug} testId="btn-report-bug">
          Report a Bug
        </SecondaryButton>
      </div>

      <div className="flex flex-wrap gap-6 sm:gap-10 text-sm sm:text-base" style={{ color: '#BFDBFE' }}>
        <div>
          <div className="text-xs uppercase tracking-widest opacity-70">Version</div>
          <div className="font-semibold text-white" data-testid="hero-version">1.0.13</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest opacity-70">Build</div>
          <div className="font-semibold text-white" data-testid="hero-build">19</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest opacity-70">Status</div>
          <div className="font-semibold text-white flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: BRAND.green }} />
            Closed Beta Active
          </div>
        </div>
      </div>
    </div>
  </header>
);

const Instructions = () => (
  <Section id="instructions" title="Beta Instructions" icon={ClipboardList}
    subtitle="Follow these steps to get started. It takes about 3 minutes.">
    <Card className="p-2 sm:p-4">
      <ol className="divide-y" style={{ borderColor: BRAND.border }}>
        {INSTRUCTIONS.map((step, i) => (
          <li key={i} className="flex items-start gap-4 p-4 sm:p-5">
            <span
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
              style={{ backgroundColor: BRAND.deepBlue }}
            >
              {i + 1}
            </span>
            <span className="pt-1 text-sm sm:text-base" style={{ color: BRAND.text }}>{step}</span>
          </li>
        ))}
      </ol>
    </Card>
  </Section>
);

const DailyChecklist = () => {
  const [checked, setChecked] = useState({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}');
      // Reset if a new UTC day
      const today = new Date().toISOString().slice(0, 10);
      if (saved.date !== today) {
        setChecked({});
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify({ date: today, items: {} }));
      } else {
        setChecked(saved.items || {});
      }
    } catch (e) {
      setChecked({});
    }
  }, []);

  const toggle = (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify({ date: today, items: next }));
  };

  const doneCount = CHECKLIST_ITEMS.filter((i) => checked[i.id]).length;
  const pct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <Section id="checklist" title="Daily Checklist" icon={CheckCircle2}
      subtitle="Complete these every day to qualify for the Launch Bonus. Resets at UTC midnight.">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium" style={{ color: BRAND.muted }}>
            {doneCount} / {CHECKLIST_ITEMS.length} completed today
          </span>
          <span className="text-sm font-bold" style={{ color: BRAND.green }}>{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full mb-6" style={{ backgroundColor: BRAND.border }}>
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: BRAND.green }}
            data-testid="checklist-progress"
          />
        </div>
        <ul className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                data-testid={`checklist-item-${item.id}`}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-slate-50"
                style={{ border: `1px solid ${BRAND.border}` }}
              >
                {checked[item.id] ? (
                  <CheckCircle2 size={22} style={{ color: BRAND.green }} className="flex-shrink-0" />
                ) : (
                  <Circle size={22} style={{ color: BRAND.border }} className="flex-shrink-0" />
                )}
                <span
                  className="text-sm sm:text-base font-medium"
                  style={{
                    color: checked[item.id] ? BRAND.muted : BRAND.text,
                    textDecoration: checked[item.id] ? 'line-through' : 'none',
                  }}
                >
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  );
};

const BugReportForm = () => {
  const initial = {
    name: '', email: '', device_model: '', android_version: '',
    app_screen: '', severity: '', what_happened: '', screenshot_link: '',
  };
  const [f, setF] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.severity) {
      toast.error('Please select a severity');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/beta/bug-reports`, f);
      toast.success('Bug report submitted. Thank you for helping us fix it!');
      setF(initial);
    } catch (err) {
      toast.error(err?.response?.data?.detail?.[0]?.msg || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section id="bug-report" title="Bug Report" icon={Bug}
      subtitle="Found something broken? Tell us. Every bug you report gets us closer to launch.">
      <Card className="p-5 sm:p-8">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" data-testid="bug-report-form">
          <Field label="Your name" name="name" value={f.name} onChange={onChange} placeholder="Juan Dela Cruz" required />
          <Field label="Email" name="email" type="email" value={f.email} onChange={onChange} placeholder="you@email.com" required />
          <Field label="Device model" name="device_model" value={f.device_model} onChange={onChange} placeholder="Samsung Galaxy A15" required />
          <Field label="Android version" name="android_version" value={f.android_version} onChange={onChange} placeholder="14" required />
          <Field label="App screen" name="app_screen" value={f.app_screen} onChange={onChange} placeholder="Tasks, Offers, Dashboard…" required />
          <Field label="Severity" name="severity" value={f.severity} onChange={onChange} required
            options={['Critical', 'Major', 'Minor']} />
          <div className="sm:col-span-2">
            <Field label="What happened?" name="what_happened" value={f.what_happened} onChange={onChange} textarea rows={5}
              placeholder="Describe what you did, what you expected, and what actually happened." required />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Screenshot or video link (optional)"
              name="screenshot_link"
              value={f.screenshot_link}
              onChange={onChange}
              placeholder="Paste a Google Drive, Imgur, Dropbox, or screen recording link here."
            />
          </div>
          <div className="sm:col-span-2 flex justify-end pt-2">
            <PrimaryButton onClick={submit} testId="btn-submit-bug" icon={Bug}>
              {submitting ? 'Submitting…' : 'Submit Bug Report'}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </Section>
  );
};

const SuggestionForm = () => {
  const initial = { name: '', email: '', category: '', details: '' };
  const [f, setF] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/beta/suggestions`, f);
      toast.success('Suggestion sent. We read every one.');
      setF(initial);
    } catch (err) {
      toast.error(err?.response?.data?.detail?.[0]?.msg || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section id="suggestion" title="Suggestion" icon={MessageSquare}
      subtitle="What could make SAMSON better? Small ideas welcome.">
      <Card className="p-5 sm:p-8">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" data-testid="suggestion-form">
          <Field label="Your name" name="name" value={f.name} onChange={onChange} placeholder="Juan Dela Cruz" required />
          <Field label="Email" name="email" type="email" value={f.email} onChange={onChange} placeholder="you@email.com" required />
          <div className="sm:col-span-2">
            <Field label="Suggestion category" name="category" value={f.category} onChange={onChange} required
              options={['New feature', 'UI / Design', 'Task ideas', 'Payment / Withdrawal', 'Offers & Surveys', 'Rewards & Bonuses', 'Referrals', 'Other']} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Suggestion details" name="details" value={f.details} onChange={onChange} textarea rows={5}
              placeholder="Describe your idea. What problem does it solve? Who benefits?" required />
          </div>
          <div className="sm:col-span-2 flex justify-end pt-2">
            <PrimaryButton onClick={submit} testId="btn-submit-suggestion" icon={MessageSquare}>
              {submitting ? 'Sending…' : 'Send Suggestion'}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </Section>
  );
};

const KnownIssues = () => (
  <Section id="known-issues" title="Known Issues" icon={AlertTriangle}
    subtitle="Already on our radar. No need to report these.">
    <Card className="p-2 sm:p-4">
      <ul className="divide-y" style={{ borderColor: BRAND.border }}>
        {KNOWN_ISSUES.map((issue, i) => (
          <li key={i} className="flex items-start gap-3 p-4">
            <AlertTriangle size={20} style={{ color: '#F59E0B' }} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm sm:text-base" style={{ color: BRAND.text }}>{issue}</span>
          </li>
        ))}
      </ul>
    </Card>
  </Section>
);

const BetaReward = () => (
  <Section id="reward" title="Beta Reward" icon={Award}>
    <Card
      className="p-6 sm:p-10 text-center"
      style={{
        background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.deepBlue} 100%)`,
        border: 'none',
      }}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
        style={{ backgroundColor: BRAND.greenLight }}>
        <Award size={32} style={{ color: BRAND.green }} />
      </div>
      <div className="font-bold mb-3" style={{ color: 'white', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)' }}>
        $100 USD SAMSON Launch Bonus
      </div>
      <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: '#DBEAFE' }}>
        Testers who actively participate throughout the full 14-day Closed Beta, complete assigned testing activities,
        and submit meaningful feedback will receive a <strong style={{ color: 'white' }}>$100 USD SAMSON Launch Bonus</strong>,
        subject to verification and compliance with beta guidelines.
      </p>
      <div className="mt-6">
        <PrimaryButton href={FEEDBACK_FORM_URL} icon={Shield} testId="btn-feedback-form">
          Start Earning Your Bonus
        </PrimaryButton>
      </div>
    </Card>
  </Section>
);

const FAQ = () => {
  const [open, setOpen] = useState(0);
  return (
    <Section id="faq" title="Frequently Asked" icon={HelpCircle}>
      <Card className="overflow-hidden">
        <ul className="divide-y" style={{ borderColor: BRAND.border }}>
          {FAQ_ITEMS.map((item, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? -1 : i)}
                data-testid={`faq-toggle-${i}`}
                className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-sm sm:text-base" style={{ color: BRAND.text }}>{item.q}</span>
                {open === i
                  ? <ChevronUp size={20} style={{ color: BRAND.muted }} />
                  : <ChevronDown size={20} style={{ color: BRAND.muted }} />}
              </button>
              {open === i && (
                <div className="px-4 sm:px-5 pb-5 -mt-1 text-sm sm:text-base leading-relaxed" style={{ color: BRAND.muted }}>
                  {item.a}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  );
};

const Contact = () => (
  <Section id="contact" title="Contact" icon={Mail}>
    <Card className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="text-sm mb-1" style={{ color: BRAND.muted }}>For anything not covered here:</div>
        <a
          href="mailto:support@samsonusd.com"
          className="text-lg sm:text-xl font-bold inline-flex items-center gap-2"
          style={{ color: BRAND.deepBlue }}
          data-testid="contact-email"
        >
          <Mail size={20} /> support@samsonusd.com
        </a>
      </div>
      <SecondaryButton href="mailto:support@samsonusd.com" icon={Mail} testId="btn-email-support">
        Email Support
      </SecondaryButton>
    </Card>
  </Section>
);

const FooterBar = () => (
  <footer className="border-t py-8 mt-8" style={{ borderColor: BRAND.border, backgroundColor: BRAND.light }}>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: BRAND.navy }}>
        <Rocket size={18} /> SAMSON Beta Operations Center
      </div>
      <div className="text-xs" style={{ color: BRAND.muted }}>
        Version 1.0.13 · Build 19 · Closed Beta
      </div>
    </div>
  </footer>
);

// ---------- Page shell -------------------------------------------------------
const BetaOps = () => {
  useEffect(() => {
    document.title = 'SAMSON Beta Operations Center';
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.light, color: BRAND.text }}>
      <Hero />
      <Instructions />
      <DailyChecklist />
      <BugReportForm />
      <SuggestionForm />
      <KnownIssues />
      <BetaReward />
      <FAQ />
      <Contact />
      <FooterBar />
    </div>
  );
};

export default BetaOps;
