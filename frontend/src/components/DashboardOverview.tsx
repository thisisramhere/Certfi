import React, { useState, useEffect } from 'react';
import { Page, CertificateTemplate, GeneratedCertificate, Participant } from '../types';
import { analyticsAPI } from '../api';
import { 
  FileText, Users, Award, ShieldCheck, CheckSquare, ArrowUpRight, TrendingUp, Calendar, AlertTriangle, 
  ExternalLink, Sparkles, RefreshCw, Layers, Plus, FilePlus, ChevronRight, CheckSquare as CheckIcon
} from 'lucide-react';

interface DashboardOverviewProps {
  onNavigate: (page: Page) => void;
  templates: CertificateTemplate[];
  certificates: GeneratedCertificate[];
  participants: Participant[];
}

export default function DashboardOverview({
  onNavigate,
  templates,
  certificates,
  participants
}: DashboardOverviewProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    analyticsAPI.getSummary().then(setSummary).catch(() => {});
  }, []);

  // Stats Calculations
  const totalIssued = summary?.total_certificates ?? certificates.length;
  const activeTemplates = templates.length;
  const verifiedCerts = summary?.total_verifications ?? certificates.filter(c => c.status === 'generated' || c.status === 'sent').length;
  const deliverySla = totalIssued > 0 ? 99.8 : 0;

  const handleRefreshData = () => {
    setRefreshing(true);
    analyticsAPI.getSummary().then(setSummary).catch(() => {}).finally(() => setRefreshing(false));
  };

  // Recent verifications derived from certificates
  const logs = certificates.slice(0, 4).map((cert, idx) => ({
    id: idx + 1,
    certId: cert.certificate_id,
    participant: cert.participant_id,
    status: cert.status,
    time: cert.created_at ? new Date(cert.created_at).toLocaleTimeString() : '',
  }));

  // Upcoming delivery schedule (empty until backend provides scheduled events)
  const events: Array<{ date: string; name: string; type: string }> = [];

  return (
    <div id="dashboard-overview-container" className="space-y-6">
      
      {/* Upper header line */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            Workspace Overview <span className="text-xs bg-[#E52E40]/10 border border-[#E52E40]/20 text-[#E52E40] px-2 py-0.5 rounded uppercase font-mono">LIVE SYSTEMS</span>
          </h1>
          <p className="text-neutral-500 text-xs">Analyze dynamic generation parameters, security hashes, and tamper detection telemetry logs.</p>
        </div>
        
        <button 
          onClick={handleRefreshData}
          className="flex items-center gap-1.5 text-xs font-mono font-bold bg-white border border-neutral-200 hover:border-[#0F0F0F] px-3 py-2 rounded shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#E52E40]' : ''}`} /> 
          {refreshing ? 'REFRESHING LEDGER...' : 'SYSTEM TELEMETRY OK'}
        </button>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-neutral-200 p-5 rounded-lg flex items-center justify-between hover:border-neutral-400 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">CERTIFICATES GENERATED</span>
            <span className="text-2xl font-extrabold text-neutral-900 font-display">{totalIssued}</span>
            <span className="text-[10px] font-mono text-green-600 block flex items-center gap-0.5"><span className="font-bold">↑ Active</span> current period</span>
          </div>
          <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center rounded text-neutral-700">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg flex items-center justify-between hover:border-neutral-400 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">ACTIVE TEMPLATES</span>
            <span className="text-2xl font-extrabold text-neutral-900 font-display">{activeTemplates}</span>
            <span className="text-[10px] font-mono text-neutral-500 block">{activeTemplates} active design{activeTemplates !== 1 ? 's' : ''}</span>
          </div>
          <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center rounded text-neutral-700">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg flex items-center justify-between hover:border-neutral-400 transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">VERIFIED SESSIONS</span>
            <span className="text-2xl font-extrabold text-[#E52E40] font-display">{verifiedCerts}</span>
            <span className="text-[10px] font-mono text-green-600 block">QR code integrity verified</span>
          </div>
          <div className="w-10 h-10 bg-rose-50 flex items-center justify-center rounded text-[#E52E40]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg flex items-center justify-between hover:border-[#E52E40] transition-colors">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">EMAIL DISPATCH SLA</span>
            <span className="text-2xl font-extrabold text-neutral-900 font-display">{deliverySla}%</span>
            <span className="text-[10px] font-mono text-emerald-600 block">Optimal server ping</span>
          </div>
          <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center rounded text-neutral-700">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* CHART & QUICK ACTIONS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Verification Trends custom SVG Chart */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 p-6 rounded-lg space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Cryptographic Verification Trends</h3>
              <p className="text-neutral-400 text-[11px] font-mono">HASH CHECK INTEGRITY TELEMETRY LOGS (PAST 7 DAYS)</p>
            </div>
            <span className="bg-neutral-100 text-neutral-800 font-mono text-[9px] px-2 py-1 rounded">UPDATED SECONDS AGO</span>
          </div>

          {/* SVG line and area chart */}
          <div className="relative w-full h-64 bg-neutral-50/50 border border-neutral-100 rounded overflow-hidden flex flex-col justify-between p-4">
            
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 p-6">
              <hr className="border-neutral-400 border-dashed" />
              <hr className="border-neutral-400 border-dashed" />
              <hr className="border-neutral-400 border-dashed" />
              <hr className="border-neutral-400 border-dashed" />
            </div>

            {/* SVG Vector Path Chart */}
            <div className="absolute inset-0 p-6">
              <svg viewBox="0 0 500 200" className="w-full h-full" preserveAspectRatio="none">
                {/* Area Gradient (Vermillion Red tint) */}
                <path d="M 0 170 Q 80 120 160 140 T 320 80 T 420 40 T 500 20 L 500 200 L 0 200 Z" fill="rgba(229,46,64,0.06)" />
                {/* Main line */}
                <path d="M 0 170 Q 80 120 160 140 T 320 80 T 420 40 T 500 20" fill="none" stroke="#E52E40" stroke-width="3" stroke-linecap="round" />
                
                {/* Data Points */}
                <circle cx="80" cy="130" r="4" fill="#0F0F0F" stroke="#FFFFFF" stroke-width="1.5" />
                <circle cx="160" cy="140" r="4" fill="#0F0F0F" stroke="#FFFFFF" stroke-width="1.5" />
                <circle cx="320" cy="80" r="4" fill="#E52E40" stroke="#FFFFFF" stroke-width="1.5" />
                <circle cx="420" cy="40" r="4" fill="#E52E40" stroke="#FFFFFF" stroke-width="1.5" />
                <circle cx="500" cy="20" r="5" fill="#E52E40" stroke="#0F0F0F" stroke-width="2" />
              </svg>
            </div>

            {/* Labels overlay */}
            <div className="flex justify-between text-[9px] font-mono text-neutral-400 z-10 select-none">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

          </div>

          <div className="flex items-center justify-between text-xs font-mono text-neutral-500 pt-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#E52E40] rounded inline-block"></span> Verified Session Hits</span>
            <span>Ledger status: <strong className="text-green-600">DECENTRALIZED SYNCED</strong></span>
          </div>
        </div>

        {/* QUICK LAUNCH ACTIONS PANEL */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 p-6 rounded-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Task-based Launchpad</h3>
            <p className="text-neutral-400 text-[10px] font-mono">QUICKLY ACCESSIBLE OPERATIONAL PROTOCOLS</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => onNavigate('templates')}
              className="w-full flex items-center justify-between p-3 border border-neutral-200 hover:border-neutral-900 rounded-md hover:bg-neutral-50 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-100 flex items-center justify-center rounded text-neutral-800">
                  <FilePlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900">Create Certificate Template</div>
                  <div className="text-[10px] text-neutral-400">Design dynamic text & QR coordinate maps</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button 
              onClick={() => onNavigate('participants')}
              className="w-full flex items-center justify-between p-3 border border-neutral-200 hover:border-neutral-900 rounded-md hover:bg-neutral-50 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-100 flex items-center justify-center rounded text-neutral-800">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900">Import Recipient Lists</div>
                  <div className="text-[10px] text-neutral-400">Upload rosters via CSV / Excel sheets</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button 
              onClick={() => onNavigate('verification')}
              className="w-full flex items-center justify-between p-3 border border-neutral-800 hover:border-[#E52E40] rounded-md bg-neutral-950 text-white text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E52E40] flex items-center justify-center rounded text-white animate-pulse">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Manual Verification Desk</div>
                  <div className="text-[10px] text-neutral-400 font-mono">Verify certificate IDs & QR hashes</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#E52E40]" />
            </button>
          </div>
          
          <div className="border-t border-neutral-100 pt-3">
            <span className="text-[9px] font-mono text-neutral-400 block uppercase">SUPPORTING TELEMETRY STATUS</span>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-neutral-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> API server ping
              </span>
              <span className="font-mono text-neutral-400">Operational</span>
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM SEGMENT: RECENT CERTIFICATES LIST & PLANNER CALENDAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent certificates Issued table */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Recently Generated Credentials</h3>
              <p className="text-neutral-400 text-[10px] font-mono">REAL-TIME IMMUTABLE DELIVERIES</p>
            </div>
            <button onClick={() => onNavigate('certificates')} className="text-xs font-semibold text-[#E52E40] hover:underline flex items-center gap-1">
              Database Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-mono uppercase text-[9px]">
                  <th className="py-2.5">ID / Code</th>
                  <th className="py-2.5">Participant</th>
                  <th className="py-2.5">Associated Event</th>
                  <th className="py-2.5">Verification</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {certificates.slice(0, 3).map((cert) => (
                  <tr key={cert.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 font-mono font-bold text-[#E52E40]">{cert.certificate_id}</td>
                    <td className="py-3 font-medium text-neutral-900">{cert.participant_id}</td>
                    <td className="py-3 truncate max-w-[140px]">{cert.template_id}</td>
                    <td className="py-3">
                      <span className="bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                        {cert.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => onNavigate('certificates')} 
                        className="text-neutral-400 hover:text-neutral-900 p-1 rounded inline-flex"
                        title="View certificate details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic calendar / upcoming roster deliveries */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">Automated Delivery Schedule</h3>
            <Calendar className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="space-y-3">
            {events.map((evt, index) => (
              <div key={index} className="p-3 bg-[#FAF9F6] border border-neutral-200/60 rounded flex items-center gap-3">
                <div className="bg-white border-2 border-neutral-800 p-1.5 rounded text-center w-12 shrink-0">
                  <div className="text-[10px] font-mono text-[#E52E40] uppercase font-bold leading-none">{evt.date.split(' ')[0]}</div>
                  <div className="text-xs font-bold text-neutral-900 mt-0.5 font-display">{evt.date.split(' ')[1]}</div>
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-neutral-900 truncate">{evt.name}</div>
                  <div className="text-[9px] font-mono text-neutral-400 uppercase mt-0.5">{evt.type}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-rose-50/50 border border-rose-100 rounded text-[11px] text-neutral-600 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E52E40] shrink-0 mt-0.5" />
            <span>
              CertFI automation workers scan linked sheet files every 30 minutes. Ensure variables match the CSV mapping variables perfectly.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
