import React from 'react';
import { Page } from '../types';
import { 
  LayoutDashboard, FileText, Users, Cpu, FileCheck, CheckSquare, 
  BarChart3, Building2, UserCog, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight, Bell
} from 'lucide-react';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  orgName: string;
}

export default function Sidebar({ 
  activePage, 
  onNavigate, 
  isCollapsed, 
  onToggleCollapse, 
  onLogout,
  orgName
}: SidebarProps) {

  // Sidebar items definition
  const menuItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'templates' as Page, label: 'Templates', icon: FileText },
    { id: 'participants' as Page, label: 'Participants', icon: Users },
    { id: 'generate' as Page, label: 'Certificate Gen', icon: Cpu },
    { id: 'certificates' as Page, label: 'Certificates List', icon: FileCheck },
    { id: 'verification' as Page, label: 'Verification Center', icon: CheckSquare },
    { id: 'analytics' as Page, label: 'Analytics', icon: BarChart3 },
    { id: 'organization' as Page, label: 'Organization', icon: Building2 },
    { id: 'users' as Page, label: 'User Management', icon: UserCog },
    { id: 'settings' as Page, label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      id="dashboard-sidebar"
      className={`bg-[#0F0F0F] text-[#FAF9F6] h-screen flex flex-col justify-between border-r border-neutral-800 transition-all duration-300 z-40 shrink-0 ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Sidebar Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800">
          {!isCollapsed ? (
            <div className="flex items-center gap-2 font-display font-bold text-base tracking-tight text-white">
              <span className="w-7 h-7 bg-[#E52E40] text-white flex items-center justify-center font-mono text-sm font-bold rounded">
                F
              </span>
              <span>Cert<span className="text-[#E52E40]">fi</span></span>
              <span className="text-[9px] font-mono text-neutral-500 border border-neutral-800 px-1 py-0.5 rounded uppercase shrink-0">SAAS</span>
            </div>
          ) : (
            <span className="w-8 h-8 bg-[#E52E40] text-white flex items-center justify-center font-mono text-sm font-bold rounded mx-auto">
              F
            </span>
          )}

          <button 
            onClick={onToggleCollapse} 
            className="hidden md:flex p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Workspace indicator */}
        {!isCollapsed && (
          <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800/60">
            <div className="text-[9px] font-mono text-[#E52E40] uppercase tracking-widest font-semibold">ACTIVE WORKSPACE</div>
            <div className="text-xs font-semibold text-neutral-200 truncate mt-0.5">{orgName}</div>
          </div>
        )}

        {/* Main Menu Links */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded text-xs font-medium transition-all group ${
                  isActive 
                    ? 'bg-[#E52E40] text-white font-semibold shadow-sm' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-neutral-800 space-y-1 bg-neutral-950">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 p-2 rounded text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors ${activePage === 'profile' ? 'text-white font-semibold' : ''}`}
          title="Profile Guidelines"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Help & Guideline</span>}
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-2 rounded text-xs text-rose-400 hover:text-white hover:bg-rose-900/40 transition-colors font-medium"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
