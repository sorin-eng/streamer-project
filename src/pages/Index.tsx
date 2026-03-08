import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Handshake, BarChart3, Play, Radio, Users, FileText, DollarSign, Zap, Globe, CheckCircle2 } from 'lucide-react';

const stats = [
  { value: '$120M+', label: 'Streamer Marketing Spend (2025)' },
  { value: '850+', label: 'Active Casino Streamers' },
  { value: '28M+', label: 'Monthly Gambling Stream Views' },
];

const steps = [
  { num: '01', icon: <Play className="h-6 w-6" />, title: 'Create Profile & List', desc: 'Register as a streamer, connect your platforms, set your stats, and post listings with your pricing — fixed rate, package, or negotiable.' },
  { num: '02', icon: <Handshake className="h-6 w-6" />, title: 'Get Discovered', desc: 'Casinos browse verified streamers filtered by platform, viewers, and geo. They find you and reach out directly.' },
  { num: '03', icon: <DollarSign className="h-6 w-6" />, title: 'Get Paid in Crypto', desc: 'Negotiate terms, sign contracts, stream, and receive payments in USDT, BTC, or ETH — fast and borderless.' },
];

const features = [
  { icon: <Shield className="h-5 w-5" />, title: 'Compliance First', desc: 'KYC verification, age gates, geo-restrictions, and full audit trail for regulatory peace of mind.' },
  { icon: <FileText className="h-5 w-5" />, title: 'Smart Contracts', desc: 'Digital contracts with dual signatures, version tracking, and PDF export for legal records.' },
  { icon: <BarChart3 className="h-5 w-5" />, title: 'Performance Analytics', desc: 'Upload reports, track FTDs, deposits, and net revenue. Commission calculations happen automatically.' },
  { icon: <Users className="h-5 w-5" />, title: 'Streamer Discovery', desc: 'Browse verified streamers filtered by platform, audience geo, niche, and viewer count.' },
  { icon: <Globe className="h-5 w-5" />, title: 'Crypto-Native Payments', desc: 'Streamers set prices in USDT, BTC, or ETH. Borderless payments with no middlemen.' },
  { icon: <Zap className="h-5 w-5" />, title: 'Real-Time Messaging', desc: 'Negotiate deals and coordinate campaigns with built-in messaging per deal thread.' },
];

const pricingItems = [
  { label: 'Streamer Registration', value: 'Free', note: 'Create your profile, listings, and get discovered.' },
  { label: 'Casino Registration', value: 'Free', note: 'Browse streamers, post campaigns, and initiate deals.' },
  { label: 'Platform Fee', value: '8%', note: 'Applied to deal value when a deal is completed. Transparent and visible on every contract.' },
];

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Castreamino",
  "url": "https://castreamino.com",
  "description": "The crypto-native marketplace connecting licensed casino operators with gambling content creators.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free to register. 8% platform fee on completed deals."
  },
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <header className="border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand">
              <Radio className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Castreamino</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-gradient-brand hover:opacity-90">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(170deg, hsl(222, 40%, 6%) 0%, hsl(222, 35%, 12%) 50%, hsl(225, 30%, 16%) 100%)' }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 25% 30%, hsl(225, 65%, 50%) 0%, transparent 50%), radial-gradient(circle at 80% 70%, hsl(42, 78%, 50%) 0%, transparent 40%)' }} />
        <div className="container relative mx-auto px-4 py-28 lg:py-40 text-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 mb-6 animate-fade-in">
            <Radio className="mr-2 h-3 w-3 text-accent" />
            Casino × Streamer Partnership Platform
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight animate-slide-up leading-[1.1] text-white">
            Where <span className="text-gradient-brand">Casinos</span> Find{' '}
            <span className="text-gradient-accent">Streamers</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/55 max-w-2xl mx-auto animate-slide-up leading-relaxed">
            The crypto-native marketplace connecting licensed casino operators with gambling content creators. List your services. Get discovered. Get paid.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-brand hover:opacity-90 text-base px-10 h-12">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base px-10 h-12 border-white/15 text-white/80 hover:bg-white/5 hover:text-white bg-transparent">
                Demo Access
              </Button>
            </Link>
          </div>
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-px max-w-2xl mx-auto animate-fade-in rounded-xl overflow-hidden border border-white/8">
            {stats.map((s, i) => (
              <div key={i} className="bg-white/[0.03] px-6 py-5">
                <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
                <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold">Three Steps to Partnership</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="relative rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-elevated hover:border-primary/20 transition-all group">
              <span className="absolute -top-4 -left-2 text-6xl font-black text-primary/5 group-hover:text-primary/10 transition-colors select-none">{s.num}</span>
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-gradient-brand group-hover:text-white transition-all">
                  {s.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-accent-foreground uppercase tracking-[0.2em] mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Broker Deals</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Commission */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">No hidden fees. Free to register. We only earn when you do.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-3xl mx-auto">
          {pricingItems.map((item, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 text-center shadow-card hover:shadow-elevated transition-all">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-4xl font-extrabold text-foreground">{item.value}</p>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA for each role */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-8 lg:p-10">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">For Casinos</span>
            <h3 className="mt-4 text-2xl font-bold">Find Your Next Top Streamer</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">Browse verified streamers with public listings, view their stats, and reach out directly — all with built-in compliance and transparent tracking.</p>
            <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              {['Browse streamers with live pricing', 'Filter by platform, geo & viewers', 'Crypto-native payments', 'Full audit trail'].map(item => (
                <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{item}</li>
              ))}
            </ul>
            <Link to="/signup" className="mt-6 inline-block">
              <Button className="bg-gradient-brand hover:opacity-90">Register as Casino <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="rounded-2xl border border-accent/15 bg-accent/[0.03] p-8 lg:p-10">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-foreground">For Streamers</span>
            <h3 className="mt-4 text-2xl font-bold">List Your Services, Get Paid in Crypto</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">Create your profile, post listings with your pricing, and let casinos come to you. Receive payments in USDT, BTC, or ETH.</p>
            <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              {['Set your own prices in crypto', 'Showcase stats from Twitch, Kick & YouTube', 'Get contacted by verified casinos', 'Multi-platform support'].map(item => (
                <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0" />{item}</li>
              ))}
            </ul>
            <Link to="/signup" className="mt-6 inline-block">
              <Button className="bg-gradient-accent hover:opacity-90 text-accent-foreground">Register as Streamer <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand">
                <Radio className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Castreamino</span>
            </Link>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/compliance" className="hover:text-foreground transition-colors">Compliance</Link>
            </div>
            <p className="text-xs text-muted-foreground">18+ Only · Not a gambling platform · © {new Date().getFullYear()} Castreamino</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
