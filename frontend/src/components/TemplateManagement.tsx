import React, { useState } from 'react';
import { Page, CertificateTemplate } from '../types';
import { templatesAPI } from '../api';
import { 
  Plus, Search, SlidersHorizontal, Trash2, Copy, Edit3, Eye, FileText, 
  Upload, Tag, ChevronRight, X, Sparkles, FolderOpen, ArrowRight, Grid3X3
} from 'lucide-react';

const CERT_BACKGROUNDS: Record<string, string> = {
  modernMinimalist: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80',
  classicGold: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80',
  techStudio: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80',
};

interface TemplateManagementProps {
  onNavigate: (page: Page) => void;
  templates: CertificateTemplate[];
  onAddTemplate: (newTpl: CertificateTemplate) => void;
  onSelectTemplate: (tpl: CertificateTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

export default function TemplateManagement({
  onNavigate,
  templates,
  onAddTemplate,
  onSelectTemplate,
  onDeleteTemplate
}: TemplateManagementProps) {
  
  // Search / filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // New template states
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplCategory, setTplCategory] = useState('Engineering');
  const [tplTags, setTplTags] = useState('SaaS, Cloud, Masterclass');
  const [backdropOption, setBackdropOption] = useState<'minimalist' | 'gold' | 'tech' | 'custom'>('minimalist');
  const [customBackdropUrl, setCustomBackdropUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Duplication confirm
  const [confirmMsg, setConfirmMsg] = useState('');

  // Categories
  const categories = ['All', 'Engineering', 'Corporate', 'Hackathons'];

  // Prune & Filter templates
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
      // simulate upload
      const file = e.dataTransfer.files[0];
      setCustomBackdropUrl(CERT_BACKGROUNDS.modernMinimalist); // fallback preview
    }
  };

  const handleSaveTemplate = async () => {
    if (!tplName) return;

    try {
      const formData = new FormData();
      formData.append('name', tplName);
      formData.append('description', tplDesc || 'Custom certificate design built inside Certfi editor.');
      formData.append('file_type', 'png');
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
      
      onNavigate('templates');
    } catch (err) {
      console.error('Template creation failed:', err);
    }
  };

  return (
    <div id="templates-page-root" className="space-y-6">
      
      {/* Upper header action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Certificate Templates</h1>
          <p className="text-neutral-500 text-xs">Upload background backdrops, config dynamic metadata grids, and map coordinate fields.</p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white text-xs font-semibold px-4 py-2.5 rounded flex items-center justify-center gap-2 transition-all self-start"
        >
          <Plus className="w-4 h-4" /> Create Custom Template
        </button>
      </div>

      {/* FILTER AND SEARCH ROW */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-neutral-200 p-4 rounded-lg">
        
        {/* Search */}
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

        {/* Categories toggler */}
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

      {/* TEMPLATE GRID */}
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
              
              {/* Preview Box */}
              <div className="bg-neutral-50 aspect-[1.41/1] overflow-hidden border-b border-neutral-100 relative flex items-center justify-center p-3">
                <img 
                  src={tpl.backdropUrl} 
                  alt={tpl.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain border border-neutral-200 rounded shadow-sm group-hover:scale-[1.02] transition-transform" 
                />
                
                {/* Elements Count Tag */}
                <span className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  {tpl.elements.length} dynamic tags
                </span>

                <span className="absolute top-3 right-3 bg-[#E52E40] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  {tpl.category}
                </span>

                {/* Overlay actions on hover */}
                <div className="absolute inset-0 bg-neutral-950/45 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                  <button 
                    onClick={() => { onSelectTemplate(tpl); onNavigate('visual-editor'); }}
                    className="bg-white hover:bg-[#E52E40] text-neutral-900 hover:text-white p-2 rounded shadow transition-colors"
                    title="Open Visual Editor"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { onSelectTemplate(tpl); }}
                    className="bg-white hover:bg-neutral-900 text-neutral-900 hover:text-white px-3 py-1.5 rounded shadow text-xs font-semibold transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div className="p-5 space-y-2">
                <h3 className="font-bold text-sm text-neutral-900 truncate">{tpl.name}</h3>
                <p className="text-xs text-neutral-500 line-clamp-2 min-h-[32px]">{tpl.description}</p>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {tpl.tags.map(t => (
                    <span key={t} className="bg-neutral-50 text-neutral-500 font-mono text-[9px] px-1.5 py-0.5 rounded border border-neutral-100">
                      #{t}
                    </span>
                  ))}
                </div>

                <hr className="border-neutral-100 my-3" />

                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span>Count: <strong className="text-neutral-700">{tpl.certificateCount}</strong> generated</span>
                  <span>Modified: {tpl.lastModified}</span>
                </div>
              </div>

              {/* Lower Actions panel */}
              <div className="bg-neutral-50/50 border-t border-neutral-100 p-3.5 flex items-center justify-between gap-2">
                <button 
                  onClick={() => { onSelectTemplate(tpl); onNavigate('visual-editor'); }}
                  className="flex items-center gap-1.5 text-xs text-neutral-700 hover:text-[#E52E40] font-semibold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Visual Editor
                </button>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      // simulate duplicate
                      const copy: CertificateTemplate = {
                        ...tpl,
                        id: `tpl_dup_${Date.now()}`,
                        name: `${tpl.name} (Copy)`,
                        certificateCount: 0
                      };
                      onAddTemplate(copy);
                      setConfirmMsg('Template successfully duplicated!');
                      setTimeout(() => setConfirmMsg(''), 3000);
                    }}
                    className="text-neutral-400 hover:text-[#0F0F0F] p-1.5 rounded transition-colors"
                    title="Duplicate template"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onDeleteTemplate(tpl.id)}
                    className="text-neutral-400 hover:text-red-600 p-1.5 rounded transition-colors"
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

      {/* Confirmation feedback pop */}
      {confirmMsg && (
        <div className="fixed bottom-6 right-6 bg-[#0F0F0F] text-white p-3.5 rounded shadow-lg z-50 text-xs font-mono border-l-4 border-emerald-500 flex items-center gap-2">
          <span>{confirmMsg}</span>
          <button onClick={() => setConfirmMsg('')} className="hover:text-neutral-400 font-bold ml-2">×</button>
        </div>
      )}

      {/* 3-STEP CREATE WIZARD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border-2 border-neutral-800 w-full max-w-2xl rounded-lg shadow-[8px_8px_0px_0px_rgba(15,15,15,1)] overflow-hidden">
            
            {/* Modal Header */}
            <div className="border-b border-neutral-200 p-4 flex items-center justify-between bg-neutral-50">
              <div>
                <h3 className="font-bold text-sm text-[#0F0F0F]">Create Certificate Template</h3>
                <p className="text-neutral-400 text-[10px] font-mono">STEP-BY-STEP OPERATIONAL SETUP</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); setWizardStep(1); }} className="p-1 rounded hover:bg-neutral-200 text-neutral-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Progress bar */}
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

            {/* Content Segment */}
            <div className="p-6">
              
              {/* STEP 1: Upload / Choose backdrop */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">SELECT BACKGROUND DESIGN TYPE</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <label className={`border p-3 rounded cursor-pointer transition-all text-center space-y-1 block ${backdropOption === 'minimalist' ? 'border-[#E52E40] bg-rose-50/20' : 'border-neutral-200 hover:border-neutral-400'}`}>
                      <input type="radio" checked={backdropOption === 'minimalist'} onChange={() => setBackdropOption('minimalist')} className="hidden" />
                      <div className="font-semibold text-xs text-neutral-900">Modern Swiss Accent</div>
                      <div className="text-[10px] text-neutral-400">Minimal off-white with vermillion border line</div>
                    </label>

                    <label className={`border p-3 rounded cursor-pointer transition-all text-center space-y-1 block ${backdropOption === 'gold' ? 'border-[#E52E40] bg-rose-50/20' : 'border-neutral-200 hover:border-neutral-400'}`}>
                      <input type="radio" checked={backdropOption === 'gold'} onChange={() => setBackdropOption('gold')} className="hidden" />
                      <div className="font-semibold text-xs text-neutral-900">Classic Gold Foil</div>
                      <div className="text-[10px] text-neutral-400">Academic vintage borders & ornaments</div>
                    </label>

                    <label className={`border p-3 rounded cursor-pointer transition-all text-center space-y-1 block ${backdropOption === 'tech' ? 'border-[#E52E40] bg-rose-50/20' : 'border-neutral-200 hover:border-neutral-400'}`}>
                      <input type="radio" checked={backdropOption === 'tech'} onChange={() => setBackdropOption('tech')} className="hidden" />
                      <div className="font-semibold text-xs text-neutral-900">Cyberpunk Dark Tech</div>
                      <div className="text-[10px] text-neutral-400">Pure obsidian base with custom grids</div>
                    </label>

                  </div>

                  <div className="relative my-4 text-center">
                    <hr className="border-neutral-100" />
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-2 text-[8px] font-mono text-neutral-400 uppercase">OR UPLOAD CUSTOM FILE</span>
                  </div>

                  {/* Drag and Drop Field */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center space-y-2 cursor-pointer transition-all ${dragActive ? 'border-[#E52E40] bg-rose-50/30' : 'border-neutral-300 hover:border-neutral-500'}`}
                    onClick={() => setBackdropOption('custom')}
                  >
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto" />
                    <div className="text-xs font-semibold text-neutral-800">Drag & Drop background file or click to choose</div>
                    <div className="text-[10px] text-neutral-400">PNG, JPG, or PDF file types accepted (Recommend: 1600x1120px)</div>
                    {customBackdropUrl && (
                      <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-[10px] font-mono px-2 py-0.5 rounded border border-green-200">
                        File Loaded Successfully
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Template Information details */}
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

              {/* STEP 3: Confirm & Launch to Visual Editor */}
              {wizardStep === 3 && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-[#E52E40]/10 text-[#E52E40] flex items-center justify-center rounded-full mx-auto">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="max-w-sm mx-auto space-y-2">
                    <h4 className="font-extrabold text-[#0F0F0F] text-base">Ready to align graphic layers!</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Saving template configs. We will now initialize the drag-and-drop Visual Editor to help you map name labels, QR coordinates, and digital signatures.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
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
                  disabled={wizardStep === 2 && !tplName}
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
                  Deploy Editor Studio <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
