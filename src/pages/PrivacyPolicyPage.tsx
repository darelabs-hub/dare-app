import React, { useEffect } from 'react';
import { ArrowLeft, Lock, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Privacy Policy — DARE';
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 antialiased font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#07090e]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button 
            onClick={handleBack} 
            className="flex items-center gap-2.5 text-white font-black tracking-tight text-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shadow-md">
              D
            </span>
            <span>DARE</span>
          </button>
          
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to App</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        {/* Document Title Header */}
        <div className="border-b border-slate-800 pb-8 mb-8">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Privacy &amp; Data Protection
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5">
            DARE Privacy Policy
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Effective Date: January 1, 2026 · Platform: DARE · Version 2.4
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-slate-300">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              1. Introduction &amp; Scope
            </h2>
            <p className="leading-relaxed">
              Welcome to DARE. DARE is a modern social challenge platform that allows individuals to broadcast challenges, submit verifiable video/photo evidence, build activity streaks, and participate in community leaderboards.
            </p>
            <p className="leading-relaxed">
              This Privacy Policy explains how DARE collects, uses, shares, and protects your information when you access or use our web applications, Progressive Web App (PWA), and associated services.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              2. Information We Collect
            </h2>
            <p className="leading-relaxed">
              We collect information strictly necessary to operate a safe and engaging social platform:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
                <p className="text-xs font-bold text-white">Account Details</p>
                <p className="text-xs text-slate-400 leading-normal">
                  When you sign in using Google or email authentication, we receive your authentication UID, email address, display name, and avatar image. We never store third-party passwords.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
                <p className="text-xs font-bold text-white">Proof &amp; Activity Media</p>
                <p className="text-xs text-slate-400 leading-normal">
                  Photos and video clips submitted as proof are processed strictly to verify challenge completion and display on community feeds.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              3. Zero Data Selling Commitment
            </h2>
            <p className="leading-relaxed">
              We do not sell, rent, monetize, or trade your personal information or media to third-party data brokers or advertising networks. Data collected is used solely to maintain platform safety, authenticate accounts, and process challenge leaderboards.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              4. Data Retention &amp; User Controls
            </h2>
            <p className="leading-relaxed">
              You maintain ownership of your content. You may update your profile information, manage preferences, or request full deletion of your account and associated media at any time from your Profile Settings.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              5. Security Standards
            </h2>
            <p className="leading-relaxed">
              We implement industry-standard technical and operational security controls to protect your data against unauthorized access, alteration, or disclosure.
            </p>
          </section>

          {/* Support Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-10">
            <div>
              <h3 className="text-sm font-bold text-white">Have Privacy Questions?</h3>
              <p className="text-xs text-slate-400 mt-0.5">Reach out to our team directly for any data inquiries.</p>
            </div>
            <a
              href="mailto:support@dare.me.uk"
              className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold px-4 py-2 text-xs transition-colors shadow-sm"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
