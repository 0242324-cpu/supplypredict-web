export default function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div style={{ width:'20px', height:'20px',
        border:'2px solid rgba(255,255,255,0.08)',
        borderTop:'2px solid #3B82F6',
        borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
