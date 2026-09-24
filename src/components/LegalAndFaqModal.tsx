import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  FileText,
  ShieldCheck,
  Lock,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Mail,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';

export type LegalTab = 'faq' | 'terms' | 'safety' | 'privacy';

interface LegalAndFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: LegalTab;
}

interface FaqItem {
  id: string;
  category: 'general' | 'dares' | 'ai' | 'streaks' | 'economy' | 'safety';
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'what-is-dare',
    category: 'general',
    question: 'What is DARE and how does it work?',
    answer:
      'DARE is a modern social challenge platform where members create, discover, and complete real-world challenges.\n\nYou can accept open community challenges or challenge friends directly, submit photo or video evidence, build daily activity streaks, and earn Cred points verified by our automated AI verification system.',
  },
  {
    id: 'how-to-create-dare',
    category: 'dares',
    question: 'How do I create and post a challenge?',
    answer:
      'Click the "Create Dare" button in the top navigation bar. Enter a clear title, description, time limit (e.g. 24 or 48 hours), and choose the required proof type (Photo, Video, or Link).\n\nYou can optionally attach a Cred bounty reward from your wallet. Challenges can be made public to the entire community or targeted directly to a specific friend.',
  },
  {
    id: 'how-to-accept',
    category: 'dares',
    question: 'How do I accept a challenge and submit proof?',
    answer:
      'Browse open challenges on the main feed and click "Accept Dare". A countdown timer will begin.\n\nOnce you complete the challenge in real life, click "Submit Proof", upload your photo or video or enter a link, add any brief notes, and submit. The AI verification system will evaluate your submission against the creator’s instructions.',
  },
  {
    id: 'how-ai-verification-works',
    category: 'ai',
    question: 'How does AI proof verification work?',
    answer:
      'When you submit proof, our multimodal AI (powered by Google Gemini) analyzes your photo or video evidence against the challenge instructions and criteria set by the creator.\n\nIt checks for authenticity, completeness, and effort. Once approved, your Cred bounty and experience points (XP) are immediately awarded to your profile.',
  },
  {
    id: 'dispute-resolution',
    category: 'ai',
    question: 'What happens if my proof is rejected?',
    answer:
      'If your proof is not approved, the AI provides a specific reason explaining what criteria was missing or unclear.\n\nYou can submit updated or clearer proof anytime before the challenge timer expires. If you believe your submission was evaluated incorrectly, you can also reach out to support for a manual review.',
  },
  {
    id: 'what-is-cred',
    category: 'economy',
    question: 'What is Cred (CR) and what can I do with it?',
    answer:
      'Cred is DARE’s in-app reward and reputation point system. You can use Cred across several features:\n\n' +
      '• Funding Bounties: Stake Cred as reward pots when creating challenges for others to win.\n' +
      '• The Armory Store: Unlock XP boosters, streak protection shields, and profile titles.\n' +
      '• 1v1 Duels & Wagers: Challenge friends in head-to-head dares with Cred stakes on the line.\n' +
      '• Season Pass: Advance tiers to unlock exclusive cosmetic customization.\n\n' +
      'Please note: Cred is strictly a virtual utility point system for platform gameplay and leaderboards, with no cash or monetary value.',
  },
  {
    id: 'how-do-i-earn-cred',
    category: 'economy',
    question: 'How do I earn more Cred?',
    answer:
      'You can earn Cred through several activities on the platform:\n\n' +
      '• Completing open community challenges verified by the AI.\n' +
      '• Winning 1v1 duels against rivals.\n' +
      '• Completing your Daily Missions.\n' +
      '• Maintaining daily action streaks and achieving milestone badges.\n' +
      '• Leveling up through the Season Pass track.\n' +
      '• Claiming real-world GPS Drop Zones.',
  },
  {
    id: 'streaks-and-milestones',
    category: 'streaks',
    question: 'How do Streaks and Milestone Badges work?',
    answer:
      'Performing at least one core action each day—such as creating a dare, accepting a challenge, or submitting proof—keeps your daily streak alive.\n\nReaching consecutive milestones (3, 7, 14, 30 days and beyond) upgrades your profile badge, boosts your leaderboard standing, and awards bonus Cred.',
  },
  {
    id: 'direct-challenge-rules',
    category: 'dares',
    question: 'Can I challenge a specific friend or rival directly?',
    answer:
      'Yes! When creating a challenge, select "Target: Direct Rival" and enter your friend’s username (@handle). The challenge will be routed privately to them with a direct invitation to accept or decline.',
  },
  {
    id: 'cred-transaction-history',
    category: 'economy',
    question: 'Where can I view my Cred transaction ledger?',
    answer:
      'Click your profile avatar in the top navigation and select "Cred Transaction Log". This opens a detailed record of all your earnings, payouts, Armory purchases, and wagers with full timestamps.',
  },
  {
    id: 'prohibited-dares',
    category: 'safety',
    question: 'What types of challenges are strictly prohibited?',
    answer:
      'We maintain a zero-tolerance policy against any content that involves physical danger or self-harm, illegal activities, property vandalism, trespassing, harassment, hate speech, non-consensual pranks, or sharing private personal information.\n\nAny challenge that violates these guidelines is promptly removed and the account may be suspended.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'general', label: 'General' },
  { id: 'dares', label: 'Challenges & Proof' },
  { id: 'ai', label: 'AI Verification' },
  { id: 'economy', label: 'Cred & Rewards' },
  { id: 'streaks', label: 'Streaks' },
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
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
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
      id="legal-faq-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="legal-faq-modal-container"
        className="relative flex flex-col w-full max-w-4xl max-h-[88vh] rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Help & Information Center
              </h2>
              <p className="text-xs text-slate-400">
                Frequently asked questions, platform guidelines, safety policies, and terms.
              </p>
            </div>
          </div>

          <button
            id="close-legal-modal-btn"
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clean Tab Navigation */}
        <div className="flex items-center border-b border-slate-800/80 bg-slate-900/40 px-6 overflow-x-auto scrollbar-none gap-1">
          <button
            id="tab-faq"
            type="button"
            onClick={() => handleTabChange('faq')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-cyan-400 text-white bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Frequently Asked Questions</span>
          </button>

          <button
            id="tab-terms"
            type="button"
            onClick={() => handleTabChange('terms')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-cyan-400 text-white bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Terms of Service</span>
          </button>

          <button
            id="tab-safety"
            type="button"
            onClick={() => handleTabChange('safety')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'safety'
                ? 'border-rose-400 text-rose-300 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-rose-400" />
            <span>Safety Guidelines</span>
          </button>

          <button
            id="tab-privacy"
            type="button"
            onClick={() => handleTabChange('privacy')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-cyan-400 text-white bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-5">
              {/* Clean Search and Category Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="faq-search-input"
                    type="text"
                    placeholder="Search questions (e.g. proof, cred, streak, verification)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-14 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSelectedCategory(cat.id);
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-slate-800/60'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="space-y-2.5">
                {filteredFaqs.length === 0 ? (
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-8 text-center">
                    <p className="text-sm text-slate-400">No questions matched your search.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="mt-2 text-xs font-medium text-cyan-400 hover:underline"
                    >
                      Reset search & filters
                    </button>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isOpen = expandedFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className={`rounded-xl border transition-all ${
                          isOpen
                            ? 'border-cyan-500/30 bg-slate-900/80'
                            : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700/80 hover:bg-slate-900/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-center justify-between p-4 text-left gap-3"
                        >
                          <span className="text-sm font-medium text-white">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-cyan-400 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-800/60 px-4 pb-4 pt-3 text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                            <p>{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Support & Assistance Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Have questions or need assistance with your account?</span>
                </div>
                <a
                  href="mailto:daredaylabs@gmail.com?subject=DARE%20Support%20Inquiry"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-all shrink-0"
                >
                  <span>Contact Support</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Terms of Service
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official platform terms governing dares, community participation, and Cred points.
                  </p>
                </div>
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                    window.history.pushState({}, '', '/terms');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Standalone Page (/terms)
                </a>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-300">
                      Voluntary Assumption of Risk & Personal Responsibility
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      DARE is a platform for creative, mental, athletic, and fun social challenges. By
                      using DARE, you explicitly acknowledge that all activities are undertaken
                      voluntarily at your own risk. Never attempt any challenge that compromises your
                      physical health, personal safety, or legal compliance.
                    </p>
                  </div>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  1. Acceptance of Terms
                </h3>
                <p>
                  By accessing, browsing, creating challenges, or submitting proof on DARE, you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of the platform.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  2. Eligibility & Account Conduct
                </h3>
                <p>
                  Users must be at least 13 years of age. You agree to provide authentic representations in your profile and refrain from manipulating challenge proofs or submitting deceptive multimedia content.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  3. Challenge Creation & Prohibited Content
                </h3>
                <p>
                  You retain responsibility for all challenges created under your account. You may not post any challenge that involves:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
                  <li>Physical bodily harm, self-injury, or reckless endangerment</li>
                  <li>Violations of municipal, state, national, or international law</li>
                  <li>Harassment, stalking, doxxing, or defamation</li>
                  <li>Trespassing on private property, destruction of property, or vandalism</li>
                  <li>Sexually explicit material, non-consensual imagery, or hate speech</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  4. Automated AI Verification
                </h3>
                <p>
                  Submissions are reviewed using artificial intelligence models. While designed for objective criteria matching, AI evaluations are provided "as-is". Platform operators reserve the right to review, adjust, or overturn verification decisions upon request.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  5. Virtual Currency ("Cred") & Badges
                </h3>
                <p>
                  Cred points, streaks, and digital badges are non-transferable digital metrics intended solely for interactive gamification. Cred has no monetary cash value, cannot be redeemed for real currency, and does not constitute a financial investment or security.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  6. Media Ownership & License
                </h3>
                <p>
                  By submitting proof (including images, video recordings, or notes), you grant DARE a worldwide license to display and verify your submission on the platform feed and proof viewer. You affirm that you hold all necessary rights for your uploaded content.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  7. Limitation of Liability
                </h3>
                <p>
                  Under no circumstances shall DARE or its operators be liable for any direct, indirect, incidental, or consequential damages resulting from your participation in challenges or interactions with other users.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: SAFETY GUIDELINES */}
          {activeTab === 'safety' && (
            <div className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-rose-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      DARE Community Safety Charter
                    </h3>
                    <p className="text-xs text-rose-200/80 mt-0.5">
                      Fun and positive challenges only. Reckless behavior and harm are strictly prohibited.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2 font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Encouraged & Allowed</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    <li>Creative arts (sketching, photography, music, coding)</li>
                    <li>Fitness & athletic milestones (calisthenics, running, cold plunge)</li>
                    <li>Lighthearted, wholesome social interactions</li>
                    <li>Skill-building feats (speed solving, trivia, puzzles)</li>
                    <li>Acts of kindness and community service</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2 font-semibold text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Strictly Prohibited</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    <li>Consuming non-food items or harmful substances</li>
                    <li>Rooftop stunts or heights without certified safety gear</li>
                    <li>Harassing non-consenting strangers or retail staff</li>
                    <li>Distracted driving or traffic obstruction</li>
                    <li>Hate speech, threats, or privacy violations</li>
                  </ul>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-white">
                  3 Principles of Safe Challenges
                </h4>
                <div className="space-y-2.5">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                    <span className="font-semibold text-cyan-300 text-xs">1. Clear & Achievable</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Specific guidelines prevent misunderstandings and unsafe improvisations. Clearly state what proof is expected.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                    <span className="font-semibold text-cyan-300 text-xs">2. Respect Surroundings</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Challenges must never damage property, violate local ordinances, or distress bystanders.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                    <span className="font-semibold text-cyan-300 text-xs">3. Consent & Discretion</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Direct challenges can always be declined without any penalty to user score or standing.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-white">
                    Encountered an Unsafe Challenge?
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Help keep our community safe. Report safety concerns directly to our moderation team.
                  </p>
                </div>
                <a
                  href="mailto:daredaylabs@gmail.com?subject=Urgent%20Safety%20Report%20-%20DARE"
                  className="rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium px-3.5 py-1.5 transition-all shadow-sm shrink-0"
                >
                  Report Violation
                </a>
              </section>
            </div>
          )}

          {/* TAB 4: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-cyan-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Privacy Policy
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Learn how your data and media are protected on DARE.
                    </p>
                  </div>
                </div>
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                    window.history.pushState({}, '', '/privacy');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Standalone Page (/privacy)
                </a>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  1. Information We Collect
                </h3>
                <p>
                  We collect account username/handle, display name, avatar link, challenge participation records, streak tallies, and submitted proof media. We do not sell personal information to third parties or data brokers.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  2. AI Proof Processing
                </h3>
                <p>
                  When you submit proof for verification, photos or videos are processed transiently through Google Gemini AI solely to evaluate challenge criteria completion. Uploaded media is not used to train generic AI models without consent.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  3. Media Storage & Public Feed
                </h3>
                <p>
                  Proof submitted for public challenges is visible to community members on the challenge feed and proof viewer. You may request deletion of your proof submissions at any time by contacting support.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  4. Your Rights & Data Requests
                </h3>
                <p>
                  You have the right to request access to your account records, correct any profile information, or request complete deletion of your account. For inquiries, reach out to our privacy desk at{' '}
                  <span className="text-cyan-300 font-medium">daredaylabs@gmail.com</span>.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Clean Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-900/60 px-6 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>DARE Help & Guidelines</span>
            <span aria-hidden="true">·</span>
            <span>Updated September 2026</span>
          </div>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-medium text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
