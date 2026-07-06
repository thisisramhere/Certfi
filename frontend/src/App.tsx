import React, { useState, useEffect } from 'react';
import { 
  Page, CertificateTemplate, Participant, GeneratedCertificate, 
  User, OrgConfig, Notification
} from './types';
import { authAPI, templatesAPI, participantsAPI, certificatesAPI } from './api';
import { useAuth } from './services/auth';

// Component Imports
import PublicWebsite from './components/PublicWebsite';
import AuthPages from './components/AuthPages';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardOverview from './components/DashboardOverview';
import TemplateManagement from './components/TemplateManagement';
import ParticipantsManagement from './components/ParticipantsManagement';
import CertificateGenerator from './components/CertificateGenerator';
import CertificatesList from './components/CertificatesList';
import VerificationCenter from './components/VerificationCenter';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import OrgAndUsers from './components/OrgAndUsers';
import SettingsPage from './components/SettingsPage';
import { LoadingScreen } from './components/public/LoadingScreen';

export default function App() {
  // Core global frontend states
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Roster and template database states
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [certificates, setCertificates] = useState<GeneratedCertificate[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [orgConfig, setOrgConfig] = useState<OrgConfig>({ name: 'Certfi' });

  // Auth context
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  
  // Loading state for data initialization
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Load initial data from API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    } else {
      setDataLoading(false);
    }
  }, [isAuthenticated]);

  // Load initial data from API
  const loadInitialData = async () => {
    try {
      setDataLoading(true);
      setDataError(null);

      const results = await Promise.allSettled([
        templatesAPI.getAll(),
        participantsAPI.getAll(),
        certificatesAPI.getAll()
      ]);

      const templatesData = results[0].status === 'fulfilled' ? results[0].value : [];
      setTemplates(templatesData);

      const participantsData = results[1].status === 'fulfilled' ? results[1].value : [];
      setParticipants(participantsData);

      const certificatesData = results[2].status === 'fulfilled' ? results[2].value : [];
      setCertificates(certificatesData);

      if (results.some(r => r.status === 'rejected')) {
        console.warn('Some initial data failed to load', results.filter(r => r.status === 'rejected').map(r => r.reason));
      }

    } catch (err) {
      console.error('Unexpected error loading initial data:', err);
      setDataError('Failed to load application data');
    } finally {
      setDataLoading(false);
    }
  };

  // Auth handlers
  const handleLogin = async (credentials: { email: string; password: string }) => {
    await login(credentials);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentPage('home');
  };

  // API integration handlers
  const handleAddTemplate = (templateData: any) => {
    setTemplates(prev => [templateData, ...prev]);
  };

  const handleUpdateTemplate = async (updatedTpl: CertificateTemplate) => {
    try {
      const response = await templatesAPI.update(updatedTpl.id, updatedTpl);
      setTemplates(templates.map(t => t.id === updatedTpl.id ? response : t));
      return response;
    } catch (err) {
      console.error('Error updating template:', err);
      throw err;
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await templatesAPI.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting template:', err);
      throw err;
    }
  };

  const handleAddParticipant = async (participantData: Participant) => {
    console.log('ADDING TO STATE', participantData);
    setParticipants(prev => [participantData, ...prev]);
    return participantData;
  };

  const handleRefreshParticipants = async () => {
    try {
      const fresh = await participantsAPI.getAll();
      setParticipants(fresh);
    } catch (err) {
      console.error('Failed to refresh participants:', err);
    }
  };

  const handleDeleteParticipant = async (id: string) => {
    try {
      await participantsAPI.delete(id);
      setParticipants(participants.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting participant:', err);
      throw err;
    }
  };

  const handleGenerateCertificates = async (certificatesToGenerate: any[]) => {
    try {
      const response = await certificatesAPI.generate(certificatesToGenerate);
      const results = response?.results || response;
      const formattedCerts: GeneratedCertificate[] = (Array.isArray(results) ? results : []).map((cert: any) => ({
        id: cert.certificate_id || cert.id,
        certificate_id: cert.certificate_id || '',
        qr_token: cert.qr_token || '',
        tamper_hash: cert.tamper_hash || '',
        status: cert.status === 'success' ? 'generated' : cert.status,
        template_id: cert.template_id || '',
        participant_id: cert.participant_id || '',
        creator_id: cert.creator_id || '',
        organization_id: cert.organization_id || '',
        created_at: cert.created_at || new Date().toISOString(),
        updated_at: cert.updated_at || new Date().toISOString(),
      }));
      setCertificates([...formattedCerts, ...certificates]);

      // Reload certificates list from API to get full data
      certificatesAPI.getAll().then(setCertificates).catch(() => {});

      const newNotif: Notification = {
        id: `notif_${Date.now()}`,
        title: 'Bulk Generation Batch Signed',
        message: `Dispatched ${formattedCerts.length} certificates securely to ledger registry.`,
        time: 'Just now',
        type: 'certificate',
        read: false
      };
      setNotifications([newNotif, ...notifications]);

      return formattedCerts;
    } catch (err) {
      console.error('Error generating certificates:', err);
      throw err;
    }
  };

  const handleRevokeCertificate = async (id: string) => {
    if (window.confirm(`Are you absolutely sure you want to revoke and flag Certificate ID ${id}? This action instantly flags all public verification scans.`)) {
      try {
        await certificatesAPI.revoke(id);
        setCertificates(certificates.map(c => c.id === id ? { ...c, status: 'revoked' as const } : c));

        const newNotif: Notification = {
          id: `notif_${Date.now()}`,
          title: 'Certificate Revocations Ledger Update',
          message: `Certificate ID ${id} was flagged and revoked.`,
          time: 'Just now',
          type: 'security',
          read: false
        };
        setNotifications([newNotif, ...notifications]);
      } catch (err) {
        console.error('Error revoking certificate:', err);
        throw err;
      }
    }
  };

  const handleAddTeamMember = (member: User) => {
    setTeamMembers([...teamMembers, member]);
  };

  const handleRemoveTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const handleClearNotifications = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (isAuthenticated && ['login', 'register', 'forgot-password'].includes(currentPage)) {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated, currentPage]);

  // Redirect unauthenticated users away from protected pages
  useEffect(() => {
    const protectedPages = ['dashboard', 'templates', 'participants', 'generate', 'certificates', 'verification', 'analytics', 'organization', 'users', 'settings'];
    if (!isAuthenticated && protectedPages.includes(currentPage)) {
      setCurrentPage('login');
    }
  }, [isAuthenticated, currentPage]);

  // Show loading screen while initializing
  if (isLoading || dataLoading) {
    return <LoadingScreen />;
  }

  // Show error screen if initialization failed
  if (dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">Initialization Error</h2>
          <p className="text-neutral-600 mb-4">{dataError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#E52E40] text-white rounded-lg hover:bg-[#E52E40]/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="certfi-app-viewport" className="min-h-screen bg-neutral-50 flex flex-col justify-between text-neutral-800 font-sans selection:bg-[#E52E40]/10 selection:text-[#E52E40]">
      
      {/* 1. PUBLIC MARKETING WEBSITE ROUTING */}
      {!isAuthenticated && ['home', 'login', 'register', 'forgot-password'].includes(currentPage) && (
        <div className="flex-1 flex flex-col justify-between">
          
          {/* Main Website views / Auth portals wrapper */}
          {currentPage === 'home' ? (
            <PublicWebsite onNavigate={handleNavigate} />
          ) : (
            <AuthPages 
              initialScreen={currentPage as any} 
              onNavigate={handleNavigate} 
              onLoginSuccess={handleLogin} 
            />
          )}

        </div>
      )}

      {/* 2. AUTHENTICATED SaaS CONTROL CENTER */}
      {isAuthenticated && (
        <div className="flex-1 flex items-stretch min-h-screen overflow-hidden">
          
          {/* Collapsible Sidebar */}
          <Sidebar 
            activePage={currentPage} 
            onNavigate={handleNavigate} 
            isCollapsed={sidebarCollapsed} 
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
            onLogout={handleLogout} 
            orgName={orgConfig.name} 
          />

          {/* Core Screen Container */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            
            {/* Top contextual Breadcrumb bar */}
            <Navbar 
              activePage={currentPage} 
              onNavigate={handleNavigate} 
              userEmail={user?.email || "user@example.com"}
              notifications={notifications} 
              onMarkAllRead={handleClearNotifications} 
              orgName={orgConfig.name}
              onSelectOrg={(name) => setOrgConfig({ ...orgConfig, name })}
              onLogout={handleLogout}
            />

            {/* Active view component router portal */}
            <div className="p-6 md:p-8 flex-1 max-w-[1400px] w-full mx-auto animate-fade-in pb-16">
              
              {currentPage === 'dashboard' && (
                <DashboardOverview 
                  onNavigate={handleNavigate} 
                  templates={templates} 
                  participants={participants} 
                  certificates={certificates} 
                />
              )}

              {currentPage === 'templates' && (
                <TemplateManagement 
                  onNavigate={handleNavigate} 
                  templates={templates} 
                  onAddTemplate={handleAddTemplate} 
                  onDeleteTemplate={handleDeleteTemplate}
                  onTemplatesUpdate={(tpls) => setTemplates(tpls)}
                  onSelectTemplate={(tpl) => {
                    handleNavigate('templates');
                  }}
                />
              )}

              {currentPage === 'participants' && (
                <ParticipantsManagement 
                  onNavigate={handleNavigate} 
                  participants={participants} 
                  onAddParticipant={handleAddParticipant} 
                  onDeleteParticipant={handleDeleteParticipant}
                  onRefreshParticipants={handleRefreshParticipants}
                />
              )}

              {currentPage === 'generate' && (
                <CertificateGenerator 
                  onNavigate={handleNavigate} 
                  templates={templates} 
                  participants={participants} 
                  onGenerateCertificates={handleGenerateCertificates}
                />
              )}

              {currentPage === 'certificates' && (
                <CertificatesList 
                  onNavigate={handleNavigate} 
                  certificates={certificates} 
                  templates={templates} 
                  onRevokeCertificate={handleRevokeCertificate}
                />
              )}

              {currentPage === 'verification' && (
                <VerificationCenter 
                  onNavigate={handleNavigate} 
                  certificates={certificates} 
                />
              )}

              {currentPage === 'analytics' && (
                <AnalyticsDashboard 
                  onNavigate={handleNavigate} 
                  templates={templates} 
                  certificates={certificates} 
                />
              )}

              {currentPage === 'organization' && (
                <OrgAndUsers 
                  onNavigate={handleNavigate} 
                  teamMembers={teamMembers} 
                  onAddTeamMember={handleAddTeamMember} 
                  onRemoveTeamMember={handleRemoveTeamMember}
                />
              )}

              {currentPage === 'settings' && (
                <SettingsPage 
                  onNavigate={handleNavigate} 
                  config={orgConfig} 
                  onUpdateConfig={setOrgConfig}
                />
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}