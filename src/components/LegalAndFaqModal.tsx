import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Shield,
  FileText,
  Search,
  ChevronDown,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Lock,
  Scale,
  Mail,
  Share2,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';

export type LegalTab = 'faq' | 'terms' | 'privacy';

interface LegalAndFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: LegalTab;
}

interface FaqItem {
  id: string;
  category: 'getting-started' | 'challenges' | 'cred' | 'stories' | 'safety';
  categoryLabel: string;
  question: string;
  answer: string;
  bullets?: string[];
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'what-is-dare',
    category: 'getting-started',
    categoryLabel: 'Getting Started',
    question: 'What is DARE and how does it work?',
    answer:
      'DARE is a modern social challenge platform where members create, discover, and share real-world challenges. Instead of passive scrolling, DARE inspires active participation in physical fitness, creative arts, social kindness, and fun adventures.',
    bullets: [
      'Browse open challenges on the community feed or receive direct dares from friends.',
      'Accept challenges to activate countdown timers and capture verified photo or video evidence.',
      'Earn Cred, build daily streaks, and rise up local and global creator rankings.',
    ],
  },
  {
    id: 'how-to-create-dare',
    category: 'challenges',
    categoryLabel: 'Challenges & Proof',
    question: 'How do I create and publish a challenge?',
    answer:
      'Tap the "+ DARE" button in the top navigation bar or mobile menu. You will define a clear title, description, category, and completion window (between 12 and 72 hours).',
    bullets: [
      'Set specific proof requirements so participants know exactly what photo or video to submit.',
      'Optionally fund an Cred bounty from your balance to incentivize participants.',
      'Publish openly to the public community feed or direct the challenge to a specific friend (@handle).',
    ],
  },
  {
    id: 'how-to-accept-and-submit',
    category: 'challenges',
    categoryLabel: 'Challenges & Proof',
    question: 'How do I accept a challenge and submit verified proof?',
    answer:
      'Explore any challenge on the feed and tap "Accept Dare" to lock in your attempt and start the challenge countdown.',
    bullets: [
      'Complete the challenge in real life according to the posted criteria.',
      'Tap "Submit Proof", upload your photo or short video clip, and add any completion notes.',
      'Once verified, your Cred reward is credited instantly and recorded on your public profile.',
    ],
  },
  {
    id: 'how-verification-works',
    category: 'challenges',
    categoryLabel: 'Challenges & Proof',
    question: 'How does proof verification work?',
    answer:
      'Submissions undergo automated vision analysis to confirm that the submitted photo or video matches the requested criteria and demonstrates genuine effort.',
    bullets: [
      'Authenticity Check: Validates that media is newly recorded and relevant to the challenge prompt.',
      'Instant Resolution: Approvals immediately award Cred, advance streak milestones, and update activity stats.',
      'Appeal Process: If a submission is rejected, you receive constructive feedback and can re-submit before the timer expires.',
    ],
  },
  {
    id: 'what-is-cred',
    category: 'cred',
    categoryLabel: 'Cred & Reputation',
    question: 'What is Cred and how is it used?',
    answer:
      'Cred is DARE’s internal social reputation metric. It represents community participation and creator credibility across the platform.',
    bullets: [
      'Challenge Bounties: Fund rewards for dares you post to the community.',
      'Profile Customization: Unlock creator badges, verified tags, and custom profile aesthetics.',
      'Friendly Stakes: Send 1-on-1 challenges to friends with mutual Cred stakes.',
      'Leaderboards: Advance your standing on weekly, monthly, and all-time leaderboards.',
      'Notice: Cred is an internal virtual utility metric with zero cash value that cannot be redeemed for fiat currency.',
    ],
  },
  {
    id: 'how-to-earn-cred',
    category: 'cred',
    categoryLabel: 'Cred & Reputation',
    question: 'How do I earn Cred?',
    answer:
      'Cred is earned organically through active engagement on the platform:',
    bullets: [
      'Submitting approved proof for open community challenges.',
      'Completing daily challenges and spontaneous platform prompts.',
      'Winning head-to-head 1-on-1 challenges against friends.',
      'Maintaining consecutive daily streaks and achieving milestone badges.',
    ],
  },
  {
    id: 'how-streaks-work',
    category: 'cred',
    categoryLabel: 'Cred & Reputation',
    question: 'How do Daily Streaks work?',
    answer:
      'Completing at least one core platform activity every 24 hours keeps your daily streak active. Core activities include posting a new challenge, accepting an open dare, or submitting verified proof.',
    bullets: [
      'Consecutive milestones (3, 7, 14, 30, and 100 days) unlock exclusive badges and Cred multipliers.',
      'Streak shields can be acquired through milestone achievements to protect your streak during busy days.',
    ],
  },
  {
    id: 'sharing-and-deep-links',
    category: 'stories',
    categoryLabel: 'Stories & Sharing',
    question: 'How do I share my profile or challenges with friends?',
    answer:
      'DARE provides deep-linking and social sharing across all major platforms:',
    bullets: [
      'Share Profile: Open your Profile, tap "Share Profile", and copy your direct link (e.g. dare.app/?u=username).',
      'Instant Social Sharing: One-tap sharing to WhatsApp, X (Twitter), Telegram, LinkedIn, or native device share sheets.',
      'Digital Nametag QR Code: Switch to "Scan QR Code" in the Share modal to display a clean, scannable QR card for camera scanning.',
    ],
  },
  {
    id: 'ephemeral-stories',
    category: 'stories',
    categoryLabel: 'Stories & Sharing',
    question: 'How does the Story Creator work?',
    answer:
      'Stories are 24-hour ephemeral posts displayed across the top story banner of the home feed.',
    bullets: [
      'Tap the "+" button on "Your Story" in the top bar to launch the Story Creator Studio.',
      'Say Something: Create high-impact text stories with custom color gradients, typography, and mood tags.',
      'Upload Photo: Share photos with aesthetic filters and custom caption overlays.',
      'Short Clip: Share short video clips of real-world highlights.',
      'Manage & Delete: View your own story at any time and delete it whenever you choose.',
    ],
  },
  {
    id: 'direct-challenges',
    category: 'challenges',
    categoryLabel: 'Challenges & Proof',
    question: 'Can I send a challenge to a specific friend?',
    answer:
      'Yes. When creating a challenge, select "Direct Challenge" and enter your friend’s handle (@username). They will receive an invitation in their activity notifications to accept and complete the challenge within the specified timeframe.',
  },
  {
    id: 'prohibited-content',
    category: 'safety',
    categoryLabel: 'Safety & Guidelines',
    question: 'What types of challenges are strictly prohibited?',
    answer:
      'Community safety and mutual respect are foundational to DARE. We strictly enforce a zero-tolerance policy for dangerous or harmful content:',
    bullets: [
      'Physical Harm: Any activity that risks bodily harm, self-injury, or physical endangerment.',
      'Illegal Activities: Trespassing, vandalism, traffic violations, or any unlawful acts.',
      'Harassment: Bullying, stalking, non-consensual recording, or hate speech.',
      'Explicit Content: Sexually suggestive, pornographic, or non-consensual media.',
      'Violations result in immediate removal of content and permanent account suspension.',
    ],
  },
  {
    id: 'privacy-controls',
    category: 'safety',
    categoryLabel: 'Safety & Guidelines',
    question: 'How is my private data protected?',
    answer:
      'We do not sell, rent, or trade your personal information. Media uploaded as proof is processed solely to verify challenge requirements and display on authorized community feeds. You can manage your profile visibility or request full data deletion at any time from your Account Settings.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'challenges', label: 'Challenges & Proof' },
  { id: 'cred', label: 'Cred & Reputation' },
  { id: 'stories', label: 'Stories & Sharing' },
  { id: 'safety', label: 'Safety Guidelines' },
];

export const LegalAndFaqModal: React.FC<LegalAndFaqModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'faq',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('what-is-dare');

  if (!isOpen) return null;

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.bullets && item.bullets.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    playSound('click');
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const handleTabChange = (tab: LegalTab) => {
    playSound('click');
    setActiveTab(tab);
  };

  return (
    <div
      id="faq-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 md:p-6 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Container: Clean, Modern Dark Slate Glassmorphism */}
      <div
        id="faq-modal-container"
        className="relative flex flex-col w-full max-w-3xl max-h-[88vh] rounded-3xl border border-slate-800 bg-[#0a0d14] text-slate-200 shadow-2xl shadow-black/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar: Clean Social Branding & Balanced Spacing */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#0d111a]/80">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800/90 border border-slate-700/60 text-slate-200 shadow-sm shrink-0">
              {activeTab === 'faq' && <HelpCircle className="h-5 w-5 text-pink-400" />}
              {activeTab === 'privacy' && <Lock className="h-5 w-5 text-cyan-400" />}
              {activeTab === 'terms' && <Scale className="h-5 w-5 text-indigo-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {activeTab === 'faq' && 'Help & FAQ'}
                  {activeTab === 'privacy' && 'Privacy Policy'}
                  {activeTab === 'terms' && 'Terms of Service'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60 font-mono">
                  DARE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'faq' && 'Everything you need to know about the DARE social platform'}
                {activeTab === 'privacy' && 'How your personal data and media are protected'}
                {activeTab === 'terms' && 'Community standards, safety protocol & legal terms'}
              </p>
            </div>
          </div>

          <button
            id="close-faq-modal-btn"
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Segmented Tab Navigation: Apple/Linear Style */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-[#080b11]">
          <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800/90 max-w-md">
            {[
              { id: 'faq', label: 'FAQ' },
              { id: 'terms', label: 'Terms of Service' },
              { id: 'privacy', label: 'Privacy Policy' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id as LegalTab)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body with Generous Breathing Room */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6 text-sm leading-relaxed overscroll-contain">
          
          {/* TAB 1: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Search Bar with Clear Button */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions (e.g. proof, cred, streaks, stories, safety)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSelectedCategory(cat.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-950 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Accordion FAQ List */}
              <div className="space-y-2.5 pt-1">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className={`rounded-2xl border transition-all duration-150 overflow-hidden ${
                          isExpanded
                            ? 'border-slate-700 bg-slate-900/70 shadow-md'
                            : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700/60 hover:bg-slate-900/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full flex items-center justify-between p-4 sm:p-4.5 text-left gap-3.5 cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                              {faq.categoryLabel}
                            </span>
                            <span className="font-semibold text-white text-xs sm:text-sm leading-snug">
                              {faq.question}
                            </span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-white' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4.5 pt-2 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 space-y-2.5 animate-fade-in">
                            <p>{faq.answer}</p>
                            {faq.bullets && faq.bullets.length > 0 && (
                              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400 pt-1">
                                {faq.bullets.map((bullet, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 text-center space-y-2">
                    <p className="text-slate-400 text-xs">No questions matched your search criteria.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="text-xs font-semibold text-pink-400 hover:underline cursor-pointer"
                    >
                      Clear search & reset filters
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Support Banner */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#121622] to-[#0c0f16] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 mt-6">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Still have questions?</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Our team is always available to help with verification, account inquiries, or bug reports.
                  </p>
                </div>
                <a
                  href="mailto:support@dare.app"
                  className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold px-4 py-2 text-xs transition-colors shrink-0 shadow-sm"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Contact Support</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-6 text-xs sm:text-sm text-slate-300 animate-fade-in leading-relaxed">
              
              {/* Document Header */}
              <div className="border-b border-slate-800 pb-5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Legal &amp; User Agreement
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  DARE Terms of Service
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Effective Date: January 1, 2026 · Platform: DARE · Version 2.4
                </p>
              </div>

              {/* Safety & Voluntary Participation Notice */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Safety Protocol &amp; Voluntary Participation</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  All challenges, activities, and physical dares proposed on DARE are undertaken <strong className="text-white">strictly on a voluntary basis and entirely at your own risk</strong>.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
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
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  1. Acceptance of Terms
                </h4>
                <p className="text-xs text-slate-300">
                  By accessing or using the DARE platform, creating challenges, accepting dares, or submitting video/photo proof, you agree to be legally bound by these Terms of Service. If you do not agree to these terms, you must discontinue use of the platform.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  2. User Accounts &amp; Conduct
                </h4>
                <p className="text-xs text-slate-300">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted through your account. You agree to provide accurate information and to conduct yourself respectfully toward all community members.
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  3. Cred Utility Metric &amp; Virtual Goods
                </h4>
                <p className="text-xs text-slate-300">
                  Cred is an internal virtual utility metric designed solely for platform engagement, reputation, and community leaderboards. Cred does not constitute currency, holds zero monetary value, and cannot be exchanged or redeemed for fiat currency.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  4. Community Standards &amp; Prohibited Content
                </h4>
                <p className="text-xs text-slate-300">
                  Users agree not to upload proof or propose challenges involving explicit adult content, non-consensual imagery, harassment, hate speech, dangerous stunts, or intellectual property infringement. Violations result in immediate content removal and account termination.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  5. Termination &amp; Modification
                </h4>
                <p className="text-xs text-slate-300">
                  We reserve the right to suspend or terminate accounts that breach these Terms or compromise community safety. These terms may be updated periodically, with continued use of the platform constituting acceptance of any revisions.
                </p>
              </div>

              {/* Support Contact */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 mt-6">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Questions About Terms?</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Contact our legal and compliance team directly.</p>
                </div>
                <a
                  href="mailto:support@dare.app"
                  className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold px-4 py-2 text-xs transition-colors shrink-0 shadow-sm"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Contact Support</span>
                </a>
              </div>

            </div>
          )}

          {/* TAB 3: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 text-xs sm:text-sm text-slate-300 animate-fade-in leading-relaxed">
              
              {/* Document Header */}
              <div className="border-b border-slate-800 pb-5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Privacy &amp; Data Protection
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  DARE Privacy Policy
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Effective Date: January 1, 2026 · Platform: DARE · Version 2.4
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  1. Information We Collect
                </h4>
                <p className="text-xs text-slate-300">
                  When you access DARE, we collect information necessary to provide and secure our services:
                </p>
                <div className="grid gap-3 sm:grid-cols-2 pt-1">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
                    <p className="text-xs font-semibold text-white">Account Details</p>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      When signing in, we receive your authentication identifier, primary email address, display handle, and profile avatar.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
                    <p className="text-xs font-semibold text-white">Proof &amp; Activity Media</p>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Photos and video clips submitted as proof are processed strictly to verify challenge completion and display on authorized feeds.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  2. How Information is Used
                </h4>
                <p className="text-xs text-slate-300">
                  Information collected is utilized exclusively to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
                  <li>Authenticate your account and maintain platform sessions.</li>
                  <li>Verify completion of challenges and update community leaderboards.</li>
                  <li>Prevent abuse, fraud, harassment, and policy violations.</li>
                  <li>Deliver optional notifications and updates you have chosen to receive.</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  3. Zero Data Selling Commitment
                </h4>
                <p className="text-xs text-slate-300">
                  We do not sell, rent, monetize, or trade your personal data or submitted media to third-party data brokers or advertising networks. Data is processed solely to operate the DARE social platform.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  4. Data Retention &amp; User Rights
                </h4>
                <p className="text-xs text-slate-300">
                  You retain ownership of your content. You may update your profile information, manage notification preferences, or request full deletion of your account and associated media at any time through your Profile Settings.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  5. Security Standards
                </h4>
                <p className="text-xs text-slate-300">
                  We maintain robust technical, administrative, and operational safeguards to protect your personal information against unauthorized access, loss, or misuse.
                </p>
              </div>

              {/* Support Contact */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 mt-6">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Have Privacy Questions?</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Reach out to our team directly for any data inquiries.</p>
                </div>
                <a
                  href="mailto:support@dare.app"
                  className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold px-4 py-2 text-xs transition-colors shrink-0 shadow-sm"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Contact Support</span>
                </a>
              </div>

            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="relative z-10 border-t border-slate-800/80 bg-[#080b11] px-6 py-3.5 flex items-center justify-between text-xs text-slate-400">
          <span className="text-slate-500 text-[11px] font-mono">
            DARE Platform Documentation
          </span>
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer border border-slate-700/80"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
