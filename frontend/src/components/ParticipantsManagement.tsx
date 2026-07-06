import React, { useState, useRef } from 'react';
import { Page, Participant } from '../types';
import { participantsAPI } from '../api';
import { useToast } from './Toast';
import { 
  Users, Search, Upload, FileSpreadsheet, Trash2, X, 
  Check, AlertCircle, Plus, UserPlus
} from 'lucide-react';

interface ParticipantsManagementProps {
  onNavigate: (page: Page) => void;
  participants: Participant[];
  onAddParticipant: (part: Participant) => void;
  onDeleteParticipant: (id: string) => void;
  onRefreshParticipants: () => Promise<void>;
}

export default function ParticipantsManagement({
  onNavigate,
  participants,
  onAddParticipant,
  onDeleteParticipant,
  onRefreshParticipants
}: ParticipantsManagementProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'valid' | 'pending' | 'invalid'>('All');
  
  // Import Wizard
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Add Participant Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [customFields, setCustomFields] = useState<{key: string; value: string}[]>([{key: '', value: ''}]);
  const [adding, setAdding] = useState(false);

  const filteredParticipants = participants.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || (p.event || '').toLowerCase().includes(q);
  });

  const detectHeaders = async (file: File): Promise<string[]> => {
    if (file.name.endsWith('.csv')) {
      const text = await file.slice(0, 4096).text();
      const firstLine = text.split('\n')[0];
      return firstLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    }
    return [];
  };

  const handleStartImport = () => {
    setShowImportModal(true);
    setImportStep(1);
    setSelectedFile(null);
    setDetectedHeaders([]);
    setFieldMapping({});
    setPreviewRows([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const headers = await detectHeaders(file);
    setDetectedHeaders(headers);
    const mapping: Record<string, string> = {};
    headers.forEach(h => {
      const hl = h.toLowerCase();
      if (hl === 'name' || hl === 'full name' || hl === 'full_name') mapping[h] = 'name';
      else if (hl === 'email' || hl === 'email address' || hl === 'email_address') mapping[h] = 'email';
      else mapping[h] = h;
    });
    setFieldMapping(mapping);
    setImportStep(2);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const headers = await detectHeaders(file);
    setDetectedHeaders(headers);
    const mapping: Record<string, string> = {};
    headers.forEach(h => {
      const hl = h.toLowerCase();
      if (hl === 'name' || hl === 'full name' || hl === 'full_name') mapping[h] = 'name';
      else if (hl === 'email' || hl === 'email address' || hl === 'email_address') mapping[h] = 'email';
      else mapping[h] = h;
    });
    setFieldMapping(mapping);
    setImportStep(2);
  };

  const handleMappingChange = (header: string, value: string) => {
    setFieldMapping(prev => ({...prev, [header]: value}));
  };

  const buildPreview = async () => {
    if (!selectedFile) return;
    if (selectedFile.name.endsWith('.csv')) {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(l => l.trim());
      const dataLines = lines.slice(1, 6);
      const rows = dataLines.map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        return vals;
      });
      setPreviewRows(rows);
    }
    setImportStep(3);
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    try {
      const result = await participantsAPI.importParticipants(selectedFile, fieldMapping);
      setShowImportModal(false);
      const created = result?.created ?? 0;
      const skipped = result?.skipped ?? 0;
      const errors = result?.errors ?? 0;
      await onRefreshParticipants();
      let msg = `${created} participant${created !== 1 ? 's' : ''} imported successfully`;
      if (skipped > 0) msg += `. ${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped`;
      if (errors > 0) msg += `. ${errors} row${errors !== 1 ? 's' : ''} had errors`;
      addToast(msg, 'success');
    } catch (err: any) {
      console.log(err.response?.data);
      addToast(err.response?.data?.detail ?? 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      addToast('Name and Email are required', 'error');
      return;
    }
    setAdding(true);
    try {
      const customFieldsObj: Record<string, string> = {};
      customFields.forEach(cf => {
        if (cf.key.trim()) customFieldsObj[cf.key.trim()] = cf.value.trim();
      });
      const payload: any = { name: newName.trim(), email: newEmail.trim() };
      if (Object.keys(customFieldsObj).length > 0) payload.custom_fields = customFieldsObj;
      console.log('ADDING PARTICIPANT', payload);
      const response = await participantsAPI.create(payload);
      console.log('CREATED', response);
      onAddParticipant(response);
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setCustomFields([{key: '', value: ''}]);
      addToast('Participant added successfully', 'success');
    } catch (err: any) {
      const detail = err.response?.data;
      const errorMessage = detail?.message || detail?.detail || err.message || 'Failed to add participant';
      addToast(errorMessage, 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div id="participants-page-root" className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Participant Roster</h1>
          <p className="text-neutral-500 text-xs">Manage participants, import from CSV/XLSX, or add manually.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white text-xs font-semibold px-4 py-2.5 rounded flex items-center justify-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add Participant
          </button>
          <button 
            onClick={handleStartImport}
            className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white text-xs font-semibold px-4 py-2.5 rounded flex items-center justify-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" /> Bulk Import
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-neutral-200 p-4 rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search participants..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none rounded p-2.5 pl-9 text-xs transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-neutral-400">Filter:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 hover:border-neutral-400 p-2 rounded outline-none text-xs font-semibold"
          >
            <option value="All">All ({participants.length})</option>
            <option value="valid">Valid</option>
            <option value="pending">Pending</option>
            <option value="invalid">Invalid</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-mono uppercase text-[9px]">
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Event</th>
                <th className="p-4">Custom Fields</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {filteredParticipants.map((part, idx) => (
                <tr key={part.id} className="hover:bg-neutral-50/40 transition-colors">
                  <td className="p-4 text-center font-mono text-neutral-400">#{idx + 1}</td>
                  <td className="p-4 font-bold text-neutral-900">{part.name}</td>
                  <td className="p-4 font-mono text-neutral-600">{part.email}</td>
                  <td className="p-4 max-w-[150px] truncate">{part.event || '—'}</td>
                  <td className="p-4 text-neutral-500 text-[10px] max-w-[200px] truncate">
                    {part.custom_fields ? JSON.stringify(part.custom_fields) : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => onDeleteParticipant(part.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredParticipants.length === 0 && (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <Users className="w-8 h-8 mx-auto stroke-1" />
            <div className="text-xs font-semibold">No participants found</div>
            <p className="text-[10px] leading-relaxed">Add participants manually or import from CSV/XLSX.</p>
          </div>
        )}

        <div className="bg-neutral-50/50 border-t border-neutral-100 p-3.5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span>Showing {filteredParticipants.length} of {participants.length} participants</span>
        </div>
      </div>

      {/* ADD PARTICIPANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-neutral-800 w-full max-w-md rounded-lg shadow-[8px_8px_0px_0px_rgba(15,15,15,1)] overflow-hidden">
            <div className="border-b border-neutral-200 p-4 flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <h3 className="font-bold text-sm text-[#0F0F0F]">Add Participant</h3>
                <p className="text-neutral-400 text-[9px] font-mono">MANUAL ENTRY</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-neutral-200 text-neutral-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddParticipant}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Name *</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded p-2.5 text-xs outline-none focus:border-[#E52E40] mt-1"
                    placeholder="Full name" />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Email *</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded p-2.5 text-xs outline-none focus:border-[#E52E40] mt-1"
                    placeholder="email@example.com" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Custom Fields</label>
                    <button type="button" onClick={() => setCustomFields([...customFields, {key: '', value: ''}])}
                      className="text-[10px] text-[#E52E40] font-bold">+ Add Field</button>
                  </div>
                  {customFields.map((cf, i) => (
                    <div key={i} className="flex items-center gap-2 mt-1">
                      <input type="text" placeholder="Field name" value={cf.key}
                        onChange={e => { const n = [...customFields]; n[i].key = e.target.value; setCustomFields(n); }}
                        className="flex-1 bg-neutral-50 border border-neutral-200 rounded p-2 text-xs outline-none focus:border-[#E52E40]"
                      />
                      <input type="text" placeholder="Value" value={cf.value}
                        onChange={e => { const n = [...customFields]; n[i].value = e.target.value; setCustomFields(n); }}
                        className="flex-1 bg-neutral-50 border border-neutral-200 rounded p-2 text-xs outline-none focus:border-[#E52E40]"
                      />
                      {customFields.length > 1 && (
                        <button type="button" onClick={() => setCustomFields(customFields.filter((_, j) => j !== i))}
                          className="text-neutral-400 hover:text-rose-600">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={adding}
                  className="w-full bg-[#0F0F0F] hover:bg-[#E52E40] text-white p-3 text-xs font-bold rounded transition-colors disabled:opacity-50">
                  {adding ? 'Saving...' : 'Save Participant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-neutral-800 w-full max-w-xl rounded-lg shadow-[8px_8px_0px_0px_rgba(15,15,15,1)] overflow-hidden">
            
            <div className="border-b border-neutral-200 p-4 flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <h3 className="font-bold text-sm text-[#0F0F0F]">Bulk Import</h3>
                <p className="text-neutral-400 text-[9px] font-mono">CSV / XLSX</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded hover:bg-neutral-200 text-neutral-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between px-6 py-3.5 bg-neutral-100/60 border-b border-neutral-100 font-mono text-[10px]">
              <span className={`font-bold ${importStep === 1 ? 'text-[#E52E40]' : 'text-neutral-400'}`}>1. UPLOAD</span>
              <span>→</span>
              <span className={`font-bold ${importStep === 2 ? 'text-[#E52E40]' : 'text-neutral-400'}`}>2. MAP COLUMNS</span>
              <span>→</span>
              <span className={`font-bold ${importStep === 3 ? 'text-[#E52E40]' : 'text-neutral-400'}`}>3. PREVIEW</span>
              <span>→</span>
              <span className={`font-bold ${importStep === 4 ? 'text-[#E52E40]' : 'text-neutral-400'}`}>4. IMPORT</span>
            </div>

            <div className="p-6">
              
              {/* STEP 1: Upload */}
              {importStep === 1 && (
                <div className="space-y-4">
                  <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                  <div onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()} onDrop={handleFileDrop}
                    className="border-2 border-dashed border-neutral-300 hover:border-[#E52E40] rounded-lg p-8 text-center space-y-3 cursor-pointer bg-[#FAF9F6] transition-all">
                    <FileSpreadsheet className="w-12 h-12 text-[#E52E40] mx-auto" />
                    <h4 className="text-xs font-bold text-neutral-800">Choose spreadsheet</h4>
                    <p className="text-[10px] text-neutral-400">Drag & drop .csv, .xlsx files or click to browse.</p>
                  </div>
                </div>
              )}

              {/* STEP 2: Map Columns */}
              {importStep === 2 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                    MAP CSV HEADERS TO DATABASE FIELDS
                  </span>
                  {detectedHeaders.length === 0 && (
                    <p className="text-xs text-amber-600">Could not detect headers. You can type column names manually below.</p>
                  )}
                  <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
                    {detectedHeaders.map(header => (
                      <div key={header} className="flex items-center gap-2 p-2 bg-[#FAF9F6] rounded border border-neutral-200">
                        <span className="font-mono font-bold text-neutral-600 min-w-[100px]">{header}</span>
                        <span className="text-neutral-400">→</span>
                        <input type="text" value={fieldMapping[header] || ''}
                          onChange={e => handleMappingChange(header, e.target.value)}
                          className="flex-1 bg-white border border-neutral-300 p-1.5 rounded outline-none font-mono text-[10px]"
                          placeholder="DB field name (name, email, ...)" />
                      </div>
                    ))}
                    {detectedHeaders.length === 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-[#FAF9F6] rounded border border-neutral-200">
                          <input type="text" placeholder="Column name" className="flex-1 bg-white border border-neutral-300 p-1.5 rounded outline-none font-mono text-[10px]"
                            value={Object.keys(fieldMapping)[0] || ''}
                            onChange={e => {
                              const newMapping: Record<string, string> = {};
                              newMapping[e.target.value] = 'name';
                              setFieldMapping(newMapping);
                            }}
                          />
                          <span className="text-neutral-400">→</span>
                          <input type="text" value="name" disabled className="flex-1 bg-neutral-100 border border-neutral-200 p-1.5 rounded font-mono text-[10px]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    Map CSV column names to database fields. Use <strong>name</strong>, <strong>email</strong> for standard fields. 
                    Any other field name will be stored in <strong>custom_fields</strong> JSON.
                  </p>
                  <button onClick={buildPreview} className="w-full bg-[#0F0F0F] text-white p-3 text-xs font-mono rounded font-bold hover:bg-neutral-800 transition-colors">
                    Preview Data →
                  </button>
                </div>
              )}

              {/* STEP 3: Preview */}
              {importStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">DATA PREVIEW</span>
                    <span className="bg-green-100 text-green-800 font-mono text-[9px] px-2 py-0.5 rounded font-bold">
                      {detectedHeaders.length} columns detected
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-mono">
                      <thead>
                        <tr className="text-neutral-500">
                          {detectedHeaders.map(h => <th key={h} className="p-1.5 text-left">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i} className="border-t border-neutral-100">
                            {row.map((cell, j) => (
                              <td key={j} className="p-1.5 text-neutral-700 max-w-[120px] truncate">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => setImportStep(4)} className="w-full bg-[#0F0F0F] text-white p-3 text-xs font-mono rounded font-bold hover:bg-neutral-800 transition-colors">
                    Continue to Import →
                  </button>
                </div>
              )}

              {/* STEP 4: Confirm & Import */}
              {importStep === 4 && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-green-50 text-green-600 flex items-center justify-center rounded-full mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="max-w-sm mx-auto space-y-2">
                    <h4 className="font-bold text-neutral-900 text-sm">Ready to Import</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      The file has been parsed. Columns will be mapped as configured.
                    </p>
                  </div>
                  <button onClick={handleExecuteImport} disabled={importing}
                    className="bg-[#E52E40] text-white p-3 px-6 text-xs font-mono rounded font-bold hover:bg-rose-700 transition-colors disabled:opacity-50">
                    {importing ? 'Importing...' : 'Execute Import'}
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
