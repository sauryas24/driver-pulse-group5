'use client'

// Dashboard page refactor:
// Uses reusable UI components (Card/CardGrid/Badge/ProgressBar) and applies the
// velocity suppression rule (3 trips OR 60 minutes) via mock data from lib/driverData.

import { useState, useEffect } from 'react'
import AlertBanner from '../components/AlertBanner'
import { getDashboardData } from '../lib/driverData'
import Card from '../components/Card'
import CardGrid from '../components/CardGrid'
import Badge from '../components/Badge'
import ProgressBar from '../components/ProgressBar'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [tripA, setTripA] = useState('')
  const [tripB, setTripB] = useState('')
  const [goals, setGoals] = useState({ targetTrips: null, targetEarnings: null })

  useEffect(() => {
    setData(getDashboardData())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('driver_pulse_goals')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setGoals({
          targetTrips: Number(parsed?.targetTrips) || null,
          targetEarnings: Number(parsed?.targetEarnings) || null,
        })
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (data?.tripsForComparison?.length) {
      setTripA(data.tripsForComparison[0]?.id ?? '')
      setTripB(data.tripsForComparison[1]?.id ?? '')
    }
  }, [data])

  if (!data) return null

  const {
    driverName,
    pulseScore,
    forecastStatus,
    tripsCompleted,
    totalEarnings,
    safetyScore,
    currentVelocity,
    dailyProgress,
    targetTrips,
    hoursElapsed,
    liveTrip,
    safetyTrend,
    goalProgressTimeline,
    alerts
  } = data

  const resolvedTargetTrips = goals.targetTrips || targetTrips
  const elapsedMinutes = Math.round((hoursElapsed || 0) * 60)
  const showVelocity = tripsCompleted >= 3 || elapsedMinutes >= 60

  const forecastTone =
    forecastStatus?.status === 'ahead'
      ? 'success'
      : forecastStatus?.status === 'at_risk'
        ? 'danger'
        : 'warning'

  return (
    <div className="page-section">
      <div className="content-area">
        <div className="row between wrap gap-3">
          <div className="col">
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Welcome back, {driverName}
            </div>
            <div className="muted">Your performance at a glance</div>
          </div>
          <div className="row gap-2">
            <Badge tone={forecastTone}>{forecastStatus?.label}</Badge>
          </div>
        </div>

        <div className="mt-4">
          <AlertBanner alerts={alerts} />
        </div>

        <div className="mt-4">
          <CardGrid cols={3}>
            <Card
              title="Driver Pulse Score"
              subtitle="Composite score (0–100)"
              variant="elevated"
              ariaLabel="Driver Pulse Score"
              className="kpi-hero"
            >
              <div className="row between">
                <div className="col" aria-live="polite">
                  <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: '-0.03em' }}>
                    {pulseScore}
                  </div>
                  <div className="muted">Forecast: {forecastStatus?.label}</div>
                </div>
                <div className="col" style={{ alignItems: 'flex-end' }}>
                  <Badge tone={forecastTone}>
                    {forecastStatus?.status === 'ahead' ? 'Ahead' : forecastStatus?.status === 'at_risk' ? 'At Risk' : 'On Track'}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 muted" style={{ fontSize: 13 }}>
                Base 100 − motion penalties − audio penalties ± forecast = final score
              </div>
            </Card>

            <Card title="Earnings Velocity" subtitle="$/hr (suppressed early shift)" ariaLabel="Earnings Velocity">
              {showVelocity ? (
                <div className="col gap-2">
                  <div style={{ fontSize: 28, fontWeight: 900 }}>
                    ${currentVelocity.toFixed(2)} <span className="muted" style={{ fontSize: 14, fontWeight: 700 }}>/ hr</span>
                  </div>
                  <ProgressBar value={Math.min(100, Math.round((currentVelocity / (data.targetVelocity || 1)) * 100))} label="Velocity vs target" />
                </div>
              ) : (
                <div className="col gap-2">
                  <div style={{ fontSize: 18, fontWeight: 800 }}>Collecting data…</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    Velocity shown after 3 trips or 1 hour to avoid early-shift inflation.
                  </div>
                </div>
              )}
            </Card>

            <Card title="Daily Progress" subtitle={`Trips completed: ${tripsCompleted} / ${resolvedTargetTrips}`} ariaLabel="Daily Progress">
              <ProgressBar value={Math.min(100, Math.round((tripsCompleted / (resolvedTargetTrips || 1)) * 100))} label="Shift progress" />
              <div className="mt-3 row between">
                <div className="muted">Trips</div>
                <div style={{ fontWeight: 800 }}>{tripsCompleted} / {resolvedTargetTrips}</div>
              </div>
              <div className="mt-2 row between">
                <div className="muted">Earnings</div>
                <div style={{ fontWeight: 800 }}>${totalEarnings.toFixed(2)}</div>
              </div>
            </Card>
          </CardGrid>
        </div>

        <div className="mt-4">
          <CardGrid cols={2}>
            <Card title="Safety Trend" subtitle="Last 7 checkpoints" ariaLabel="Safety trend chart">
              <svg width="100%" height="120" viewBox="0 0 600 120" role="img" aria-label="Safety trend line chart">
                <polyline
                  fill="none"
                  stroke="rgba(14,165,164,0.95)"
                  strokeWidth="4"
                  points={(safetyTrend || []).map((p, i) => `${i * 90},${110 - p.safetyScore}`).join(' ')}
                />
              </svg>
              <div className="muted" style={{ fontSize: 13 }}>Current safety score: <b>{safetyScore}</b></div>
            </Card>

            <Card title="Earnings Trend" subtitle="Progress to goal" ariaLabel="Earnings trend chart">
              <svg width="100%" height="120" viewBox="0 0 600 120" role="img" aria-label="Earnings trend line chart">
                <polyline
                  fill="none"
                  stroke="rgba(16,185,129,0.95)"
                  strokeWidth="4"
                  points={(goalProgressTimeline || []).map((p, i) => `${i * 90},${110 - Math.round((p.percentOfGoal || 0))}`).join(' ')}
                />
              </svg>
              <div className="muted" style={{ fontSize: 13 }}>
                Daily progress: <b>{dailyProgress}%</b>
              </div>
            </Card>
          </CardGrid>
        </div>

        <div className="mt-4">
          <CardGrid cols={2}>
            <Card title="Live Trip" subtitle="Current ride snapshot" ariaLabel="Live trip">
              <div className="row between">
                <div className="row gap-2">
                  <span aria-hidden="true">🚗</span>
                  <div className="col">
                    <div style={{ fontWeight: 900 }}>{liveTrip?.rideType || 'UberX'}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{elapsedMinutes} min online</div>
                  </div>
                </div>
                <Badge tone="neutral">${(liveTrip?.fare || 0).toFixed(2)}</Badge>
              </div>
              <div className="mt-3">
                <div className="muted" style={{ fontSize: 12 }}>Pickup</div>
                <div style={{ fontWeight: 800 }}>{liveTrip?.pickup}</div>
              </div>
              <div className="mt-3">
                <div className="muted" style={{ fontSize: 12 }}>Dropoff</div>
                <div style={{ fontWeight: 800 }}>{liveTrip?.dropoff}</div>
              </div>
              <div className="mt-4">
                <ProgressBar value={liveTrip?.progress || 0} label="Trip progress" />
              </div>
            </Card>

            <Card title="Insights" subtitle="Quick signals to act on" ariaLabel="Insights">
              <div className="col gap-3">
                <div className="row between">
                  <div className="muted">Safety Score</div>
                  <div style={{ fontWeight: 900 }}>{safetyScore}</div>
                </div>
                <div className="row between">
                  <div className="muted">Current Velocity</div>
                  <div style={{ fontWeight: 900 }}>${currentVelocity.toFixed(2)}/hr</div>
                </div>
                <div className="row between">
                  <div className="muted">Trips Completed</div>
                  <div style={{ fontWeight: 900 }}>{tripsCompleted}</div>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  Tip: smoother braking and lower cabin noise improve score stability.
                </div>
              </div>
            </Card>
          </CardGrid>
        </div>
      </div>
    </div>
  )
}