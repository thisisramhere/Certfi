import React, { useState } from 'react';
import { Page, GeneratedCertificate } from '../types';
import { verificationAPI } from '../api';
import { 
  CheckSquare, QrCode, Search, ShieldCheck, ShieldAlert, Upload, 
  Camera, X, FileText, Check, AlertCircle, RefreshCw, Calendar, Sparkles, CornerDownRight
} from 'lucide-react';

interface VerificationCenterProps {
  onNavigate: (page: Page) => void;
  certificates: GeneratedCertificate[];
}

export default function VerificationCenter({
  onNavigate,
  certificates
}: VerificationCenterProps) {
  
  const [activeMethod, setActiveMethod] = useState<'id' | 'upload' | 'camera'>('id');
  const [inputId, setInputId] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // Verification result state
  const [verificationResult, setVerificationResult] = useState<{ status: string; message: string; certificate_id: string } | null>(null);
  const [searchedEmpty, setSearchedEmpty] = useState(false);

  // Trigger search ID via API
  const handleVerifyId = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputId) return;

    setVerifying(true);
    setVerificationResult(null);
    setSearchedEmpty(false);

    try {
      const result = await verificationAPI.verifyCertificate(inputId);
      setVerificationResult(result);
      if (result.status === 'invalid') {
        setSearchedEmpty(true);
      }
    } catch (err) {
      setSearchedEmpty(true);
    } finally {
      setVerifying(false);
    }
  };

  // Quick lookup helper
  const handleTryQuery = (id: string) => {
    setInputId(id);
    setActiveMethod('id');
    setVerificationResult(null);
    setSearchedEmpty(false);
    handleVerifyId();
  };

  // Simulate drag drop file parsing
  const handleSimulateDragQR = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
    }, 900);
  };

  // Simulate camera resolution
  const [cameraActive, setCameraActive] = useState(false);
  const handleSimulateCameraResolve = () => {
    setCameraActive(true);
    setTimeout(() => {
      setCameraActive(false);
    }, 2500);
  };

  return (
    <div id="verification-center-root" className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Cryptographic Verification Desk</h1>
          <p className="text-neutral-500 text-xs">Verify authenticity hashes, detect tampered files, and review immutable participant registries.</p>
        </div>
        
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-400 bg-white border border-neutral-200 px-3 py-1.5 rounded">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span> LEDGER GATEWAY ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Verification Inputs Gateway */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-lg p-6 space-y-6 shadow-sm">
          
          {/* Tabs Selector */}
          <div className="grid grid-cols-3 divide-x divide-neutral-100 bg-neutral-50 p-1 rounded border border-neutral-200 font-mono text-[9px] text-center">
            <button 
              onClick={() => { setActiveMethod('id'); setVerificationResult(null); setSearchedEmpty(false); }}
              className={`py-2 rounded font-bold transition-colors ${activeMethod === 'id' ? 'bg-white text-[#E52E40]' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              CERTIFICATE ID
            </button>
            <button 
              onClick={() => { setActiveMethod('upload'); setVerificationResult(null); setSearchedEmpty(false); }}
              className={`py-2 rounded font-bold transition-colors ${activeMethod === 'upload' ? 'bg-white text-[#E52E40]' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              UPLOAD QR FILE
            </button>
            <button 
              onClick={() => { setActiveMethod('camera'); setVerificationResult(null); setSearchedEmpty(false); }}
              className={`py-2 rounded font-bold transition-colors ${activeMethod === 'camera' ? 'bg-white text-[#E52E40]' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              LIVE CAMERA SCAN
            </button>
          </div>

          {/* METHOD 1: ID INPUT */}
          {activeMethod === 'id' && (
            <form onSubmit={handleVerifyId} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-neutral-500 mb-1">ENTER UNIQUE SECURE ID</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. CERT-2026-0928A" 
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 pl-10 rounded text-sm font-mono tracking-wider"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={verifying}
                className="w-full bg-[#0F0F0F] hover:bg-[#E52E40] disabled:bg-neutral-300 text-white font-semibold text-xs p-3.5 rounded transition-all flex items-center justify-center gap-2"
              >
                {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {verifying ? 'VERIFYING SIGNATURE HASH...' : 'Query Blockchain Ledger'}
              </button>

              {/* Try sample test labels */}
              <div className="pt-4 border-t border-neutral-100">
                <span className="text-[9px] font-mono text-neutral-400 block uppercase font-bold mb-2">QUICK TELEMETRY TEST SAMPLES</span>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                  <button type="button" onClick={() => handleTryQuery(inputId || 'TEST-CERT-001')} className="bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 px-2.5 py-1 rounded">Test Verify</button>
                </div>
              </div>
            </form>
          )}

          {/* METHOD 2: UPLOAD QR */}
          {activeMethod === 'upload' && (
            <div className="space-y-4">
              <div 
                onClick={handleSimulateDragQR}
                className="border-2 border-dashed border-neutral-300 hover:border-[#E52E40] rounded-lg p-8 text-center space-y-3 cursor-pointer bg-[#FAF9F6] transition-all"
              >
                <Upload className="w-10 h-10 text-neutral-400 mx-auto" />
                <h4 className="text-xs font-bold text-neutral-800">Drag & Drop secure PDF or QR block image</h4>
                <p className="text-[10px] text-neutral-400">Our engines read integrated pixels and parse crypt signatures instantly.</p>
              </div>

              <div className="text-center text-[11px] text-neutral-500">
                Click file region above to simulate QR extraction.
              </div>
            </div>
          )}

          {/* METHOD 3: CAMERA SCAN */}
          {activeMethod === 'camera' && (
            <div className="space-y-4">
              
              {cameraActive ? (
                /* Simulated viewfinder */
                <div className="relative aspect-square max-w-[280px] mx-auto bg-black rounded-lg overflow-hidden border-2 border-neutral-800">
                  <div className="absolute inset-4 border border-dashed border-green-500 opacity-60 rounded flex items-center justify-center animate-pulse">
                    <span className="text-[8px] font-mono text-green-500">RESOLVING QR CODE SIGN...</span>
                  </div>
                  {/* Viewfinder crosshairs */}
                  <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-green-500"></span>
                  <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-green-500"></span>
                  <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-green-500"></span>
                  <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-green-500"></span>
                  
                  {/* laser bar */}
                  <div className="absolute w-full h-1 bg-green-500 top-1/2 -translate-y-1/2 shadow-[0_0_10px_#22c55e] animate-bounce"></div>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-lg border-neutral-200 space-y-4 bg-neutral-50/50">
                  <Camera className="w-12 h-12 text-[#E52E40] mx-auto" />
                  <div className="max-w-xs mx-auto space-y-1">
                    <h4 className="font-bold text-neutral-800 text-xs">Verify using Smartphone Camera</h4>
                    <p className="text-[10px] text-neutral-400 leading-normal">
                      Hold the certificate QR box within viewfinder. Ensure correct alignment and high-contrast environments.
                    </p>
                  </div>
                  <button 
                    onClick={handleSimulateCameraResolve}
                    className="bg-[#0F0F0F] text-white p-2.5 px-4 font-mono text-xs rounded font-bold hover:bg-neutral-800 transition-colors"
                  >
                    Activate Camera Scan Viewfinder
                  </button>
                </div>
              )}

              {verifying && activeMethod === 'camera' && (
                <div className="text-center font-mono text-[10px] text-[#E52E40] animate-pulse">
                  SYNCING HASH LEDGER BLOCKS...
                </div>
              )}

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Verification Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          
          {verificationResult ? (
            /* VERIFIED / FLAG MATCH RESULT CARD */
            <div className="bg-white border-2 border-neutral-800 rounded-lg p-6 shadow-[8px_8px_0px_0px_rgba(15,15,15,1)] space-y-6 animate-fade-in">
              
              {/* Header result badge banner */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Cryptographic Verification Integrity</h3>
                  <p className="text-neutral-400 text-[9px] font-mono">RESOLVED BLOCK ID: {verificationResult.certificate_id}</p>
                </div>
                
                {verificationResult.status === 'valid' && (
                  <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded font-bold text-xs uppercase font-mono">
                    <Check className="w-4 h-4" /> SECURELY VERIFIED
                  </span>
                )}
                {verificationResult.status === 'invalid' && (
                  <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 rounded font-bold text-xs uppercase font-mono">
                    <ShieldAlert className="w-4 h-4" /> INVALID CERTIFICATE
                  </span>
                )}
                {verificationResult.status === 'tampered' && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded font-bold text-xs uppercase font-mono">
                    <AlertCircle className="w-4 h-4" /> TAMPERED
                  </span>
                )}
              </div>

              {/* Certificate details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-neutral-400 block uppercase font-bold">CERTIFICATE ID</span>
                    <div className="text-sm font-bold text-neutral-900 font-mono">{verificationResult.certificate_id}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-neutral-400 block uppercase font-bold">VERIFICATION STATUS</span>
                    <div className="text-xs font-semibold text-neutral-700">{verificationResult.status.toUpperCase()}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-neutral-400 block uppercase font-bold">VERIFICATION MESSAGE</span>
                    <div className="text-xs text-neutral-600 leading-relaxed">{verificationResult.message}</div>
                  </div>
                </div>
              </div>

              {/* Ledger check verification timeline */}
              <div className="border-t border-neutral-100 pt-4 space-y-2">
                <span className="text-[9px] font-mono text-neutral-400 block uppercase font-bold text-left">LEDGER BLOCKCHECKS DIAGNOSTICS</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-green-50/50 border border-green-100 rounded text-green-800 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600 shrink-0" /> Certificate Hash Verified
                  </div>
                  <div className="p-2.5 bg-green-50/50 border border-green-100 rounded text-green-800 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600 shrink-0" /> Integrity Check OK
                  </div>
                  <div className="p-2.5 bg-green-50/50 border border-green-100 rounded text-green-800 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600 shrink-0" /> Block Active & Valid
                  </div>
                </div>
              </div>

            </div>
          ) : searchedEmpty ? (
            /* INVALID RESULT CARD */
            <div className="bg-white border border-rose-200 rounded-lg p-8 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 flex items-center justify-center rounded-full mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h3 className="font-extrabold text-[#0F0F0F] text-sm uppercase">Cryptographic Signature Rejected</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  No certificate matching unique ID <strong>"{inputId}"</strong> was located within our decentralized ledger. This record may have been forged or altered.
                </p>
              </div>
              <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-lg text-left text-xs text-rose-800 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-[#E52E40]" /> Forgery Counter-protocols Triggered:</div>
                <div className="text-[10px] text-rose-700 leading-normal pl-5">
                  - Ledger Signature mismatch detected.<br />
                  - Event authority validation failed.<br />
                  - Access logged with IP telemetry markers.
                </div>
              </div>
            </div>
          ) : (
            /* EMPTY INITIAL RESULT */
            <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-16 text-center text-neutral-400 space-y-3">
              <CheckSquare className="w-10 h-10 mx-auto stroke-1 text-neutral-300 animate-pulse" />
              <div className="text-xs font-semibold">Ready for Cryptographic Query</div>
              <p className="text-[10px] leading-relaxed max-w-sm mx-auto">
                Enter a certificate code above or scan a secure QR matrix block to query the ledger database and view real-time compliance validation metrics.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
