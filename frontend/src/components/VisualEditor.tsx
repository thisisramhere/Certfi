import React, { useState } from 'react';
import { Page, CertificateTemplate, CanvasElement } from '../types';
import { useToast } from './Toast';
import { templatesAPI } from '../api';
import { 
  Save, Undo, Redo, Eye, ArrowLeft, Download, Maximize, ZoomIn, ZoomOut, 
  Grid, Compass, Trash2, Lock, Unlock, Type, QrCode, FileImage, Layers,
  ChevronRight, AlignLeft, AlignCenter, AlignRight, Bold, Settings2, Info, Plus
} from 'lucide-react';

interface VisualEditorProps {
  onNavigate: (page: Page) => void;
  selectedTemplate: CertificateTemplate | null;
  onUpdateTemplate: (tpl: CertificateTemplate) => void;
}

export default function VisualEditor({
  onNavigate,
  selectedTemplate,
  onUpdateTemplate
}: VisualEditorProps) {
  
  if (!selectedTemplate) {
    return (
      <div className="p-16 text-center space-y-4">
        <h3 className="font-bold text-neutral-800">No template active for editing</h3>
        <button onClick={() => onNavigate('templates')} className="bg-[#0F0F0F] text-white px-4 py-2 rounded text-xs font-mono">
          Go Choose Template
        </button>
      </div>
    );
  }

  // Active designer states
  const [elements, setElements] = useState<CanvasElement[]>(selectedTemplate.elements);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(selectedTemplate.elements[0]?.id || null);
  const [previewMode, setPreviewMode] = useState(false);
  const [zoomScale, setZoomScale] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [activeTabLeft, setActiveTabLeft] = useState<'placeholders' | 'shapes' | 'layers'>('placeholders');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  
  // History stack simple simulation
  const [history, setHistory] = useState<CanvasElement[][]>([selectedTemplate.elements]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const activeElement = elements.find(el => el.id === selectedElementId);

  const saveToHistory = (newElems: CanvasElement[]) => {
    const updatedHistory = history.slice(0, historyIdx + 1);
    updatedHistory.push(newElems);
    setHistory(updatedHistory);
    setHistoryIdx(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setElements(history[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setElements(history[nextIdx]);
    }
  };

  // Add new canvas element
  const handleAddElement = (type: CanvasElement['type'], shapeType?: CanvasElement['shapeType']) => {
    const id = `el_${Date.now()}`;
    const newEl: CanvasElement = {
      id,
      type,
      name: `New ${type.toUpperCase()}`,
      placeholderVariable: type === 'text' ? '{{CUSTOM_VARIABLE}}' : '{{QR_VERIFICATION}}',
      x: 35,
      y: 45,
      width: type === 'qr' ? 14 : 30,
      height: type === 'qr' ? 20 : 8,
      rotation: 0,
      opacity: 1,
      fontSize: type === 'text' ? 14 : undefined,
      fontWeight: 'normal',
      fontFamily: 'Inter',
      color: '#0F0F0F',
      align: 'center',
      shapeType
    };

    const updated = [...elements, newEl];
    setElements(updated);
    setSelectedElementId(id);
    saveToHistory(updated);
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    const updated = elements.filter(el => el.id !== id);
    setElements(updated);
    if (selectedElementId === id) {
      setSelectedElementId(updated[0]?.id || null);
    }
    saveToHistory(updated);
  };

  // Update specific field on active element
  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    const updated = elements.map(el => {
      if (el.id === id) {
        return { ...el, ...updates };
      }
      return el;
    });
    setElements(updated);
    // save on substantial changes or debounced
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const placeholders = elements.map(el => ({
        type: el.type === 'qr' ? 'custom' : el.type,
        custom_key: el.placeholderVariable,
        x: Math.round(el.x),
        y: Math.round(el.y),
        width: Math.round(el.width),
        height: Math.round(el.height),
        font_family: el.fontFamily,
        font_size: el.fontSize || 14,
        font_weight: el.fontWeight,
        font_color: el.color,
        alignment: el.align,
        rotation: el.rotation,
        opacity: el.opacity,
        is_required: true,
        default_value: undefined,
      }));
      await templatesAPI.savePlaceholders(selectedTemplate.id, placeholders);
      const updatedTpl: CertificateTemplate = {
        ...selectedTemplate,
        elements,
        lastModified: new Date().toISOString().split('T')[0]
      };
      onUpdateTemplate(updatedTpl);
      addToast('Template layout saved successfully!', 'success');
    } catch (err) {
      console.error('Save error:', err);
      addToast('Failed to save layout. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="visual-editor-root" className="min-h-[calc(100vh-64px)] flex flex-col justify-between bg-neutral-100 font-sans">
      
      {/* 1. TOP TOOLBAR */}
      <div className="h-14 bg-white border-b border-neutral-200 px-4 flex items-center justify-between shadow-sm">
        
        {/* Left: Back and Title info */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('templates')}
            className="p-1.5 rounded hover:bg-neutral-100 text-neutral-600 transition-colors"
            title="Back to Templates list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-neutral-900 truncate max-w-[200px]">{selectedTemplate.name}</span>
              <span className="bg-amber-50 text-amber-800 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-200">UNSAVED DRAFT</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">RENDER RES: 100% vector scaling</p>
          </div>
        </div>

        {/* Center: Tools (Undo, Redo, Zoom, Grid toggles) */}
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-md">
          <button 
            onClick={handleUndo} 
            disabled={historyIdx === 0}
            className="p-1.5 rounded hover:bg-white text-neutral-600 disabled:opacity-40 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button 
            onClick={handleRedo} 
            disabled={historyIdx === history.length - 1}
            className="p-1.5 rounded hover:bg-white text-neutral-600 disabled:opacity-40 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-neutral-300 mx-1"></span>

          <button 
            onClick={() => setZoomScale(Math.max(50, zoomScale - 10))} 
            className="p-1.5 rounded hover:bg-white text-neutral-600"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-neutral-600 w-10 text-center">{zoomScale}%</span>
          <button 
            onClick={() => setZoomScale(Math.min(150, zoomScale + 10))} 
            className="p-1.5 rounded hover:bg-white text-neutral-600"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span className="w-[1px] h-4 bg-neutral-300 mx-1"></span>

          <button 
            onClick={() => setShowGrid(!showGrid)} 
            className={`p-1.5 rounded ${showGrid ? 'bg-white text-[#E52E40]' : 'text-neutral-500'}`}
            title="Toggle alignment grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setShowGuides(!showGuides)} 
            className={`p-1.5 rounded ${showGuides ? 'bg-white text-[#E52E40]' : 'text-neutral-500'}`}
            title="Toggle bounding layout guides"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Preview mode, Export and Save */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded flex items-center gap-1 transition-colors ${previewMode ? 'bg-[#E52E40] text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'}`}
          >
            <Eye className="w-3.5 h-3.5" /> {previewMode ? 'EDITING MODE' : 'RECIPIENT PREVIEW'}
          </button>
          <button 
            onClick={handleSaveAll}
            className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white text-xs font-semibold px-4 py-1.5 rounded flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Coordinate Map
          </button>
        </div>

      </div>

      {/* 2. THREE-PANEL DESIGNER WORKSPACE */}
      <div className="flex-1 flex items-stretch overflow-hidden">
        
        {/* LEFT PANEL: Placeholders Library & Layer Stack */}
        <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col justify-between shrink-0">
          
          <div>
            {/* Left Nav Header Tabs */}
            <div className="grid grid-cols-3 border-b border-neutral-200 bg-neutral-50 font-mono text-[10px] text-center">
              <button 
                onClick={() => setActiveTabLeft('placeholders')}
                className={`py-3.5 font-bold transition-colors border-b-2 ${activeTabLeft === 'placeholders' ? 'border-[#E52E40] text-[#0F0F0F] bg-white' : 'border-transparent text-neutral-400'}`}
              >
                Placeholders
              </button>
              <button 
                onClick={() => setActiveTabLeft('shapes')}
                className={`py-3.5 font-bold transition-colors border-b-2 ${activeTabLeft === 'shapes' ? 'border-[#E52E40] text-[#0F0F0F] bg-white' : 'border-transparent text-neutral-400'}`}
              >
                Shapes
              </button>
              <button 
                onClick={() => setActiveTabLeft('layers')}
                className={`py-3.5 font-bold transition-colors border-b-2 ${activeTabLeft === 'layers' ? 'border-[#E52E40] text-[#0F0F0F] bg-white' : 'border-transparent text-neutral-400'}`}
              >
                Layers ({elements.length})
              </button>
            </div>

            {/* TAB CONTENT: PLACEHOLDERS LIBRARY */}
            {activeTabLeft === 'placeholders' && (
              <div className="p-4 space-y-4">
                <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">DRAG-AND-DROP PLACEHOLDERS</div>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => handleAddElement('text')}
                    className="w-full flex items-center gap-2.5 p-2.5 border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 rounded text-left transition-colors"
                  >
                    <Type className="w-4 h-4 text-neutral-600" />
                    <div>
                      <div className="text-xs font-bold text-neutral-800">Dynamic Text Layer</div>
                      <div className="text-[9px] text-neutral-400">Recipient Name, ID, Event</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleAddElement('qr')}
                    className="w-full flex items-center gap-2.5 p-2.5 border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 rounded text-left transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-[#E52E40]" />
                    <div>
                      <div className="text-xs font-bold text-neutral-800">Verification QR Element</div>
                      <div className="text-[9px] text-neutral-400">Interactive ledger endpoint mapping</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleAddElement('signature')}
                    className="w-full flex items-center gap-2.5 p-2.5 border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 rounded text-left transition-colors"
                  >
                    <span className="w-4 h-4 text-neutral-500 font-serif italic font-bold">S</span>
                    <div>
                      <div className="text-xs font-bold text-neutral-800">Digital Signature Overlay</div>
                      <div className="text-[9px] text-neutral-400">Dynamic SVG / handdrawn stroke</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleAddElement('watermark')}
                    className="w-full flex items-center gap-2.5 p-2.5 border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 rounded text-left transition-colors"
                  >
                    <FileImage className="w-4 h-4 text-neutral-500" />
                    <div>
                      <div className="text-xs font-bold text-neutral-800">Cryptographic Watermark</div>
                      <div className="text-[9px] text-neutral-400">Prune tampering attempt overlays</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SHAPES LIBRARY */}
            {activeTabLeft === 'shapes' && (
              <div className="p-4 space-y-4">
                <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-bold">VECTOR LAYER SHAPES</div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleAddElement('shape', 'rectangle')}
                    className="p-3 border border-neutral-200 rounded text-center hover:border-[#0F0F0F] hover:bg-neutral-50 transition-colors text-xs"
                  >
                    <div className="w-8 h-6 border-2 border-neutral-800 bg-neutral-200 mx-auto mb-2 rounded"></div>
                    Rectangle
                  </button>
                  <button 
                    onClick={() => handleAddElement('shape', 'circle')}
                    className="p-3 border border-neutral-200 rounded text-center hover:border-[#0F0F0F] hover:bg-neutral-50 transition-colors text-xs"
                  >
                    <div className="w-8 h-8 border-2 border-neutral-800 bg-neutral-200 rounded-full mx-auto mb-1"></div>
                    Circle
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LAYERS STACK */}
            {activeTabLeft === 'layers' && (
              <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
                {elements.map((el, index) => {
                  const isSel = el.id === selectedElementId;
                  return (
                    <div 
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${isSel ? 'bg-rose-50/40 text-neutral-900 border-l-4 border-[#E52E40]' : 'hover:bg-neutral-50 text-neutral-500'}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[9px] text-neutral-400">#{index + 1}</span>
                        {el.type === 'qr' ? <QrCode className="w-3.5 h-3.5" /> : <Type className="w-3.5 h-3.5" />}
                        <span className="font-semibold truncate">{el.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 md:opacity-100">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateElement(el.id, { isLocked: !el.isLocked }); }}
                          className="hover:text-neutral-900"
                        >
                          {el.isLocked ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3 text-neutral-400" />}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteElement(el.id); }}
                          className="text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Guidelines box on bottom left */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50">
            <span className="text-[9px] font-mono text-neutral-400 block uppercase font-bold">EDITOR SYSTEM MECHANICS</span>
            <div className="flex items-start gap-1.5 mt-1">
              <Info className="w-3.5 h-3.5 text-[#E52E40] shrink-0 mt-0.5" />
              <p className="text-[10px] text-neutral-500 leading-tight">
                X/Y positions represent vector coordinate ratios. Certificates automatically scale layout templates during bulk PDF downloads.
              </p>
            </div>
          </div>

        </aside>

        {/* CENTER ELEMENT: DESIGN CANVAS AREA */}
        <main className="flex-1 overflow-auto flex items-center justify-center p-8 relative">
          
          {/* Zoom container */}
          <div 
            style={{ transform: `scale(${zoomScale / 100})`, transformOrigin: 'center center' }}
            className="transition-transform duration-100"
          >
            {/* Realistic paper aspect-ratio vector bounding box certificate */}
            <div 
              id="editor-canvas-stage"
              style={{ backgroundImage: `url(${selectedTemplate.backdropUrl})` }}
              className="w-[800px] h-[560px] bg-white bg-cover bg-no-repeat relative shadow-[0px_10px_30px_rgba(0,0,0,0.1)] rounded-sm border border-neutral-300"
            >
              
              {/* Optional Snap Grid layout dots */}
              {showGrid && (
                <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60"></div>
              )}

              {/* RENDER CANVAS LAYER ELEMENTS */}
              {elements.map((el) => {
                const isSelected = el.id === selectedElementId;
                
                // convert relative ratios into real pixel placements on canvas
                const elStyle: React.CSSProperties = {
                  position: 'absolute',
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width}%`,
                  height: `${el.height}%`,
                  opacity: el.opacity,
                  transform: `rotate(${el.rotation}deg)`,
                  userSelect: 'none',
                  cursor: el.isLocked ? 'not-allowed' : 'move'
                };

                return (
                  <div 
                    key={el.id}
                    style={elStyle}
                    onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                    className={`group transition-all ${isSelected ? 'ring-2 ring-[#E52E40] z-20' : 'hover:ring-1 hover:ring-neutral-400'}`}
                  >
                    
                    {/* Bounding handles for layout feedback */}
                    {isSelected && !el.isLocked && showGuides && (
                      <>
                        <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#E52E40] border border-white rounded-full z-30"></span>
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#E52E40] border border-white rounded-full z-30"></span>
                        <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#E52E40] border border-white rounded-full z-30"></span>
                        <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#E52E40] border border-white rounded-full z-30"></span>
                        {/* Dynamic guide tag */}
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded shadow z-40 whitespace-nowrap">
                          {el.name} ({Math.round(el.x)}%, {Math.round(el.y)}%)
                        </span>
                      </>
                    )}

                    {/* DYNAMIC COMPONENT RENDER ENGINE */}
                    <div className="w-full h-full flex items-center justify-center p-1.5 overflow-hidden">
                      {el.type === 'text' && (
                        <div 
                          style={{ 
                            fontSize: `${el.fontSize || 14}px`, 
                            fontWeight: el.fontWeight, 
                            fontFamily: el.fontFamily,
                            color: el.color,
                            textAlign: el.align
                          }}
                          className="w-full truncate leading-tight whitespace-nowrap"
                        >
                          {previewMode ? (
                            // simulated recipient view
                            el.placeholderVariable === '{{PARTICIPANT_NAME}}' ? 'Ram Kiran Mohan' :
                            el.placeholderVariable === '{{CERTIFICATE_ID}}' ? 'CERT-2026-0928A' : 
                            el.placeholderVariable.replace(/[{}]/g, '')
                          ) : (
                            el.placeholderVariable
                          )}
                        </div>
                      )}

                      {el.type === 'qr' && (
                        <div className="w-full h-full bg-white border border-neutral-200 p-1 rounded flex flex-col items-center justify-center">
                          <QrCode className="w-full h-full text-neutral-800" />
                          <span className="text-[6px] font-mono text-neutral-400 leading-none mt-0.5">SECURE_HASH</span>
                        </div>
                      )}

                      {el.type === 'signature' && (
                        <div className="w-full h-full border border-dashed border-neutral-300 rounded bg-[#FDFCF7]/60 flex items-center justify-center">
                          <span className="font-serif italic text-base text-neutral-800 leading-none">{el.placeholderVariable}</span>
                        </div>
                      )}

                      {el.type === 'watermark' && (
                        <div className="w-full h-full opacity-20 bg-neutral-400 rounded flex items-center justify-center">
                          <span className="text-[10px] font-mono font-bold tracking-widest uppercase">CERTFI PROT WATERMARK</span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

            </div>
          </div>

        </main>

        {/* RIGHT PANEL: Properties Inspector */}
        <aside className="w-72 bg-white border-l border-neutral-200 flex flex-col justify-between shrink-0">
          
          {activeElement ? (
            <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-120px)]">
              
              <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-[#0F0F0F] uppercase tracking-wider">Properties Inspector</h3>
                  <p className="text-neutral-400 text-[10px] font-mono">SELECTED LAYER ELEMENT</p>
                </div>
                <button 
                  onClick={() => handleDeleteElement(activeElement.id)} 
                  className="text-neutral-400 hover:text-red-600 p-1"
                  title="Remove Element"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* General inputs */}
              <div className="space-y-3">
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-bold">1. BOUNDING ALIGNMENT</span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-0.5 font-mono text-[9px]">X POSITION (%)</label>
                    <input 
                      type="number" 
                      value={Math.round(activeElement.x)} 
                      onChange={(e) => handleUpdateElement(activeElement.id, { x: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-0.5 font-mono text-[9px]">Y POSITION (%)</label>
                    <input 
                      type="number" 
                      value={Math.round(activeElement.y)} 
                      onChange={(e) => handleUpdateElement(activeElement.id, { y: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-0.5 font-mono text-[9px]">WIDTH (%)</label>
                    <input 
                      type="number" 
                      value={Math.round(activeElement.width)} 
                      onChange={(e) => handleUpdateElement(activeElement.id, { width: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-0.5 font-mono text-[9px]">HEIGHT (%)</label>
                    <input 
                      type="number" 
                      value={Math.round(activeElement.height)} 
                      onChange={(e) => handleUpdateElement(activeElement.id, { height: Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Text styling properties (Conditional if text/signature) */}
              {(activeElement.type === 'text' || activeElement.type === 'signature') && (
                <div className="space-y-3 pt-3 border-t border-neutral-100">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-bold">2. TYPOGRAPHY DESIGNS</span>
                  
                  <div className="text-xs">
                    <label className="block text-neutral-400 mb-1 font-mono text-[9px]">FONT FAMILY</label>
                    <select 
                      value={activeElement.fontFamily}
                      onChange={(e) => handleUpdateElement(activeElement.id, { fontFamily: e.target.value as any })}
                      className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded outline-none text-xs"
                    >
                      <option value="Space Grotesk">Space Grotesk (Modern Tech)</option>
                      <option value="Inter">Inter (General Clean)</option>
                      <option value="JetBrains Mono">JetBrains Mono (Sleek Data)</option>
                      <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-neutral-400 mb-0.5 font-mono text-[9px]">FONT SIZE (PX)</label>
                      <input 
                        type="number" 
                        value={activeElement.fontSize || 14} 
                        onChange={(e) => handleUpdateElement(activeElement.id, { fontSize: Number(e.target.value) })}
                        className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-0.5 font-mono text-[9px]">FONT WEIGHT</label>
                      <select 
                        value={activeElement.fontWeight}
                        onChange={(e) => handleUpdateElement(activeElement.id, { fontWeight: e.target.value as any })}
                        className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded outline-none text-xs"
                      >
                        <option value="normal">Normal</option>
                        <option value="medium">Medium</option>
                        <option value="semibold">Semibold</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>

                  {/* Alignment buttons */}
                  <div>
                    <label className="block text-neutral-400 mb-1 font-mono text-[9px]">ALIGNMENT</label>
                    <div className="flex items-center gap-1 bg-neutral-50 p-1 rounded border border-neutral-200">
                      <button 
                        onClick={() => handleUpdateElement(activeElement.id, { align: 'left' })}
                        className={`flex-1 py-1 rounded text-neutral-700 flex justify-center ${activeElement.align === 'left' ? 'bg-white shadow-sm font-bold' : ''}`}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleUpdateElement(activeElement.id, { align: 'center' })}
                        className={`flex-1 py-1 rounded text-neutral-700 flex justify-center ${activeElement.align === 'center' ? 'bg-white shadow-sm font-bold' : ''}`}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleUpdateElement(activeElement.id, { align: 'right' })}
                        className={`flex-1 py-1 rounded text-neutral-700 flex justify-center ${activeElement.align === 'right' ? 'bg-white shadow-sm font-bold' : ''}`}
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Text Color Picker */}
                  <div className="text-xs">
                    <label className="block text-neutral-400 mb-1 font-mono text-[9px]">FONT COLOR CODE</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={activeElement.color || '#0F0F0F'} 
                        onChange={(e) => handleUpdateElement(activeElement.id, { color: e.target.value })}
                        className="w-10 h-8 rounded border border-neutral-200 cursor-pointer p-0 bg-transparent"
                      />
                      <input 
                        type="text" 
                        value={activeElement.color || '#0F0F0F'} 
                        onChange={(e) => handleUpdateElement(activeElement.id, { color: e.target.value })}
                        className="flex-1 bg-neutral-50 border border-neutral-200 p-1.5 rounded outline-none font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* Dynamic matching variable */}
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-bold">3. METADATA MAPPING</span>
                
                <div className="text-xs">
                  <label className="block text-neutral-400 mb-1 font-mono text-[9px]">PLACEHOLDER KEY (VARIABLE)</label>
                  <input 
                    type="text" 
                    value={activeElement.placeholderVariable} 
                    onChange={(e) => handleUpdateElement(activeElement.id, { placeholderVariable: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded outline-none font-mono text-xs text-[#E52E40]"
                  />
                  <span className="text-[9px] text-neutral-400 block mt-1 leading-tight">Must match associated CSV/Excel column headings exactly.</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-neutral-400 space-y-2 my-auto">
              <Settings2 className="w-8 h-8 mx-auto stroke-1" />
              <div className="text-xs font-semibold">No Layer Selected</div>
              <p className="text-[10px] leading-relaxed">Select any dynamic canvas layer to edit alignment, font attributes, and data mapping parameters.</p>
            </div>
          )}

          {/* Quick lock settings overlay footer */}
          {activeElement && (
            <div className="p-4 border-t border-neutral-100 bg-neutral-50/60 text-xs font-mono space-y-2">
              <span className="text-[9px] font-mono text-neutral-400 block uppercase font-bold text-left">SECURITY INTEGRITY</span>
              <div className="flex items-center justify-between">
                <span>Lock coordinate position:</span>
                <button 
                  onClick={() => handleUpdateElement(activeElement.id, { isLocked: !activeElement.isLocked })}
                  className={`p-1 px-2.5 rounded text-[10px] font-bold ${activeElement.isLocked ? 'bg-amber-100 text-amber-800' : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'}`}
                >
                  {activeElement.isLocked ? 'LOCKED' : 'UNLOCK'}
                </button>
              </div>
            </div>
          )}

        </aside>

      </div>

    </div>
  );
}
