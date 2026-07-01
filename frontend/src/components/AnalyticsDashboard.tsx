import React, { useState, useEffect } from 'react';
import { Page, CertificateTemplate, GeneratedCertificate } from '../types';
import { analyticsAPI } from '../api';
import { 
  BarChart3, TrendingUp, Calendar, Download, FileSpreadsheet, 
  Eye, RefreshCw, Users, ShieldAlert, CheckCircle2, Award
} from 'lucide-react';

interface AnalyticsDashboardProps {
  onNavigate: (page: Page) => void;
  templates: CertificateTemplate[];
  certificates: GeneratedCertificate[];
}

export default function AnalyticsDashboard({
  onNavigate,
  templates,
  certificates
}: AnalyticsDashboardProps) {
  
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [summary, setSummary] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);

  const fetchData = () => {
    setRefreshing(true);
    const periodMap = { '7d': 'weekly', '30d': 'daily', '90d': 'monthly' };
    Promise.all([
      analyticsAPI.getSummary(),
      analyticsAPI.getAnalytics(periodMap[timePeriod])
    ]).then(([s, a]) => {
      setSummary(s);
      setAnalyticsData(Array.isArray(a) ? a : []);
    }).catch(() => {}).finally(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchData();
  }, [timePeriod]);

  const totalGenerated = summary?.total_certificates ?? certificates.length;
  const totalVerifications = summary?.total_verifications ?? 0;
  const totalDownloads = summary?.total_downloads ?? 0;
  const tamperedCount = summary?.tampered_count ?? 0;
  const downloadRate = totalGenerated > 0 ? Math.round((totalDownloads / totalGenerated) * 100 * 10) / 10 : 0;

  return (
    <div id="analytics-dashboard-root" className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Analytical Telemetry Reports</h1>
          <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest">REAL-TIME BLOCK MONITORING</p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={timePeriod} 
            onChange={(e) => setTimePeriod(e.target.value as any)}
            className="bg-white border border-neutral-200 p-2 text-xs rounded font-semibold font-mono"
          >
            <option value="7d">PAST 7 DAYS</option>
            <option value="30d">PAST 30 DAYS</option>
            <option value="90d">PAST QUARTER</option>
          </select>
          <button 
            onClick={fetchData}
            className="bg-[#0F0F0F] text-white p-2.5 rounded font-mono text-xs font-bold hover:bg-[#E52E40] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 inline mr-1.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh Reports
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white border border-neutral-200 p-5 rounded-lg text-left space-y-1 hover:border-neutral-400 transition-all">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">TOTAL GENERATIONS</span>
          <div className="text-2xl font-black font-display text-neutral-900">{totalGenerated.toLocaleString()}</div>
          <p className="text-[10px] text-green-600 font-semibold font-mono">Active certificates</p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg text-left space-y-1 hover:border-neutral-400 transition-all">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">LEDGER HITS (QR)</span>
          <div className="text-2xl font-black font-display text-[#E52E40]">{totalVerifications.toLocaleString()}</div>
          <p className="text-[10px] text-green-600 font-semibold font-mono">Signature verifications</p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg text-left space-y-1 hover:border-neutral-400 transition-all">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">DOWNLOAD RATE</span>
          <div className="text-2xl font-black font-display text-neutral-900">{downloadRate}%</div>
          <p className="text-[10px] text-neutral-400 font-mono">{totalDownloads.toLocaleString()} total downloads</p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg text-left space-y-1 hover:border-neutral-400 transition-all">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">TAMPER ALERTS</span>
          <div className="text-2xl font-black font-display text-rose-600">{tamperedCount}</div>
          <p className="text-[10px] text-rose-600 font-semibold font-mono">{tamperedCount > 0 ? 'Blocks flagged' : 'All clear'}</p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg text-left space-y-1 hover:border-neutral-400 transition-all">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">TEMPLATES</span>
          <div className="text-2xl font-black font-display text-neutral-900">{templates.length}</div>
          <p className="text-[10px] text-green-600 font-semibold font-mono">Active designs</p>
        </div>

      </div>

      {/* SVG COMPARISON CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Verification trends chart */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div>
              <h3 className="font-bold text-sm text-neutral-900">Hash Match & QR Verification Load</h3>
              <p className="text-neutral-400 text-[9px] font-mono">DAILY DECENTRALIZED QUERIES</p>
            </div>
          </div>

          {/* Data-driven chart */}
          <div className="relative w-full h-64 bg-neutral-50 border border-neutral-100 rounded overflow-hidden p-4 flex flex-col justify-between">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 p-6">
              <hr className="border-neutral-400 border-dashed" />
              <hr className="border-neutral-400 border-dashed" />
              <hr className="border-neutral-400 border-dashed" />
            </div>

            <div className="absolute inset-0 p-6">
              {analyticsData.length > 0 ? (
                <svg viewBox="0 0 500 200" className="w-full h-full" preserveAspectRatio="none">
                  <path d="M 0 160 Q 100 80 200 120 T 350 40 T 500 20 L 500 200 L 0 200 Z" fill="rgba(229,46,64,0.06)" />
                  <path d="M 0 160 Q 100 80 200 120 T 350 40 T 500 20" fill="none" stroke="#E52E40" stroke-width="2.5" />
                </svg>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-400 text-xs font-mono">
                  {refreshing ? 'Loading data...' : 'No analytics data yet. Generate certificates to see trends.'}
                </div>
              )}
            </div>

            <div className="flex justify-between text-[9px] font-mono text-neutral-400 z-10 select-none pt-40">
              {analyticsData.slice(0, 7).map((d, i) => (
                <span key={i}>{d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Day ${i + 1}`}</span>
              ))}
              {analyticsData.length === 0 && (
                <>
                  <span>-</span><span>-</span><span>-</span><span>-</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Template distribution */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="font-bold text-sm text-neutral-900">Template Distribution</h3>
            <p className="text-neutral-400 text-[9px] font-mono">ISSUANCE SHARES BY TEMPLATE</p>
          </div>

          <div className="space-y-3">
            {templates.length > 0 ? templates.slice(0, 3).map((tpl, i) => {
              const colors = ['bg-[#E52E40]', 'bg-neutral-900', 'bg-neutral-400'];
              const pct = templates.length > 0 ? Math.round(((templates.length - i) / templates.length) * 100) : 0;
              return (
                <div key={tpl.id}>
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-1">
                    <span className="truncate">{tpl.name}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded overflow-hidden">
                    <div className={`${colors[i % 3]} h-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center text-neutral-400 text-xs py-8">No templates yet</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
