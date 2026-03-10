'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import LanguageDropdown from './LanguageDropdown'
import { useLanguage } from './LanguageContext'
import { getDashboardData } from '../lib/driverData'
import IconButton from './IconButton'

function resolveTitle(pathname, t) {
  if (pathname === '/') return t('dashboard')
  if (pathname.startsWith('/safety')) return t('safety')
  if (pathname.startsWith('/earnings')) return t('earnings')
  if (pathname.startsWith('/trips')) return t('trips')
  if (pathname.startsWith('/settings')) return t('settings')
  return 'Driver Pulse'
}

export default function Header() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [time, setTime] = useState('')
  const [q, setQ] = useState('')
  const driverName = useMemo(() => {
    try {
      return getDashboardData()?.driverName || 'Driver'
    } catch {
      return 'Driver'
    }
  }, [])
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="top-nav" role="banner">
      <div className="top-nav-left">
        <div className="top-nav-title">{resolveTitle(pathname, t)}</div>
        <div className="top-nav-subtitle">{time}</div>
      </div>
      <div className="header-right">
        <div className="search-pill" role="search" aria-label="Search">
          <span aria-hidden="true">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search trips, zones, metrics…"
            aria-label="Search (placeholder)"
          />
        </div>
        <LanguageDropdown variant="compact" />
        <div className="top-nav-divider" aria-hidden="true" />
        <IconButton
          ariaLabel="Notifications"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
          onClick={() => {}}
        />
        <div className="user-chip" role="group" aria-label="User">
          <div className="user-avatar" aria-hidden="true">
            {driverName?.slice(0, 1)?.toUpperCase() || 'D'}
          </div>
          <div className="user-chip-meta">
            <div className="user-chip-name">{driverName}</div>
            <div className="user-chip-sub">{t('operations')}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
