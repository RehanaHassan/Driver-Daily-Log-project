const ROW = { offduty: 0, driving: 2, onduty: 3 }
const LABELS = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty (Not Driving)']
const W = 740, H = 170, ROW_H = H / 4, GRID_X = 110

export default function LogSheet({ day, segments }) {
  const x = (h) => GRID_X + (h / 24) * (W - GRID_X)
  const totals = { offduty: 0, driving: 0, onduty: 0 }
  segments.forEach((s) => { totals[s.status] += s.end - s.start })

  return (
    <div className="glass logsheet">
      {/* Header */}
      <div className="logsheet-header">
        <span className="day-badge">
          <span className="badge-icon">📅</span>
          Day {day}
        </span>
      </div>

      {/* SVG Grid */}
      <svg width={W + 10} height={H + 42} style={{ minWidth: W + 10 }}>
        {/* Row labels */}
        {LABELS.map((label, i) => (
          <text
            key={label}
            x="4"
            y={i * ROW_H + ROW_H / 2 + 29}
            className="label-text"
            fill="#ffffff"
          >
            {label}
          </text>
        ))}

        {/* Hour labels along the top */}
        {[...Array(25)].map((_, h) => (
          <text
            key={'ht' + h}
            x={x(h)}
            y={14}
            textAnchor="middle"
            className="hour-text"
            fill="#ffffff"
          >
            {h === 0 ? 'M' : h === 12 ? 'N' : h === 24 ? 'M' : h < 12 ? h : h - 12}
          </text>
        ))}

        {/* Vertical grid lines */}
        {[...Array(25)].map((_, h) => (
          <line
            key={h}
            x1={x(h)}
            y1={22}
            x2={x(h)}
            y2={H + 22}
            className="grid-line"
          />
        ))}

        {/* Horizontal row borders */}
        {[0, 1, 2, 3, 4].map((r) => (
          <line
            key={r}
            x1={GRID_X}
            y1={r * ROW_H + 22}
            x2={W}
            y2={r * ROW_H + 22}
            className="grid-border"
          />
        ))}

        {/* Activity segments — horizontal lines + vertical connectors */}
        {segments.map((s, i) => {
          const y = ROW[s.status] * ROW_H + ROW_H / 2 + 22
          const prevSeg = i > 0 ? segments[i - 1] : null
          const prevY = prevSeg ? ROW[prevSeg.status] * ROW_H + ROW_H / 2 + 22 : null

          return (
            <g key={i}>
              {/* Vertical connector from previous segment */}
              {prevY !== null && prevY !== y && (
                <line
                  x1={x(s.start)}
                  y1={Math.min(prevY, y)}
                  x2={x(s.start)}
                  y2={Math.max(prevY, y)}
                  className="vert-seg"
                />
              )}
              {/* Horizontal activity line */}
              <line
                x1={x(s.start)}
                y1={y}
                x2={x(s.end)}
                y2={y}
                className="seg-line"
              />
            </g>
          )
        })}
      </svg>

      {/* Totals */}
      <div className="logsheet-totals">
        <div className="total-item">
          <span className="dot off" />
          Off Duty: <strong>{totals.offduty.toFixed(1)}h</strong>
        </div>
        <div className="total-item">
          <span className="dot drive" />
          Driving: <strong>{totals.driving.toFixed(1)}h</strong>
        </div>
        <div className="total-item">
          <span className="dot on" />
          On Duty: <strong>{totals.onduty.toFixed(1)}h</strong>
        </div>
      </div>
    </div>
  )
}
