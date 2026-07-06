import React, { useState } from 'react';
import { Page, OrgConfig } from '../types';
import { useToast } from './Toast';
import { 
  Settings, User, Key, CreditCard, Bell, Globe, Copy, Check, Eye, EyeOff, Plus, Trash2, ShieldCheck, Mail
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (page: Page) => void;
  config: OrgConfig;
  onUpdateConfig: (conf: OrgConfig) => void;
}

export default function SettingsPage({
  onNavigate,
  config,
  onUpdateConfig
}: SettingsPageProps) {
  
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'security' | 'billing'>('profile');
  const { addToast } = useToast();
  
  // Profile settings state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // API credentials state (empty until fetched from backend)
  const [apiKeys, setApiKeys] = useState<{ id: string, name: string, prefix: string, secret: string, created: string, visible: boolean }[]>([]);
  const [newKeyName, setNewKeyName] = useState('');

  // Webhooks state (empty until fetched from backend)
  const [webhooks, setWebhooks] = useState<{ id: string, url: string, event: string, active: boolean }[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleCopyKey = (id: string, secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      prefix: 'cf_live_4e1a...',
      secret: `cf_live_4e1a${Math.random().toString(16).substring(2, 10)}b${Math.random().toString(16).substring(2, 10)}8ff9029a10fc2b98fa`,
      created: new Date().toISOString().split('T')[0],
      visible: false
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    addToast('API token generated! Copy the secret now.', 'warning', 6000);
  };

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl) return;

    setWebhooks([...webhooks, {
      id: `wh_${Date.now()}`,
      url: newWebhookUrl,
      event: 'certificate.generated',
      active: true
    }]);
    setNewWebhookUrl('');
  };

  return (
    <div id="settings-page-root" className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight font-display">Workspace Configuration</h1>
        <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest">Global preferences, cryptographic tokens, and ledger endpoints</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left selector menu tabs */}
        <aside className="lg:col-span-3 bg-white border border-neutral-200 rounded-lg overflow-hidden shrink-0 font-mono text-[11px] font-semibold text-neutral-500">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left p-3.5 border-b border-neutral-100 flex items-center gap-2.5 transition-colors ${activeTab === 'profile' ? 'bg-rose-50/10 text-neutral-900 font-bold border-l-4 border-[#E52E40]' : 'hover:bg-neutral-50'}`}
          >
            <User className="w-4 h-4 text-[#E52E40]" /> PERSONAL ACCOUNT PROFILE
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`w-full text-left p-3.5 border-b border-neutral-100 flex items-center gap-2.5 transition-colors ${activeTab === 'api' ? 'bg-rose-50/10 text-neutral-900 font-bold border-l-4 border-[#E52E40]' : 'hover:bg-neutral-50'}`}
          >
            <Key className="w-4 h-4 text-[#E52E40]" /> API & WEBHOOK INTEGRATIONS
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full text-left p-3.5 border-b border-neutral-100 flex items-center gap-2.5 transition-colors ${activeTab === 'security' ? 'bg-rose-50/10 text-neutral-900 font-bold border-l-4 border-[#E52E40]' : 'hover:bg-neutral-50'}`}
          >
            <Globe className="w-4 h-4 text-[#E52E40]" /> SECURITY & LEDGER LOGS
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`w-full text-left p-3.5 flex items-center gap-2.5 transition-colors ${activeTab === 'billing' ? 'bg-rose-50/10 text-neutral-900 font-bold border-l-4 border-[#E52E40]' : 'hover:bg-neutral-50'}`}
          >
            <CreditCard className="w-4 h-4 text-[#E52E40]" /> BILLING & USAGE LIMITS
          </button>
        </aside>

        {/* Right view content pane */}
        <main className="lg:col-span-9 bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
          
          {/* TAB 1: PROFILE ACCOUNT SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-100 pb-3">
                <h2 className="font-bold text-sm text-neutral-900 uppercase">Profile Settings</h2>
                <p className="text-[10px] text-neutral-400 font-mono">ACCOUNT DETAILS</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 font-mono text-[9px]">FULL ACCOUNT NAME</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 p-2.5 rounded font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-mono text-[9px]">PRIMARY ACCOUNT EMAIL</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 p-2.5 rounded font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-mono text-[9px]">PHONE NUMBER</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 p-2.5 rounded font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-mono text-[9px]">USER ACCESS LEVEL</label>
                  <input 
                    type="text" 
                    readOnly 
                    value="Organization Administrator (Owner)" 
                    className="w-full bg-neutral-100 border border-neutral-200 p-2.5 rounded text-neutral-500 font-semibold outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <button 
                onClick={() => addToast('Account profile updated!', 'success')}
                className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white text-xs font-semibold px-4 py-2.5 rounded transition-all"
              >
                Update Account Information
              </button>
            </div>
          )}

          {/* TAB 2: API AND WEBHOOKS INTEGRATION */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              
              {/* API keys section */}
              <div className="space-y-4">
                <div className="border-b border-neutral-100 pb-3">
                  <h2 className="font-bold text-sm text-neutral-900 uppercase">Cryptographic API Tokens</h2>
                  <p className="text-[10px] text-neutral-400 font-mono">USE FOR CSV AUTOMATIONS & INTEGRATIONS</p>
                </div>

                {/* API keys table list */}
                <div className="border border-neutral-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-mono uppercase text-[9px]">
                        <th className="p-3">Token Name</th>
                        <th className="p-3">Secret Value (Keep secure)</th>
                        <th className="p-3">Created</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono text-[11px] text-neutral-700">
                      {apiKeys.map(key => (
                        <tr key={key.id}>
                          <td className="p-3 font-bold text-neutral-900 font-sans text-xs">{key.name}</td>
                          <td className="p-3 text-neutral-500 max-w-[200px] truncate">
                            {key.visible ? key.secret : key.prefix}
                          </td>
                          <td className="p-3 text-neutral-400">{key.created}</td>
                          <td className="p-3 text-right space-x-1.5">
                            <button 
                              onClick={() => {
                                setApiKeys(apiKeys.map(k => k.id === key.id ? { ...k, visible: !k.visible } : k));
                              }}
                              className="text-neutral-500 hover:text-neutral-900"
                              title="Toggle Visibility"
                            >
                              {key.visible ? <EyeOff className="w-3.5 h-3.5 inline" /> : <Eye className="w-3.5 h-3.5 inline" />}
                            </button>
                            <button 
                              onClick={() => handleCopyKey(key.id, key.secret)}
                              className="text-neutral-500 hover:text-[#E52E40]"
                              title="Copy token to clipboard"
                            >
                              {copiedKeyId === key.id ? <Check className="w-3.5 h-3.5 text-green-600 inline" /> : <Copy className="w-3.5 h-3.5 inline" />}
                            </button>
                            <button 
                              onClick={() => setApiKeys(apiKeys.filter(k => k.id !== key.id))}
                              className="text-neutral-400 hover:text-rose-600"
                              title="Delete Key"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Generate form */}
                <form onSubmit={handleCreateApiKey} className="flex items-end gap-3 text-xs bg-[#FAF9F6] p-4 border border-neutral-200 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-neutral-400 mb-1 font-mono text-[9px]">TOKEN MEMO LABEL</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. My API Key" 
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full bg-white border border-neutral-200 p-2 rounded outline-none"
                    />
                  </div>
                  <button type="submit" className="bg-[#0F0F0F] hover:bg-[#E52E40] text-white font-bold p-2 px-4 rounded transition-colors">
                    Generate Secret
                  </button>
                </form>
              </div>

              {/* Webhook block */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <div className="border-b border-neutral-100 pb-2">
                  <h3 className="font-bold text-sm text-neutral-900 uppercase">Automatic Webhook Endpoints</h3>
                  <p className="text-[10px] text-neutral-400 font-mono">PUSH REAL-TIME CERTIFICATE VERIFICATION HOOKS</p>
                </div>

                <div className="space-y-2 text-xs">
                  {webhooks.map(wh => (
                    <div key={wh.id} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded">
                      <div className="space-y-1">
                        <span className="bg-red-50 text-[#E52E40] font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border border-red-200">{wh.event}</span>
                        <div className="font-mono text-neutral-600 truncate max-w-sm md:max-w-md">{wh.url}</div>
                      </div>
                      <button 
                        onClick={() => setWebhooks(webhooks.filter(w => w.id !== wh.id))}
                        className="text-neutral-400 hover:text-red-600 p-1"
                        title="Delete Webhook"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddWebhook} className="flex items-end gap-3 text-xs bg-neutral-50/40 p-4 border border-neutral-200 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-neutral-400 mb-1 font-mono text-[9px]">WEBHOOK ENDPOINT POST URL</label>
                    <input 
                      type="url" 
                      required
                      placeholder="https://api.yourdomain.com/webhooks/listener" 
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      className="w-full bg-white border border-neutral-200 p-2 rounded outline-none font-mono"
                    />
                  </div>
                  <button type="submit" className="bg-[#0F0F0F] text-white p-2 px-4 rounded font-bold hover:bg-neutral-800 transition-colors">
                    Add Endpoint
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 3: SECURITY & AUDIT LOGS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-100 pb-3">
                <h2 className="font-bold text-sm text-neutral-900 uppercase">Security Configuration</h2>
                <p className="text-[10px] text-neutral-400 font-mono">TWO-FACTOR & SECURE SIGN-IN HISTORY</p>
              </div>

              <div className="space-y-4">
                
                <div className="flex items-center justify-between p-4 border border-neutral-100 rounded-lg bg-[#FAF9F6]">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800">Two-Factor Authentication (2FA)</h4>
                    <p className="text-[10px] text-neutral-400 max-w-sm">Secure your workspace ledger. Requests to generate certificates will require custom smartphone verification codes.</p>
                  </div>
                  <button className="bg-neutral-200 text-neutral-800 hover:bg-neutral-300 font-bold text-xs p-2 px-4 rounded">
                    Configure 2FA
                  </button>
                </div>

                  <div className="space-y-2">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">SECURE SIGN-IN LEDGER HISTORY</span>
                  <div className="border border-neutral-200 rounded-lg overflow-hidden text-[10px] font-mono">
                    <div className="p-3 bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[9px]">IP / Location, Device Browser, Timestamp</div>
                    <div className="p-6 text-center text-neutral-400">
                      <p className="text-xs font-semibold">No login history available</p>
                      <p className="text-[10px] mt-1">Sign-in sessions will appear here</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: BILLING & LIMITS */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-100 pb-3">
                <h2 className="font-bold text-sm text-neutral-900 uppercase">Subscription Plans & Usage Rates</h2>
                <p className="text-[10px] text-neutral-400 font-mono">COMPLIANCE SECTIONS</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Active plan card */}
                <div className="border border-neutral-200 rounded-lg p-5 bg-[#FAF9F6] space-y-3">
                  <span className="bg-neutral-100 text-neutral-500 font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase">No Active Plan</span>
                  <h3 className="font-bold text-sm text-neutral-500">No active subscription</h3>
                  <div className="text-xl font-black text-neutral-400">-</div>
                  <p className="text-[10px] text-neutral-400 leading-normal">Subscribe to a plan to start issuing certificates at scale.</p>
                </div>

                {/* Usage metrics limits */}
                <div className="border border-neutral-200 rounded-lg p-5 space-y-4">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">MONTHLY VOLUME USAGE</span>
                  
                  <div className="p-6 text-center text-neutral-400">
                    <p className="text-xs font-semibold">No active subscription</p>
                    <p className="text-[10px] mt-1">Usage metrics will appear once subscribed</p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}
