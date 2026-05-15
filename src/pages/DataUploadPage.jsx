import { useState, useCallback, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://supplypredict-api.onrender.com'

export default function DataUploadPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  // ── Nuevos estados para reentrenamiento ──
  const [retrainEnabled, setRetrainEnabled] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState(null) // null | {status, message, result, ...}
  const pollingRef = useRef(null)

  // ── Polling de /training-status ──
  useEffect(() => {
    if (!trainingStatus || !['queued', 'running'].includes(trainingStatus.status)) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/training-status`)
        if (res.ok) {
          const data = await res.json()
          setTrainingStatus(data)

          if (data.status === 'completed' || data.status === 'error') {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }
      } catch {
        // silently retry
      }
    }, 10000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [trainingStatus?.status])

  const parseCSV = useCallback((text) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].replace(/\r/g, '').split(',').map(h => h.replace(/["\uFEFF]/g, '').trim())
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const values = []
      let current = ''
      let inQuotes = false
      const line = lines[i].replace(/\r/g, '')
      for (let c = 0; c < line.length; c++) {
        if (line[c] === '"') { inQuotes = !inQuotes }
        else if (line[c] === ',' && !inQuotes) { values.push(current.trim()); current = '' }
        else { current += line[c] }
      }
      values.push(current.trim())
      if (values.length >= headers.length) {
        const row = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })
        rows.push(row)
      }
    }
    return { headers, rows }
  }, [])

  const handleFile = useCallback((f) => {
    if (!f || !f.name.endsWith('.csv')) {
      setError('Solo se aceptan archivos .csv')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
    setTrainingStatus(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const { headers, rows } = parseCSV(e.target.result)
        const requiredCols = ['CODIGO_PRODUCTO', 'DESCRIPCION_PRODUCTO', 'CANTIDAD TOTAL']
        const missing = requiredCols.filter(c => !headers.includes(c))

        if (missing.length > 0) {
          setError(`Columnas faltantes: ${missing.join(', ')}. Se requieren: ${requiredCols.join(', ')}`)
          setPreview(null)
          return
        }

        setPreview({
          fileName: f.name,
          fileSize: (f.size / 1024).toFixed(1),
          headers,
          totalRows: rows.length,
          sampleRows: rows.slice(0, 8),
          rawText: e.target.result
        })
      } catch (err) {
        setError(`Error leyendo CSV: ${err.message}`)
      }
    }
    reader.readAsText(f, 'utf-8')
  }, [parseCSV])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }, [handleFile])

  const handleUpload = async () => {
    if (!file || !preview) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const url = `${API_URL}/upload-sales${retrainEnabled ? '?retrain=true' : ''}`
      const res = await fetch(url, { method: 'POST', body: formData })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Error ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      setResult(data)
      setPreview(null)
      setFile(null)

      // Si se inició el reentrenamiento, empezar polling
      if (data.retrain_started) {
        setTrainingStatus({ status: 'queued', message: 'Entrenamiento en cola...' })
      }
    } catch (err) {
      setError(`Error subiendo datos: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  // ── Helper: calcular tiempo transcurrido ──
  const getElapsed = () => {
    if (!trainingStatus?.started_at) return ''
    const start = new Date(trainingStatus.started_at)
    const now = new Date()
    const secs = Math.floor((now - start) / 1000)
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 className="mono" style={{
          fontSize: 20, fontWeight: 700, color: '#E2E8F0', letterSpacing: '-0.02em', marginBottom: 8
        }}>
          Carga de datos de ventas
        </h2>
        <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
          Sube un CSV con ventas globales para actualizar pronósticos y descripciones de productos.
          El archivo debe incluir columnas: <span className="mono" style={{ color: '#CBD5E1' }}>CODIGO_PRODUCTO</span>,{' '}
          <span className="mono" style={{ color: '#CBD5E1' }}>DESCRIPCION_PRODUCTO</span>,{' '}
          <span className="mono" style={{ color: '#CBD5E1' }}>CANTIDAD TOTAL</span>
        </p>
      </div>

      {/* Drop Zone */}
      {!preview && !result && !trainingStatus && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('csv-input').click()}
          style={{
            border: `2px dashed ${dragOver ? '#3B82F6' : '#334155'}`,
            borderRadius: 8,
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(59,130,246,0.06)' : 'rgba(15,23,42,0.4)',
            transition: 'all 0.2s ease',
            marginBottom: 24,
          }}
        >
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <p style={{ fontSize: 15, color: '#CBD5E1', fontWeight: 500, marginBottom: 8 }}>
            {dragOver ? 'Suelta el archivo aquí' : 'Arrastra un CSV o haz clic para seleccionar'}
          </p>
          <p className="mono" style={{ fontSize: 11, color: '#64748B' }}>
            Formato: VENTAS_GLOBALES_*.csv
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <span style={{ color: '#EF4444', fontSize: 16 }}>⚠</span>
          <p style={{ fontSize: 13, color: '#FCA5A5', lineHeight: 1.5, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid #1E293B',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          {/* Preview header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #1E293B',
            background: 'rgba(30,41,59,0.4)',
          }}>
            <div>
              <span className="mono" style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>
                {preview.fileName}
              </span>
              <span className="mono" style={{ fontSize: 11, color: '#64748B', marginLeft: 12 }}>
                {preview.fileSize} KB · {preview.totalRows} productos
              </span>
            </div>
            <button
              onClick={() => { setPreview(null); setFile(null) }}
              style={{
                background: 'none', border: 'none', color: '#64748B',
                cursor: 'pointer', fontSize: 18, padding: '2px 6px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Columns detected */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #1E293B' }}>
            <p style={{ fontSize: 11, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Columnas detectadas
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {preview.headers.map((h) => (
                <span key={h} className="mono" style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 4,
                  background: ['CODIGO_PRODUCTO', 'DESCRIPCION_PRODUCTO', 'CANTIDAD TOTAL'].includes(h)
                    ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.2)',
                  color: ['CODIGO_PRODUCTO', 'DESCRIPCION_PRODUCTO', 'CANTIDAD TOTAL'].includes(h)
                    ? '#4ADE80' : '#94A3B8',
                  border: `1px solid ${['CODIGO_PRODUCTO', 'DESCRIPCION_PRODUCTO', 'CANTIDAD TOTAL'].includes(h) ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.2)'}`,
                }}>
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Sample data table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['CODIGO_PRODUCTO', 'DESCRIPCION_PRODUCTO', 'CANTIDAD TOTAL'].map((h) => (
                    <th key={h} className="mono" style={{
                      padding: '10px 16px', fontSize: 11, color: '#64748B',
                      textAlign: 'left', borderBottom: '1px solid #1E293B',
                      textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(30,41,59,0.5)' }}>
                    <td className="mono" style={{ padding: '8px 16px', fontSize: 12, color: '#93C5FD' }}>
                      {row['CODIGO_PRODUCTO']}
                    </td>
                    <td style={{ padding: '8px 16px', fontSize: 12, color: '#CBD5E1' }}>
                      {row['DESCRIPCION_PRODUCTO']}
                    </td>
                    <td className="mono" style={{ padding: '8px 16px', fontSize: 12, color: '#E2E8F0', textAlign: 'right' }}>
                      {row['CANTIDAD TOTAL']}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.totalRows > 8 && (
              <p className="mono" style={{ padding: '8px 16px', fontSize: 11, color: '#475569' }}>
                ... y {preview.totalRows - 8} productos más
              </p>
            )}
          </div>

          {/* ── NUEVO: Toggle de reentrenamiento ── */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: retrainEnabled ? 'rgba(59,130,246,0.06)' : 'transparent',
          }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', userSelect: 'none', flex: 1,
            }}>
              <div
                onClick={() => setRetrainEnabled(!retrainEnabled)}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: retrainEnabled ? '#3B82F6' : '#334155',
                  position: 'relative', transition: 'background 0.2s',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff', position: 'absolute', top: 3,
                  left: retrainEnabled ? 21 : 3, transition: 'left 0.2s',
                }} />
              </div>
              <div>
                <p style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500, margin: 0 }}>
                  Reentrenar modelo con estos datos
                </p>
                <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
                  {retrainEnabled
                    ? 'El modelo se reentrenará automáticamente (~2.5 min). El dashboard se actualizará con nuevas métricas.'
                    : 'Solo se actualizarán los nombres de productos (rápido, sin entrenamiento).'}
                </p>
              </div>
            </label>
          </div>

          {/* Upload button */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>
              {retrainEnabled
                ? '⚡ Se actualizarán nombres + se reentrenará el modelo LightGBM'
                : 'Se actualizarán nombres de productos en el dashboard.'}
            </p>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                background: uploading ? '#1E293B' : retrainEnabled ? '#7C3AED' : '#2563EB',
                color: '#fff', border: 'none',
                padding: '10px 24px', borderRadius: 6,
                fontSize: 13, fontWeight: 600,
                cursor: uploading ? 'wait' : 'pointer',
                opacity: uploading ? 0.6 : 1,
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {uploading
                ? '⏳ Procesando...'
                : retrainEnabled
                  ? '🧠 Subir y reentrenar'
                  : '▲ Subir y actualizar'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* NUEVO: Panel de entrenamiento en curso                        */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {trainingStatus && ['queued', 'running'].includes(trainingStatus.status) && (
        <div style={{
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          <div style={{
            padding: '24px 20px',
            textAlign: 'center',
          }}>
            {/* Animated spinner */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, margin: '0 auto',
                border: '3px solid #1E293B',
                borderTop: '3px solid #3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>

            <h3 style={{ fontSize: 16, color: '#E2E8F0', fontWeight: 600, marginBottom: 8 }}>
              🧠 Reentrenando modelo...
            </h3>
            <p className="mono" style={{ fontSize: 13, color: '#93C5FD', marginBottom: 4 }}>
              {trainingStatus.message || 'Procesando...'}
            </p>
            <p className="mono" style={{ fontSize: 12, color: '#64748B' }}>
              Tiempo: {getElapsed()} — estimado ~2:30 min
            </p>

            {/* Progress bar animation */}
            <div style={{
              width: '100%', height: 4, background: '#1E293B',
              borderRadius: 2, marginTop: 16, overflow: 'hidden',
            }}>
              <div style={{
                width: '30%', height: '100%', background: '#3B82F6',
                borderRadius: 2,
                animation: 'progress 2.5s ease-in-out infinite',
              }} />
              <style>{`@keyframes progress { 0% { width: 5%; } 50% { width: 70%; } 100% { width: 95%; } }`}</style>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* NUEVO: Resultado del entrenamiento completado                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {trainingStatus?.status === 'completed' && trainingStatus.result && (
        <div style={{
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid rgba(34,197,94,0.15)',
            background: 'rgba(34,197,94,0.06)',
          }}>
            <h3 style={{ fontSize: 15, color: '#4ADE80', fontWeight: 600, marginBottom: 4 }}>
              ✓ Modelo reentrenado exitosamente
            </h3>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>
              Las predicciones y métricas del dashboard se actualizaron con los nuevos datos.
            </p>
          </div>

          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'MAPE Mediana', value: `${trainingStatus.result.mape_median || '—'}%`, color: '#4ADE80' },
              { label: 'Productos', value: trainingStatus.result.products_trained || 0, color: '#E2E8F0' },
              { label: 'Grado A', value: trainingStatus.result.grades?.A || 0, color: '#4ADE80' },
              { label: 'Grado B', value: trainingStatus.result.grades?.B || 0, color: '#93C5FD' },
              { label: 'Grado C', value: trainingStatus.result.grades?.C || 0, color: '#F59E0B' },
              { label: 'Grado D', value: trainingStatus.result.grades?.D || 0, color: '#EF4444' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'rgba(30,41,59,0.4)',
                padding: '12px 14px',
                borderRadius: 6,
                border: '1px solid #1E293B',
              }}>
                <p className="mono" style={{ fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </p>
                <p className="mono" style={{ fontSize: 20, color: stat.color, fontWeight: 700 }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #1E293B', display: 'flex', gap: 10 }}>
            <button
              onClick={() => { window.location.href = '/'; }}
              style={{
                background: '#2563EB', color: '#fff', border: 'none',
                padding: '8px 16px', borderRadius: 6, fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Ver Dashboard
            </button>
            <button
              onClick={() => { setResult(null); setTrainingStatus(null); setError(null) }}
              style={{
                background: 'rgba(100,116,139,0.15)', color: '#CBD5E1',
                border: '1px solid #334155', padding: '8px 16px',
                borderRadius: 6, fontSize: 12, cursor: 'pointer',
              }}
            >
              Subir otro archivo
            </button>
          </div>
        </div>
      )}

      {/* ── Error del entrenamiento ── */}
      {trainingStatus?.status === 'error' && (
        <div style={{
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 15, color: '#EF4444', fontWeight: 600, marginBottom: 8 }}>
            ✗ Error en el reentrenamiento
          </h3>
          <p className="mono" style={{ fontSize: 12, color: '#FCA5A5', lineHeight: 1.5 }}>
            {trainingStatus.message || 'Error desconocido'}
          </p>
          <button
            onClick={() => { setTrainingStatus(null); setError(null) }}
            style={{
              background: 'rgba(100,116,139,0.15)', color: '#CBD5E1',
              border: '1px solid #334155', padding: '8px 16px',
              borderRadius: 6, fontSize: 12, cursor: 'pointer', marginTop: 12,
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Success result (solo upload, sin retrain) */}
      {result && !trainingStatus && (
        <div style={{
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid rgba(34,197,94,0.15)',
            background: 'rgba(34,197,94,0.06)',
          }}>
            <h3 style={{ fontSize: 15, color: '#4ADE80', fontWeight: 600, marginBottom: 4 }}>
              ✓ Datos procesados correctamente
            </h3>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>
              Los nombres de productos han sido actualizados.
            </p>
          </div>

          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { label: 'Productos procesados', value: result.products_processed || 0, color: '#E2E8F0' },
              { label: 'Nombres actualizados', value: result.names_updated || 0, color: '#4ADE80' },
              { label: 'Con match en modelo', value: result.matched || 0, color: '#93C5FD' },
              { label: 'Nuevos (sin modelo)', value: result.unmatched || 0, color: '#F59E0B' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'rgba(30,41,59,0.4)',
                padding: '14px 16px',
                borderRadius: 6,
                border: '1px solid #1E293B',
              }}>
                <p className="mono" style={{ fontSize: 11, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </p>
                <p className="mono" style={{ fontSize: 22, color: stat.color, fontWeight: 700 }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #1E293B' }}>
            <button
              onClick={() => { setResult(null); setError(null) }}
              style={{
                background: 'rgba(100,116,139,0.15)', color: '#CBD5E1',
                border: '1px solid #334155', padding: '8px 16px',
                borderRadius: 6, fontSize: 12, cursor: 'pointer',
              }}
            >
              Subir otro archivo
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: 'rgba(15,23,42,0.3)',
        border: '1px solid #1E293B',
        borderRadius: 8,
        padding: 20,
      }}>
        <h3 className="mono" style={{ fontSize: 13, color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Formato esperado del CSV
        </h3>
        <div className="mono" style={{
          background: 'rgba(0,0,0,0.3)',
          padding: 14, borderRadius: 6,
          fontSize: 12, color: '#94A3B8', lineHeight: 1.6, overflow: 'auto',
        }}>
          CODIGO_PRODUCTO,DESCRIPCION_PRODUCTO,CANTIDAD TOTAL<br/>
          CO-CAR200-12622,SUKIYA YAKITORI 180 G,617<br/>
          CO-CAR201-6301,SUKIYA GYUSARA 145 G,"1,539"<br/>
          SE-ARR101-1786,SUNWEST ARROZ U.S. # 1 22.6 KG,845
        </div>
        <p style={{ fontSize: 12, color: '#64748B', marginTop: 12, lineHeight: 1.5 }}>
          • El CSV actualiza la tabla de nombres de productos en el sistema.<br/>
          • Los productos con match en el modelo existente actualizan sus pronósticos.<br/>
          • Los productos nuevos (sin historial) se registran para futuro modelado.<br/>
          • <strong style={{ color: '#93C5FD' }}>Con "Reentrenar" activo:</strong> el modelo LightGBM se re-ejecuta con los datos actuales (~2.5 min).
        </p>
      </div>
    </div>
  )
}
