'use client'

import { useState, useTransition } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { saveNotificationPrefs } from '@/lib/actions/settings'

const NOTIFICATION_GROUPS = [
  {
    section: 'Lead activity',
    items: [
      { key: 'lead_assigned', label: 'New lead assigned to me', description: 'Get notified when a lead is assigned to you', default: true },
      { key: 'lead_status_changed', label: 'Lead status changed', description: 'When a lead you own moves to a new stage', default: true },
      { key: 'lead_won', label: 'Lead closed (won)', description: 'Celebrate every closed deal', default: true },
    ],
  },
  {
    section: 'Workspace',
    items: [
      { key: 'new_member', label: 'New team member joined', description: 'When someone joins the workspace', default: false },
      { key: 'project_updated', label: 'Project status updated', description: 'When a project goes active or gets archived', default: false },
      { key: 'weekly_digest', label: 'Weekly digest', description: 'Summary of leads and activity every Monday', default: true },
    ],
  },
]

interface NotificationsTabProps {
  savedPrefs: Record<string, boolean>
}

export function NotificationsTab({ savedPrefs }: NotificationsTabProps) {
  // Initialise state: use saved prefs if present, else fall back to defaults
  const initPrefs = () => {
    const result: Record<string, boolean> = {}
    for (const group of NOTIFICATION_GROUPS) {
      for (const item of group.items) {
        result[item.key] = item.key in savedPrefs ? savedPrefs[item.key] : item.default
      }
    }
    return result
  }

  const [prefs, setPrefs] = useState<Record<string, boolean>>(initPrefs)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function toggle(key: string) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveNotificationPrefs(prefs)
      if (!result?.error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    })
  }

  return (
    <div className="p-7 max-w-xl">
      <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Notifications</h1>
      <p className="mb-6 text-[13px] text-content-2">Control which notifications you receive.</p>

      <div className="space-y-6">
        {NOTIFICATION_GROUPS.map(group => (
          <div key={group.section}>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.05em] text-content-3">
              {group.section}
            </div>
            <div className="overflow-hidden rounded-[10px] border border-border bg-white divide-y divide-border">
              {group.items.map(item => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center gap-4 px-4 py-3.5 hover:bg-[#FAFAFB] transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-content">{item.label}</div>
                    <div className="mt-0.5 text-[12px] text-content-2">{item.description}</div>
                  </div>
                  {/* Toggle switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs[item.key]}
                    onClick={() => toggle(item.key)}
                    className={`relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                      prefs[item.key] ? 'bg-brand' : 'bg-[#D1D5DB]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        prefs[item.key] ? 'translate-x-[18px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-[7px] bg-brand px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.1)] hover:bg-brand/90 disabled:opacity-60 transition-all"
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          {isPending ? 'Saving…' : 'Save preferences'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-[13px] text-green-600">
            <CheckCircle2 size={14} />
            Saved
          </span>
        )}
      </div>
    </div>
  )
}
