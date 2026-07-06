import React, { useState } from 'react';
import { Page } from '../types';
import { 
  Award, Shield, FileSpreadsheet, QrCode, ArrowRight, ChevronDown
} from 'lucide-react';

interface PublicWebsiteProps {
  onNavigate: (page: Page) => void;
}

export default function PublicWebsite({ onNavigate }: PublicWebsiteProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Faq list
  const faqs = [
    {
      q: 'How does QR Code Verification work?',
      a: 'Each certificate generated on Certfi contains an encrypted, unique cryptographic hash embedded in a QR code. When scanned, it immediately resolves to our tamper-proof server ledger, confirming the participant\'s name, certificate legitimacy, issuance timestamp, and event details without exposing sensitive metadata.'
    },
    {
      q: 'Can we integrate Certfi with our existing LMS (e.g., Moodle, Canvas, or custom)?',
      a: 'Yes. Certfi offers modular REST APIs and developer-friendly webhooks that trigger certificate generation immediately upon a participant passing a course, scoring a benchmark, or completing an event. Detailed API documentation is available under our developer portal.'
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
              <span>Cert<span className="text-[#E52E40]">fi</span></span>
            </button>
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => onNavigate('home')} className="font-medium text-sm transition-colors hover:text-[#E52E40] text-[#E52E40]">Home</button>
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

      {/* HOME PAGE CONTENT */}
      <div>
          {/* HERO SECTION */}
          <section className="relative pt-12 pb-20 border-b border-neutral-200 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#E52E40]/10 border border-[#E52E40]/20 px-3 py-1 text-[#E52E40] font-mono text-xs font-semibold rounded-full uppercase tracking-wider">
                  v2.4 Secure Architecture Live
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

                  {/* Certificate placeholder */}
                  <div className="relative aspect-[1.4/1] bg-[#FDFCF7] border border-neutral-200 rounded p-4 overflow-hidden flex flex-col items-center justify-center">
                    <div className="text-center space-y-2">
                      <Award className="w-10 h-10 text-neutral-300 mx-auto" />
                      <p className="text-sm font-medium text-neutral-400">No certificates yet</p>
                      <p className="text-xs text-neutral-300">Create your first certificate to get started</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-neutral-500 font-mono">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span> Active Placeholders</span>
                    <span>3 layers configured</span>
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
                  Certfi unifies visual digital craftsmanship with strict operational tracking. Empower your brand with certificates that people can actually trust.
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
                    Import lists of thousands of participants. Certfi runs automatic column schema matching, duplicates pruning, email validation, and background processing.
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
                <h3 className="text-3xl font-bold tracking-tight">How Certfi Power Automates Your Delivery</h3>
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
                <p className="text-neutral-500 text-sm">Everything you need to know about the Certfi secure delivery protocols.</p>
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

      {/* FOOTER */}
      <footer className="bg-[#0F0F0F] text-[#FAF9F6] border-t border-neutral-800 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <div>© 2026 Certfi</div>
            <div>
              <a href="https://github.com/thisisramhere" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
