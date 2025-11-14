import { render, screen } from '@testing-library/react'
import { PassItem } from './App'
import type { PassEvent } from './lib/types'

const baseEvent: PassEvent = {
  plane: {
    id: 'abc123',
    callsign: 'ABC123',
    x: 0,
    y: 0,
    v: 220,
    trackRad: 0,
    h: 1000
  },
  eta: 42,
  duration: 75,
  dmin: 120,
  level: '高',
  ok: true,
  entersAt: 0,
  exitsAt: 60
}

describe('PassItem', () => {
  it('renders upcoming pass details', () => {
    render(
      <ul>
        <PassItem event={baseEvent} isPrimary />
      </ul>
    )

    const item = screen.getByRole('listitem')
    expect(item).toHaveClass('pass-item', 'pass-item--primary')
    expect(screen.getByText('倒數：42 秒')).toBeInTheDocument()
    expect(screen.getByText('預估通過：75 秒')).toBeInTheDocument()
    expect(screen.getByText('最近距離：120 m')).toBeInTheDocument()
    expect(screen.getByText('噪音等級：高')).toBeInTheDocument()
  })

  it('labels active passes and applies active styling', () => {
    render(
      <ul>
        <PassItem event={{ ...baseEvent, eta: -3 }} isPrimary={false} />
      </ul>
    )

    const item = screen.getByRole('listitem')
    expect(item).toHaveClass('pass-item', 'pass-item--active')
    expect(item).not.toHaveClass('pass-item--primary')
    expect(screen.getByText('通過中')).toBeInTheDocument()
    expect(screen.getByText('剩餘：75 秒')).toBeInTheDocument()
  })
})
