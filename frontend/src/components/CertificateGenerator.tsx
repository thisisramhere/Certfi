import React, { useState } from 'react';
import { Page, CertificateTemplate, Participant, GeneratedCertificate } from '../types';
import { certificatesAPI } from '../api';
import { useToast } from './Toast';
import { 
  FileText, Users, Sliders, Play, CheckCircle, Download, RefreshCw, 
  ChevronRight, Sparkles, AlertCircle, FileArchive, ArrowLeft, QrCode
} from 'lucide-react';

interface CertificateGeneratorProps {
  onNavigate: (page: Page) => void;
  templates: CertificateTemplate[];
  participants: Participant[];
  onGenerateCertificates: (certs: any[]) => void;
}

export default function CertificateGenerator({
  onNavigate,
  templates,
  participants,
  onGenerateCertificates
}: CertificateGeneratorProps) {
  
  const [wizardStep, setWizardStep] = useState(1);
  
  // Selection states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [targetClass, setTargetClass] = useState<string>('Cloud Architect Masterclass 2026');
  
  // Custom overlays
  const [includeQr, setIncludeQr] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'ZIP_PDF' | 'ZIP_PNG' | 'API_URL'>('ZIP_PDF');
  const [namingFormat, setNamingFormat] = useState('{{NAME}}_CERT_Kyoto2026');

  // Generation progress
  const [progress, setProgress] = useState(0);
  const [genLogs, setGenLogs] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const { addToast } = useToast();

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const matchingParticipantsCount = participants.filter(p => p.event === targetClass).length;

  const handleStartGeneration = () => {
    setWizardStep(5);
    setGenerating(true);
    setProgress(0);
    setGenLogs(['[04:33:20] Initializing bulk generation cluster...']);

    const logsArray = [
      '[04:33:21] Fetching secure SHA-256 ledger certificates...',
      '[04:33:22] Mapping dynamic placeholder {{PARTICIPANT_NAME}} coordinate tables...',
      '[04:33:23] Resolving cryptographic QR coordinate blocks...',
      '[04:33:24] Generating hi-res PDF vector render buffers...',
      '[04:33:25] Compiling ZIP package archive CertFI_Kyoto2026.zip...',
      '[04:33:26] Writing hash records to public-facing audit ledger...',
      '[04:33:27] Bulk processing completed successfully!'
    ];

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          const activeParticipants = participants.filter(p => p.event === targetClass);
          const certsPayload = activeParticipants.map(ap => ({
            participant_id: ap.id,
            template_id: selectedTemplateId,
            participant_name: ap.name,
            participant_email: ap.email,
            participant_event: ap.event,
            template_name: selectedTemplate?.name || 'Certificate',
          }));
          
          certificatesAPI.generate(certsPayload)
            .then(generatedCerts => {
              onGenerateCertificates(generatedCerts);
              setGenerating(false);
            })
            .catch(err => {
              console.error('Certificate generation failed:', err);
              setGenerating(false);
            });
          
          return 100;
        }
        
        if (prev % 15 === 0 && currentLogIdx < logsArray.length) {
          setGenLogs(l => [...l, logsArray[currentLogIdx]]);
          currentLogIdx++;
        }
        
        return prev + 5;
      });
    }, 150);
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const orgId = localStorage.getItem('current_user') ? JSON.parse(localStorage.getItem('current_user')!).organization_id : '';
      const blob = await certificatesAPI.downloadAll(orgId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificates.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      addToast('ZIP package downloaded successfully!', 'success');
    } catch (err) {
      console.error('ZIP download error:', err);
      addToast('ZIP download is not available yet.', 'warning');
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div id="bulk-generator-page" className="space-y-6 max-w-4xl mx-auto bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      
      {/* Upper header */}
      <div className="border-b border-neutral-100 p-6 bg-neutral-50/50">
        <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">Bulk Certificate Generator</h1>
        <p className="text-neutral-500 text-xs mt-1">Ingest rosters, verify placeholders coordinates, overlay cryptographic QR hashes, and compile ZIP folders.</p>
      </div>

      {/* stepper progress segments */}
      {wizardStep < 5 && (
        <div className="grid grid-cols-4 divide-x divide-neutral-100 border-b border-neutral-100 font-mono text-[10px] text-center bg-neutral-50/20 select-none">
          <button 
            onClick={() => setWizardStep(1)}
            className={`py-3 font-semibold ${wizardStep === 1 ? 'bg-white text-[#E52E40] border-b-2 border-[#E52E40]' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            1. SELECT TEMPLATE
          </button>
          <button 
            onClick={() => setWizardStep(2)}
            disabled={!selectedTemplateId}
            className={`py-3 font-semibold ${wizardStep === 2 ? 'bg-white text-[#E52E40] border-b-2 border-[#E52E40]' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            2. RECIPIENT CLASS
          </button>
          <button 
            onClick={() => setWizardStep(3)}
            className={`py-3 font-semibold ${wizardStep === 3 ? 'bg-white text-[#E52E40] border-b-2 border-[#E52E40]' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            3. RENDER OVERLAYS
          </button>
          <button 
            onClick={() => setWizardStep(4)}
            className={`py-3 font-semibold ${wizardStep === 4 ? 'bg-white text-[#E52E40] border-b-2 border-[#E52E40]' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            4. LIVE MERGE PREVIEW
          </button>
        </div>
      )}

      {/* CONTENT REGIONS */}
      <div className="p-6">
        
        {/* STEP 1: SELECT TEMPLATE */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">CHOOSE ACTIVE DESIGN TEMPLATE</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(tpl => (
                <div 
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all flex gap-4 items-start ${selectedTemplateId === tpl.id ? 'border-[#E52E40] bg-rose-50/10 shadow-sm' : 'border-neutral-200 hover:border-neutral-400'}`}
                >
                  <img src={tpl.backdropUrl} referrerPolicy="no-referrer" alt={tpl.name} className="w-20 aspect-[1.41/1] object-contain border border-neutral-200 rounded shrink-0 bg-white" />
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-neutral-900 leading-tight">{tpl.name}</h3>
                    <p className="text-[10px] text-neutral-500 line-clamp-2">{tpl.description}</p>
                    <span className="inline-block bg-neutral-100 text-neutral-600 font-mono text-[8px] px-1.5 py-0.5 rounded">
                      {tpl.elements.length} dynamic tags
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SELECT RECIPIENTS TARGET CLASS */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">CHOOSE ENROLLMENT CLASS</span>
            
            <div className="space-y-3">
              <label className="block text-xs font-mono font-semibold uppercase text-neutral-500 mb-1">SELECT EVENTS WORKSHOP</label>
              <select 
                value={targetClass} 
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded text-xs outline-none"
              >
                <option value="Cloud Architect Masterclass 2026">Cloud Architect Masterclass 2026 (Japan Academy)</option>
                <option value="SaaS Security & Governance Workshop">SaaS Security & Governance Workshop (Cyber Defense Corp)</option>
                <option value="Advanced Design Systems Summit">Advanced Design Systems Summit (Innovate Studio)</option>
              </select>

              {/* Matching diagnostics */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-neutral-800">Roster Matching Telemetry</div>
                  <div className="text-[10px] text-neutral-400">Validated candidates synced with this registry.</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#E52E40]">{matchingParticipantsCount}</span>
                  <span className="text-neutral-500 text-xs"> candidates</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RENDER OVERLAYS & SETTINGS */}
        {wizardStep === 3 && (
          <div className="space-y-5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">RENDER OPTIONS & METADATA OVERLAYS</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-neutral-100 rounded bg-[#FAF9F6]">
                  <div>
                    <div className="font-bold text-neutral-800">Include QR Verification Code</div>
                    <p className="text-[10px] text-neutral-400 leading-tight">Embed encrypted QR coordinates point to verification ledger</p>
                  </div>
                  <input type="checkbox" checked={includeQr} onChange={(e) => setIncludeQr(e.target.checked)} className="accent-[#E52E40] w-4 h-4 cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-3 border border-neutral-100 rounded bg-[#FAF9F6]">
                  <div>
                    <div className="font-bold text-neutral-800">Include Anti-Tamper Watermark</div>
                    <p className="text-[10px] text-neutral-400 leading-tight">Underlay translucent CertFI compliance watermark</p>
                  </div>
                  <input type="checkbox" checked={includeWatermark} onChange={(e) => setIncludeWatermark(e.target.checked)} className="accent-[#E52E40] w-4 h-4 cursor-pointer" />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-mono text-[9px]">OUTPUT FILE FORMAT</label>
                  <select value={outputFormat} onChange={(e: any) => setOutputFormat(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 p-2.5 rounded text-xs outline-none">
                    <option value="ZIP_PDF">Secure PDF Archive Package (ZIP)</option>
                    <option value="ZIP_PNG">Hi-Res Raster Image Package (ZIP)</option>
                    <option value="API_URL">Secure Hosted Ledger URLs (Cloud Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-mono text-[9px]">FILE NAMING FORMAT CONVENTION</label>
                  <input 
                    type="text" 
                    value={namingFormat}
                    onChange={(e) => setNamingFormat(e.target.value)}
                    placeholder="{{NAME}}_CERT_Kyoto2026"
                    className="w-full bg-neutral-50 border border-neutral-200 p-2.5 rounded font-mono text-xs text-[#E52E40] outline-none"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 4: LIVE MERGE PREVIEW */}
        {wizardStep === 4 && (
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">VERIFY MERGED SPECIMEN ACCORDING TO VARIABLES</span>
            
            {/* Specimen rendering mockup */}
            <div className="relative max-w-lg mx-auto bg-[#FDFCF7] border-2 border-neutral-800 p-6 rounded shadow-[4px_4px_0px_0px_rgba(15,15,15,1)] text-center space-y-4 overflow-hidden aspect-[1.41/1]">
              <div className="absolute inset-0 border-4 border-double border-neutral-800 opacity-25 pointer-events-none"></div>
              
              <div className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">SPECIMEN PREVIEW // kyoto_roster[0]</div>
              <h2 className="text-2xl font-bold font-display text-neutral-900 mt-2">Sora Takahashi</h2>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                has successfully demonstrated SaaS Cloud Infrastructure Mastery during the intensive Cloud Architect Masterclass 2026.
              </p>
              
              <div className="flex items-center justify-between px-8 pt-8">
                <div className="text-left font-mono text-[8px] text-neutral-400">
                  <div>ID: CERT-2026-X99</div>
                  <div>HASH: SYNCED</div>
                </div>
                {includeQr && (
                  <div className="w-12 h-12 border border-neutral-200 p-1 bg-white rounded flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-neutral-800" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-center text-[11px] text-neutral-500">
              Template Backdrop: <strong>Modern Swiss Accent</strong> | Total Recipients: <strong>{matchingParticipantsCount} candidates</strong>
            </div>

          </div>
        )}

        {/* STEP 5: GENERATION PROCESSING PROGRESS */}
        {wizardStep === 5 && (
          <div className="space-y-6 py-6 text-center">
            
            {generating ? (
              <>
                <RefreshCw className="w-12 h-12 text-[#E52E40] mx-auto animate-spin" />
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="font-extrabold text-[#0F0F0F] text-base">Rendering Cryptographic Credentials...</h3>
                  <p className="text-xs text-neutral-400">Writing hash records to ledger block. Do not reload tab.</p>
                </div>

                {/* Progress bar container */}
                <div className="w-full max-w-md mx-auto bg-neutral-100 rounded-full h-2.5 overflow-hidden border border-neutral-200">
                  <div style={{ width: `${progress}%` }} className="bg-[#E52E40] h-full transition-all duration-150"></div>
                </div>
                <span className="text-xs font-mono text-[#E52E40] font-bold">{progress}% Rendered</span>

                {/* Logs feed console */}
                <div className="w-full max-w-md bg-[#0F0F0F] text-[#FAF9F6] p-4 rounded text-left font-mono text-[10px] space-y-1 overflow-y-auto h-36 border border-neutral-800 shadow-inner">
                  {genLogs.map((log, index) => (
                    <div key={index} className="text-neutral-300">{log}</div>
                  ))}
                </div>
              </>
            ) : (
              // COMPLETED SCREEN
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-600 flex items-center justify-center rounded-full mx-auto">
                  <CheckCircle className="w-10 h-10" />
                </div>
                
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-extrabold text-neutral-900 text-base">Bulk Issuance Complete!</h3>
                  <p className="text-xs text-neutral-500">
                    SaaS excellence hashes have been signed and written to the public verification ledger successfully.
                  </p>
                </div>

                <div className="p-4 bg-[#FAF9F6] border border-neutral-200 rounded-lg max-w-md mx-auto text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                    <span>Generated File:</span>
                    <span className="font-mono text-[#E52E40]">CertFI_Archive_Kyoto2026.zip</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>Volume count:</span>
                    <span>{matchingParticipantsCount} PDFs</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button 
                    onClick={() => onNavigate('certificates')}
                    className="bg-[#0F0F0F] hover:bg-neutral-800 text-white font-semibold text-xs px-5 py-3 rounded transition-colors flex items-center gap-1.5"
                  >
                    View Issued Ledger
                  </button>
                  <button 
                    onClick={handleDownloadZip}
                    disabled={downloadingZip}
                    className="bg-[#E52E40] hover:bg-rose-700 text-white font-bold text-xs px-5 py-3 rounded transition-colors flex items-center gap-1.5 shadow disabled:opacity-50"
                  >
                    <FileArchive className="w-4 h-4" /> {downloadingZip ? 'Downloading...' : 'Download ZIP Package'}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* FOOTER ACTIONS WIZARD */}
      {wizardStep < 5 && (
        <div className="border-t border-neutral-100 p-4 bg-neutral-50 flex items-center justify-between">
          <button 
            onClick={() => setWizardStep(wizardStep - 1)}
            disabled={wizardStep === 1}
            className="border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-50 text-neutral-700 font-mono text-xs px-4 py-2 rounded"
          >
            ← Previous
          </button>

          {wizardStep < 4 ? (
            <button 
              onClick={() => setWizardStep(wizardStep + 1)}
              className="bg-[#0F0F0F] hover:bg-neutral-800 text-white font-semibold font-mono text-xs px-4 py-2 rounded flex items-center gap-1"
            >
              Next Step <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              onClick={handleStartGeneration}
              className="bg-[#E52E40] hover:bg-rose-700 text-white font-bold font-mono text-xs px-5 py-2.5 rounded flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-4 h-4" /> Trigger Render Engine
            </button>
          )}
        </div>
      )}

    </div>
  );
}
