import { playClick } from '../sound'

export default function CartDrawer({ isOpen, onClose, items, onRemove }) {
  if (!isOpen) return null
  const total = items.reduce((s, i) => s + i.price, 0)

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease]" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-brand-dark border-l border-white/10 flex flex-col animate-[slideIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
        {/* header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/10">
          <h2 className="text-white font-display text-xl tracking-wide">YOUR CART ({items.length})</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors interactive" aria-label="Close cart">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8">
            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center text-white/40">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-10 h-10">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 0 20" opacity="0.4" />
                <path d="M2 12h20" opacity="0.4" />
              </svg>
            </div>
            <p className="text-white/70 text-sm tracking-widest uppercase">YOUR CART IS EMPTY</p>
            <p className="text-gray-500 text-xs">Add a classic 32-panel match ball to start your collection.</p>
            <button
              onClick={() => {
                onClose()
                playClick()
              }}
              className="mt-2 text-xs uppercase tracking-widest text-brand-accent hover:text-white transition-colors interactive flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Shop
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center gap-4 border border-white/10 rounded-lg p-4">
                <div
                  className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: item.accentColor }}
                >
                  {item.model.slice(0, 4)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-display tracking-wide text-sm">{item.model}</p>
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest truncate">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm" style={{ color: item.accentColor }}>
                    ${item.price.toFixed(2)}
                  </p>
                  <button
                    onClick={() => onRemove(idx)}
                    className="text-[10px] text-gray-500 hover:text-red-400 uppercase tracking-widest mt-1 interactive"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* footer */}
        {items.length > 0 && (
          <div className="p-6 md:p-8 border-t border-white/10 bg-[#0a0a0a]">
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-400 text-xs uppercase tracking-widest">Total</span>
              <span className="text-white font-bold text-2xl">${total.toFixed(2)}</span>
            </div>
            <button className="w-full py-4 font-bold uppercase tracking-widest text-black interactive transition-all duration-300 hover:brightness-110" style={{ backgroundColor: '#FFC300' }}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
