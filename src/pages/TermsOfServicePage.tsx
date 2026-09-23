import React, { useEffect } from 'react';
import { ShieldAlert, ArrowLeft, Scale, AlertTriangle, CheckCircle, Award, Ban } from 'lucide-react';
import { DareDayLogo } from '../components/DareDayLogo';

interface TermsOfServicePageProps {
  onBack?: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Terms of Service | DARE - Social Challenge Protocol';
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 antialiased selection:bg-pink-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button 
            onClick={handleBack} 
            className="flex items-center gap-3 transition-opacity hover:opacity-90 cursor-pointer"
            title="Return to DARE App"
          >
            <DareDayLogo size={36} showText={true} />
          </button>
          
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-pink-500/50 hover:bg-slate-800 hover:text-white transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-pink-400" />
            Back to App
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-pink-400 mb-4">
            <Scale className="h-3.5 w-3.5" /> User Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            DARE Terms of Service
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            <strong>Effective Date:</strong> January 1, 2026 &bull; <strong>Last Updated:</strong> September 23, 2026
          </p>
          <p className="mt-2 text-sm text-slate-400">
            <strong>Platform:</strong> DARE DAY LABS &bull; 
            <strong> Website:</strong> <a href="https://dare.me.uk" className="text-pink-400 hover:underline">https://dare.me.uk</a>
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">1</span>
              Agreement to Terms
            </h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and DARE DAY LABS (&quot;DARE&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your access to and use of the DARE social challenge platform, website (<a href="https://dare.me.uk" className="text-pink-400 hover:underline">https://dare.me.uk</a>), mobile web applications, and related services.
            </p>
            <p>
              By signing in, creating an account, creating a dare, or submitting verification proof, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must cease using the Platform immediately.
            </p>
          </section>

          {/* Section 2 - Safety & Assumption of Risk (CRITICAL) */}
          <section className="space-y-4 rounded-2xl border border-red-500/30 bg-red-950/10 p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Safety Protocol &amp; Voluntary Assumption of Risk
            </h2>
            <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4 text-xs text-red-200">
              <strong>CRITICAL PARTICIPATION DISCLAIMER:</strong> All dares, fitness milestones, creative stunts, and public challenges created or accepted on DARE are undertaken <strong>strictly on a voluntary basis and entirely at your own risk</strong>.
            </div>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-300">
              <li>
                <strong>No Mandatory Obligations:</strong> You are never required or pressured to accept any challenge. You maintain full discretion to decline or abandon any challenge at any moment.
              </li>
              <li>
                <strong>Personal Responsibility:</strong> You represent and warrant that you possess adequate physical capability, health, and situational awareness before attempting any challenge.
              </li>
              <li>
                <strong>Zero Tolerance for Hazardous Conduct:</strong> You must never propose, encourage, or execute any dare that poses foreseeable risk of bodily harm, property damage, traffic disruption, public disturbance, illegal acts, or animal cruelty.
              </li>
              <li>
                <strong>Indemnification &amp; Waiver:</strong> You expressly release and hold harmless DARE DAY LABS, its directors, developers, and affiliates from any liabilities, injuries, damages, or claims arising from your participation in peer-generated dares.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">2</span>
              User Accounts &amp; Authentication
            </h2>
            <p>
              To create dares or submit verification evidence, you must authenticate through a supported third-party identity provider (such as Google Authentication). You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <p>
              You must provide accurate and non-infringing information when setting your username, handle, or avatar. We reserve the right to reclaim or modify handles that impersonate public figures, brands, or other users.
            </p>
          </section>

          {/* Section 4 - Virtual Cred Economy */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">3</span>
              Virtual Cred &amp; In-App Reputation
            </h2>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 space-y-2">
              <p>
                <strong>Virtual Reputation Only:</strong> &quot;Cred&quot; represents an internal, virtual gamification score and community standing indicator. Cred has <strong>no cash, monetary, or real-world redemption value</strong>.
              </p>
              <p>
                Cred cannot be exchanged, withdrawn, or traded for fiat currency or cryptocurrencies. DARE DAY LABS reserves the right to manage, adjust, regulate, or reset Cred balances to ensure platform balance, prevent fraudulent exploitation, or address software discrepancies.
              </p>
            </div>
          </section>

          {/* Section 5 - Prohibited Conduct */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">4</span>
              Prohibited Activities
            </h2>
            <p>You agree that you will NOT under any circumstances:</p>
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 flex items-start gap-2">
                <Ban className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>Post dares promoting violence, hate speech, self-harm, harassment, or illicit substances.</span>
              </div>
              <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 flex items-start gap-2">
                <Ban className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>Submit fraudulent, digitally synthesized, deepfaked, or stolen media as proof of completion.</span>
              </div>
              <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 flex items-start gap-2">
                <Ban className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>Engage in automated scraping, bot attacks, denial-of-service, or API manipulation.</span>
              </div>
              <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 flex items-start gap-2">
                <Ban className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>Dox or publish non-consensual personal information or intimate imagery of any person.</span>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">5</span>
              User Submissions &amp; Content License
            </h2>
            <p>
              You retain ownership of any media, images, videos, and comments you upload to DARE. However, by uploading content, you grant DARE DAY LABS a worldwide, non-exclusive, royalty-free license to host, display, reproduce, and adapt your content solely for the purpose of operating, marketing, and improving the Platform (including display in the community Proof Viewer and leaderboards).
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">6</span>
              Limitation of Liability
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-wide leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DARE DAY LABS SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION PHYSICAL INJURY, PROPERTY DAMAGE, LOSS OF PROFITS, DATA LOSS, OR REPUTATIONAL HARM RESULTING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM OR PARTICIPATION IN ANY DARE.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">7</span>
              Modifications &amp; Termination
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. When material changes are made, we will update the &quot;Last Updated&quot; date at the top of this document. We reserve the right to suspend or terminate any user account immediately for breach of these Terms without prior notice.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">8</span>
              Contact Information
            </h2>
            <p>
              For legal inquiries, dispute notifications, or support regarding these Terms, please contact:
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-1">
              <p className="font-bold text-white">DARE DAY LABS - Legal Department</p>
              <p>Email: <a href="mailto:daredaylabs@gmail.com" className="text-pink-400 hover:underline">daredaylabs@gmail.com</a></p>
              <p>Website: <a href="https://dare.me.uk" className="text-pink-400 hover:underline">https://dare.me.uk</a></p>
              <p>Primary Domain: dare.me.uk</p>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="mt-14 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>&copy; 2026 DARE DAY LABS. All rights reserved.</p>
          <div className="mt-3 flex justify-center gap-4 text-xs">
            <button onClick={handleBack} className="text-slate-400 hover:text-white transition-colors cursor-pointer">App Home</button>
            <span>&bull;</span>
            <a href="/terms" className="text-pink-400 font-semibold hover:underline">Terms of Service</a>
            <span>&bull;</span>
            <a href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </main>
    </div>
  );
};
