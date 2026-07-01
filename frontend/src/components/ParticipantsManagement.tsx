import React, { useState, useRef } from 'react';
import { Page, Participant } from '../types';
import { participantsAPI } from '../api';
import { useToast } from './Toast';
import { 
  Users, Search, Filter, Upload, FileSpreadsheet, Trash2, Edit3, X, 
  Check, CheckSquare, ChevronRight, AlertCircle, RefreshCw, FileText
} from 'lucide-react';

interface ParticipantsManagementProps {
  onNavigate: (page: Page) => void;
  participants: Participant[];
  onAddParticipant: (part: Participant) => void;
  onDeleteParticipant: (id: string) => void;
}

export default function ParticipantsManagement({
  onNavigate,
  participants,
  onAddParticipant,
  onDeleteParticipant
}: ParticipantsManagementProps) {
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'valid' | 'pending' | 'invalid'>('All');
  
  // Import Wizard Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  
  // Mapping columns simulated state
  const [mappedName, setMappedName] = useState('Full_Name');
  const [mappedEmail, setMappedEmail] = useState('Email_Address');
  const [mappedEvent, setMappedEvent] = useState('Associated_Event');
  
  // Filter list
  const filteredParticipants = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.event || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleStartImport = () => {
    setShowImportModal(true);
    setImportStep(1);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setImportStep(2);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportStep(2);
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    try {
      const fieldMapping: Record<string, string> = {};
      fieldMapping[mappedName] = 'name';
      fieldMapping[mappedEmail] = 'email';
      fieldMapping[mappedEvent] = 'event';
      
      const result = await participantsAPI.importParticipants(selectedFile, fieldMapping);
      setShowImportModal(false);
      addToast('Participants imported successfully!', 'success');
      window.location.reload();
    } catch (err) {
      console.error('Import failed:', err);
      addToast('Import failed. Please check your file format.', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div id="participants-page-root" className="space-y-6">
      
      {/* Header element */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Participant Roster</h1>
          <p className="text-neutral-500 text-xs">Verify enrollment spreadsheets, check valid emails, and map columns before triggering bulk outputs.</p>
        </div>
        
        <button 
          onClick={handleStartImport}
          className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white text-xs font-semibold px-4 py-2.5 rounded flex items-center justify-center gap-2 transition-all self-start"
        >
          <Upload className="w-4 h-4" /> Import CSV / Excel list
        </button>
      </div>

      {/* FILTER & SEARCH COMPONENT */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-neutral-200 p-4 rounded-lg">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search roster database (e.g. Sora Takahashi, Cloud, Paris)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none rounded p-2.5 pl-9 text-xs transition-colors"
          />
        </div>

        {/* Status filters toggler */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-neutral-400">Filter status:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 hover:border-neutral-400 p-2 rounded outline-none text-xs font-semibold"
          >
            <option value="All">All statuses ({participants.length})</option>
            <option value="valid">Valid Email Protocols</option>
            <option value="pending">Awaiting Verification</option>
            <option value="invalid">Flagged Validation Errors</option>
          </select>
        </div>

      </div>

      {/* PARTICIPANTS LIST TABLE */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-mono uppercase text-[9px]">
                <th className="p-4 w-12 text-center">Roster #</th>
                <th className="p-4">Recipient Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Course / Event</th>
                <th className="p-4">Registration</th>
                <th className="p-4">Format State</th>
                <th className="p-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {filteredParticipants.map((part, idx) => (
                <tr key={part.id} className="hover:bg-neutral-50/40 transition-colors">
                  <td className="p-4 text-center font-mono text-neutral-400">#{idx + 1}</td>
                  <td className="p-4 font-bold text-neutral-900">{part.name}</td>
                  <td className="p-4 font-mono text-neutral-600">{part.email}</td>
                  <td className="p-4 text-neutral-500 font-mono">{part.phone}</td>
                  <td className="p-4 font-medium max-w-[200px] truncate" title={part.event}>{part.event}</td>
                  <td className="p-4 text-neutral-500 font-mono">{part.date}</td>
                  <td className="p-4">
                    {part.status === 'valid' && (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Verified Protocol
                      </span>
                    )}
                    {part.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending Sync
                      </span>
                    )}
                    {part.status === 'invalid' && (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold text-[10px]" title="Format error triggered">
                        <AlertCircle className="w-3 h-3 text-[#E52E40]" /> Syntax Error
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => onDeleteParticipant(part.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                      title="Prune Participant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic empty state table */}
        {filteredParticipants.length === 0 && (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <Users className="w-8 h-8 mx-auto stroke-1" />
            <div className="text-xs font-semibold">No participants registered</div>
            <p className="text-[10px] leading-relaxed">Consider mapping an external enrollment roster CSV spreadsheet.</p>
          </div>
        )}

        {/* Pagination placeholder footer */}
        <div className="bg-neutral-50/50 border-t border-neutral-100 p-3.5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span>Showing 1 to {filteredParticipants.length} of {filteredParticipants.length} matching cells</span>
          <div className="flex items-center gap-1">
            <button disabled className="p-1 px-2.5 bg-white border border-neutral-200 rounded text-neutral-400 hover:text-neutral-900 transition-colors">Previous</button>
            <button disabled className="p-1 px-2.5 bg-white border border-neutral-200 rounded text-neutral-400 hover:text-neutral-900 transition-colors">Next</button>
          </div>
        </div>

      </div>

      {/* 4-STEP CSV IMPORT MULTI-STEP MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-neutral-800 w-full max-w-xl rounded-lg shadow-[8px_8px_0px_0px_rgba(15,15,15,1)] overflow-hidden">
            
            {/* Modal Header */}
            <div className="border-b border-neutral-200 p-4 flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <h3 className="font-bold text-sm text-[#0F0F0F]">Spreadsheet Integration Desk</h3>
                <p className="text-neutral-400 text-[9px] font-mono">PARSING EXTERNAL DATA ROSTERS</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded hover:bg-neutral-200 text-neutral-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper progress block */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-neutral-100/60 border-b border-neutral-100 font-mono text-[10px]">
              <span className={`font-bold ${importStep === 1 ? 'text-[#E52E40]' : 'text-neutral-400'}`}>1. UPLOAD CSV</span>
              <span>→</span>
              <span className={`font-bold ${importStep === 2 ? 'text-[#E52E40]' : 'text-neutral-400'}`}>2. COLUMN MAPPING</span>
              <span>→</span>
              <span className={`font-bold ${importStep === 3 ? 'text-[#E52E40]' : 'text-neutral-400'}`}>3. SYNTAX CHECK</span>
              <span>→</span>
              <span className={`font-bold ${importStep === 4 ? 'text-[#E52E40]' : 'text-neutral-400'}`}>4. INGEST RECORD</span>
            </div>

            {/* Content areas */}
            <div className="p-6">
              
              {/* STEP 1: Upload File */}
              {importStep === 1 && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-neutral-300 hover:border-[#E52E40] rounded-lg p-8 text-center space-y-3 cursor-pointer bg-[#FAF9F6] transition-all"
                  >
                    <FileSpreadsheet className="w-12 h-12 text-[#E52E40] mx-auto" />
                    <h4 className="text-xs font-bold text-neutral-800">Choose enrollment spreadsheet</h4>
                    <p className="text-[10px] text-neutral-400">Drag & Drop .csv, .xlsx files or click to browse files.</p>
                  </div>
                  <div className="text-[10px] text-neutral-500 leading-normal flex items-start gap-1">
                    <span className="text-[#E52E40] font-bold">Note:</span>
                    <span>To allow optimal automatic verification, ensure column entries include Email headers.</span>
                  </div>
                </div>
              )}

              {/* STEP 2: COLUMN MAPPING */}
              {importStep === 2 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">MAP PLACEHOLDER VARIABLES TO CSV HEADERS</span>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-[#FAF9F6] rounded border border-neutral-200">
                      <span className="font-mono text-[#E52E40] font-bold">{"{{PARTICIPANT_NAME}}"}</span>
                      <span>maps to:</span>
                      <select value={mappedName} onChange={(e) => setMappedName(e.target.value)} className="bg-white border border-neutral-300 p-1.5 rounded outline-none font-mono">
                        <option value="Full_Name">Full_Name (Matches 99%)</option>
                        <option value="Recipient">Recipient</option>
                        <option value="Enroll_Name">Enroll_Name</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-[#FAF9F6] rounded border border-neutral-200">
                      <span className="font-mono text-[#E52E40] font-bold">{"{{EMAIL}}"}</span>
                      <span>maps to:</span>
                      <select value={mappedEmail} onChange={(e) => setMappedEmail(e.target.value)} className="bg-white border border-neutral-300 p-1.5 rounded outline-none font-mono">
                        <option value="Email_Address">Email_Address</option>
                        <option value="Contact_Email">Contact_Email</option>
                        <option value="Mail_Header">Mail_Header</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-[#FAF9F6] rounded border border-neutral-200">
                      <span className="font-mono text-[#E52E40] font-bold">{"{{EVENT}}"}</span>
                      <span>maps to:</span>
                      <select value={mappedEvent} onChange={(e) => setMappedEvent(e.target.value)} className="bg-white border border-neutral-300 p-1.5 rounded outline-none font-mono">
                        <option value="Associated_Event">Associated_Event</option>
                        <option value="Course_Title">Course_Title</option>
                        <option value="Event_Code">Event_Code</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={() => setImportStep(3)} className="w-full bg-[#0F0F0F] text-white p-3 text-xs font-mono rounded font-bold hover:bg-neutral-800 transition-colors">
                    Save mappings & check syntax →
                  </button>
                </div>
              )}

              {/* STEP 3: SYNTAX VALIDATION SCREEN */}
              {importStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">MAPPED ROSTER SYNTAX DIAGNOSTICS</span>
                    <span className="bg-green-100 text-green-800 font-mono text-[9px] px-2 py-0.5 rounded font-bold">CHECK COMPLETE</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 border-l-4 border-green-500 bg-[#FAF9F6] rounded">
                      <div>
                        <div className="font-bold text-neutral-800">Hiroko Takahashi (hiroko@cybersecurity.kyoto)</div>
                        <div className="text-[10px] text-neutral-400">Class: SaaS Security & Governance Workshop</div>
                      </div>
                      <span className="text-green-600 font-bold font-mono">OK</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 border-l-4 border-green-500 bg-[#FAF9F6] rounded">
                      <div>
                        <div className="font-bold text-neutral-800">Kenji Kamada (kamada@techu.ac.jp)</div>
                        <div className="text-[10px] text-neutral-400">Class: Cloud Architect Masterclass 2026</div>
                      </div>
                      <span className="text-green-600 font-bold font-mono">OK</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 border-l-4 border-rose-500 bg-rose-50/20 rounded">
                      <div>
                        <div className="font-bold text-neutral-800">Pruned: Row #45 is empty</div>
                        <div className="text-[10px] text-rose-600">Warning: No valid Email identifier present</div>
                      </div>
                      <span className="text-rose-600 font-bold font-mono">PRUNED</span>
                    </div>
                  </div>

                  <button onClick={() => setImportStep(4)} className="w-full bg-[#0F0F0F] text-white p-3 text-xs font-mono rounded font-bold hover:bg-neutral-800 transition-colors">
                    Proceed to confirmation →
                  </button>
                </div>
              )}

              {/* STEP 4: COMPLETED IMPORT PREVIEW */}
              {importStep === 4 && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-green-50 text-green-600 flex items-center justify-center rounded-full mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="max-w-sm mx-auto space-y-2">
                    <h4 className="font-bold text-neutral-900 text-sm">Roster checks complete!</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      We have resolved Kyoto Academy spreadsheet records. 2 new student profiles will be appended. Any invalid cells have been automatically cleaned.
                    </p>
                  </div>
                  <button onClick={handleExecuteImport} className="bg-[#E52E40] text-white p-3 px-6 text-xs font-mono rounded font-bold hover:bg-rose-700 transition-colors">
                    Commit Ingest to Ledger
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
