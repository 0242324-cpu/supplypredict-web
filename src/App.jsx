import { useState } from 'react'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import ProductDetail from './pages/ProductDetail'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [selected, setSelected] = useState(null)

  const goDetail = (id) => { setSelected(id); setPage('detail') }
  const goHome   = ()    => setPage('dashboard')

  return (
    <div className="min-h-screen">
      {/* Background grid */}
      <div className="fixed inset-0 bg-slate-950" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(239,68,68,0.04) 0%, transparent 50%)'
      }} />
      <div className="relative z-10">
        <Header onHome={goHome} alertCount={495} />
        {page === 'dashboard'
          ? <Dashboard onSelect={goDetail} />
          : <ProductDetail productId={selected} onBack={goHome} />
        }
      </div>
    </div>
  )
}
