import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

const LegalLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand"><Radio className="h-4 w-4 text-primary-foreground" /></div>
          <span className="font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Castreamino</span>
        </Link>
      </div>
    </header>
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{title}</h1>
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">{children}</div>
    </main>
  </div>
);

export const TermsPage = () => (
  <LegalLayout title="Terms of Service">
    <p>Last updated: March 8, 2026</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">1. Service Description</h2>
    <p>Castreamino is a B2B brokerage marketplace that connects licensed online casinos with gambling content creators (streamers/influencers). Castreamino does NOT operate any gambling services, does NOT process gambling bets, and does NOT provide streaming services.</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">2. Eligibility</h2>
    <p>You must be at least 18 years of age to use this platform. Casino operators must hold valid gambling licenses from recognized jurisdictions.</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">3. User Responsibilities</h2>
    <p>Users are responsible for compliance with all applicable laws in their jurisdiction, including gambling advertising regulations and influencer marketing disclosure requirements.</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">4. Platform Fees</h2>
    <p>Castreamino charges a commission on successfully brokered deals. Fee schedules are disclosed during the deal finalization process.</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">5. Disclaimer</h2>
    <p>Castreamino is not responsible for the performance of deals between casinos and streamers. All agreements are between the respective parties.</p>
  </LegalLayout>
);

export const PrivacyPage = () => (
  <LegalLayout title="Privacy Policy">
    <p>Last updated: March 8, 2026</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">1. Data Collection</h2>
    <p>We collect account information (email, display name, role), profile data, and usage analytics to operate the platform.</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">2. Data Usage</h2>
    <p>Your data is used to facilitate connections between casinos and streamers, process deals, and improve our platform.</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">3. Data Sharing</h2>
    <p>Profile information is shared with potential partners on the platform. We do not sell your data to third parties.</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">4. Data Retention</h2>
    <p>Account data is retained for the duration of your account. You may request deletion at any time.</p>
  </LegalLayout>
);

export const CompliancePage = () => (
  <LegalLayout title="Compliance Disclaimer">
    <p>Last updated: March 8, 2026</p>
    <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 my-6">
      <p className="font-semibold text-foreground">Important Notice</p>
      <p className="mt-2">Castreamino is NOT a casino, NOT a gambling operator, and does NOT process any gambling transactions. This platform serves exclusively as a B2B brokerage connecting licensed casino operators with content creators.</p>
    </div>
    <h2 className="text-lg font-semibold text-foreground mt-6">Licensing Requirements</h2>
    <p>All casino operators on this platform are required to provide proof of valid gambling licenses from recognized jurisdictions before being verified.</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">Responsible Gambling</h2>
    <p>All partnerships brokered through this platform must comply with responsible gambling advertising standards. Content must include appropriate disclaimers and age restrictions.</p>
    <h2 className="text-lg font-semibold text-foreground mt-6">Geo Restrictions</h2>
    <p>Campaigns and deals are subject to geographic restrictions based on licensing jurisdictions. Users must comply with the gambling advertising laws of all targeted territories.</p>
  </LegalLayout>
);
