'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Projects',    href: '/portal' },
  { label: 'Submit lead', href: '/submit-lead' },
  { label: 'My leads',    href: '/my-leads' },
]

export function PortalNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/submit-lead') {
      // Active on /submit-lead AND /portal/[slug]/submit-lead
      return pathname === '/submit-lead' || pathname.endsWith('/submit-lead')
    }
    if (href === '/portal') {
      // Active on /portal and /portal/[slug] but NOT on submit-lead paths
      return (pathname === '/portal' || pathname.startsWith('/portal/')) &&
             !pathname.endsWith('/submit-lead')
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="ml-8 flex items-center gap-1">
      {NAV_ITEMS.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={[
            'rounded-[6px] px-3 py-[6px] text-[13px] transition-colors',
            isActive(item.href)
              ? 'bg-[#F3F4F6] font-medium text-[#111827]'
              : 'font-normal text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]',
          ].join(' ')}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
