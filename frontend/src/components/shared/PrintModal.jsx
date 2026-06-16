import { X, Printer } from 'lucide-react'

/**
 * PrintModal — lets the user choose A4 or A5 before opening a PDF.
 *
 * Usage:
 *   const [printUrl, setPrintUrl] = useState(null)
 *   <button onClick={() => setPrintUrl(id => `/api/prescriptions/${id}/pdf`)}>Print</button>
 *   <PrintModal urlFn={printUrl} onClose={() => setPrintUrl(null)} />
 *
 * urlFn: (size: 'A4'|'A5') => string  — builds the PDF URL for the chosen size
 */
export default function PrintModal({ urlFn, onClose }) {
  if (!urlFn) return null

  const handlePrint = (size) => {
    window.open(urlFn(size), '_blank')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-80 animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Printer size={15} className="text-primary" />
            </div>
            <h3 className="font-bold text-gray-900">Select Paper Size</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Size options */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => handlePrint('A4')}
            className="group flex flex-col items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="w-10 h-[56px] border-2 border-gray-300 group-hover:border-primary rounded bg-white shadow-sm transition-colors flex items-center justify-center">
              <span className="text-[8px] text-gray-300 group-hover:text-primary/50 font-mono">A4</span>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-sm">A4</p>
              <p className="text-[10px] text-gray-400">210 × 297 mm</p>
              <p className="text-[9px] text-gray-300 mt-0.5">Standard</p>
            </div>
          </button>

          <button
            onClick={() => handlePrint('A5')}
            className="group flex flex-col items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="w-8 h-[44px] border-2 border-gray-300 group-hover:border-primary rounded bg-white shadow-sm transition-colors flex items-center justify-center">
              <span className="text-[7px] text-gray-300 group-hover:text-primary/50 font-mono">A5</span>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-sm">A5</p>
              <p className="text-[10px] text-gray-400">148 × 210 mm</p>
              <p className="text-[9px] text-gray-300 mt-0.5">Half page</p>
            </div>
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-center">
          PDF will open in a new tab — use your browser&apos;s print dialog
        </p>
      </div>
    </div>
  )
}
