'use client'

import { useState, useTransition } from 'react'
import { Avatar } from '@/components/shared/Avatar'
import { NotificationsTab } from './NotificationsTab'
import { IntegrationsTab } from './IntegrationsTab'
import { saveNotificationPrefs } from '@/lib/actions/settings'
import { Loader2, CheckCircle2 } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SettingsData {
  isHead: boolean
  userId: string
  // General tab
  projectCount: number | null
  leadCount: number | null
  memberCount: number | null
  // Members tab
  members: any[]
  // Profile tab
  profile: any
  // Notifications tab
  notificationPrefs: Record<string, boolean>
  // Integrations tab
  integrations: any[]
}

interface Props {
  data: SettingsData
  updateProfile: (fd: FormData) => Promise<void>
}

const WORKSPACE_TABS = [
  { id: 'general', label: 'General' },
  { id: 'members', label: 'Members' },
  { id: 'roles', label: 'Roles & permissions' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'billing', label: 'Billing' },
]

const ACCOUNT_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'sessions', label: 'Sessions' },
]

export function SettingsClient({ data, updateProfile }: Props) {
  const [tab, setTab] = useState(data.isHead ? 'general' : 'profile')

  const allTabs = [...(data.isHead ? WORKSPACE_TABS : []), ...ACCOUNT_TABS]
  const currentLabel = allTabs.find(t => t.id === tab)?.label ?? 'Settings'

  const allTabs2 = [...(data.isHead ? WORKSPACE_TABS : []), ...ACCOUNT_TABS]

  return (
    <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
      {/* Mobile: horizontal scrollable tab bar */}
      <div className="flex overflow-x-auto border-b border-border bg-white px-3 py-2 gap-1 scrollbar-none sm:hidden">
        {allTabs2.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-none rounded-[6px] px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors ${
              tab === item.id
                ? 'bg-[#EDEEF0] font-medium text-content'
                : 'text-content-2 hover:bg-surface-2'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Desktop: Left nav */}
      <aside className="hidden w-[210px] flex-none border-r border-border bg-white p-4 sm:block">
        {data.isHead && (
          <>
            <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">
              Workspace
            </div>
            <nav className="flex flex-col gap-px">
              {WORKSPACE_TABS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full rounded-[6px] px-2 py-1.5 text-left text-[13px] transition-colors ${
                    tab === item.id
                      ? 'bg-[#EDEEF0] font-medium text-content'
                      : 'text-content-2 hover:bg-surface-2'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mb-1 mt-5 px-2 text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">
              Account
            </div>
          </>
        )}
        {!data.isHead && (
          <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">
            Account
          </div>
        )}
        <nav className="flex flex-col gap-px">
          {ACCOUNT_TABS.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full rounded-[6px] px-2 py-1.5 text-left text-[13px] transition-colors ${
                tab === item.id
                  ? 'bg-[#EDEEF0] font-medium text-content'
                  : 'text-content-2 hover:bg-surface-2'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content — instant switch, zero network */}
      <div className="flex-1 overflow-auto">
        {tab === 'general' && data.isHead && (
          <GeneralTab
            projectCount={data.projectCount}
            leadCount={data.leadCount}
            memberCount={data.memberCount}
          />
        )}
        {tab === 'members' && data.isHead && (
          <MembersTab members={data.members} currentUserId={data.userId} />
        )}
        {tab === 'roles' && data.isHead && <RolesTab />}
        {tab === 'integrations' && data.isHead && (
          <IntegrationsTab saved={data.integrations} />
        )}
        {tab === 'billing' && data.isHead && <BillingTab />}
        {tab === 'profile' && (
          <ProfileTab profile={data.profile} updateProfile={updateProfile} />
        )}
        {tab === 'notifications' && (
          <NotificationsTab savedPrefs={data.notificationPrefs} />
        )}
        {tab === 'sessions' && <SessionsTab />}
      </div>
    </div>
  )
}

// ── Tab: General ─────────────────────────────────────────────────────────────
function GeneralTab({ projectCount, leadCount, memberCount }: { projectCount: number | null; leadCount: number | null; memberCount: number | null }) {
  return (
    <div className="p-4 sm:p-7 max-w-2xl">
      <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">General</h1>
      <p className="mb-6 text-[13px] text-content-2">Overview of your Rayash CRM workspace.</p>
      <div className="mb-6 overflow-hidden rounded-[10px] border border-border bg-white">
        <div className="border-b border-border px-5 py-3.5">
          <div className="text-[13px] font-semibold">Workspace</div>
        </div>
        <div className="divide-y divide-border">
          <Row label="Workspace name" value="Rayash Real Estate" />
          <Row label="Plan" value="Professional" />
          <Row label="Region" value="Asia (Mumbai)" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total projects', value: projectCount ?? 0, color: '#2563EB' },
          { label: 'Total leads', value: leadCount ?? 0, color: '#8B5CF6' },
          { label: 'Team members', value: memberCount ?? 0, color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="rounded-[10px] border border-border bg-white p-4">
            <div className="mb-1 text-[12px] text-content-2">{s.label}</div>
            <div className="text-[26px] font-semibold tracking-[-0.02em]" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-[13px] text-content-2">{label}</span>
      <span className="text-[13px] font-medium text-content">{value}</span>
    </div>
  )
}

// ── Tab: Members ─────────────────────────────────────────────────────────────
function MembersTab({ members, currentUserId }: { members: any[]; currentUserId: string }) {
  return (
    <div className="p-4 sm:p-7">
      <div className="mb-5">
        <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Members</h1>
        <p className="mt-0.5 text-[13px] text-content-2">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-border bg-white">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#FAFAFB]">
              {['Member', 'Role', 'Email', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id} className="border-t border-[#EEF0F3] hover:bg-[#FAFAFB]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={member.full_name} size={28} />
                    <div>
                      <div className="font-medium">{member.full_name}</div>
                      {member.id === currentUserId && <div className="text-[11px] text-brand">You</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${
                    member.role === 'head' ? 'bg-[#111827] text-white' : 'bg-[#F5F3FF] text-[#5B21B6]'
                  }`}>
                    {member.role === 'head' ? 'Head / Admin' : 'Sales Member'}
                  </span>
                </td>
                <td className="px-4 py-3 text-content-2">{member.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${
                    member.is_active ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#F3F4F6] text-content-3'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${member.is_active ? 'bg-[#10B981]' : 'bg-content-3'}`} />
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {member.id !== currentUserId && (
                    <button className="rounded-[5px] border border-border px-2 py-1 text-[12px] text-content-2 hover:bg-surface-2">Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Roles ────────────────────────────────────────────────────────────────
const PERMISSION_SECTIONS = [
  { title: 'Lead management', rows: [
    { label: 'View all leads', perms: [true, false, false] },
    { label: 'View assigned leads', perms: [true, true, false] },
    { label: 'Reassign leads', perms: [true, false, false] },
    { label: 'Bulk CSV import', perms: [true, false, false] },
    { label: 'Delete leads', perms: [true, false, false] },
    { label: 'Add leads manually', perms: [true, true, false] },
    { label: 'Update lead status', perms: [true, true, false] },
  ]},
  { title: 'Projects', rows: [
    { label: 'View projects', perms: [true, true, true] },
    { label: 'Create projects', perms: [true, false, false] },
    { label: 'Edit project info', perms: [true, false, false] },
    { label: 'Archive projects', perms: [true, false, false] },
    { label: 'Upload project files', perms: [true, true, false] },
    { label: 'Upload project cover image', perms: [true, false, false] },
  ]},
  { title: 'Workspace', rows: [
    { label: 'Invite members', perms: [true, false, false] },
    { label: 'Manage team', perms: [true, false, false] },
    { label: 'View statistics', perms: [true, false, false] },
    { label: 'View commissions', perms: [true, false, false] },
    { label: 'Approve commissions', perms: [true, false, false] },
    { label: 'Manage integrations', perms: [true, false, false] },
  ]},
]
const ROLE_LABELS = ['Head / Admin', 'Sales Member', 'External']

function Toggle({ on }: { on: boolean }) {
  return (
    <span className="relative inline-block h-4 w-7 flex-none rounded-full transition-colors" style={{ background: on ? '#2563EB' : '#D1D5DB' }}>
      <span className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all" style={{ left: on ? '14px' : '2px' }} />
    </span>
  )
}

function RolesTab() {
  return (
    <div className="p-4 sm:p-7">
      <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Roles & permissions</h1>
      <p className="mb-6 text-[13px] text-content-2">Three roles, precise control.</p>
      <div className="overflow-hidden rounded-[10px] border border-border bg-white">
        <div className="grid border-b border-border bg-[#FAFAFB] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.04em] text-content-3"
          style={{ gridTemplateColumns: '1fr 120px 120px 120px' }}>
          <span>Permission</span>
          {ROLE_LABELS.map(r => <span key={r} className="text-center">{r}</span>)}
        </div>
        {PERMISSION_SECTIONS.map((sec, si) => (
          <div key={sec.title}>
            <div className={`px-4 py-2.5 text-[12.5px] font-semibold text-content bg-[#FAFAFB] ${si > 0 ? 'border-t border-border' : ''}`}>{sec.title}</div>
            {sec.rows.map(row => (
              <div key={row.label} className="grid items-center px-4 py-2.5 text-[13px] hover:bg-[#FAFAFB]"
                style={{ gridTemplateColumns: '1fr 120px 120px 120px', borderTop: '1px solid #EEF0F3' }}>
                <span className="text-content-2">{row.label}</span>
                {row.perms.map((on, k) => (
                  <span key={k} className="flex justify-center"><Toggle on={on} /></span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Profile ─────────────────────────────────────────────────────────────
function ProfileTab({ profile, updateProfile }: { profile: any; updateProfile: (fd: FormData) => Promise<void> }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateProfile(fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <div className="p-4 sm:p-7 max-w-xl">
      <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Profile</h1>
      <p className="mb-6 text-[13px] text-content-2">Update your personal information.</p>
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={profile?.full_name ?? 'User'} size={52} src={profile?.avatar_url ?? undefined} />
        <div>
          <div className="text-[14px] font-semibold">{profile?.full_name}</div>
          <div className="text-[13px] text-content-2">{profile?.email}</div>
          <div className={`mt-1 inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium ${
            profile?.role === 'head' ? 'bg-[#111827] text-white' : 'bg-[#F5F3FF] text-[#5B21B6]'
          }`}>
            {profile?.role === 'head' ? 'Head / Admin' : 'Sales Member'}
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-content">Full name</label>
          <input name="full_name" defaultValue={profile?.full_name ?? ''} required
            className="w-full rounded-[7px] border border-border bg-white px-3 py-2 text-[13px] text-content outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10" />
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-content">Email</label>
          <input value={profile?.email ?? ''} disabled
            className="w-full rounded-[7px] border border-border bg-surface-2 px-3 py-2 text-[13px] text-content-3 cursor-not-allowed outline-none" />
          <p className="mt-1 text-[11.5px] text-content-3">Email cannot be changed.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-content">Phone number</label>
          <input name="phone" defaultValue={profile?.phone ?? ''}
            className="w-full rounded-[7px] border border-border bg-white px-3 py-2 text-[13px] text-content outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10"
            placeholder="+91 98765 43210" />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={isPending}
            className="flex items-center gap-2 rounded-[7px] bg-brand px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.1)] hover:bg-brand/90 disabled:opacity-60 transition-all">
            {isPending && <Loader2 size={13} className="animate-spin" />}
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-[13px] text-green-600">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

// ── Tab: Sessions ─────────────────────────────────────────────────────────────
function SessionsTab() {
  const now = new Date()
  return (
    <div className="p-4 sm:p-7 max-w-xl">
      <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Sessions</h1>
      <p className="mb-6 text-[13px] text-content-2">Manage where you're signed in.</p>
      <div className="overflow-hidden rounded-[10px] border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-border bg-surface-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-medium">Current session</div>
              <div className="text-[12px] text-content-2">
                {now.toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })} · Web browser
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-medium text-[#047857]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
            Active now
          </span>
        </div>
        <div className="px-4 py-3 text-[12.5px] text-content-3">
          Only one active session found. You can sign out from all devices below.
        </div>
      </div>
      <div className="mt-4">
        <button className="rounded-[7px] border border-[#EF4444] px-4 py-2 text-[13px] font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-colors">
          Sign out all other sessions
        </button>
      </div>
    </div>
  )
}

// ── Tab: Billing ──────────────────────────────────────────────────────────────
function BillingTab() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-2 text-content-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
        </svg>
      </div>
      <div className="text-[15px] font-semibold">Billing</div>
      <div className="mt-1.5 max-w-xs text-[13px] text-content-2">Manage your subscription, view invoices, and update payment methods. Coming soon.</div>
    </div>
  )
}
