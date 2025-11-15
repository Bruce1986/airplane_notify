import './App.css'
import { evaluateAlertStatus } from './lib/alerting'
import type { AlertThresholds } from './lib/alerting'
import { formatSeconds } from './lib/formatters'
import type { PassEvent } from './lib/types'
import { useOpenSkyPolling } from './hooks/useOpenSkyPolling'
import { observationSite, POLL_INTERVAL_MS, ALERT_THRESHOLDS } from './site-config'

function formatDistance(value: number): string {
  return `${value.toFixed(0)} m`
}

function formatLevel(level: string | null): string {
  return level ?? '預估中'
}

export interface PassItemProps {
  event: PassEvent
  isPrimary: boolean
}

export function PassItem({ event, isPrimary }: PassItemProps) {
  const isActive = event.eta <= 0
  const etaLabel = isActive ? '通過中' : `倒數：${formatSeconds(event.eta)}`
  const durationLabel = isActive
    ? `剩餘：${formatSeconds(event.duration + event.eta)}`
    : `預估通過：${formatSeconds(event.duration)}`

  const classNames = ['pass-item']
  if (isPrimary) classNames.push('pass-item--primary')
  if (isActive) classNames.push('pass-item--active')

  return (
    <li className={classNames.join(' ')}>
      <strong>{event.plane.callsign ?? event.plane.id}</strong>
      <div className="pass-meta">
        <span>{etaLabel}</span>
        <span>{durationLabel}</span>
        <span>最近距離：{formatDistance(event.dmin)}</span>
        <span>噪音等級：{formatLevel(event.level)}</span>
      </div>
    </li>
  )
}

export default function App() {
  const { passEvents: livePassEvents, error: liveError } = useOpenSkyPolling({
    site: observationSite,
    intervalMs: POLL_INTERVAL_MS
  })

  return (
    <div className="app">
      <header>
        <p className="pill">MVP Sprint · W1 Prototype</p>
        <h1>飛機頭頂預警 — 即時預報面板</h1>
        <p>
          位置：{observationSite.name}（半徑 {observationSite.radius} m / 限制高度 {observationSite.maxAltitude} m）
        </p>
      </header>

      <AlertBanner primaryPass={livePassEvents[0] ?? null} thresholds={ALERT_THRESHOLDS} />

      <div className="dashboard-grid">
        <section className="card">
          <h2>即將進入半徑的航機</h2>
          <ul className="pass-list">
            {liveError && <li>資料載入失敗：{liveError.message}</li>}
            {!liveError && livePassEvents.length === 0 && <li>目前沒有預警中的航機。</li>}
            {livePassEvents.map((event, index) => (
              <PassItem key={event.plane.id} event={event} isPrimary={index === 0} />
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>開發進度里程碑</h2>
          <ol>
            <li>
              <strong>W1 · 架構與幾何核心</strong>
              <p>建立 OpenSky 正規化流程、CPA 計算函式與 Demo 面板。</p>
            </li>
            <li>
              <strong>W2 · 告警體驗</strong>
              <p>串接即時輪詢、演出模式提醒，以及錯誤回饋機制。</p>
            </li>
            <li>
              <strong>W3 · 實地驗證</strong>
              <p>蒐集實測數據並產出命中率 / 誤報率分析報告。</p>
            </li>
          </ol>
        </section>
      </div>
    </div>
  )
}

interface AlertBannerProps {
  primaryPass: PassEvent | null
  thresholds?: AlertThresholds
}

function AlertBanner({ primaryPass, thresholds }: AlertBannerProps) {
  const status = evaluateAlertStatus(primaryPass, thresholds)

  return (
    <section className={`alert-banner alert-stage-${status.stage}`}>
      <h2>{status.title}</h2>
      <p>{status.message}</p>
    </section>
  )
}
