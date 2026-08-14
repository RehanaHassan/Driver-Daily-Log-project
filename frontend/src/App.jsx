import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import LogSheet from './LogSheet'
import 'leaflet/dist/leaflet.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const BG_IMAGES = ['/images/bg1.jpg', '/images/bg2.jpg', '/images/bg3.jpg', '/images/bg4.jpg']

export default function App() {
  const [form, setForm] = useState({ current: '', pickup: '', dropoff: '', cycle_used: '' })
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BG_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch(`${API}/api/plan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setData(json)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="app">
      {/* ── Full Width Hero Section with 5s Background Slideshow ── */}
      <section className="hero-section">
        {/* Background Slideshow Layers */}
        <div className="hero-slideshow">
          {BG_IMAGES.map((img, i) => (
            <div
              key={img}
              className={`slideshow-slide ${i === bgIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          {/* Header */}
          <header className="header">
            <h1>🚚 Trip Planner & ELD Logs</h1>
            <p className="subtitle">FMCSA-compliant route planning with automated daily log sheets</p>
          </header>

          {/* Form Card */}
          <div className="glass form-card">
            <span className="form-label">📍 Trip Details</span>
            <form onSubmit={submit} className="form-grid">
              <div className="input-group">
                <span className="icon">📌</span>
                <input
                  id="input-current"
                  placeholder="Current Location"
                  required
                  value={form.current}
                  onChange={update('current')}
                />
              </div>
              <div className="input-group">
                <span className="icon">📦</span>
                <input
                  id="input-pickup"
                  placeholder="Pickup Location"
                  required
                  value={form.pickup}
                  onChange={update('pickup')}
                />
              </div>
              <div className="input-group">
                <span className="icon">🏁</span>
                <input
                  id="input-dropoff"
                  placeholder="Dropoff Location"
                  required
                  value={form.dropoff}
                  onChange={update('dropoff')}
                />
              </div>
              <div className="input-group">
                <span className="icon">⏱️</span>
                <input
                  id="input-cycle"
                  type="number"
                  min="0"
                  max="70"
                  placeholder="Cycle Used (Hrs)"
                  value={form.cycle_used}
                  onChange={update('cycle_used')}
                />
              </div>
              <button id="btn-plan" className="submit-btn" disabled={loading}>
                {loading ? <><span className="spinner" />Calculating…</> : 'Plan Trip →'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Error ── */}
      {error && <div className="error-banner" id="error-msg">⚠️ {error}</div>}

      {/* ── Results ── */}
      {data && (
        <>
          {/* Stats */}
          <div className="stats-bar">
            <div className="glass stat-card">
              <div className="stat-value">{data.distance_miles}</div>
              <div className="stat-label">Miles</div>
            </div>
            <div className="glass stat-card">
              <div className="stat-value">{data.total_hours}</div>
              <div className="stat-label">Total Hours</div>
            </div>
            <div className="glass stat-card">
              <div className="stat-value">{data.logs.length}</div>
              <div className="stat-label">{data.logs.length === 1 ? 'Day' : 'Days'} Needed</div>
            </div>
          </div>

          {/* Map */}
          <div className="glass map-wrapper">
            <div className="map-header">
              <span className="map-icon">🗺️</span> Route Overview
            </div>
            <MapContainer
              center={data.markers.current}
              zoom={5}
              style={{ height: 440, borderRadius: 12 }}
              id="route-map"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Polyline
                positions={data.route.map(([lon, lat]) => [lat, lon])}
                pathOptions={{ color: '#96C0B7', weight: 3, opacity: 0.85 }}
              />
              {Object.entries(data.markers).map(([label, pos]) => (
                <Marker key={label} position={pos}>
                  <Popup>{label}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Logs */}
          <div className="section-header">
            <h2>📋 Daily Log Sheets</h2>
            <span className="line" />
          </div>
          {data.logs.map((segments, i) => (
            <LogSheet
              key={i}
              day={i + 1}
              totalDays={data.logs.length}
              segments={segments}
              tripDetails={form}
              totalDistance={data.distance_miles}
            />
          ))}
        </>
      )}

      {/* Footer */}
      <footer className="footer">
        ELD Trip Planner — FMCSA Hours of Service Compliant
      </footer>
    </div>
  )
}
