import React, { useState } from 'react';
import { Page } from '../types';
import { 
  Award, Shield, FileSpreadsheet, QrCode, TrendingUp, Users, Settings, HelpCircle, 
  ArrowRight, Check, CheckCircle, HelpCircle as HelpIcon, Play, RefreshCw, Send, FileText, Zap, ChevronDown
} from 'lucide-react';

interface PublicWebsiteProps {
  onNavigate: (page: Page) => void;
  activeSubPage: 'home' | 'features' | 'docs' | 'pricing' | 'contact';
}

export default function PublicWebsite({ onNavigate, activeSubPage }: PublicWebsiteProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [docSearch, setDocSearch] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Faq list
  const faqs = [
    {
      q: 'How does QR Code Verification work?',
      a: 'Each certificate generated on CertFI contains an encrypted, unique cryptographic hash embedded in a QR code. When scanned, it immediately resolves to our tamper-proof server ledger, confirming the participant\'s name, certificate legitimacy, issuance timestamp, and event details without exposing sensitive metadata.'
    },
    {
      q: 'Can we integrate CertFI with our existing LMS (e.g., Moodle, Canvas, or custom)?',
      a: 'Yes. CertFI offers modular REST APIs and developer-friendly webhooks that trigger certificate generation immediately upon a participant passing a course, scoring a benchmark, or completing an event. Detailed API documentation is available under our developer portal.'
    },
    {
      q: 'Do you support custom background templates and signature layers?',
      a: 'Absolutely. You can upload high-resolution PNG, JPG, or PDF backdrop structures. Our Visual Template Editor allows you to place custom static images, digital signatures, and responsive typography placeholders with dynamic snapping and grid alignment.'
    },
    {
      q: 'What formatting guarantees tamper-detection?',
      a: 'Our platforms embed a secure digital watermark on the document canvas and record a SHA-256 integrity signature on our public-facing immutable ledger. Any attempt to modify names, grades, or serial IDs will fail the QR hash matching protocols.'
    }
  ];

  // pricing cards data
  const pricingPlans = [
    {
      name: 'Starter',
      desc: 'Ideal for independent trainers, bootcamps, and early-stage startup courses.',
      price: pricingPeriod === 'yearly' ? 19 : 25,
      limit: 'Up to 250 certificates / mo',
      features: [
        'Visual Layout Designer',
        'Standard Email Delivery',
        'Public Ledger QR Verification',
        'CSV/Excel Participant Upload',
        'CertFI Brand Watermark',
        'Standard Support'
      ],
      cta: 'Get Started Free',
      popular: false
    },
    {
      name: 'Professional',
      desc: 'Perfect for established academies, universities, and technical seminars.',
      price: pricingPeriod === 'yearly' ? 79 : 99,
      limit: 'Up to 2,500 certificates / mo',
      features: [
        'Everything in Starter',
        'No CertFI Watermarking',
        'Custom Sender Email Domains',
        'Multi-user Roles (up to 5 users)',
        'Full Analytics & History logs',
        'Automated Signature Injection',
        'API & Webhook Integrations',
        'Priority Slack & Email Support'
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      desc: 'For global corporations, universities, and high-frequency issuers.',
      price: pricingPeriod === 'yearly' ? 249 : 299,
      limit: 'Unlimited certificate generation',
      features: [
        'Everything in Professional',
        'Custom PDF metadata embedding',
        'Dedicated IP Address',
        'SAML SSO & IAM Integration',
        '99.99% Guaranteed Service SLA',
        'On-Prem / Private Cloud ledger options',
        'Custom Font & Branding library',
        '24/7 Phone & Account Manager'
      ],
      cta: 'Contact Corporate Sales',
      popular: false
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => setContactSuccess(false), 5000);
  };

  return (
    <div id="public-website-root" className="min-h-screen bg-[#FAF9F6] text-neutral-900 font-sans">
      
      {/* HEADER SECTION (Japanese/Swiss Modernism style: Thin borders, solid black/red accents) */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2 font-display font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
              <span className="w-8 h-8 bg-[#0F0F0F] flex items-center justify-center text-white font-mono text-sm font-bold rounded">
                C
              </span>
              <span>Cert<span className="text-[#E52E40]">FI</span></span>
            </button>
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => onNavigate('home')} className={`font-medium text-sm transition-colors hover:text-[#E52E40] ${activeSubPage === 'home' ? 'text-[#E52E40]' : 'text-neutral-600'}`}>Home</button>
              <button onClick={() => onNavigate('features')} className={`font-medium text-sm transition-colors hover:text-[#E52E40] ${activeSubPage === 'features' ? 'text-[#E52E40]' : 'text-neutral-600'}`}>Features</button>
              <button onClick={() => onNavigate('docs')} className={`font-medium text-sm transition-colors hover:text-[#E52E40] ${activeSubPage === 'docs' ? 'text-[#E52E40]' : 'text-neutral-600'}`}>Documentation</button>
              <button onClick={() => onNavigate('pricing')} className={`font-medium text-sm transition-colors hover:text-[#E52E40] ${activeSubPage === 'pricing' ? 'text-[#E52E40]' : 'text-neutral-600'}`}>Pricing</button>
              <button onClick={() => onNavigate('contact')} className={`font-medium text-sm transition-colors hover:text-[#E52E40] ${activeSubPage === 'contact' ? 'text-[#E52E40]' : 'text-neutral-600'}`}>Contact</button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('login')} className="text-neutral-600 text-sm font-medium hover:text-[#0F0F0F] transition-colors px-3 py-2">
              Login
            </button>
            <button onClick={() => onNavigate('register')} className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white text-sm font-medium px-4 py-2 rounded transition-colors duration-300">
              Register
            </button>
            <button onClick={() => onNavigate('dashboard')} className="hidden lg:flex items-center gap-1 bg-[#E52E40] hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors duration-300">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* RENDER DYNAMIC PAGES IN CLIENT VIEW */}
      {activeSubPage === 'home' && (
        <div>
          {/* HERO SECTION */}
          <section className="relative pt-12 pb-20 border-b border-neutral-200 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#E52E40]/10 border border-[#E52E40]/20 px-3 py-1 text-[#E52E40] font-mono text-xs font-semibold rounded-full uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 inline" /> v2.4 Secure Architecture Live
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#0F0F0F] leading-none">
                  Smart Certificate <br />
                  <span className="text-[#E52E40] underline decoration-neutral-800 decoration-4">Automation</span> & Trust.
                </h1>
                <p className="text-lg text-neutral-600 max-w-xl">
                  Visually design elegant layouts, import recipient rosters, generate credentials in bulk, and guarantee authenticity via indestructible cryptographic QR verification.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button onClick={() => onNavigate('register')} className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white font-semibold px-6 py-3.5 rounded-md flex items-center gap-2 transition-all duration-300 hover:shadow-lg">
                    Build Certificate Now <ArrowRight className="w-5 h-5" />
                  </button>
                  <button onClick={() => onNavigate('docs')} className="border-2 border-neutral-800 text-neutral-800 hover:bg-neutral-800 hover:text-white font-semibold px-6 py-3.5 rounded-md flex items-center gap-2 transition-all">
                    Developer Docs <FileText className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Stats list */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-neutral-200">
                  <div>
                    <div className="text-3xl font-display font-bold text-[#0F0F0F]">4.8M+</div>
                    <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Verified Credentials</div>
                  </div>
                  <div>
                    <div className="text-3xl font-display font-bold text-[#0F0F0F]">12,000+</div>
                    <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Global Academies</div>
                  </div>
                  <div>
                    <div className="text-3xl font-display font-bold text-[#E52E40]">99.9%</div>
                    <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Ledger Uptime</div>
                  </div>
                </div>
              </div>

              {/* Japanese/Swiss design layout mockup */}
              <div className="lg:col-span-5 relative">
                <div className="absolute -top-12 -left-12 w-64 h-64 bg-rose-200/40 rounded-full blur-3xl z-0"></div>
                <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-neutral-300/30 rounded-full blur-3xl z-0"></div>
                
                <div className="relative bg-white border-2 border-neutral-800 p-6 shadow-[8px_8px_0px_0px_rgba(15,15,15,1)] rounded-lg z-10 transition-transform hover:-translate-y-1">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#E52E40]"></span>
                      <span className="text-xs font-mono font-medium tracking-tight text-neutral-500">CANVAS_EDITOR_PREVIEW.JSX</span>
                    </div>
                    <span className="bg-neutral-100 px-2 py-0.5 text-[10px] font-mono rounded text-neutral-600">SCALE: 100%</span>
                  </div>

                  {/* Certificate graphic placeholder */}
                  <div className="relative aspect-[1.4/1] bg-[#FDFCF7] border border-neutral-200 rounded p-4 overflow-hidden flex flex-col justify-between">
                    {/* Tiny geometric art lines */}
                    <div className="absolute inset-0 border-8 border-double border-neutral-800 opacity-20 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#E52E40] rotate-45 translate-x-8 -translate-y-8"></div>
                    
                    <div className="text-center">
                      <div className="text-[9px] font-mono tracking-widest text-neutral-400">CERTIFICATE OF RECOGNITION</div>
                      <div className="text-sm font-display font-extrabold text-neutral-800 tracking-tight mt-1">EMILY WATSON</div>
                      <div className="w-12 h-[1px] bg-[#E52E40] mx-auto my-1.5"></div>
                      <p className="text-[7px] text-neutral-400 leading-tight px-4 max-w-[200px] mx-auto">
                        for meritorious architectural achievements in smart backend engineering operations.
                      </p>
                    </div>

                    <div className="flex items-end justify-between px-2">
                      <div className="text-left">
                        <div className="text-[6px] font-mono text-neutral-400">LEDGER ID:</div>
                        <div className="text-[7px] font-mono text-[#0F0F0F] font-bold">#FI-2026-X99</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] font-display font-medium text-neutral-800 border-b border-neutral-300 pb-0.5 px-3">Kenji Sato</div>
                        <div className="text-[5px] text-neutral-400 mt-0.5">DIRECTOR SIGNATURE</div>
                      </div>
                      <div className="w-8 h-8 bg-neutral-200 flex items-center justify-center rounded">
                        <QrCode className="w-6 h-6 text-neutral-800" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-neutral-500 font-mono">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span> Active Placeholders</span>
                    <span>3 layers configured</span>
                  </div>
                </div>

                {/* Customer Logos Placeholder */}
                <div className="mt-8 text-center">
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">TRUSTED BY INDUSTRY TITANS</p>
                  <div className="flex items-center justify-center gap-6 mt-3 opacity-60 grayscale">
                    <span className="font-display font-bold tracking-tighter text-sm">TOKYO_LAB</span>
                    <span className="font-mono font-bold text-sm">FI_CO_JP</span>
                    <span className="font-sans font-bold italic text-sm">CYBER_DEFENSE</span>
                    <span className="font-display font-light text-sm">INNOV_ST</span>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* PRODUCT OVERVIEW SECTION */}
          <section className="py-20 bg-white border-b border-neutral-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h2 className="text-xs font-mono text-[#E52E40] uppercase tracking-widest font-semibold">PRODUCT OVERVIEW</h2>
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0F0F0F]">
                  Enterprise-Grade Certificate Infrastructure
                </h3>
                <p className="text-neutral-500">
                  CertFI unifies visual digital craftsmanship with strict operational tracking. Empower your brand with certificates that people can actually trust.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                
                <div className="border border-neutral-200 p-8 rounded-lg hover:border-[#E52E40] transition-colors group">
                  <div className="w-12 h-12 bg-[#0F0F0F] text-white flex items-center justify-center rounded mb-6 group-hover:bg-[#E52E40] transition-colors">
                    <Award className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold mb-2 text-[#0F0F0F]">Drag-And-Drop Layout Studio</h4>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                    Drop dynamic name placeholders, custom issue dates, watermarks, signature SVGs, and automated secure QR modules seamlessly with instant snapping.
                  </p>
                  <button onClick={() => onNavigate('register')} className="text-xs font-bold text-[#E52E40] inline-flex items-center gap-1 hover:underline">
                    Explore Editor <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="border border-neutral-200 p-8 rounded-lg hover:border-[#E52E40] transition-colors group">
                  <div className="w-12 h-12 bg-[#0F0F0F] text-white flex items-center justify-center rounded mb-6 group-hover:bg-[#E52E40] transition-colors">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold mb-2 text-[#0F0F0F]">Bulk CSV / Excel Generation</h4>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                    Import lists of thousands of participants. CertFI runs automatic column schema matching, duplicates pruning, email validation, and background processing.
                  </p>
                  <button onClick={() => onNavigate('register')} className="text-xs font-bold text-[#E52E40] inline-flex items-center gap-1 hover:underline">
                    View CSV Mechanics <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="border border-neutral-200 p-8 rounded-lg hover:border-[#E52E40] transition-colors group">
                  <div className="w-12 h-12 bg-[#0F0F0F] text-white flex items-center justify-center rounded mb-6 group-hover:bg-[#E52E40] transition-colors">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold mb-2 text-[#0F0F0F]">Immutable QR Verification</h4>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                    Instantly authenticate any credential using the built-in smartphone scanner. Eliminates certificate fabrication, resume inflating, and forgery once and for all.
                  </p>
                  <button onClick={() => onNavigate('verification')} className="text-xs font-bold text-[#E52E40] inline-flex items-center gap-1 hover:underline">
                    Try Live Verification <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          </section>

          {/* INTERACTIVE WORKFLOW SECTION */}
          <section className="py-20 bg-[#FAF9F6] border-b border-neutral-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-xl mx-auto space-y-4">
                <h2 className="text-xs font-mono text-[#E52E40] uppercase tracking-widest font-semibold">THE PROCESS</h2>
                <h3 className="text-3xl font-bold tracking-tight">How CertFI Power Automates Your Delivery</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-16 text-center">
                
                <div className="relative bg-white border border-neutral-200 p-6 rounded-md">
                  <div className="w-8 h-8 bg-neutral-100 text-neutral-800 flex items-center justify-center font-mono font-bold text-xs rounded-full mx-auto mb-4 border border-neutral-300">
                    01
                  </div>
                  <h5 className="font-bold text-sm mb-1 text-[#0F0F0F]">Upload Template</h5>
                  <p className="text-xs text-neutral-500">Provide high-res PNG, JPG or PDF frame structure.</p>
                  <div className="hidden md:block absolute top-10 -right-4 translate-x-1.5 z-20 text-neutral-300 font-bold text-xl">→</div>
                </div>

                <div className="relative bg-white border border-neutral-200 p-6 rounded-md">
                  <div className="w-8 h-8 bg-[#E52E40] text-white flex items-center justify-center font-mono font-bold text-xs rounded-full mx-auto mb-4">
                    02
                  </div>
                  <h5 className="font-bold text-sm mb-1 text-[#0F0F0F]">Place Variables</h5>
                  <p className="text-xs text-neutral-500">Overlay name, date, signature, and QR placeholders.</p>
                  <div className="hidden md:block absolute top-10 -right-4 translate-x-1.5 z-20 text-neutral-300 font-bold text-xl">→</div>
                </div>

                <div className="relative bg-white border border-neutral-200 p-6 rounded-md">
                  <div className="w-8 h-8 bg-neutral-100 text-neutral-800 flex items-center justify-center font-mono font-bold text-xs rounded-full mx-auto mb-4 border border-neutral-300">
                    03
                  </div>
                  <h5 className="font-bold text-sm mb-1 text-[#0F0F0F]">Import Roster</h5>
                  <p className="text-xs text-neutral-500">Upload participant list via Excel/CSV or API endpoint.</p>
                  <div className="hidden md:block absolute top-10 -right-4 translate-x-1.5 z-20 text-neutral-300 font-bold text-xl">→</div>
                </div>

                <div className="relative bg-white border border-neutral-200 p-6 rounded-md">
                  <div className="w-8 h-8 bg-neutral-100 text-neutral-800 flex items-center justify-center font-mono font-bold text-xs rounded-full mx-auto mb-4 border border-neutral-300">
                    04
                  </div>
                  <h5 className="font-bold text-sm mb-1 text-[#0F0F0F]">Bulk Generate</h5>
                  <p className="text-xs text-neutral-500">Render thousands in seconds; deliver instantly via email.</p>
                  <div className="hidden md:block absolute top-10 -right-4 translate-x-1.5 z-20 text-neutral-300 font-bold text-xl">→</div>
                </div>

                <div className="bg-white border-2 border-neutral-800 p-6 rounded-md shadow-[4px_4px_0px_0px_rgba(15,15,15,1)]">
                  <div className="w-8 h-8 bg-green-600 text-white flex items-center justify-center font-mono font-bold text-xs rounded-full mx-auto mb-4">
                    05
                  </div>
                  <h5 className="font-bold text-sm mb-1 text-[#0F0F0F]">Verify Instantly</h5>
                  <p className="text-xs text-neutral-500">Scan secure QR block to audit the immutable metadata.</p>
                </div>

              </div>
            </div>
          </section>

          {/* FAQ SECTION */}
          <section className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-6">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-xs font-mono text-[#E52E40] uppercase tracking-widest font-semibold">QUESTIONS & HELP</h2>
                <h3 className="text-3xl font-bold tracking-tight text-[#0F0F0F]">Frequently Asked Questions</h3>
                <p className="text-neutral-500 text-sm">Everything you need to know about the CertFI secure delivery protocols.</p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border border-neutral-200 rounded-lg overflow-hidden bg-[#FAF9F6]">
                    <button 
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <span className="font-display font-semibold text-neutral-900">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                    </button>
                    {activeFaq === idx && (
                      <div className="p-6 bg-white border-t border-neutral-200 text-sm text-neutral-600 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* CORE FEATURES PAGE */}
      {activeSubPage === 'features' && (
        <section className="py-16 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-mono text-[#E52E40] uppercase tracking-widest font-bold bg-[#E52E40]/10 px-3 py-1 rounded">PLATFORM FEATURES</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#0F0F0F]">Every Tool to Issue, Manage & Audit Credentials</h1>
            <p className="text-neutral-600 text-lg">CertFI integrates precision graphics software tools with compliance tracking, tamper-proofing, and analytical reporting metrics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-neutral-200 p-8 rounded-lg">
              <Award className="w-8 h-8 text-[#E52E40] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-[#0F0F0F]">Visual Canvas Editor</h3>
              <p className="text-sm text-neutral-500">Full-fledged layout suite mirroring professional CAD software. Drag, scale, lock, and style layers down to exact pixel parameters.</p>
            </div>
            <div className="bg-white border border-neutral-200 p-8 rounded-lg">
              <FileSpreadsheet className="w-8 h-8 text-[#E52E40] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-[#0F0F0F]">Excel & CSV Automapper</h3>
              <p className="text-sm text-neutral-500">Forget manual cell copying. Import files containing thousands of recipient records, with interactive column mapping in real-time.</p>
            </div>
            <div className="bg-white border border-neutral-200 p-8 rounded-lg">
              <QrCode className="w-8 h-8 text-[#E52E40] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-[#0F0F0F]">Smart QR Generation</h3>
              <p className="text-sm text-neutral-500">Embedded QR code overlays are configured instantly. They automatically point to the decentralized, encrypted cert verification endpoint.</p>
            </div>
            <div className="bg-white border border-neutral-200 p-8 rounded-lg">
              <Shield className="w-8 h-8 text-[#E52E40] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-[#0F0F0F]">Watermarking & Tamper-Detection</h3>
              <p className="text-sm text-neutral-500">Underlay cryptographic watermarks and SHA-256 metadata signatures. Document structures are protected from modification attempts.</p>
            </div>
            <div className="bg-white border border-neutral-200 p-8 rounded-lg">
              <TrendingUp className="w-8 h-8 text-[#E52E40] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-[#0F0F0F]">Analytics & Auditing Logs</h3>
              <p className="text-sm text-neutral-500">Track template performance, verification request histories, and export rates. Gain visibility into exactly where and when credentials get reviewed.</p>
            </div>
            <div className="bg-white border border-neutral-200 p-8 rounded-lg">
              <Users className="w-8 h-8 text-[#E52E40] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-[#0F0F0F]">Organization & IAM Roles</h3>
              <p className="text-sm text-neutral-500">Manage multiple business divisions under a unified billing plan. Assign designer, administrator, and verifier credentials easily.</p>
            </div>
          </div>
        </section>
      )}

      {/* PRICING PAGE */}
      {activeSubPage === 'pricing' && (
        <section className="py-16 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <span className="text-xs font-mono text-[#E52E40] uppercase tracking-widest font-bold">TRANSPARENT TARIFFS</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#0F0F0F]">Simple, Scalable Pricing</h1>
            <p className="text-neutral-500">Start free to build custom certificate templates. Upgrade when scaling deliveries to thousands of global students.</p>
            
            {/* Toggle */}
            <div className="inline-flex items-center gap-3 bg-white p-1.5 rounded-full border border-neutral-200 mt-4">
              <button 
                onClick={() => setPricingPeriod('monthly')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${pricingPeriod === 'monthly' ? 'bg-[#0F0F0F] text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Monthly Billing
              </button>
              <button 
                onClick={() => setPricingPeriod('yearly')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1 ${pricingPeriod === 'yearly' ? 'bg-[#0F0F0F] text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Yearly Billing <span className="bg-[#E52E40] text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 items-stretch">
            {pricingPlans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`bg-white border rounded-xl p-8 flex flex-col justify-between transition-all relative ${plan.popular ? 'border-2 border-neutral-800 shadow-[8px_8px_0px_0px_rgba(229,46,64,0.15)]' : 'border-neutral-200'}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E52E40] text-white font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular Choice
                  </span>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900">{plan.name}</h3>
                  <p className="text-xs text-neutral-500 mt-2 mb-6 min-h-[36px]">{plan.desc}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-neutral-950 font-display">${plan.price}</span>
                    <span className="text-neutral-400 text-sm"> / mo {pricingPeriod === 'yearly' ? '(billed yearly)' : ''}</span>
                    <div className="text-sm font-semibold text-[#E52E40] mt-1">{plan.limit}</div>
                  </div>

                  <hr className="border-neutral-100 my-6" />

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-xs text-neutral-600">
                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => onNavigate('register')}
                  className={`w-full py-3 rounded-md font-semibold text-xs transition-colors ${plan.popular ? 'bg-[#E52E40] hover:bg-rose-700 text-white shadow' : 'bg-neutral-100 hover:bg-[#0F0F0F] hover:text-white text-neutral-800'}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DOCUMENTATION PAGE */}
      {activeSubPage === 'docs' && (
        <section className="py-16 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-neutral-200 rounded p-4">
              <h4 className="font-display font-bold text-xs text-[#E52E40] uppercase tracking-wider mb-3">GETTING STARTED</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#quickstart" className="text-neutral-800 font-semibold hover:text-[#E52E40] block py-1">Quickstart Guide</a></li>
                <li><a href="#placeholders" className="text-neutral-500 hover:text-neutral-900 block py-1">Using Dynamic Placeholders</a></li>
                <li><a href="#verification-api" className="text-neutral-500 hover:text-neutral-900 block py-1">How QR Hashes Work</a></li>
              </ul>
            </div>
            <div className="bg-white border border-neutral-200 rounded p-4">
              <h4 className="font-display font-bold text-xs text-neutral-800 uppercase tracking-wider mb-3">API REFERENCE</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#auth" className="text-neutral-500 hover:text-[#E52E40] block py-1 font-mono">POST /v1/auth/token</a></li>
                <li><a href="#generate" className="text-neutral-500 hover:text-[#E52E40] block py-1 font-mono">POST /v1/certificates/issue</a></li>
                <li><a href="#verify" className="text-neutral-500 hover:text-[#E52E40] block py-1 font-mono">GET /v1/verify/:certId</a></li>
              </ul>
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-8 bg-white border border-neutral-200 rounded-lg p-8">
            <div className="border-b border-neutral-200 pb-4">
              <h1 className="text-3xl font-extrabold text-[#0F0F0F]">CertFI Developer Documentation</h1>
              <p className="text-neutral-500 text-sm mt-1">Integrate robust, tamper-proof credentials directly inside your enterprise LMS or registration app.</p>
            </div>

            <div id="quickstart" className="space-y-3">
              <h3 className="text-xl font-bold text-neutral-900">1. Instant Quickstart</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                To issue a secure certificate, you must first create a <strong>Template Frame</strong> in our visual editor interface, save it, and then execute an API trigger or drag in a CSV containing column mappings.
              </p>
              <div className="bg-[#0F0F0F] text-[#FAF9F6] p-4 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <span className="text-neutral-400"># Install the SDK</span><br />
                <span className="text-rose-400">npm</span> install @certfi/node-sdk<br /><br />
                <span className="text-neutral-400">// Initialize client</span><br />
                <span className="text-emerald-400">const</span> CertFI = <span className="text-blue-300">require</span>(<span className="text-amber-300">'@certfi/node-sdk'</span>);<br />
                <span className="text-emerald-400">const</span> client = <span className="text-blue-300">new</span> CertFI({"{"} apiKey: <span className="text-amber-300">'cf_live_99f2b84..'</span> {"}"});
              </div>
            </div>

            <hr className="border-neutral-100" />

            <div id="placeholders" className="space-y-3">
              <h3 className="text-xl font-bold text-neutral-900">2. Placeholder Mapping Mechanics</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                When you drag a text component in the visual template canvas, you define its placeholder key using double curly braces: e.g. <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-[#E52E40] font-mono text-xs">{"{{PARTICIPANT_NAME}}"}</code>.
                At runtime, our render engines cross-examine the spreadsheet or JSON payload to dynamically merge variable cells.
              </p>
            </div>
          </main>

        </section>
      )}

      {/* CONTACT PAGE */}
      {activeSubPage === 'contact' && (
        <section className="py-16 max-w-4xl mx-auto px-6">
          <div className="bg-white border-2 border-neutral-800 p-8 md:p-12 rounded-lg shadow-[8px_8px_0px_0px_rgba(15,15,15,1)]">
            <div className="text-center space-y-3 mb-8">
              <span className="text-xs font-mono text-[#E52E40] uppercase tracking-widest font-bold">CONTACT OPERATIONS</span>
              <h1 className="text-3xl font-extrabold text-[#0F0F0F]">Enquire About Enterprise SLA & Integrations</h1>
              <p className="text-neutral-500 text-xs">Our systems engineering team in Tokyo will review and respond to configuration queries within 4 hours.</p>
            </div>

            {contactSuccess ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <h4 className="font-bold">Transmission Dispatched Successfully</h4>
                <p className="text-xs">Your request was indexed securely. An engineering specialist will coordinate with you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-neutral-600 mb-1">YOUR NAME</label>
                    <input type="text" required placeholder="Emily Watson" className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] focus:ring-1 focus:ring-[#E52E40] outline-none p-3 rounded text-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-neutral-600 mb-1">WORK EMAIL</label>
                    <input type="email" required placeholder="emily@company.com" className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] focus:ring-1 focus:ring-[#E52E40] outline-none p-3 rounded text-sm transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-neutral-600 mb-1">INQUIRY CATEGORY</label>
                  <select className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded text-sm outline-none focus:border-[#E52E40] transition-colors">
                    <option>Relational Database & Ledger Compliance Setup</option>
                    <option>High Frequency API Issuance Tariff Scaling</option>
                    <option>Dedicated S3 Custom Domain Integrations</option>
                    <option>General Customer Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-neutral-600 mb-1">MESSAGE / PARAMETERS</label>
                  <textarea rows={5} required placeholder="State your delivery parameters, estimated volume of monthly issued certs, and any customization protocols needed." className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] focus:ring-1 focus:ring-[#E52E40] outline-none p-3 rounded text-sm transition-colors"></textarea>
                </div>

                <button type="submit" className="w-full bg-[#0F0F0F] hover:bg-[#E52E40] text-white p-4 font-semibold text-sm rounded flex items-center justify-center gap-2 transition-all">
                  Submit Operational Dispatch <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-[#0F0F0F] text-[#FAF9F6] border-t border-neutral-800 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-white">
              <span className="w-8 h-8 bg-white text-neutral-900 flex items-center justify-center font-mono text-sm font-bold rounded">
                C
              </span>
              <span>Cert<span className="text-[#E52E40]">FI</span></span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Smart Certificate Visual Layout & Cryptographic Verification Platform. Built for precision-scale operational security.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-mono uppercase text-white font-bold tracking-wider mb-4 border-l-2 border-[#E52E40] pl-2">COMPANY</h5>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><button onClick={() => onNavigate('home')} className="hover:text-[#E52E40]">About Operations</button></li>
              <li><button onClick={() => onNavigate('features')} className="hover:text-[#E52E40]">Our Capabilities</button></li>
              <li><button onClick={() => onNavigate('pricing')} className="hover:text-[#E52E40]">Service Tariffs</button></li>
              <li><button onClick={() => onNavigate('contact')} className="hover:text-[#E52E40]">Submit Dispatch</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-mono uppercase text-white font-bold tracking-wider mb-4 border-l-2 border-[#E52E40] pl-2">TECHNICAL</h5>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><button onClick={() => onNavigate('docs')} className="hover:text-[#E52E40]">Developer Portal</button></li>
              <li><button onClick={() => onNavigate('verification')} className="hover:text-[#E52E40]">Verification API</button></li>
              <li><a href="#" className="hover:text-[#E52E40]">IP Ledger Audit</a></li>
              <li><a href="#" className="hover:text-[#E52E40]">Integrity Check</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-mono uppercase text-white font-bold tracking-wider mb-4 border-l-2 border-[#E52E40] pl-2">COMPLIANCE</h5>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><a href="#" className="hover:text-[#E52E40]">GDPR & Data Privacy</a></li>
              <li><a href="#" className="hover:text-[#E52E40]">Terms of Ledger</a></li>
              <li><a href="#" className="hover:text-[#E52E40]">Cryptographic Standard</a></li>
              <li><a href="#" className="hover:text-[#E52E40]">System Status</a></li>
            </ul>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>© 2026 CertFI Global Systems Ltd. All immutable rights indexed.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white">Github</a>
            <a href="#" className="hover:text-white">Security Ledger</a>
            <a href="#" className="hover:text-white">Status Page</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
