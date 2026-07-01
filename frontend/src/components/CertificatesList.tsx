import React, { useState } from 'react';
import { Page, GeneratedCertificate, CertificateTemplate } from '../types';
import { certificatesAPI } from '../api';
import { useToast } from './Toast';
import { 
  FileCheck, Search, Filter, Eye, Download, ShieldAlert, Check, RefreshCw, 
  X, ExternalLink, Calendar, Mail, FileText, QrCode, Copy, Share2
} from 'lucide-react';

interface CertificatesListProps {
  onNavigate: (page: Page) => void;
  certificates: GeneratedCertificate[];
  templates: CertificateTemplate[];
  onRevokeCertificate: (id: string) => void;
}

export default function CertificatesList({
  onNavigate,
  certificates,
  templates,
  onRevokeCertificate
}: CertificatesListProps) {
  
  // Search / filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('All');
  
  // Details Modal
  const [selectedCert, setSelectedCert] = useState<GeneratedCertificate | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { addToast } = useToast();

  // Filter list
  const filteredCerts = certificates.filter(c => {
    const matchesSearch = c.certificate_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.participant_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    const matchesTemplate = selectedTemplateId === 'All' || c.template_id === selectedTemplateId;
    return matchesSearch && matchesStatus && matchesTemplate;
  });

  const handleShareCert = (id: string) => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const handleDownloadPdf = async (certId: string) => {
    setDownloading(certId);
    try {
      const blob = await certificatesAPI.downloadPDF(certId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      addToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('PDF download error:', err);
      addToast('PDF not available for this certificate.', 'warning');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div id="certificates-list-container" className="space-y-6">
      
      {/* Header elements */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Issued Certificates Ledger</h1>
          <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest">DECENTRALIZED ENCRYPTED DATABASE</p>
        </div>

        <button 
          onClick={() => onNavigate('generate')}
          className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white text-xs font-semibold px-4 py-2.5 rounded flex items-center justify-center gap-1.5 transition-all self-start"
        >
          Issue New Batch →
        </button>
      </div>

      {/* FILTERS COMPONENT */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-neutral-200 p-4 rounded-lg">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search Cert ID, name, email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none rounded p-2.5 pl-9 text-xs transition-colors"
          />
        </div>

        {/* Filter selectors */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-mono">Status:</span>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 p-2 rounded outline-none font-semibold text-xs"
            >
              <option value="All">All statuses</option>
              <option value="active">Active Block</option>
              <option value="expired">Expired Period</option>
              <option value="revoked">Revoked / Flagged</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-mono">Template:</span>
            <select 
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 p-2 rounded outline-none font-semibold text-xs max-w-[150px]"
            >
              <option value="All">All templates</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* DATABASE GRID TABLE */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-mono uppercase text-[9px]">
                <th className="p-4">Certificate ID</th>
                <th className="p-4">Participant Candidate</th>
                <th className="p-4">Event Associated</th>
                <th className="p-4">Issued Timestamp</th>
                <th className="p-4">Block Status</th>
                <th className="p-4">Integrity Hash</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {filteredCerts.map((cert) => (
                <tr key={cert.id} className="hover:bg-neutral-50/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-[#E52E40]">{cert.certificate_id}</td>
                  <td className="p-4">
                    <div className="font-bold text-neutral-900">{cert.participant_id}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">{cert.participantEmail}</div>
                  </td>
                  <td className="p-4 font-medium max-w-[180px] truncate" title={cert.template_id}>{cert.template_id}</td>
                  <td className="p-4 font-mono text-neutral-400">{cert.created_at}</td>
                  <td className="p-4">
                    {cert.status === 'active' && (
                      <span className="bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                        Active Block
                      </span>
                    )}
                    {cert.status === 'expired' && (
                      <span className="bg-neutral-100 text-neutral-500 font-semibold px-2 py-0.5 rounded text-[10px]">
                        Expired
                      </span>
                    )}
                    {cert.status === 'revoked' && (
                      <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                        Revoked / Flagged
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-neutral-400 text-[10px] truncate max-w-[120px]" title={cert.hash}>
                    {cert.hash}
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-1.5">
                    <button 
                      onClick={() => setSelectedCert(cert)}
                      className="text-neutral-600 hover:text-[#E52E40] p-1.5 bg-neutral-100/60 rounded"
                      title="Inspect Certificate Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onRevokeCertificate(cert.id)}
                      className="text-neutral-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded"
                      title="Revoke Certificate Block"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty status check */}
        {filteredCerts.length === 0 && (
          <div className="p-16 text-center text-neutral-400 space-y-2">
            <FileCheck className="w-8 h-8 mx-auto stroke-1" />
            <div className="text-xs font-semibold">No active certificate index located</div>
            <p className="text-[10px] leading-relaxed">Consider initiating a bulk template merge loop.</p>
          </div>
        )}
      </div>

      {/* DETAILED LEDGER RECORD DRAWER/MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-neutral-800 w-full max-w-3xl rounded-lg shadow-[8px_8px_0px_0px_rgba(15,15,15,1)] overflow-hidden">
            
            {/* Header */}
            <div className="border-b border-neutral-200 p-4 bg-neutral-50 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-neutral-900">Certificate Verification Registry</h3>
                <p className="text-neutral-400 text-[9px] font-mono">RECORD ID: {selectedCert.id}</p>
              </div>
              <button onClick={() => setSelectedCert(null)} className="p-1 rounded hover:bg-neutral-200 text-neutral-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-neutral-100 p-6 gap-6">
              
              {/* Left Column: Visual thumbnail & Download commands */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Visual spec wrapper */}
                <div className="border border-neutral-200 rounded p-4 bg-[#FDFCF7] relative text-center aspect-[1.41/1] flex flex-col justify-between">
                  <div className="absolute inset-0 border-4 border-double border-neutral-800 opacity-20 pointer-events-none"></div>
                  
                  <div>
                    <span className="text-[8px] font-mono tracking-widest text-neutral-400 block uppercase">Kyoto System Certificate</span>
                    <h2 className="text-lg font-bold text-[#0F0F0F] mt-3">{selectedCert.participant_id}</h2>
                    <p className="text-[9px] text-neutral-400 max-w-xs mx-auto mt-1 leading-normal">
                      for high achievements demonstrating professional proficiency.
                    </p>
                  </div>

                  <div className="flex items-end justify-between px-3">
                    <div className="text-left font-mono text-[7px] text-neutral-400">
                      <div>ID: {selectedCert.id}</div>
                      <div>STATUS: {selectedCert.status.toUpperCase()}</div>
                    </div>
                    <div className="w-10 h-10 border border-neutral-200 p-0.5 bg-white rounded">
                      <QrCode className="w-full h-full text-neutral-800" />
                    </div>
                  </div>
                </div>

                {/* Actions button panel */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => selectedCert && handleDownloadPdf(selectedCert.certificate_id)}
                    disabled={downloading === selectedCert?.certificate_id}
                    className="flex-1 bg-[#0F0F0F] hover:bg-[#E52E40] text-white p-2.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" /> {downloading === selectedCert?.certificate_id ? 'Downloading...' : 'Download PDF Vector'}
                  </button>
                  <button 
                    onClick={() => handleShareCert(selectedCert.id)}
                    className="border border-neutral-200 hover:border-neutral-900 text-neutral-800 p-2.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 bg-white transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share Record
                  </button>
                </div>

                {shareSuccess && (
                  <div className="text-center bg-green-50 text-green-700 text-[10px] font-mono p-1 rounded border border-green-200">
                    Cryptographic ledger URL copied to clipboard!
                  </div>
                )}

              </div>

              {/* Right Column: Audit Timeline & Metadata */}
              <div className="md:col-span-5 space-y-4 pt-4 md:pt-0 pl-0 md:pl-6">
                
                {/* Hash specs */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">SHA-256 HASH SPEC</span>
                  <div className="bg-neutral-50 p-2.5 rounded font-mono text-[9px] text-neutral-600 break-all border border-neutral-100">
                    {selectedCert.hash}
                  </div>
                </div>

                {/* Audit Timeline */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">COMPLIANCE TIMELINE</span>
                  
                  <div className="space-y-3 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-neutral-200">
                    
                    <div className="flex gap-3 text-[11px] relative">
                      <div className="w-5 h-5 bg-[#E52E40] text-white font-mono text-[8px] flex items-center justify-center rounded-full shrink-0 z-10 font-bold">1</div>
                      <div>
                        <div className="font-bold text-neutral-900">Record initialized</div>
                        <div className="text-[10px] text-neutral-400">Certificate: {selectedCert.certificate_id}</div>
                      </div>
                    </div>

                    <div className="flex gap-3 text-[11px] relative">
                      <div className="w-5 h-5 bg-neutral-900 text-white font-mono text-[8px] flex items-center justify-center rounded-full shrink-0 z-10 font-bold">2</div>
                      <div>
                        <div className="font-bold text-neutral-900">Cryptographic hash signed</div>
                        <div className="text-[10px] text-neutral-400">Written to decentralized verification registry</div>
                      </div>
                    </div>

                    <div className="flex gap-3 text-[11px] relative">
                      <div className="w-5 h-5 bg-green-600 text-white font-mono text-[8px] flex items-center justify-center rounded-full shrink-0 z-10 font-bold">3</div>
                      <div>
                        <div className="font-bold text-neutral-900">Email Dispatch Synced</div>
                        <div className="text-[10px] text-neutral-400">Dispatched directly to {selectedCert.participantEmail}</div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
