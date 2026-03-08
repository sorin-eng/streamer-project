import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Handshake, BarChart3, Play, Radio, Users, FileText, DollarSign, Zap, Globe, CheckCircle2 } from 'lucide-react';

const stats = [
  { value: '$2.1B+', label: 'Streamer Marketing Spend (2025)' },
  { value: '14K+', label: 'Active Casino Streamers' },
  { value: '340M+', label: 'Monthly Gambling Stream Views' },
];

const steps = [
  { num: '01', icon: <Play className="h-6 w-6" />, title: 'Post or Browse', desc: 'Casinos post campaigns with budgets and requirements. Streamers browse and apply to opportunities that match their audience.' },
  { num: '02', icon: <Handshake className="h-6 w-6" />, title: 'Match & Negotiate', desc: 'Accept applications, negotiate terms via real-time messaging, and finalize deal structures—CPA, RevShare, or Hybrid.' },
  { num: '03', icon: <DollarSign className="h-6 w-6" />, title: 'Perform & Earn', desc: 'Sign contracts, track performance with transparent dashboards, and manage commissions automatically.' },
];

const features = [
  { icon: <Shield className="h-5 w-5" />, title: 'Compliance First', desc: 'KYC verification, age gates, geo-restrictions, and full audit trail for regulatory peace of mind.' },
  { icon: <FileText className="h-5 w-5" />, title: 'Smart Contracts', desc: 'Digital contracts with dual signatures, version tracking, and PDF export for legal records.' },
  { icon: <BarChart3 className="h-5 w-5" />, title: 'Performance Analytics', desc: 'Upload reports, track FTDs, deposits, and net revenue. Commission calculations happen automatically.' },
  { icon: <Users className="h-5 w-5" />, title: 'Streamer Discovery', desc: 'Browse verified streamers filtered by platform, audience geo, niche, and viewer count.' },
  { icon: <Globe className="h-5 w-5" />, title: 'Geo-Smart Matching', desc: 'Campaigns respect jurisdiction restrictions. Only show opportunities to streamers in accepted territories.' },
  { icon: <Zap className="h-5 w-5" />, title: 'Real-Time Messaging', desc: 'Negotiate deals and coordinate campaigns with built-in messaging per deal thread.' },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
              <Radio className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Castreamino</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-gradient-brand hover:opacity-90 shadow-glow">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark opacity-60" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(263, 70%, 58%) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(40, 96%, 53%) 0%, transparent 40%)' }} />
        <div className="container relative mx-auto px-4 py-28 lg:py-40 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6 animate-fade-in">
            <Radio className="mr-2 h-3 w-3" />
            Casino × Streamer Partnership Platform
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight animate-slide-up leading-[1.1]">
            Where <span className="text-gradient-brand">Casinos</span> Meet{' '}
            <span className="text-gradient-accent">Streamers</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up">
            The marketplace for brokering partnerships between licensed online casino operators and gambling content creators. Transparent deals, verified partners, compliant campaigns.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-brand hover:opacity-90 text-base px-8 shadow-glow">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base px-8 border-primary/30 hover:border-primary/60">
                Demo Access
              </Button>
            </Link>
          </div>
          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in">
            {stats.map((s, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
                <p className="text-2xl md:text-3xl font-bold text-gradient-brand">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold">Three Steps to Partnership</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="relative rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all group">
              <span className="absolute -top-4 -left-2 text-6xl font-black text-primary/5 group-hover:text-primary/10 transition-colors">{s.num}</span>
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-gradient-brand group-hover:text-primary-foreground transition-all">
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
      <section className="bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-accent-foreground uppercase tracking-widest mb-2">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Broker Deals</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-all group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for each role */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 lg:p-10">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">For Casinos</span>
            <h3 className="mt-4 text-2xl font-bold">Find Your Next Top Streamer</h3>
            <p className="mt-2 text-muted-foreground">Post campaigns, browse verified streamers, and manage partnerships—all with built-in compliance and transparent commission tracking.</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {['Post unlimited campaigns', 'Browse verified streamer profiles', 'Automated commission calculations', 'Full audit trail'].map(item => (
                <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{item}</li>
              ))}
            </ul>
            <Link to="/signup" className="mt-6 inline-block">
              <Button className="bg-gradient-brand hover:opacity-90">Register as Casino <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 p-8 lg:p-10">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-foreground">For Streamers</span>
            <h3 className="mt-4 text-2xl font-bold">Monetize Your Audience</h3>
            <p className="mt-2 text-muted-foreground">Apply to campaigns from licensed casinos, negotiate terms, sign contracts, and track your earnings—all in one platform.</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {['Browse open campaigns', 'Transparent deal terms', 'Real-time earnings dashboard', 'Multi-platform support'].map(item => (
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
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand">
                <Radio className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Castreamino</span>
            </div>
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
