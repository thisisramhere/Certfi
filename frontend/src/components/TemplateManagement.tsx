// LOCKED: AI template editor UI. Do not modify without running test_ai_pipeline.py first.
// Last verified: 2026-07-05 - 52/52 tests passed, restart safe.
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Page, CertificateTemplate, TemplatePlaceholder } from '../types';
import { templatesAPI, fontsAPI } from '../api';
import Moveable from 'react-moveable';
import {
  Plus, Search, Trash2, Copy, Upload, Tag, ChevronRight, X, Sparkles, FolderOpen, ArrowRight,
  CheckCircle, Loader2
} from 'lucide-react';

interface TemplateManagementProps {
  onNavigate: (page: Page) => void;
  templates: CertificateTemplate[];
  onAddTemplate: (newTpl: CertificateTemplate) => void;
  onSelectTemplate: (tpl: CertificateTemplate) => void;
  onDeleteTemplate: (id: string) => Promise<void> | void;
  onTemplatesUpdate?: (templates: CertificateTemplate[]) => void;
}

interface AnalysisResult {
  id: string;
  templateId: string;
  placeholders: TemplatePlaceholder[];
  confidence: number;
  analysis: any;
  status: 'pending' | 'success' | 'error';
}

const EditablePlaceholder = ({
  placeholder,
  previewWidth,
  previewHeight,
  selected,
  setSelected,
  updatePlaceholder,
}: {
  key?: string | number;
  placeholder: TemplatePlaceholder;
  previewWidth: number;
  previewHeight: number;
  selected: string | null;
  setSelected: (id: string | null) => void;
  updatePlaceholder: (id: string, updates: Partial<TemplatePlaceholder>) => void;
}) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const x = (placeholder.x / 100) * previewWidth;
  const y = (placeholder.y / 100) * previewHeight;
  const w = (placeholder.width / 100) * previewWidth;
  const h = (placeholder.height / 100) * previewHeight;
  return (
    <>
      <div
        ref={targetRef}
        onClick={() => setSelected(placeholder.id)}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          border: selected === placeholder.id ? '2px solid #E52E40' : '2px dashed #E52E40',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'move',
          fontFamily: placeholder.font_family || 'Arial',
          fontSize: `${placeholder.font_size || 14}px`,
          fontWeight: placeholder.font_weight || 'bold',
          color: placeholder.font_color || '#000000',
          textAlign: (placeholder.alignment as any) || 'center',
          background: 'rgba(229, 46, 64, 0.08)',
          zIndex: 10,
          overflow: 'hidden',
        }}
      >
        <span className="leading-tight px-1 text-xs pointer-events-none">
          {placeholder.type === 'name' ? 'NAME' : placeholder.type === 'certificate_id' ? 'CERT-XXXX' : placeholder.type === 'qr_code' ? 'QR' : placeholder.type?.toUpperCase()}
        </span>
      </div>
      {selected === placeholder.id && (
        <Moveable
          target={targetRef}
          draggable={true}
          resizable={true}
          onDrag={({ left, top }) => {
            updatePlaceholder(placeholder.id, {
              x: (left / previewWidth) * 100,
              y: (top / previewHeight) * 100,
            });
          }}
          onResize={({ width, height, drag }) => {
            updatePlaceholder(placeholder.id, {
              x: (drag.left / previewWidth) * 100,
              y: (drag.top / previewHeight) * 100,
              width: (width / previewWidth) * 100,
              height: (height / previewHeight) * 100,
            });
          }}
        />
      )}
    </>
  );
};

export default function TemplateManagement({
  onNavigate,
  templates,
  onAddTemplate,
  onSelectTemplate,
  onDeleteTemplate,
  onTemplatesUpdate
}: TemplateManagementProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplCategory, setTplCategory] = useState('Engineering');
  const [tplTags, setTplTags] = useState('SaaS, Cloud, Masterclass');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<CertificateTemplate | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setPreviewSize({ width: rect.width, height: rect.height });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [analysis]);
  const [wizardStep, setWizardStep] = useState(1);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imgFailedIds, setImgFailedIds] = useState<Set<string>>(new Set());
  const [customFonts, setCustomFonts] = useState<{ font_family: string; font_url: string; font_file_path?: string }[]>([]);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const uploadCustomFont = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await fontsAPI.upload(file);
      const font = new FontFace(result.font_family, `url(${result.font_url})`);
      await font.load();
      document.fonts.add(font);
      setCustomFonts(prev => [...prev, result]);
      if (selectedPlaceholder && analysis) {
        updatePlaceholder(selectedPlaceholder, {
          font_family: result.font_family,
          font_file_url: result.font_url,
          font_file_path: result.font_file_path,
        });
      }
    } catch (err: any) {
      console.error('Font upload failed:', err);
      alert(err?.response?.data?.detail || 'Font upload failed');
    }
    if (fontInputRef.current) fontInputRef.current.value = '';
  };
  
  const categories = ['All', 'Engineering', 'Corporate', 'Hackathons'];
  
  const filteredTemplates = templates.filter(tpl => {
    const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (tpl.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const getFileType = (file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
    if (ext === 'pdf') return 'pdf';
    return 'png';
  };
  
  const handleSaveTemplate = async () => {
    if (!tplName || !selectedFile) return;
    
    try {
      const formData = new FormData();
      formData.append('name', tplName);
      formData.append('description', tplDesc || 'Custom certificate design.');
      formData.append('file', selectedFile);
      formData.append('file_type', getFileType(selectedFile));
      formData.append('width', '1200');
      formData.append('height', '850');
      formData.append('dpi', '300');
      formData.append('background_color', '#FFFFFF');
      
      const newTpl = await templatesAPI.create(formData);
      onAddTemplate(newTpl);
      setShowCreateModal(false);
      
      setWizardStep(1);
      setTplName('');
      setTplDesc('');
      setTplCategory('Engineering');
      setTplTags('');
      setSelectedFile(null);
      
      openAIEditor(newTpl);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Template creation failed.';
      console.error('Template creation failed:', err);
      alert(msg);
    }
  };
  
  const openAIEditor = async (template: CertificateTemplate) => {
    setIsAnalyzing(true);
    setShowAIEditor(true);
    setCurrentTemplate(template);
    setAnalysis(null);
    
    try {
      const result = await templatesAPI.aiAnalyzeTemplate(template.id);
      setAnalysis(result);
    } catch (err: any) {
      console.error('AI analysis failed:', err?.response?.data || err);
      alert(err?.response?.data?.detail ?? err?.message ?? 'AI analysis failed');
      setShowAIEditor(false);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const FONT_FAMILIES = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Poppins', 'Montserrat', 'Playfair Display', 'Dancing Script', 'Great Vibes'];
  const FONT_WEIGHTS = ['normal', 'medium', 'bold'];

  const updatePlaceholder = (id: string, updates: Partial<TemplatePlaceholder>) => {
    setAnalysis(prev => prev ? {
      ...prev,
      placeholders: prev.placeholders.map(ph =>
        ph.id === id ? { ...ph, ...updates } : ph
      )
    } : null);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedPlaceholder || !analysis) return;
    const ph = analysis.placeholders.find(p => p.id === selectedPlaceholder);
    if (!ph) return;
    const step = e.shiftKey ? 5 : 0.5;
    let dx = 0, dy = 0;
    switch (e.key) {
      case 'ArrowUp': dy = -step; break;
      case 'ArrowDown': dy = step; break;
      case 'ArrowLeft': dx = -step; break;
      case 'ArrowRight': dx = step; break;
      default: return;
    }
    e.preventDefault();
    updatePlaceholder(selectedPlaceholder, { x: ph.x + dx, y: ph.y + dy });
  }, [selectedPlaceholder, analysis]);

  const acceptAIPlacement = async () => {
    if (!currentTemplate || !analysis || isSaving) return;
    
    setIsSaving(true);
    try {
      await templatesAPI.aiFinalizePlacements(currentTemplate.id, analysis.placeholders);
      setShowAIEditor(false);
      setAnalysis(null);
      setSelectedPlaceholder(null);
      alert('AI placement saved successfully!');
      // Refresh global templates state so other components get placeholders
      const refreshedTemplates = await templatesAPI.getAll();
      if (onTemplatesUpdate) {
        onTemplatesUpdate(refreshedTemplates);
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(err.response?.data?.detail || 'Failed to save placement');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Certificate Templates</h1>
          <p className="text-neutral-500 text-xs">Upload background backdrops, AI analyzes certificate layout and places dynamic metadata grids.</p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white text-xs font-semibold px-4 py-2.5 rounded flex items-center justify-center gap-2 transition-all self-start"
        >
          <Plus className="w-4 h-4" /> Create Custom Template
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-neutral-200 p-4 rounded-lg">
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search templates (e.g. leadership, gold)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none rounded p-2.5 pl-9 text-xs transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${selectedCategory === cat ? 'bg-[#0F0F0F] text-white' : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-16 text-center rounded-lg space-y-4">
          <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center text-neutral-400 rounded-full mx-auto">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="max-w-sm mx-auto space-y-2">
            <h3 className="font-bold text-neutral-900 text-sm">No templates match query</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">Consider creating a fresh certificate canvas or resetting your category selections.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white font-semibold text-xs px-4 py-2 rounded transition-colors">
            Configure New Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => (
            <div key={tpl.id} className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group">
              
              <div className="bg-neutral-50 aspect-[1.41/1] overflow-hidden border-b border-neutral-100 relative flex items-center justify-center p-3">
                {tpl.backdropUrl && !imgFailedIds.has(tpl.id) ? (
                  <img 
                    src={tpl.backdropUrl} 
                    alt={tpl.name} 
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailedIds(prev => new Set(prev).add(tpl.id))}
                    className="w-full h-full object-contain border border-neutral-200 rounded shadow-sm group-hover:scale-[1.02] transition-transform" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded border border-neutral-200">
                    <span className="text-xs text-neutral-400">No image</span>
                  </div>
                )}
                
                <span className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  {(tpl.elements ?? []).length} dynamic tags
                </span>

                <span className="absolute top-3 right-3 bg-[#E52E40] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  {tpl.category ?? 'General'}
                </span>

                <div className="absolute inset-0 bg-neutral-950/45 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                  <button 
                    onClick={() => openAIEditor(tpl)}
                    className="bg-white hover:bg-[#E52E40] text-neutral-900 hover:text-white p-2 rounded shadow transition-colors"
                    title="Analyze with AI"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { onSelectTemplate(tpl); }}
                    className="bg-white hover:bg-neutral-900 text-neutral-900 hover:text-white px-3 py-1.5 rounded shadow text-xs font-semibold transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="font-bold text-sm text-neutral-900 truncate">{tpl.name}</h3>
                <p className="text-xs text-neutral-500 line-clamp-2 min-h-[32px]">{tpl.description}</p>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {(tpl.tags ?? []).map(t => (
                    <span key={t} className="bg-neutral-50 text-neutral-500 font-mono text-[9px] px-1.5 py-0.5 rounded border border-neutral-100">
                      #{t}
                    </span>
                  ))}
                </div>

                <hr className="border-neutral-100 my-3" />

                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span>Count: <strong className="text-neutral-700">{tpl.certificateCount ?? 0}</strong> generated</span>
                  <span>Modified: {tpl.lastModified ?? 'N/A'}</span>
                </div>
              </div>

              <div className="bg-neutral-50/50 border-t border-neutral-100 p-3.5 flex items-center justify-between gap-2">
                <button 
                  onClick={() => openAIEditor(tpl)}
                  className="flex items-center gap-1.5 text-xs text-neutral-700 hover:text-[#E52E40] font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI Analyze
                </button>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={async () => {
                      try {
                        const dup = await templatesAPI.duplicate(tpl.id);
                        onAddTemplate(dup);
                        setConfirmMsg('Template successfully duplicated!');
                        setTimeout(() => setConfirmMsg(''), 3000);
                      } catch (err: any) {
                        alert(err?.response?.data?.detail || 'Failed to duplicate template');
                      }
                    }}
                    className="text-neutral-400 hover:text-[#0F0F0F] p-1.5 rounded transition-colors"
                    title="Duplicate template"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete \"${tpl.name}\"? This action cannot be undone.`)) {
                        setDeletingId(tpl.id);
                        try {
                          await onDeleteTemplate(tpl.id);
                          setConfirmMsg('Template deleted successfully');
                          setTimeout(() => setConfirmMsg(''), 3000);
                        } catch (err: any) {
                          alert(err?.response?.data?.detail || err?.message || 'Failed to delete template');
                        } finally {
                          setDeletingId(null);
                        }
                      }
                    }}
                    disabled={deletingId === tpl.id}
                    className="text-neutral-400 hover:text-red-600 p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmMsg && (
        <div className="fixed bottom-6 right-6 bg-[#0F0F0F] text-white p-3.5 rounded shadow-lg z-50 text-xs font-mono border-l-4 border-emerald-500 flex items-center gap-2">
          <span>{confirmMsg}</span>
          <button onClick={() => setConfirmMsg('')} className="hover:text-neutral-400 font-bold ml-2">×</button>
        </div>
      )}

      {showAIEditor && currentTemplate && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-neutral-800 w-full max-w-6xl rounded-lg shadow-[8px_8px_0px_0px_rgba(15,15,15,1)] overflow-hidden max-h-[90vh] overflow-y-auto">
            
            <div className="border-b border-neutral-200 p-4 flex items-center justify-between bg-neutral-50">
              <div>
                <h3 className="font-bold text-sm text-[#0F0F0F]">AI Certificate Analysis</h3>
                <p className="text-neutral-400 text-[10px] font-mono">Analyze: {currentTemplate.name}</p>
              </div>
              <button onClick={() => { setShowAIEditor(false); setAnalysis(null); setSelectedPlaceholder(null); }} className="p-1 rounded hover:bg-neutral-200 text-neutral-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {isAnalyzing ? (
                <div className="text-center py-12 space-y-4">
                  <Loader2 className="w-12 h-12 text-[#E52E40] animate-spin mx-auto" />
                  <div>
                    <h4 className="font-semibold text-sm">Analyzing Certificate...</h4>
                    <p className="text-xs text-neutral-500 mt-1">Running computer vision pipeline...</p>
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-mono text-xs text-neutral-500 uppercase">Original Certificate</h4>
                      <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                        {currentTemplate.backdropUrl && !imgFailedIds.has(currentTemplate.id) ? (
                          <img 
                            src={currentTemplate.backdropUrl} 
                            alt={currentTemplate.name}
                            referrerPolicy="no-referrer"
                            onError={() => setImgFailedIds(prev => new Set(prev).add(currentTemplate.id))}
                            className="w-full h-auto object-contain rounded border border-neutral-200"
                          />
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center bg-neutral-100 rounded border border-neutral-200">
                            <span className="text-xs text-neutral-400">Template image not available</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-mono text-xs text-neutral-500 uppercase">AI Placement Preview</h4>
                        <span className="text-xs font-mono text-neutral-400">
                          {analysis.placeholders.length} placeholders detected
                        </span>
                      </div>
                      <div ref={previewRef} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 relative" id="ai-preview-container">
                        <div className="relative">
                          {currentTemplate.backdropUrl && !imgFailedIds.has(currentTemplate.id) ? (
                            <img 
                              src={currentTemplate.backdropUrl} 
                              alt={currentTemplate.name}
                              referrerPolicy="no-referrer"
                              onError={() => setImgFailedIds(prev => new Set(prev).add(currentTemplate.id))}
                              className="w-full h-auto object-contain rounded border border-neutral-200"
                            />
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center bg-neutral-100 rounded border border-neutral-200">
                              <span className="text-xs text-neutral-400">Template image not available</span>
                            </div>
                          )}
                          <div
                            ref={previewContainerRef}
                            className="absolute inset-0 z-10"
                            onKeyDown={handleKeyDown}
                            tabIndex={0}
                          >
                            {previewSize.width > 0 && previewSize.height > 0 && analysis.placeholders
                              .filter((p: any) =>
                                Number.isFinite(p.x ?? p.x_position) &&
                                Number.isFinite(p.y ?? p.y_position) &&
                                Number.isFinite(p.width) &&
                                Number.isFinite(p.height)
                              )
                              .map((placeholder: TemplatePlaceholder, index: number) => (
                                  <EditablePlaceholder
                                  key={placeholder.id || index}
                                  placeholder={placeholder}
                                  previewWidth={previewSize.width}
                                  previewHeight={previewSize.height}
                                  updatePlaceholder={updatePlaceholder}
                                  selected={selectedPlaceholder}
                                  setSelected={setSelectedPlaceholder}
                                />
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* TEXT STYLE SETTINGS */}
                  {selectedPlaceholder && analysis.placeholders.find(ph => ph.id === selectedPlaceholder && (ph.type === 'name' || ph.type === 'certificate_id')) && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-4">
                      <h4 className="font-mono text-xs text-neutral-500 uppercase">TEXT STYLE SETTINGS</h4>
                      {(() => {
                        const ph = analysis.placeholders.find(p => p.id === selectedPlaceholder)!;
                        return (
                          <div key={ph.id} className="space-y-3">
                            <div className="text-[10px] font-mono text-neutral-400 uppercase">Placeholder: <strong className="text-neutral-700">{ph.type.toUpperCase()}</strong></div>
                            <div className="grid grid-cols-5 gap-3">
                              <div>
                                <label className="block text-[9px] font-mono text-neutral-400 mb-1">FONT</label>
                                <div className="flex gap-1">
                                  <select
                                    value={ph.font_family || 'Arial'}
                                    onChange={(e) => updatePlaceholder(ph.id, { font_family: e.target.value })}
                                    className="flex-1 bg-white border border-neutral-200 p-2 rounded text-xs outline-none"
                                  >
                                    {FONT_FAMILIES.map(f => (
                                      <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                                    ))}
                                    {customFonts.length > 0 && (
                                      <option disabled className="text-neutral-300">──────────</option>
                                    )}
                                    {customFonts.map(f => (
                                      <option key={f.font_family} value={f.font_family} style={{ fontFamily: f.font_family }}>{f.font_family}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => fontInputRef.current?.click()}
                                    className="px-2 py-1 border border-neutral-200 rounded text-xs hover:bg-neutral-100 transition-colors"
                                    title="Upload Custom Font"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                  </button>
                                  <input
                                    ref={fontInputRef}
                                    type="file"
                                    accept=".ttf,.otf"
                                    onChange={uploadCustomFont}
                                    className="hidden"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-neutral-400 mb-1">SIZE</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="10"
                                    max="80"
                                    value={ph.font_size || 24}
                                    onChange={(e) => updatePlaceholder(ph.id, { font_size: parseInt(e.target.value) })}
                                    className="flex-1 accent-[#E52E40]"
                                  />
                                  <span className="text-xs font-mono text-neutral-600 w-10 text-right">{ph.font_size || 24}px</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-neutral-400 mb-1">WEIGHT</label>
                                <select
                                  value={ph.font_weight || 'bold'}
                                  onChange={(e) => updatePlaceholder(ph.id, { font_weight: e.target.value })}
                                  className="w-full bg-white border border-neutral-200 p-2 rounded text-xs outline-none"
                                >
                                  {FONT_WEIGHTS.map(w => (
                                    <option key={w} value={w} style={{ fontWeight: w }}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-neutral-400 mb-1">COLOR</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={ph.font_color || '#000000'}
                                    onChange={(e) => updatePlaceholder(ph.id, { font_color: e.target.value })}
                                    className="w-9 h-9 p-0.5 border border-neutral-200 rounded cursor-pointer"
                                  />
                                  <span className="text-[10px] font-mono text-neutral-500">{ph.font_color || '#000000'}</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-neutral-400 mb-1">ALIGN</label>
                                <select
                                  value={ph.alignment || 'center'}
                                  onChange={(e) => updatePlaceholder(ph.id, { alignment: e.target.value })}
                                  className="w-full bg-white border border-neutral-200 p-2 rounded text-xs outline-none"
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                    <h4 className="font-mono text-xs text-neutral-500 uppercase mb-3">AI ANALYSIS METADATA</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-neutral-400">Total Placeholders:</span>
                        <div className="font-semibold text-neutral-700">{analysis.placeholders.length}</div>
                      </div>
                      <div>
                        <span className="text-neutral-400">Average Confidence:</span>
                        <div className="font-semibold text-neutral-700">
                          {(analysis.placeholders.reduce((sum, p) => sum + (p as any).confidence_score || 0, 0) / analysis.placeholders.length).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  <Sparkles className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p>No analysis data available</p>
                </div>
              )}
            </div>
            
            <div className="border-t border-neutral-200 p-4 bg-neutral-50 flex items-center justify-between">
              <button 
                onClick={() => { setShowAIEditor(false); setAnalysis(null); setSelectedPlaceholder(null); }}
                className="border border-neutral-200 bg-white hover:bg-neutral-100 px-4 py-2 text-xs font-mono rounded"
              >
                Cancel
              </button>
              
              <button 
                onClick={acceptAIPlacement}
                disabled={isAnalyzing || isSaving || !analysis}
                className="bg-[#E52E40] hover:bg-rose-700 disabled:bg-neutral-300 text-white font-bold px-5 py-2.5 text-xs font-mono rounded flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Accept AI Placement
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-neutral-800 w-full max-w-2xl rounded-lg shadow-[8px_8px_0px_0px_rgba(15,15,15,1)] overflow-hidden">
            
            <div className="border-b border-neutral-200 p-4 flex items-center justify-between bg-neutral-50">
              <div>
                <h3 className="font-bold text-sm text-[#0F0F0F]">Create Certificate Template</h3>
                <p className="text-neutral-400 text-[10px] font-mono">STEP-BY-STEP OPERATIONAL SETUP</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); setWizardStep(1); }} className="p-1 rounded hover:bg-neutral-200 text-neutral-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-neutral-100/60 border-b border-neutral-100">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 font-mono text-[10px] flex items-center justify-center rounded-full ${wizardStep >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'}`}>1</span>
                <span className="text-[11px] font-bold text-neutral-800">Choose Backdrop</span>
              </div>
              <div className="w-12 h-[1px] bg-neutral-300"></div>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 font-mono text-[10px] flex items-center justify-center rounded-full ${wizardStep >= 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'}`}>2</span>
                <span className="text-[11px] font-bold text-neutral-800">Metadata Details</span>
              </div>
              <div className="w-12 h-[1px] bg-neutral-300"></div>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 font-mono text-[10px] flex items-center justify-center rounded-full ${wizardStep >= 3 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'}`}>3</span>
                <span className="text-[11px] font-bold text-neutral-800">Editor Workspace</span>
              </div>
            </div>

            <div className="p-6">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">UPLOAD CERTIFICATE BACKGROUND FILE</span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center space-y-3 cursor-pointer transition-all ${dragActive ? 'border-[#E52E40] bg-rose-50/30' : selectedFile ? 'border-green-400 bg-green-50/20' : 'border-neutral-300 hover:border-neutral-500'}`}
                  >
                    {selectedFile ? (
                      <>
                        <div className="w-12 h-12 bg-green-100 text-green-600 flex items-center justify-center rounded-full mx-auto">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-neutral-800">{selectedFile.name}</div>
                        <div className="text-[10px] text-neutral-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB — Click to replace
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-neutral-400 mx-auto" />
                        <div className="text-xs font-bold text-neutral-800">Drag & Drop background file or click to choose</div>
                        <div className="text-[10px] text-neutral-400">PNG, JPG, JPEG, or PDF (Recommend: 1600x1120px)</div>
                      </>
                    )}
                  </div>

                  <div className="text-[10px] text-neutral-500 leading-normal">
                    <span className="text-[#E52E40] font-bold">Note:</span> A background file is required to create a template.
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-neutral-500 mb-1">TEMPLATE NAME</label>
                    <input 
                      type="text" 
                      required 
                      value={tplName}
                      onChange={(e) => setTplName(e.target.value)}
                      placeholder="e.g. Masterclass Kubernetes Orchestration" 
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 rounded text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-neutral-500 mb-1">DESCRIPTION</label>
                    <textarea 
                      rows={3}
                      value={tplDesc}
                      onChange={(e) => setTplDesc(e.target.value)}
                      placeholder="Write description detailing compliance rules and courses associated." 
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 rounded text-sm transition-colors"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase text-neutral-500 mb-1">CATEGORY</label>
                      <select 
                        value={tplCategory} 
                        onChange={(e) => setTplCategory(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded text-sm outline-none"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Hackathons">Hackathons</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase text-neutral-500 mb-1">TAGS (COMMA SEPARATED)</label>
                      <div className="relative">
                        <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                        <input 
                          type="text" 
                          value={tplTags}
                          onChange={(e) => setTplTags(e.target.value)}
                          placeholder="e.g. Engineering, Cloud, AWS" 
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 pl-10 rounded text-sm transition-colors font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-[#E52E40]/10 text-[#E52E40] flex items-center justify-center rounded-full mx-auto">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="max-w-sm mx-auto space-y-2">
                    <h4 className="font-extrabold text-[#0F0F0F] text-base">Ready to align graphic layers!</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Saving template configs. AI will now analyze the certificate image and suggest optimal placeholder positions for recipient name, QR coordinates, and digital signatures.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-200 p-4 bg-neutral-50 flex items-center justify-between">
              <button 
                type="button"
                onClick={() => setWizardStep(wizardStep - 1)}
                disabled={wizardStep === 1}
                className="border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-50 px-4 py-2 text-xs font-mono rounded"
              >
                ← Back
              </button>

              {wizardStep < 3 ? (
                <button 
                  type="button"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  disabled={(wizardStep === 1 && !selectedFile) || (wizardStep === 2 && !tplName)}
                  className="bg-[#0F0F0F] hover:bg-neutral-800 disabled:bg-neutral-300 text-white px-4 py-2 text-xs font-mono rounded flex items-center gap-1"
                >
                  Next Step <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleSaveTemplate}
                  className="bg-[#E52E40] hover:bg-rose-700 text-white font-bold px-5 py-2.5 text-xs font-mono rounded flex items-center gap-1.5"
                >
                  Deploy AI Studio <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
