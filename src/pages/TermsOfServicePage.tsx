import React, { useEffect } from 'react';
import { ArrowLeft, AlertCircle, Mail } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack?: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Terms of Service — DARE';
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
            Legal &amp; User Agreement
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5">
            DARE Terms of Service
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Effective Date: January 1, 2026 · Platform: DARE · Version 2.4
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-slate-300">
          
          {/* CRITICAL SAFETY DISCLAIMER */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 space-y-3.5">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Safety Protocol &amp; Voluntary Participation</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              All challenges, activities, and physical dares proposed on DARE are undertaken <strong className="text-white">strictly on a voluntary basis and entirely at your own risk</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-400">
              <li>
                <strong className="text-slate-200">No Mandatory Obligations:</strong> You are never required or pressured to accept any challenge. You retain full discretion to decline or abandon any challenge at any time.
              </li>
              <li>
                <strong className="text-slate-200">Zero Tolerance for Hazardous Conduct:</strong> You must never propose or execute any dare involving bodily harm, traffic violations, trespassing, property damage, or illegal acts.
              </li>
              <li>
                <strong className="text-slate-200">Assumption of Risk:</strong> You expressly acknowledge that physical activities involve inherent risks and agree to hold harmless DARE and its operators from any liabilities or claims resulting from your participation.
              </li>
            </ul>
          </section>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed">
              By accessing or using the DARE platform, creating challenges, accepting dares, or submitting video/photo proof, you agree to be legally bound by these Terms of Service. If you do not agree to these terms, you must discontinue use of the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              2. User Accounts &amp; Conduct
            </h2>
            <p className="leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted through your account. You agree to provide accurate information and to conduct yourself respectfully toward all community members.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              3. Cred Utility Metric &amp; Virtual Goods
            </h2>
            <p className="leading-relaxed">
              Cred is an internal virtual utility metric designed solely for platform engagement, reputation, and community leaderboards. Cred does not constitute currency, holds zero monetary value, and cannot be exchanged or redeemed for fiat currency.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              4. Community Standards &amp; Prohibited Content
            </h2>
            <p className="leading-relaxed">
              Users agree not to upload proof or propose challenges involving explicit adult content, non-consensual imagery, harassment, hate speech, dangerous stunts, or intellectual property infringement. Violations result in immediate content removal and account termination.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">
              5. Termination &amp; Modification
            </h2>
            <p className="leading-relaxed">
              We reserve the right to suspend or terminate accounts that breach these Terms or compromise community safety. These terms may be updated periodically, with continued use of the platform constituting acceptance of any revisions.
            </p>
          </section>

          {/* Support Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-10">
            <div>
              <h3 className="text-sm font-bold text-white">Questions About Terms?</h3>
              <p className="text-xs text-slate-400 mt-0.5">Contact our legal and compliance team directly.</p>
            </div>
            <a
              href="mailto:support@dare.app"
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
