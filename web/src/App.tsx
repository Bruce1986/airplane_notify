import { startTransition, useEffect, useState } from 'react'
import './App.css'
import { processPassEvents } from './lib/pass-processing'
import { demoSite, sampleStateVectors } from './sample-data'
import type { PassEvent } from './lib/types'

function formatSeconds(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${Math.round(value)}s`
}

function formatDistance(value: number): string {
  return `${value.toFixed(0)} m`
}

function formatLevel(level: string | null): string {
  return level ?? '預估中'
}

export default function App() {
  const [demoPasses, setDemoPasses] = useState<PassEvent[]>([])

  useEffect(() => {
    const passes = processPassEvents(demoSite, sampleStateVectors)
    startTransition(() => {
      setDemoPasses(passes)
    })
  }, [])

  return (
    <div className="app">
      <header>
        <p className="pill">MVP Sprint · W1 Prototype</p>
        <h1>飛機頭頂預警 — 即時預報面板</h1>
        <p>
          位置：{demoSite.name}（半徑 {demoSite.radius} m / 限制高度 {demoSite.maxAltitude} m）
        </p>
      </header>

      <div className="dashboard-grid">
        <section className="card">
          <h2>即將進入半徑的航機</h2>
          <ul className="pass-list">
            {demoPasses.length === 0 && <li>目前沒有預警中的航機。</li>}
            {demoPasses.map((event) => (
              <li key={event.plane.id} className="pass-item">
                <strong>{event.plane.callsign ?? event.plane.id}</strong>
                <div className="pass-meta">
                  <span>倒數：{formatSeconds(event.eta)}</span>
                  <span>停留：{formatSeconds(event.duration)}</span>
                  <span>最近距離：{formatDistance(event.dmin)}</span>
                  <span>噪音等級：{formatLevel(event.level)}</span>
                </div>
              </li>
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
