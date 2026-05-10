'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Eye, EyeOff, ExternalLink, Plug, Zap, Mail, MessageCircle } from 'lucide-react'
import { saveIntegration } from '@/lib/actions/settings'

interface Integration {
  name: string
  label: string
  description: string
  icon: React.ReactNode
  color: string
  fields: { key: string; label: string; placeholder: string; type?: string; hint?: string }[]
  docsUrl: string
  docsLabel: string
}

const INTEGRATIONS: Integration[] = [
  {
    name: 'resend',
    label: 'Resend (Email)',
    description: 'Send automated emails to leads — welcome messages, follow-up reminders, status updates.',
    icon: <Mail size={18} />,
    color: '#111827',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        placeholder: 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'password',
        hint: 'Get your API key from resend.com → API Keys',
      },
      {
        key: 'from_email',
        label: 'From email',
        placeholder: 'noreply@yourdomain.com',
        hint: 'Must be a verified domain in Resend',
      },
    ],
    docsUrl: 'https://resend.com/docs/api-reference/api-keys/create-api-key',
    docsLabel: 'Get API key at resend.com (free)',
  },
  {
    name: 'whatsapp',
    label: 'WhatsApp Business (Meta Cloud API)',
    description: 'Send WhatsApp messages to leads instantly — free via Meta Cloud API, no per-message charges.',
    icon: <MessageCircle size={18} />,
    color: '#25D366',
    fields: [
      {
        key: 'phone_number_id',
        label: 'Phone Number ID',
        placeholder: '1234567890123456',
        hint: 'Find in Meta Business Manager → WhatsApp → Phone Numbers',
      },
      {
        key: 'access_token',
        label: 'Permanent Access Token',
        placeholder: 'EAAxxxxxxxx…',
        type: 'password',
        hint: 'System user token from Meta Business Manager → System Users',
      },
    ],
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
    docsLabel: 'Setup guide at developers.facebook.com (free)',
  },
  {
    name: 'webhook',
    label: 'Webhook (Zapier / Make)',
    description: 'Fire a webhook whenever a new lead is created — connect to Zapier, Make, or any custom URL.',
    icon: <Zap size={18} />,
    color: '#FF6B35',
    fields: [
      {
        key: 'url',
        label: 'Webhook URL',
        placeholder: 'https://hooks.zapier.com/hooks/catch/…',
        hint: 'In Zapier: New Zap → Trigger: Webhooks by Zapier → Catch Hook → copy URL',
      },
    ],
    docsUrl: 'https://zapier.com/apps/webhook/integrations',
    docsLabel: 'Create a free Zapier webhook',
  },
]

interface IntegrationsTabProps {
  saved: Array<{ name: string; is_enabled: boolean; config: Record<string, string> }>
}

export function IntegrationsTab({ saved }: IntegrationsTabProps) {
  // Build initial state from saved DB data
  const initState = () => {
    const map: Record<string, { enabled: boolean; config: Record<string, string> }> = {}
    for (const intg of INTEGRATIONS) {
      const dbRow = saved.find(r => r.name === intg.name)
      map[intg.name] = {
        enabled: dbRow?.is_enabled ?? false,
        config: dbRow?.config ?? {},
      }
    }
    return map
  }

  const [state, setState] = useState(initState)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [pendingName, setPendingName] = useState<string | null>(null)
  const [savedName, setSavedName] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  function updateField(intgName: string, fieldKey: string, value: string) {
    setState(prev => ({
      ...prev,
      [intgName]: {
        ...prev[intgName],
        config: { ...prev[intgName].config, [fieldKey]: value },
      },
    }))
  }

  function handleSave(intg: Integration) {
    setPendingName(intg.name)
    setErrors(prev => ({ ...prev, [intg.name]: '' }))
    startTransition(async () => {
      const result = await saveIntegration(
        intg.name,
        state[intg.name].config,
        state[intg.name].enabled,
      )
      setPendingName(null)
      if (result?.error) {
        setErrors(prev => ({ ...prev, [intg.name]: result.error! }))
      } else {
        setSavedName(intg.name)
        setTimeout(() => setSavedName(null), 2500)
        setExpanded(null)
      }
    })
  }

  function toggleEnabled(intgName: string) {
    setState(prev => ({
      ...prev,
      [intgName]: { ...prev[intgName], enabled: !prev[intgName].enabled },
    }))
  }

  return (
    <div className="p-7 max-w-2xl">
      <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Integrations</h1>
      <p className="mb-6 text-[13px] text-content-2">
        Connect external services. All are free — just paste your API key and save.
      </p>

      <div className="space-y-3">
        {INTEGRATIONS.map(intg => {
          const isExpanded = expanded === intg.name
          const intgState = state[intg.name]
          const isPending = pendingName === intg.name
          const wasSaved = savedName === intg.name
          const isConnected = intgState.enabled

          return (
            <div
              key={intg.name}
              className="overflow-hidden rounded-[10px] border border-border bg-white"
            >
              {/* Header row */}
              <div className="flex items-center gap-3.5 px-4 py-3.5">
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-[8px]"
                  style={{ background: `${intg.color}14`, color: intg.color }}
                >
                  {intg.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-content">{intg.label}</span>
                    {isConnected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-1.5 py-0.5 text-[10.5px] font-medium text-[#047857]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                        Connected
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12px] text-content-2">{intg.description}</div>
                </div>
                <button
                  onClick={() => setExpanded(isExpanded ? null : intg.name)}
                  className="flex-none rounded-[6px] border border-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-content hover:bg-surface-2 transition-colors"
                >
                  {isConnected ? 'Edit' : 'Connect'}
                </button>
              </div>

              {/* Expanded config */}
              {isExpanded && (
                <div className="border-t border-border bg-[#FAFAFA] px-4 py-4">
                  {/* Enable toggle */}
                  <label className="mb-4 flex cursor-pointer items-center justify-between">
                    <span className="text-[13px] font-medium text-content">Enable this integration</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={intgState.enabled}
                      onClick={() => toggleEnabled(intg.name)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        intgState.enabled ? 'bg-brand' : 'bg-[#D1D5DB]'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        intgState.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </label>

                  {/* Fields */}
                  <div className="space-y-3">
                    {intg.fields.map(field => (
                      <div key={field.key}>
                        <label className="mb-1 block text-[12px] font-medium text-content-2">
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            type={field.type === 'password' && !showSecrets[`${intg.name}_${field.key}`] ? 'password' : 'text'}
                            value={intgState.config[field.key] ?? ''}
                            onChange={e => updateField(intg.name, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full rounded-[7px] border border-border bg-white px-3 py-2 text-[13px] text-content outline-none placeholder:text-content-3 focus:border-brand/50 focus:ring-1 focus:ring-brand/10 pr-9"
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => setShowSecrets(prev => ({
                                ...prev,
                                [`${intg.name}_${field.key}`]: !prev[`${intg.name}_${field.key}`],
                              }))}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-3 hover:text-content"
                            >
                              {showSecrets[`${intg.name}_${field.key}`]
                                ? <EyeOff size={13} />
                                : <Eye size={13} />
                              }
                            </button>
                          )}
                        </div>
                        {field.hint && (
                          <p className="mt-1 text-[11.5px] text-content-3">{field.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Docs link */}
                  <a
                    href={intg.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[12px] text-brand hover:underline"
                  >
                    <ExternalLink size={11} />
                    {intg.docsLabel}
                  </a>

                  {/* Error */}
                  {errors[intg.name] && (
                    <p className="mt-2 text-[12px] text-red-500">{errors[intg.name]}</p>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleSave(intg)}
                      disabled={isPending}
                      className="flex items-center gap-2 rounded-[7px] bg-brand px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.06)] hover:bg-brand/90 disabled:opacity-60 transition-all"
                    >
                      {isPending && <Loader2 size={13} className="animate-spin" />}
                      {isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setExpanded(null)}
                      className="rounded-[7px] border border-border bg-white px-4 py-2 text-[13px] font-medium text-content hover:bg-surface-2 transition-colors"
                    >
                      Cancel
                    </button>
                    {wasSaved && (
                      <span className="flex items-center gap-1.5 text-[13px] text-green-600">
                        <CheckCircle2 size={14} />
                        Saved
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-5 text-[12px] text-content-3">
        API keys are stored encrypted in your Supabase project and never exposed to the browser.
      </p>
    </div>
  )
}
