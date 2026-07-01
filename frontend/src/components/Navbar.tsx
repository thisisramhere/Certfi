import React, { useState } from 'react';
import { Page, Notification } from '../types';
import { 
  Search, Bell, User, ChevronDown, Plus, Globe, Settings, ShieldCheck, HelpCircle, LogOut 
} from 'lucide-react';

interface NavbarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  userEmail: string;
  notifications: Notification[];
  onMarkAllRead: () => void;
  orgName: string;
  onSelectOrg: (name: string) => void;
  onLogout: () => void;
}

export default function Navbar({
  activePage,
  onNavigate,
  userEmail,
  notifications,
  onMarkAllRead,
  orgName,
  onSelectOrg,
  onLogout
}: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  const getBreadcrumbs = () => {
    const root = 'Workspace';
    switch (activePage) {
      case 'dashboard': return [root, 'Overview'];
      case 'templates': return [root, 'Templates'];
      case 'visual-editor': return [root, 'Templates', 'Visual Template Editor'];
      case 'participants': return [root, 'Participants'];
      case 'generate': return [root, 'Certificate Generator'];
      case 'certificates': return [root, 'Issued Certificates'];
      case 'verification': return [root, 'Verification Engine'];
      case 'analytics': return [root, 'Analytics Reports'];
      case 'organization': return [root, 'Organization Profile'];
      case 'users': return [root, 'IAM User Management'];
      case 'settings': return [root, 'Platform Settings'];
      case 'notifications': return [root, 'Notification Logs'];
      case 'profile': return [root, 'Account Profile'];
      default: return [root, activePage];
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 border-b border-neutral-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={bc}>
              <span className="hover:text-neutral-700 cursor-pointer">{bc}</span>
              {idx < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="sm:hidden font-display font-bold text-sm text-neutral-900 truncate max-w-[120px]">
          {breadcrumbs[breadcrumbs.length - 1]}
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden md:flex items-center relative w-72 max-w-sm">
        <Search className="absolute left-3 w-4 h-4 text-neutral-400" />
        <input 
          type="text" 
          placeholder="Global Search (Certs, Users, Tags)..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 focus:border-[#E52E40] outline-none rounded p-2 pl-9 text-xs font-mono transition-all"
        />
        {searchQuery && (
          <div className="absolute top-11 left-0 w-full bg-white border-2 border-neutral-800 rounded shadow-lg p-3 z-50 text-left">
            <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest mb-1">SEARCH RESULTS FOR: "{searchQuery}"</div>
            <div className="text-xs text-neutral-500 py-2">Type a certificate ID, template name, or email to search the ledger.</div>
          </div>
        )}
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-4">
        
        {/* Quick Action Button */}
        <button 
          onClick={() => onNavigate('generate')}
          className="hidden lg:flex items-center gap-1 bg-[#E52E40] hover:bg-rose-700 text-white font-semibold text-xs px-3.5 py-2 rounded transition-colors"
        >
          <Plus className="w-4 h-4" /> Bulk Gen
        </button>

        {/* Org Selector */}
        <div className="relative">
          <button 
            onClick={() => { setShowOrgMenu(!showOrgMenu); setShowProfileMenu(false); setShowNotifMenu(false); }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-2 rounded transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#E52E40]"></span>
            <span className="truncate max-w-[100px]">{orgName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {showOrgMenu && (
            <div className="absolute right-0 top-11 w-56 bg-white border border-neutral-200 rounded shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest px-2 py-1">SWITCH ORG</div>
              <button 
                onClick={() => { onSelectOrg('CertFI Japan Operations'); setShowOrgMenu(false); }}
                className="w-full text-left p-2 hover:bg-neutral-50 text-xs rounded font-medium flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#E52E40]"></span> CertFI Japan Operations
              </button>
              <button 
                onClick={() => { onSelectOrg('Kyoto Tech Labs'); setShowOrgMenu(false); }}
                className="w-full text-left p-2 hover:bg-neutral-50 text-xs rounded font-medium flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Kyoto Tech Labs
              </button>
              <button 
                onClick={() => { onSelectOrg('Global Systems Tokyo'); setShowOrgMenu(false); }}
                className="w-full text-left p-2 hover:bg-neutral-50 text-xs rounded font-medium flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Global Systems Tokyo
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifMenu(!showNotifMenu); setShowProfileMenu(false); setShowOrgMenu(false); }}
            className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 rounded relative transition-all"
            title="Notification feed"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#E52E40] text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-neutral-200 rounded shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-2">
                <span className="text-xs font-bold text-neutral-900">Notifications ({unreadCount} new)</span>
                {unreadCount > 0 && (
                  <button onClick={onMarkAllRead} className="text-[10px] text-[#E52E40] font-semibold hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-2 rounded text-xs text-left border-l-2 transition-colors ${notif.read ? 'bg-white border-neutral-300' : 'bg-rose-50/50 border-[#E52E40]'}`}>
                    <div className="font-semibold text-neutral-900 flex justify-between">
                      <span>{notif.title}</span>
                      <span className="text-[9px] text-neutral-400 font-normal">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-100 pt-2 mt-2 text-center">
                <button onClick={() => { onNavigate('notifications'); setShowNotifMenu(false); }} className="text-[10px] text-neutral-500 font-semibold hover:text-[#0F0F0F] hover:underline">
                  View all system logs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button 
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifMenu(false); setShowOrgMenu(false); }}
            className="flex items-center gap-1.5 focus:outline-none group"
            title="User Settings"
          >
            <div className="w-8 h-8 rounded-full bg-[#0F0F0F] text-white flex items-center justify-center font-mono text-xs font-bold group-hover:bg-[#E52E40] transition-colors">
              {userEmail ? userEmail[0].toUpperCase() : 'R'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-11 w-56 bg-white border border-neutral-200 rounded shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-neutral-100">
                <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">AUTHENTICATED</div>
                <div className="text-xs font-bold text-neutral-800 truncate mt-0.5">{userEmail}</div>
              </div>
              
              <div className="p-1 space-y-0.5">
                <button 
                  onClick={() => { onNavigate('profile'); setShowProfileMenu(false); }}
                  className="w-full text-left p-2 hover:bg-neutral-50 text-xs text-neutral-600 hover:text-[#0F0F0F] rounded flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5" /> Account Details
                </button>
                <button 
                  onClick={() => { onNavigate('settings'); setShowProfileMenu(false); }}
                  className="w-full text-left p-2 hover:bg-neutral-50 text-xs text-neutral-600 hover:text-[#0F0F0F] rounded flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5" /> Security Keys
                </button>
                <button 
                  onClick={() => { onNavigate('organization'); setShowProfileMenu(false); }}
                  className="w-full text-left p-2 hover:bg-neutral-50 text-xs text-neutral-600 hover:text-[#0F0F0F] rounded flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Organization
                </button>
              </div>

              <hr className="border-neutral-100 my-1" />

              <div className="p-1">
                <button 
                  onClick={() => { onLogout(); setShowProfileMenu(false); }}
                  className="w-full text-left p-2 hover:bg-rose-50 text-xs text-rose-600 rounded flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
