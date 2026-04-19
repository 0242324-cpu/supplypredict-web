import { useState } from 'react'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import ProductDetail from './pages/ProductDetail'
import Metrics from './pages/Metrics'

export default function App() {
  const [page, setPage]         = useState('dashboard')
  const [selected, setSelected] = useState(null)
  const [alertCount, setAlertCount] = useState(0)

  const goDetail  = (id) => { setSelected(id); setPage('detail') }
  const goHome    = ()    => setPage('dashboard')
  const goMetrics = ()    => setPage('metrics')

  return (
    <div style={{ minHeight:'100vh' }}>
      <Header
        onHome={goHome}
        onMetrics={goMetrics}
        page={page === 'detail' ? 'dashboard' : page}
        alertCount={alertCount}
      />
      {page === 'dashboard' && <Dashboard onSelect={goDetail} />}
      {page === 'detail'    && <ProductDetail productId={selected} onBack={goHome} />}
      {page === 'metrics'   && <Metrics />}
    </div>
  )
}
