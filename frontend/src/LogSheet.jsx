import { useState } from 'react'

const ROW = { offduty: 0, sleeper: 1, driving: 2, onduty: 3 }
const LABELS = [
  '1. Off Duty',
  '2. Sleeper Berth',
  '3. Driving',
  '4. On Duty (Not Driving)'
]
const W = 760, H = 180, ROW_H = H / 4, GRID_X = 140

export default function LogSheet({ day, totalDays, segments, tripDetails = {}, totalDistance = 0 }) {
  const x = (h) => GRID_X + (h / 24) * (W - GRID_X)

  // Calculate day totals
  const totals = { offduty: 0, sleeper: 0, driving: 0, onduty: 0 }
  segments.forEach((s) => {
    const key = s.status === 'sleeper' ? 'sleeper' : s.status
    if (totals[key] !== undefined) {
      totals[key] += s.end - s.start
    }
  })
  const totalDayHours = totals.offduty + totals.sleeper + totals.driving + totals.onduty

  // Calculate formatted date for Day N
  const today = new Date()
  const logDate = new Date(today)
  logDate.setDate(today.getDate() + (day - 1))
  const monthStr = String(logDate.getMonth() + 1).padStart(2, '0')
  const dateStr = String(logDate.getDate()).padStart(2, '0')
  const yearStr = logDate.getFullYear()

  // Estimated driving miles for Day N
  const estimatedMiles = totalDays > 0 ? Math.round((totalDistance / totalDays)) : 0

  // Editable holder fields state
  const [fields, setFields] = useState({
    carrier: 'Interstate Freight Logistics Inc.',
    mainOffice: '100 Logistics Parkway, Suite 400, Chicago, IL',
    homeTerminal: 'Terminal 12 - 450 Transport Way, Chicago, IL',
    truckTrailer: 'Tractor #1042 / Trailer #TR-8820',
    shippingDocs: `BOL #${100000 + day * 3421} - Commercial Freight Cargo`,
  })

  const handleFieldChange = (key) => (e) => setFields({ ...fields, [key]: e.target.value })

  // Build automatic duty change remarks
  const remarks = segments.map((s) => {
    const formatTime = (h) => {
      const hrs = Math.floor(h)
      const mins = Math.round((h - hrs) * 60)
      const hStr = String(hrs % 12 === 0 ? 12 : hrs % 12).padStart(2, '0')
      const mStr = String(mins).padStart(2, '0')
      const ampm = hrs >= 12 && hrs < 24 ? 'PM' : 'AM'
      return `${hStr}:${mStr} ${ampm}`
    }
    const statusLabel =
      s.status === 'driving' ? 'Driving' : s.status === 'onduty' ? 'On Duty' : 'Off Duty'
    const location =
      s.start === 0 && day === 1
        ? tripDetails.current || 'Origin'
        : s.end >= 24 && day === totalDays
        ? tripDetails.dropoff || 'Destination'
        : tripDetails.pickup || 'En Route Location'

    return `${formatTime(s.start)} - ${statusLabel} (${(s.end - s.start).toFixed(1)}h) @ ${location}`
  })

  const cycleUsedNum = parseFloat(tripDetails.cycle_used || 0)
  const onDutyToday = totals.driving + totals.onduty
  const totalLast7 = Math.min(70, cycleUsedNum + (day * 8.5))
  const availableTomorrow = Math.max(0, 70 - totalLast7)

  return (
    <div className="glass logsheet-wrapper">
      {/* ── Top Header Holder Card ── */}
      <div className="logsheet-paper-header">
        <div className="paper-top-row">
          <div className="title-block">
            <h3>DRIVERS DAILY LOG</h3>
            <span className="sub-tag">(24 Hours)</span>
          </div>
          <div className="date-block">
            <div className="date-box">
              <span className="val">{monthStr}</span>
              <span className="lbl">Month</span>
            </div>
            <span className="slash">/</span>
            <div className="date-box">
              <span className="val">{dateStr}</span>
              <span className="lbl">Day</span>
            </div>
            <span className="slash">/</span>
            <div className="date-box">
              <span className="val">{yearStr}</span>
              <span className="lbl">Year</span>
            </div>
          </div>
          <div className="day-badge-pill">
            Day {day} of {totalDays}
          </div>
        </div>

        <div className="filing-note">
          Original - File at home terminal. Duplicate - Driver retains in his/her possession for 8 days.
        </div>

        {/* Route From / To Holder */}
        <div className="route-holder-grid">
          <div className="holder-field">
            <span className="field-label">FROM:</span>
            <span className="field-value">{day === 1 ? (tripDetails.current || 'Current Location') : (tripDetails.pickup || 'Pickup Location')}</span>
          </div>
          <div className="holder-field">
            <span className="field-label">TO:</span>
            <span className="field-value">{day === totalDays ? (tripDetails.dropoff || 'Dropoff Location') : (tripDetails.pickup || 'En Route Location')}</span>
          </div>
        </div>

        {/* Carrier & Equipment Grid Holder */}
        <div className="carrier-holder-grid">
          <div className="holder-box">
            <span className="box-title">Total Driving Miles Today</span>
            <span className="box-value">{Math.round(totals.driving * 55)} mi</span>
          </div>
          <div className="holder-box">
            <span className="box-title">Total Mileage Today</span>
            <span className="box-value">{estimatedMiles} mi</span>
          </div>
          <div className="holder-box span-2">
            <span className="box-title">Truck/Tractor & Trailer Numbers</span>
            <input
              className="holder-input"
              value={fields.truckTrailer}
              onChange={handleFieldChange('truckTrailer')}
            />
          </div>
        </div>

        <div className="carrier-address-grid">
          <div className="address-row">
            <span className="addr-label">Name of Carrier:</span>
            <input
              className="holder-input flex-1"
              value={fields.carrier}
              onChange={handleFieldChange('carrier')}
            />
          </div>
          <div className="address-row">
            <span className="addr-label">Main Office Address:</span>
            <input
              className="holder-input flex-1"
              value={fields.mainOffice}
              onChange={handleFieldChange('mainOffice')}
            />
          </div>
          <div className="address-row">
            <span className="addr-label">Home Terminal Address:</span>
            <input
              className="holder-input flex-1"
              value={fields.homeTerminal}
              onChange={handleFieldChange('homeTerminal')}
            />
          </div>
        </div>
      </div>

      {/* ── 24-Hour Log Grid SVG ── */}
      <div className="logsheet-grid-container">
        <svg width={W + 70} height={H + 46} style={{ minWidth: W + 70 }}>
          {/* Top Hours Header Row Background */}
          <rect x={GRID_X} y={2} width={W - GRID_X} height={20} fill="rgba(255, 255, 255, 0.1)" rx="3" />
          <text x={W + 35} y={15} textAnchor="middle" className="hour-text bold" fill="#ffffff">
            Total Hours
          </text>

          {/* Row labels */}
          {LABELS.map((label, i) => (
            <text
              key={label}
              x="4"
              y={i * ROW_H + ROW_H / 2 + 30}
              className="label-text"
              fill="#ffffff"
            >
              {label}
            </text>
          ))}

          {/* Hour numbers 1-24 */}
          {[...Array(25)].map((_, h) => (
            <text
              key={'ht' + h}
              x={x(h)}
              y={16}
              textAnchor="middle"
              className="hour-text"
              fill="#ffffff"
            >
              {h === 0 ? 'M' : h === 12 ? 'N' : h === 24 ? 'M' : h < 12 ? h : h - 12}
            </text>
          ))}

          {/* Quarter hour tick marks & grid lines */}
          {[...Array(25)].map((_, h) => (
            <g key={h}>
              <line
                x1={x(h)}
                y1={24}
                x2={x(h)}
                y2={H + 24}
                className="grid-line"
              />
              {/* Quarter hour minor ticks */}
              {h < 24 && [0.25, 0.5, 0.75].map((q) => (
                <line
                  key={q}
                  x1={x(h + q)}
                  y1={24}
                  x2={x(h + q)}
                  y2={H + 24}
                  className="grid-line-minor"
                />
              ))}
            </g>
          ))}

          {/* Horizontal row borders */}
          {[0, 1, 2, 3, 4].map((r) => (
            <line
              key={r}
              x1={GRID_X}
              y1={r * ROW_H + 24}
              x2={W}
              y2={r * ROW_H + 24}
              className="grid-border"
            />
          ))}

          {/* Right column vertical border for Total Hours */}
          <line x1={W} y1={2} x2={W} y2={H + 24} className="grid-border" />
          <line x1={W + 65} y1={2} x2={W + 65} y2={H + 24} className="grid-border" />

          {/* Activity segments — horizontal lines + vertical connectors */}
          {segments.map((s, i) => {
            const rowIdx = s.status === 'sleeper' ? 1 : ROW[s.status] !== undefined ? ROW[s.status] : 0
            const y = rowIdx * ROW_H + ROW_H / 2 + 24
            const prevSeg = i > 0 ? segments[i - 1] : null
            const prevRowIdx = prevSeg ? (prevSeg.status === 'sleeper' ? 1 : ROW[prevSeg.status] || 0) : null
            const prevY = prevRowIdx !== null ? prevRowIdx * ROW_H + ROW_H / 2 + 24 : null

            return (
              <g key={i}>
                {prevY !== null && prevY !== y && (
                  <line
                    x1={x(s.start)}
                    y1={Math.min(prevY, y)}
                    x2={x(s.start)}
                    y2={Math.max(prevY, y)}
                    className="vert-seg"
                  />
                )}
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

          {/* Right column Total Hours per row */}
          <text x={W + 32} y={ROW_H * 0.5 + 28} textAnchor="middle" className="hour-total-val" fill="#ffffff">
            {totals.offduty.toFixed(1)}
          </text>
          <text x={W + 32} y={ROW_H * 1.5 + 28} textAnchor="middle" className="hour-total-val" fill="#ffffff">
            {totals.sleeper.toFixed(1)}
          </text>
          <text x={W + 32} y={ROW_H * 2.5 + 28} textAnchor="middle" className="hour-total-val" fill="#ffffff">
            {totals.driving.toFixed(1)}
          </text>
          <text x={W + 32} y={ROW_H * 3.5 + 28} textAnchor="middle" className="hour-total-val" fill="#ffffff">
            {totals.onduty.toFixed(1)}
          </text>
        </svg>
      </div>

      {/* ── Remarks & Shipping Documents Holder ── */}
      <div className="logsheet-remarks-holder">
        <div className="remarks-column">
          <span className="remarks-title">REMARKS / DUTY STATUS CHANGES:</span>
          <ul className="remarks-list">
            {remarks.map((r, idx) => (
              <li key={idx}>📌 {r}</li>
            ))}
          </ul>
        </div>

        <div className="shipping-column">
          <span className="remarks-title">SHIPPING DOCUMENTS:</span>
          <input
            className="holder-input full"
            value={fields.shippingDocs}
            onChange={handleFieldChange('shippingDocs')}
          />
        </div>
      </div>

      {/* ── Recap Table (70 Hr / 8 Day Rule) ── */}
      <div className="logsheet-recap-holder">
        <div className="recap-title">RECAP (70 Hour / 8 Day Drivers Rule):</div>
        <div className="recap-grid">
          <div className="recap-card">
            <span className="recap-num">{onDutyToday.toFixed(1)}h</span>
            <span className="recap-lbl">On Duty Today (Lines 3 & 4)</span>
          </div>
          <div className="recap-card">
            <span className="recap-num">{totalLast7.toFixed(1)}h</span>
            <span className="recap-lbl">A. Total Hours Last 7 Days</span>
          </div>
          <div className="recap-card">
            <span className="recap-num">{availableTomorrow.toFixed(1)}h</span>
            <span className="recap-lbl">B. Hours Available Tomorrow</span>
          </div>
          <div className="recap-card">
            <span className="recap-num">{totalDayHours.toFixed(1)}h</span>
            <span className="recap-lbl">Total 24-Hr Log Hours</span>
          </div>
        </div>
      </div>
    </div>
  )
}
