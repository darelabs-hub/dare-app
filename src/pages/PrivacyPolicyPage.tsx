import React, { useEffect } from 'react';
import { ShieldCheck, ArrowLeft, Mail, Lock, Eye, Database, FileCheck, CheckCircle2 } from 'lucide-react';
import { DareDayLogo } from '../components/DareDayLogo';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Privacy Policy | DARE - Social Challenge Protocol';
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
            <Lock className="h-3.5 w-3.5" /> Official Legal Notice
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            DARE Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            <strong>Effective Date:</strong> January 1, 2026 &bull; <strong>Last Updated:</strong> September 23, 2026
          </p>
          <p className="mt-2 text-sm text-slate-400">
            <strong>Published by:</strong> DARE DAY LABS (&quot;DARE&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) &bull; 
            <strong> Website:</strong> <a href="https://dare.me.uk" className="text-pink-400 hover:underline">https://dare.me.uk</a>
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">1</span>
              Introduction &amp; Scope
            </h2>
            <p>
              Welcome to DARE (accessible via <a href="https://dare.me.uk" className="text-pink-400 hover:underline">https://dare.me.uk</a>). DARE is a peer-to-peer social challenge and bounty protocol that allows individuals to broadcast friendly challenges, submit verifiable video/photo proof, and earn digital reputation points (&quot;Cred&quot;).
            </p>
            <p>
              This Privacy Policy explains how DARE DAY LABS collects, uses, shares, and protects your personal information when you access or use our web applications, Progressive Web App (PWA), API endpoints, and associated services (collectively, the &quot;Platform&quot;).
            </p>
            <p>
              By accessing or using the Platform, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with our policies, please do not access or use our services.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">2</span>
              Information We Collect
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 text-white font-semibold mb-2">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  Account &amp; Identity Data
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  When you sign in using Google Authentication, we collect your unique account identifier (UID), primary email address, display name, and avatar image URL. We do not receive or store your Google password.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 text-white font-semibold mb-2">
                  <Database className="h-4 w-4 text-pink-400" />
                  Activity &amp; Dare Submissions
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Challenges you create, accepted dares, uploaded proof media (images/videos), field notes, comments, streak progress, leaderboard scores, and in-app Cred transactions.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 text-white font-semibold mb-2">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  Technical &amp; Telemetry Data
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  IP address, browser type, device information, operating system, approximate geographic region, and telemetry logs used to ensure server reliability and prevent malicious activity.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 text-white font-semibold mb-2">
                  <FileCheck className="h-4 w-4 text-amber-400" />
                  Payment Information (Optional)
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  If you purchase PRO memberships or platform merch, payments are processed securely by Stripe. We never store credit or debit card numbers on our servers.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 - Google API Disclosure */}
          <section className="space-y-4 rounded-2xl border border-pink-500/30 bg-pink-950/10 p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-pink-400" />
              Google API Services User Data Policy Compliance
            </h2>
            <p className="text-slate-300">
              DARE’s use and transfer of information received from Google APIs to any other app will adhere to the{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pink-400 font-medium underline underline-offset-2 hover:text-pink-300"
              >
                Google API Services User Data Policy
              </a>, including the <strong>Limited Use</strong> requirements.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-300">
              <li>
                <strong>Strict Scopes:</strong> We only request basic user identity scopes (<code>openid</code>, <code>email</code>, <code>profile</code>) required to authenticate your account and securely associate your DARE challenges.
              </li>
              <li>
                <strong>No Data Selling:</strong> We do not sell, rent, or lease your Google user data to any third party, broker, or advertising network under any circumstances.
              </li>
              <li>
                <strong>No Unauthorized Advertising:</strong> Google user data is never used for serving personalized, targeted, or retargeted advertisements.
              </li>
              <li>
                <strong>Limited Human Access:</strong> No humans at DARE read your personal private data unless you provide explicit consent to resolve a specific technical dispute, or as strictly necessary for legal investigations.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">3</span>
              How We Use Your Information
            </h2>
            <p>We process personal data only for legitimate business purposes, including:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Providing, maintaining, and updating the DARE challenge platform and leaderboard.</li>
              <li>Verifying submitted proof media through our automated multimodal AI verification engine (Oracle AI powered by Google Gemini).</li>
              <li>Facilitating in-app reputation tracking, streak calculations, and Cred balances.</li>
              <li>Preventing spam, abuse, hazardous challenges, and violations of our Safety Protocol.</li>
              <li>Delivering push notifications and reminders regarding expiring dares when authorized by you.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">4</span>
              Data Sharing &amp; Third-Party Service Providers
            </h2>
            <p>
              We do not sell your personal data. We share information only with trusted infrastructure providers who assist in operating our platform under strict confidentiality agreements:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>Google Cloud &amp; Firebase:</strong> For identity authentication, database persistence, and secure server hosting.</li>
              <li><strong>Google Gemini API:</strong> Multimodal AI models used strictly to verify challenge task completion evidence. Submissions are processed statelessly in accordance with enterprise data protection standards.</li>
              <li><strong>Stripe:</strong> Payment processor for optional virtual PRO tier memberships.</li>
              <li><strong>Render:</strong> Cloud application hosting and deployment infrastructure.</li>
            </ul>
          </section>

          {/* Section 6 - User Rights & Deletion */}
          <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">5</span>
              Your Rights &amp; Data Deletion Requests (GDPR / CCPA)
            </h2>
            <p>
              Under global data privacy laws including the General Data Protection Regulation (GDPR), the UK Data Protection Act 2018, and the California Consumer Privacy Act (CCPA), you have the right to:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                <span className="font-semibold text-white block mb-1">Right to Access &amp; Portability</span>
                Request an export of all personal data and submissions linked to your profile.
              </div>
              <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                <span className="font-semibold text-white block mb-1">Right to Erasure (Deletion)</span>
                Request complete deletion of your account, history, proof media, and Cred records.
              </div>
              <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                <span className="font-semibold text-white block mb-1">Right to Rectification</span>
                Update inaccurate or outdated handle, avatar, or account preferences.
              </div>
              <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                <span className="font-semibold text-white block mb-1">Right to Withdraw Consent</span>
                Disconnect Google OAuth authorization at any time via your Google Account security settings.
              </div>
            </div>

            <div className="rounded-lg border border-pink-500/40 bg-pink-500/10 p-4 mt-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-wide mb-1 flex items-center gap-2">
                <Mail className="h-4 w-4 text-pink-400" />
                How to Submit a Data Deletion Request
              </h3>
              <p className="text-xs text-slate-300">
                To request permanent deletion of your account and personal data, send an email to{' '}
                <a href="mailto:daredaylabs@gmail.com?subject=Data%20Deletion%20Request" className="font-bold text-pink-400 underline">
                  daredaylabs@gmail.com
                </a>{' '}
                with the subject line <strong>&quot;Data Deletion Request&quot;</strong> and include your registered email address or handle. Requests are processed within 14 business days.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">6</span>
              Data Security &amp; Retention
            </h2>
            <p>
              We implement industry-standard cryptographic measures to safeguard user data, including mandatory HTTPS/TLS transport encryption, restricted Firebase security rules, and role-based operational permissions. We retain your account data only for as long as your account remains active or as needed to provide our services and satisfy legal obligations.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">7</span>
              Children’s Privacy
            </h2>
            <p>
              The DARE Platform is strictly intended for individuals who are at least 13 years of age (or 16 years of age in the European Economic Area / UK). We do not knowingly collect personal data from children under these age limits. If you become aware that a minor has provided us with personal information without parental consent, please contact us immediately for prompt deletion.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-mono text-pink-400">8</span>
              Contact Information
            </h2>
            <p>
              If you have any questions, concerns, or inquiries regarding this Privacy Policy or our data handling practices, please contact our Data Protection team at:
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-1">
              <p className="font-bold text-white">DARE DAY LABS</p>
              <p>Email: <a href="mailto:daredaylabs@gmail.com" className="text-pink-400 hover:underline">daredaylabs@gmail.com</a></p>
              <p>Website: <a href="https://dare.me.uk" className="text-pink-400 hover:underline">https://dare.me.uk</a></p>
              <p>Domain: dare.me.uk</p>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="mt-14 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>&copy; 2026 DARE DAY LABS. All rights reserved.</p>
          <div className="mt-3 flex justify-center gap-4 text-xs">
            <button onClick={handleBack} className="text-slate-400 hover:text-white transition-colors cursor-pointer">App Home</button>
            <span>&bull;</span>
            <a href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a>
            <span>&bull;</span>
            <a href="/privacy" className="text-pink-400 font-semibold hover:underline">Privacy Policy</a>
          </div>
        </div>
      </main>
    </div>
  );
};
