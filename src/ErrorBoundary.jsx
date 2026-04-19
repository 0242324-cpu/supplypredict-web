import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  componentDidCatch(error, info) {
    this.setState({ error, info })
    console.error('SupplyPredict crash:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#080C14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', padding: '2rem'
        }}>
          <div style={{
            border: '1px solid rgba(244,63,94,0.4)',
            borderRadius: '8px', padding: '2rem', maxWidth: '640px',
            background: 'rgba(244,63,94,0.05)'
          }}>
            <p style={{ color: '#F43F5E', fontSize: '11px', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              RUNTIME ERROR — SUPPLYPREDICT
            </p>
            <pre style={{ color: '#94A3B8', fontSize: '12px', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
              {this.state.error?.toString()}
            </pre>
            <pre style={{ color: '#475569', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
              {this.state.info?.componentStack}
            </pre>
            <button onClick={() => window.location.reload()}
              style={{ marginTop: '1.5rem', padding: '8px 16px', background: '#1D4ED8',
                border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer',
                fontSize: '12px', fontFamily: 'monospace' }}>
              Recargar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
