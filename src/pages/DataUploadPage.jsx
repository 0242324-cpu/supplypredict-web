import { useState, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://supplypredict-api.onrender.com'

export default function DataUploadPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

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

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const { headers, rows } = parseCSV(e.target.result)

        // Validate expected columns
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

      const res = await fetch(`${API_URL}/upload-sales`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Error ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      setResult(data)
      setPreview(null)
      setFile(null)
    } catch (err) {
      setError(`Error subiendo datos: ${err.message}`)
    } finally {
      setUploading(false)
    }
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
      {!preview && !result && (
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
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: 18,
                padding: '2px 6px',
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
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: ['CODIGO_PRODUCTO', 'DESCRIPCION_PRODUCTO', 'CANTIDAD TOTAL'].includes(h)
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(100,116,139,0.2)',
                  color: ['CODIGO_PRODUCTO', 'DESCRIPCION_PRODUCTO', 'CANTIDAD TOTAL'].includes(h)
                    ? '#4ADE80'
                    : '#94A3B8',
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
                      padding: '10px 16px',
                      fontSize: 11,
                      color: '#64748B',
                      textAlign: 'left',
                      borderBottom: '1px solid #1E293B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
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

          {/* Upload button */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>
              Se actualizarán nombres de productos y se agregarán datos de ventas al modelo.
            </p>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                background: uploading ? '#1E293B' : '#2563EB',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: uploading ? 'wait' : 'pointer',
                opacity: uploading ? 0.6 : 1,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {uploading ? '⏳ Procesando...' : '▲ Subir y actualizar'}
            </button>
          </div>
        </div>
      )}

      {/* Success result */}
      {result && (
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
              Los pronósticos y nombres de productos han sido actualizados.
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
                background: 'rgba(100,116,139,0.15)',
                color: '#CBD5E1',
                border: '1px solid #334155',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
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
          padding: 14,
          borderRadius: 6,
          fontSize: 12,
          color: '#94A3B8',
          lineHeight: 1.6,
          overflow: 'auto',
        }}>
          CODIGO_PRODUCTO,DESCRIPCION_PRODUCTO,CANTIDAD TOTAL<br/>
          CO-CAR200-12622,SUKIYA YAKITORI 180 G,617<br/>
          CO-CAR201-6301,SUKIYA GYUSARA 145 G,"1,539"<br/>
          SE-ARR101-1786,SUNWEST ARROZ U.S. # 1 22.6 KG,845
        </div>
        <p style={{ fontSize: 12, color: '#64748B', marginTop: 12, lineHeight: 1.5 }}>
          • El CSV actualiza la tabla de nombres de productos en el sistema.<br/>
          • Los productos con match en el modelo existente actualizan sus pronósticos.<br/>
          • Los productos nuevos (sin historial) se registran para futuro modelado.
        </p>
      </div>
    </div>
  )
}
