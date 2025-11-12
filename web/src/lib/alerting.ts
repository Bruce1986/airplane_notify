import type { PassEvent } from './types'

export type AlertStage = 'idle' | 'monitor' | 'warning' | 'critical' | 'active'

export interface AlertThresholds {
  warning: number
  critical: number
}

export interface AlertStatus {
  stage: AlertStage
  title: string
  message: string
  event: PassEvent | null
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  warning: 30,
  critical: 10
}

export function evaluateAlertStatus(
  event: PassEvent | null,
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): AlertStatus {
  const normalized = normalizeThresholds(thresholds)
  const stage = determineStage(event, normalized)
  const { title, message } = describeStage(stage, event)
  return {
    stage,
    title,
    message,
    event
  }
}

function normalizeThresholds(thresholds: AlertThresholds): AlertThresholds {
  const warning = Math.max(0, thresholds.warning)
  const critical = Math.max(0, thresholds.critical)
  if (warning < critical) {
    return { warning: critical, critical }
  }
  return { warning, critical }
}

function determineStage(
  event: PassEvent | null,
  thresholds: AlertThresholds
): AlertStage {
  if (!event) return 'idle'
  if (event.eta <= 0) return 'active'
  if (event.eta <= thresholds.critical) return 'critical'
  if (event.eta <= thresholds.warning) return 'warning'
  return 'monitor'
}

function describeStage(stage: AlertStage, event: PassEvent | null) {
  if (!event) {
    return {
      title: '目前沒有預警中的航機',
      message: '等待 OpenSky 更新。'
    }
  }

  const planeName = event.plane.callsign ?? event.plane.id
  const etaText = formatSeconds(event.eta)
  const durationText = formatSeconds(event.duration)
  const levelText = event.level ?? '預估中'

  if (stage === 'active') {
    return {
      title: '注意：飛機正在通過！',
      message: `${planeName} 剩餘約 ${durationText} 離開半徑，噪音等級：${levelText}。`
    }
  }

  if (stage === 'critical') {
    return {
      title: '演出模式：T-10 秒內提醒',
      message: `${planeName} 將在 ${etaText} 內進入半徑，預估停留 ${durationText}，噪音等級：${levelText}。`
    }
  }

  if (stage === 'warning') {
    return {
      title: '提醒：T-30 秒內有航機靠近',
      message: `${planeName} 約 ${etaText} 後接近，預估通過 ${durationText}，噪音等級：${levelText}。`
    }
  }

  return {
    title: '預警：航機即將進入觀測半徑',
    message: `${planeName} 約 ${etaText} 後進入，預估通過 ${durationText}。`
  }
}

function formatSeconds(value: number): string {
  const rounded = Math.round(Math.max(0, value))
  return `${rounded} 秒`
}

export const __testables = {
  determineStage,
  normalizeThresholds,
  formatSeconds
}
