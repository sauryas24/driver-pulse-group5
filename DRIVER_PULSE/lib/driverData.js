/**
 * Driver Pulse - Frontend Data Layer
 * Core logic mirroring the sensor fusion pipeline:
 * Motion + Audio events → Safety score → Earnings velocity → Forecast status
 */

// --- Constants (thresholds from pipeline logic) ---
const HARSH_BRAKING_ALERT_THRESHOLD = 5
const AUDIO_SPIKE_ALERT_THRESHOLD = 3

// --- Mock Data (simulates outputs from motion_flags, audio_flags, trip_summaries) ---
export const motionFlags = [
  { trip_id: 'trip_001', timestamp: '10:05', event_type: 'hard_brake', severity: 'medium' },
  { trip_id: 'trip_001', timestamp: '10:18', event_type: 'sharp_turn', severity: 'medium' },
  { trip_id: 'trip_002', timestamp: '11:02', event_type: 'hard_brake', severity: 'high' },
  { trip_id: 'trip_002', timestamp: '11:15', event_type: 'sudden_maneuver', severity: 'medium' },
  { trip_id: 'trip_003', timestamp: '12:05', event_type: 'hard_brake', severity: 'medium' },
  { trip_id: 'trip_003', timestamp: '12:10', event_type: 'sharp_turn', severity: 'low' },
  { trip_id: 'trip_004', timestamp: '13:20', event_type: 'hard_brake', severity: 'high' },
]

export const audioFlags = [
  { trip_id: 'trip_001', timestamp: '10:06', event_type: 'audio_spike', severity: 'medium' },
  { trip_id: 'trip_002', timestamp: '11:03', event_type: 'audio_spike', severity: 'high' },
  { trip_id: 'trip_003', timestamp: '12:11', event_type: 'audio_spike', severity: 'low' },
]

export const tripSummaries = [
  { trip_id: 'trip_001', harsh_brakes: 2, sudden_maneuvers: 1, audio_spikes: 1, combined_events: 1, safety_score: 82, earnings: 24.50 },
  { trip_id: 'trip_002', harsh_brakes: 1, sudden_maneuvers: 1, audio_spikes: 1, combined_events: 1, safety_score: 75, earnings: 32.00 },
  { trip_id: 'trip_003', harsh_brakes: 1, sudden_maneuvers: 1, audio_spikes: 1, combined_events: 0, safety_score: 88, earnings: 18.75 },
  { trip_id: 'trip_004', harsh_brakes: 1, sudden_maneuvers: 0, audio_spikes: 1, combined_events: 1, safety_score: 70, earnings: 28.00 },
  { trip_id: 'trip_005', harsh_brakes: 0, sudden_maneuvers: 1, audio_spikes: 0, combined_events: 0, safety_score: 95, earnings: 21.00 },
]

export const trips = [
  { id: 'trip_001', from: 'Downtown Station', to: 'Airport Terminal 1', time: '10:45 AM', duration: '25 min', rating: 5, fare: 24.50, harsh_brakes: 2, safety_score: 82 },
  { id: 'trip_002', from: 'Central Mall', to: 'University Campus', time: '9:30 AM', duration: '18 min', rating: 5, fare: 32.00, harsh_brakes: 1, safety_score: 75 },
  { id: 'trip_003', from: 'Riverside Hotel', to: 'Business District', time: '8:15 AM', duration: '22 min', rating: 4, fare: 18.75, harsh_brakes: 1, safety_score: 88 },
  { id: 'trip_004', from: 'Residential Area', to: 'City Hospital', time: '7:00 AM', duration: '15 min', rating: 5, fare: 28.00, harsh_brakes: 1, safety_score: 70 },
  { id: 'trip_005', from: 'Train Station', to: 'Tech Park', time: '6:30 AM', duration: '20 min', rating: 5, fare: 21.00, harsh_brakes: 0, safety_score: 95 },
]

// --- Core Logic Functions ---

/**
 * Compute forecast status from earnings velocity formula:
 * Ahead: vel_delta > 0 && hours_elapsed >= target_hours
 * On Track: vel_delta >= 0 && hours_elapsed < target_hours
 * At Risk: vel_delta < 0
 */
export function getForecastStatus(currentVelocity, targetVelocity, hoursElapsed, targetHours) {
  const velDelta = currentVelocity - targetVelocity

  if (velDelta > 0 && hoursElapsed >= targetHours) {
    return { status: 'ahead', label: 'Ahead' }
  }
  if (velDelta >= 0 && hoursElapsed < targetHours) {
    return { status: 'on_track', label: 'On Track' }
  }
  return { status: 'at_risk', label: 'At Risk' }
}

/**
 * Driver Pulse Score = 0.5 * Safety + 0.3 * Driving Consistency + 0.2 * Earnings Performance
 * Safety: from trip summaries (0-100)
 * Consistency: inverse of event variability (simplified as avg safety)
 * Earnings: progress toward target (0-100)
 */
export function computeDriverPulseScore(safetyScore, earningsProgress, consistencyScore = null) {
  const safety = Math.min(100, Math.max(0, safetyScore))
  const consistency = consistencyScore !== null ? consistencyScore : safety * 0.95
  const earnings = Math.min(100, Math.max(0, earningsProgress))
  return Math.round(0.5 * safety + 0.3 * consistency + 0.2 * earnings)
}

/**
 * Safety score from event counts (100 - penalties)
 * More bad events = lower score
 */
export function computeSafetyScore(harshBrakes, suddenManeuvers, audioSpikes, combinedEvents) {
  const penalty = harshBrakes * 5 + suddenManeuvers * 3 + audioSpikes * 2 + combinedEvents * 8
  return Math.max(0, Math.min(100, 100 - penalty))
}

/**
 * Generate alerts based on pipeline thresholds
 */
export function getAlerts(tripSummaries, motionFlags, audioFlags, forecastStatus) {
  const alerts = []

  const totalHarshBrakes = motionFlags.filter((m) => m.event_type === 'hard_brake').length
  if (totalHarshBrakes >= HARSH_BRAKING_ALERT_THRESHOLD) {
    alerts.push({
      id: 'harsh_braking',
      message: 'Frequent harsh braking detected',
      severity: 'warning',
    })
  }

  const totalAudioSpikes = audioFlags.length
  if (totalAudioSpikes >= AUDIO_SPIKE_ALERT_THRESHOLD) {
    alerts.push({
      id: 'audio_spikes',
      message: 'High cabin audio levels detected',
      severity: 'warning',
    })
  }

  if (forecastStatus === 'at_risk') {
    alerts.push({
      id: 'earnings_risk',
      message: "You are at risk of missing today's earnings target",
      severity: 'risk',
    })
  }

  return alerts
}

// --- Aggregated Dashboard Data ---

export function getDashboardData(driverId = null, tripId = null) {
  const totalEarnings = tripSummaries.reduce((sum, t) => sum + t.earnings, 0)
  const tripsCompleted = tripSummaries.length
  const hoursElapsed = 6.0
  const targetHours = 8
  const targetEarnings = 400
  const targetTrips = 18

  const currentVelocity = totalEarnings / hoursElapsed
  const targetVelocity = targetEarnings / targetHours
  const velocityDelta = currentVelocity - targetVelocity
  const forecast = getForecastStatus(currentVelocity, targetVelocity, hoursElapsed, targetHours)

  const avgSafety = tripSummaries.length
    ? tripSummaries.reduce((s, t) => s + t.safety_score, 0) / tripSummaries.length
    : 85
  const earningsProgress = (totalEarnings / targetEarnings) * 100
  const pulseScore = computeDriverPulseScore(avgSafety, earningsProgress)

  const totalHarshBrakes = motionFlags.filter((m) => m.event_type === 'hard_brake').length
  const totalSuddenManeuvers = motionFlags.filter((m) =>
    ['sudden_maneuver', 'sharp_turn', 'sudden_acceleration'].includes(m.event_type)
  ).length
  const totalAudioSpikes = audioFlags.length

  const alerts = getAlerts(tripSummaries, motionFlags, audioFlags, forecast.status)
  const stressfulMoments = getStressfulMoments()
  const actionPoints = getActionPoints(forecast.status, stressfulMoments)

  return {
    driverName: 'Alex',
    pulseScore,
    forecastStatus: forecast,
    tripsCompleted,
    totalEarnings,
    safetyScore: Math.round(avgSafety),
    currentVelocity,
    targetVelocity,
    velocityDelta,
    hoursElapsed,
    targetHours,
    targetEarnings,
    targetTrips,
    dailyProgress: Math.round((tripsCompleted / targetTrips) * 100),
    earningsProgress: Math.min(100, Math.round(earningsProgress)),
    totalHarshBrakes,
    totalSuddenManeuvers,
    totalAudioSpikes,
    alerts,
    liveTrip: {
      duration: 8,
      pickup: '123 Market Street',
      dropoff: '456 Mission Bay',
      distance: 4.2,
      fare: 18.5,
      rideType: 'UberX',
      progress: 60,
    },
    goalProgressTimeline: getGoalProgressTimeline(),
    stressfulMoments,
    actionPoints,
    drivingSmoothness: getDrivingSmoothness(),
    tripsForComparison: getTripsForComparison(),
    earningsEfficiency: getEarningsEfficiency(),
    eventDensity: getEventDensityByTime(),
    safetyTrend: getSafetyScoreTrend(),
    dailySummary: getDailySummary(),
  }
}

export function getSafetyData() {
  const totalHarshBrakes = motionFlags.filter((m) => m.event_type === 'hard_brake').length
  const totalSuddenManeuvers = motionFlags.filter((m) =>
    ['sudden_maneuver', 'sharp_turn', 'sudden_acceleration'].includes(m.event_type)
  ).length
  const totalAudioSpikes = audioFlags.length

  const avgSafety =
    tripSummaries.length > 0
      ? tripSummaries.reduce((s, t) => s + t.safety_score, 0) / tripSummaries.length
      : 85

  // Timeline: merge motion + audio by time
  const allEvents = [
    ...motionFlags.map((m) => ({ ...m, source: 'motion', type: m.event_type })),
    ...audioFlags.map((a) => ({ ...a, source: 'audio', type: 'audio_spike' })),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  const weeklyEvents = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
    day,
    date: i + 2,
    good: Math.max(0, 4 - i),
    warning: i % 3 === 0 ? 1 : 0,
  }))

  return {
    safetyScore: Math.round(avgSafety),
    totalHarshBrakes,
    totalSuddenManeuvers,
    totalAudioSpikes,
    eventsTimeline: allEvents,
    weeklyEvents,
    tips: [
      'Maintain safe following distance',
      'Avoid sudden braking',
      'Keep cabin noise levels low',
    ],
  }
}

export function getEarningsData() {
  const totalEarnings = tripSummaries.reduce((sum, t) => sum + t.earnings, 0)
  const hoursElapsed = 6.0
  const targetHours = 8
  const targetEarnings = 400

  const currentVelocity = totalEarnings / hoursElapsed
  const targetVelocity = targetEarnings / targetHours
  const velocityDelta = currentVelocity - targetVelocity
  const forecast = getForecastStatus(currentVelocity, targetVelocity, hoursElapsed, targetHours)
  const projectedEarnings = currentVelocity * targetHours
  const progressPercent = Math.min((totalEarnings / targetEarnings) * 100, 100)

  return {
    currentEarnings: totalEarnings,
    targetEarnings,
    projectedEarnings: Math.round(projectedEarnings * 100) / 100,
    currentVelocity,
    targetVelocity,
    velocityDelta,
    hoursElapsed,
    targetHours,
    forecast,
    progressPercent,
    breakdown: [
      { label: 'Trip Fares', amount: totalEarnings * 0.87, color: 'green' },
      { label: 'Tips', amount: totalEarnings * 0.1, color: 'blue' },
      { label: 'Bonuses', amount: totalEarnings * 0.03, color: 'yellow' },
    ],
  }
}

export function getTripsData() {
  const totalDistance = trips.reduce((sum, t, i) => sum + (25 + i * 8), 0)

  return {
    tripsCompleted: trips.length,
    drivingHours: '6h',
    totalDistance: `${totalDistance} mi`,
    trips,
  }
}

// --- Goal Progress Timeline (earnings vs target at different times of day) ---
export function getGoalProgressTimeline() {
  const targetEarnings = 400
  const targetHours = 8
  return [
    { time: '6:00 AM', earnings: 0, targetAtTime: 0, percentOfGoal: 0 },
    { time: '8:00 AM', earnings: 45, targetAtTime: 100, percentOfGoal: 45 },
    { time: '10:00 AM', earnings: 120, targetAtTime: 200, percentOfGoal: 60 },
    { time: '12:00 PM', earnings: 195, targetAtTime: 300, percentOfGoal: 65 },
    { time: '2:00 PM', earnings: 245, targetAtTime: 350, percentOfGoal: 70 },
    { time: '4:00 PM', earnings: 295, targetAtTime: 375, percentOfGoal: 79 },
    { time: 'Now', earnings: 325, targetAtTime: 400, percentOfGoal: 81 },
  ]
}

// --- Stressful / Risky Moments (from motion + audio flags) ---
export function getStressfulMoments() {
  const moments = []
  const highSeverityMotion = motionFlags.filter((m) => m.severity === 'high')
  const highSeverityAudio = audioFlags.filter((a) => a.severity === 'high')
  const lowSafetyTrips = tripSummaries.filter((t) => t.safety_score < 80)

  highSeverityMotion.forEach((m) => {
    const trip = trips.find((t) => t.id === m.trip_id)
    moments.push({
      id: `motion_${m.trip_id}_${m.timestamp}`,
      time: m.timestamp,
      type: 'safety',
      severity: 'high',
      title: 'Harsh braking / sudden maneuver',
      description: trip ? `${trip.from} → ${trip.to}` : 'Trip in progress',
      icon: 'brake',
    })
  })

  highSeverityAudio.forEach((a) => {
    moments.push({
      id: `audio_${a.trip_id}_${a.timestamp}`,
      time: a.timestamp,
      type: 'audio',
      severity: 'high',
      title: 'High cabin noise detected',
      description: 'Consider reducing volume or closing windows',
      icon: 'audio',
    })
  })

  lowSafetyTrips.forEach((t) => {
    if (!moments.some((m) => m.id?.includes(t.trip_id))) {
      const trip = trips.find((tr) => tr.id === t.trip_id)
      moments.push({
        id: `trip_${t.trip_id}`,
        time: trip?.time?.split(' ')[0] || '—',
        type: 'trip',
        severity: 'medium',
        title: `Low safety score (${t.safety_score})`,
        description: trip ? `${trip.from} → ${trip.to}` : 'Trip summary',
        icon: 'shield',
      })
    }
  })

  return moments.sort((a, b) => a.time.localeCompare(b.time))
}

// --- Action Points & Things to Remember for Next Shift ---
export function getActionPoints(forecastStatus, stressfulMoments) {
  const actions = []

  if (forecastStatus === 'at_risk') {
    actions.push({
      id: 'earnings',
      type: 'adjust',
      title: 'Extend your shift',
      detail: "You're behind target. Consider driving 1–2 extra hours or focusing on surge zones.",
      priority: 'high',
    })
  }

  if (stressfulMoments.some((m) => m.severity === 'high')) {
    actions.push({
      id: 'safety',
      type: 'reflect',
      title: 'Smoother braking in rush hour',
      detail: 'A few harsh brakes today. Leave more following distance in busy areas.',
      priority: 'medium',
    })
  }

  actions.push({
    id: 'peak',
    type: 'plan',
    title: 'Peak hours tomorrow',
    detail: '8–10 AM and 5–7 PM typically have the best fares. Plan to be online then.',
    priority: 'low',
  })

  actions.push({
    id: 'rest',
    type: 'remember',
    title: 'Take breaks',
    detail: 'Stretch every 2 hours. Fatigue affects safety and ratings.',
    priority: 'medium',
  })

  return actions
}

// --- Driving Smoothness Meter ---
export function getDrivingSmoothness() {
  const totalEvents = motionFlags.length + audioFlags.length
  const harshEvents = motionFlags.filter((m) => m.event_type === 'hard_brake').length +
    motionFlags.filter((m) => ['sudden_maneuver', 'sharp_turn'].includes(m.event_type)).length +
    audioFlags.filter((a) => a.severity === 'high').length
  const smoothEvents = Math.max(0, totalEvents - harshEvents)
  const smoothnessPercent = totalEvents > 0 ? Math.round((smoothEvents / totalEvents) * 100) : 100
  return { smoothnessPercent, totalEvents, harshEvents }
}

// --- Trip Comparison (trips with full details) ---
export function getTripsForComparison() {
  return trips.map((t) => {
    const summary = tripSummaries.find((s) => s.trip_id === t.id)
    const tripEvents = motionFlags.filter((m) => m.trip_id === t.id).concat(
      audioFlags.filter((a) => a.trip_id === t.id)
    )
    return {
      ...t,
      harsh_brakes: summary?.harsh_brakes ?? t.harsh_brakes ?? 0,
      sudden_maneuvers: summary?.sudden_maneuvers ?? 0,
      audio_spikes: summary?.audio_spikes ?? 0,
      eventCount: tripEvents.length,
      durationMins: parseInt(t.duration) || 20,
    }
  })
}

// --- Earnings Efficiency (safe vs risky trips) ---
const SAFE_TRIP_THRESHOLD = 85
export function getEarningsEfficiency() {
  const safeTrips = tripSummaries.filter((t) => t.safety_score >= SAFE_TRIP_THRESHOLD)
  const riskyTrips = tripSummaries.filter((t) => t.safety_score < SAFE_TRIP_THRESHOLD)
  const safeEarnings = safeTrips.reduce((s, t) => s + t.earnings, 0)
  const riskyEarnings = riskyTrips.reduce((s, t) => s + t.earnings, 0)
  return {
    earningsPerSafeTrip: safeTrips.length > 0 ? (safeEarnings / safeTrips.length).toFixed(2) : '0',
    earningsPerRiskyTrip: riskyTrips.length > 0 ? (riskyEarnings / riskyTrips.length).toFixed(2) : '—',
    safeTripCount: safeTrips.length,
    riskyTripCount: riskyTrips.length,
  }
}

// --- Event Density by Time (when incidents occur during trips) ---
export function getEventDensityByTime() {
  const slots = [
    { label: '6–8', min: 6, max: 8 },
    { label: '8–10', min: 8, max: 10 },
    { label: '10–12', min: 10, max: 12 },
    { label: '12–14', min: 12, max: 14 },
    { label: '14+', min: 14, max: 24 },
  ]
  const events = [...motionFlags, ...audioFlags]
  const density = slots.map(({ label, min, max }) => {
    const count = events.filter((e) => {
      const h = parseInt(e.timestamp.split(':')[0], 10)
      return h >= min && h < max
    }).length
    return { slot: label, count }
  })
  const max = Math.max(...density.map((d) => d.count), 1)
  return density.map((d) => ({ ...d, height: (d.count / max) * 100 }))
}

// --- Safety Score Trend (over time) ---
export function getSafetyScoreTrend() {
  return trips.map((t) => ({
    label: t.time?.split(' ')[0] || t.id,
    score: t.safety_score,
  })).reverse()
}

// --- Daily Driver Summary ---
export function getDailySummary() {
  const totalEarnings = tripSummaries.reduce((sum, t) => sum + t.earnings, 0)
  const avgSafety = tripSummaries.length > 0
    ? tripSummaries.reduce((s, t) => s + t.safety_score, 0) / tripSummaries.length
    : 0
  const { smoothnessPercent } = getDrivingSmoothness()
  let behaviorGrade = 'A'
  if (avgSafety < 70 || smoothnessPercent < 60) behaviorGrade = 'C'
  else if (avgSafety < 80 || smoothnessPercent < 75) behaviorGrade = 'B'

  return {
    tripsCompleted: tripSummaries.length,
    totalEarnings,
    safetyScore: Math.round(avgSafety),
    behaviorGrade,
    behaviorNote: behaviorGrade === 'A' ? 'Excellent driving today' : behaviorGrade === 'B' ? 'Good — minor improvements possible' : 'Focus on smoother braking',
  }
}
