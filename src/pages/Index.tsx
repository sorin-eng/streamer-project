import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, Shield, Handshake, BarChart3 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">BrokerHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-gradient-brand hover:opacity-90">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark opacity-50" />
        <div className="container relative mx-auto px-4 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6 animate-fade-in">
            <Shield className="mr-2 h-3 w-3 text-primary" />
            B2B Brokerage Platform · Not a Casino
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight animate-slide-up">
            Connect <span className="text-gradient-brand">Licensed Casinos</span><br />
            with Top Streamers
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up">
            The marketplace for brokering partnerships between online casino operators and gambling influencers. Transparent deals, verified partners, compliant campaigns.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-brand hover:opacity-90 text-base px-8">
                Start Brokering <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base px-8">Demo Access</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="mt-2 text-muted-foreground">Simple, transparent, compliant</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: <Shield className="h-6 w-6" />, title: 'Verified Partners', desc: 'All casinos must provide licensing proof. Streamers are vetted for audience authenticity.' },
            { icon: <Handshake className="h-6 w-6" />, title: 'Smart Matching', desc: 'Post campaigns, receive applications, negotiate terms, and finalize contracts—all in one place.' },
            { icon: <BarChart3 className="h-6 w-6" />, title: 'Performance Tracking', desc: 'Upload reports, track signups and revenue, manage commissions with transparent dashboards.' },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground group-hover:bg-gradient-brand group-hover:text-primary-foreground transition-all">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-brand"><Zap className="h-3 w-3 text-primary-foreground" /></div>
              <span className="text-sm font-semibold">BrokerHub</span>
            </div>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/compliance" className="hover:text-foreground transition-colors">Compliance</Link>
            </div>
            <p className="text-xs text-muted-foreground">18+ Only · Not a gambling platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
