import React, { useState } from 'react';
import { Page, User } from '../types';
import { useToast } from './Toast';
import { 
  Building2, Users, Mail, ShieldAlert, Check, X, Plus, 
  Trash2, UserPlus, Shield, Lock, Globe, Upload
} from 'lucide-react';

interface OrgAndUsersProps {
  onNavigate: (page: Page) => void;
  teamMembers: User[];
  onAddTeamMember: (member: User) => void;
  onRemoveTeamMember: (id: string) => void;
}

export default function OrgAndUsers({
  onNavigate,
  teamMembers,
  onAddTeamMember,
  onRemoveTeamMember
}: OrgAndUsersProps) {
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Designer' | 'Verifier'>('Designer');
  const { addToast } = useToast();

  // Org branding states
  const [orgName, setOrgName] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const newMember: User = {
      id: `usr_${Date.now()}`,
      email: inviteEmail,
      full_name: inviteName,
      role: inviteRole,
      name: inviteName,
      status: 'Pending',
      is_active: true,
      is_verified: false,
    };

    onAddTeamMember(newMember);
    setInviteName('');
    setInviteEmail('');
    addToast(`Invite sent to ${inviteEmail}!`, 'success');
  };

  return (
    <div id="org-and-users-root" className="space-y-6">
      
      {/* Upper header */}
      <div className="border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Organization Profile & Team</h1>
        <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest">Workspace configuration and RBAC control</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Org Identity Branding & Custom Domain mapping */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 shadow-sm">
            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">1. WORKSPACE IDENTITY</span>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 font-mono text-[9px]">ORGANIZATION LEGAL NAME</label>
                <input 
                  type="text" 
                  value={orgName} 
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 p-2.5 rounded font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono text-[9px]">CUSTOM WHITE-LABEL DOMAIN</label>
                <div className="flex items-center">
                  <span className="bg-neutral-100 border border-r-0 border-neutral-200 p-2.5 rounded-l text-neutral-500 font-mono text-[10px]">https://</span>
                  <input 
                    type="text" 
                    value={customDomain} 
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="flex-1 bg-neutral-50 border border-neutral-200 p-2.5 rounded-r font-mono text-xs outline-none"
                  />
                </div>
                <span className="text-[9px] text-neutral-400 block mt-1 leading-tight">Requires matching CNAME records mapped in your DNS provider registry.</span>
              </div>

              {/* Upload logo */}
              <div>
                <label className="block text-neutral-400 mb-1 font-mono text-[9px]">VERIFICATION PAGE LOGO</label>
                <div className="border border-dashed border-neutral-200 p-4 rounded text-center cursor-pointer hover:bg-neutral-50/50">
                  <Upload className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
                  <span className="text-[10px] text-neutral-500 font-bold">Replace organization logo</span>
                </div>
              </div>

              <button 
                onClick={() => addToast('Branding configuration saved!', 'success')}
                className="w-full bg-[#0F0F0F] hover:bg-[#E52E40] text-white text-xs font-semibold p-2.5 rounded transition-all"
              >
                Save Workspace Branding
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Team members RBAC list and Invite Form */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Team list table */}
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm space-y-4">
            
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Team Membership & Roles</h3>
                <p className="text-[9px] text-neutral-400 font-mono uppercase">ACCESS PERMISSION SCHEME</p>
              </div>
              <span className="bg-neutral-100 text-neutral-600 font-mono text-[9px] px-2 py-0.5 rounded font-semibold">{teamMembers.length} active users</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-y border-neutral-200 text-neutral-500 font-mono uppercase text-[9px]">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">RBAC Role</th>
                    <th className="p-4">Verification State</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {teamMembers.map(member => (
                    <tr key={member.id} className="hover:bg-neutral-50/40">
                      <td className="p-4 font-bold text-neutral-900">{member.name}</td>
                      <td className="p-4 font-mono text-neutral-500">{member.email}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold">
                          <Shield className="w-3 h-3 text-[#E52E40]" /> {member.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {member.status === 'Active' && (
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-semibold">Active</span>
                        )}
                        {member.status === 'Pending' && (
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-semibold">Invite Pending</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => onRemoveTeamMember(member.id)}
                          className="text-neutral-400 hover:text-red-600 p-1 rounded"
                          title="Revoke User Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Invite user form */}
          <div className="bg-[#FAF9F6] border border-neutral-200 rounded-lg p-5">
            <div className="flex items-start gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-[#E52E40] mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-neutral-900 uppercase">Transmit Secure Member Invitation</h4>
                <p className="text-[10px] text-neutral-400 leading-tight">Transmit secure login invite. Users must confirm via their registered mailboxes.</p>
              </div>
            </div>

            <form onSubmit={handleSendInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-end">
              <div className="md:col-span-1.5">
                <label className="block text-neutral-400 mb-1 font-mono text-[9px]">RECIPIENT FULL NAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. John Doe" 
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-white border border-neutral-200 p-2.5 rounded outline-none"
                />
              </div>

              <div className="md:col-span-1.5">
                <label className="block text-neutral-400 mb-1 font-mono text-[9px]">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. johndoe@gmail.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white border border-neutral-200 p-2.5 rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono text-[9px]">ASSIGN ROLE</label>
                <select 
                  value={inviteRole} 
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="w-full bg-white border border-neutral-200 p-2.5 rounded outline-none text-xs font-semibold"
                >
                  <option value="Admin">Administrator</option>
                  <option value="Designer">Template Designer</option>
                  <option value="Verifier">Compliance Verifier</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#0F0F0F] hover:bg-[#E52E40] text-white font-bold p-3 rounded transition-all text-center"
              >
                Transmit Invite
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
