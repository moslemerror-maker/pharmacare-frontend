import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Printer } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'
import PrintModal from '../../components/shared/PrintModal'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function SalesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [printUrlFn, setPrintUrlFn] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['sales', dateFrom, dateTo, search],
    queryFn: () => api.get('/sales', { params: { date_from: dateFrom, date_to: dateTo, bill_number: search || undefined, limit: 100 } }).then(r => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const openPDF = (id, e) => {
    e.stopPropagation()
    const token = localStorage.getItem('pc_token')
    setPrintUrlFn(() => (size) => `${API_BASE}/api/sales/${id}/pdf?size=${size}&token=${token}`)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PrintModal urlFn={printUrlFn} onClose={() => setPrintUrlFn(null)} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales / Billing</h1>
          <p className="text-xs text-gray-400">
            {data?.total || 0} bills · Total collected: {fmt.currency(data?.totalAmount)}
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/sales/new')}>
          <Plus size={15} />New Sale
        </button>
      </div>

      <div className="card mb-4">
        <div className="p-3 border-b border-gray-100 flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search size={14} className="text-gray-400" />
            <input
              className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
              placeholder="Search bill number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <input type="date" className="input py-1.5 text-xs w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" className="input py-1.5 text-xs w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Bill No.</th>
                <th className="th">Date & Time</th>
                <th className="th">Patient</th>
                <th className="th">Payment</th>
                <th className="th text-right">Subtotal</th>
                <th className="th text-right">GST</th>
                <th className="th text-right">Total</th>
                <th className="th">Status</th>
                <th className="th w-10" />
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map(s => (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/sales/${s.id}`)}
                >
                  <td className="td font-mono text-xs text-primary font-semibold">{s.bill_number}</td>
                  <td className="td text-xs">{fmt.dateTime(s.bill_date)}</td>
                  <td className="td">{s.patient_name || <span className="text-gray-400">Walk-in</span>}</td>
                  <td className="td">
                    <span className="badge badge-gray">{s.payment_mode}</span>
                  </td>
                  <td className="td text-xs text-right">{fmt.currency(s.subtotal)}</td>
                  <td className="td text-xs text-right">
                    {fmt.currency(parseFloat(s.cgst_amount) + parseFloat(s.sgst_amount))}
                  </td>
                  <td className="td font-bold text-primary text-right">{fmt.currency(s.total_amount)}</td>
                  <td className="td">
                    <span className={`badge ${s.payment_status === 'Paid' ? 'badge-green' : 'badge-red'}`}>
                      {s.payment_status}
                    </span>
                  </td>
                  <td className="td">
                    <button
                      onClick={e => openPDF(s.id, e)}
                      className="btn-ghost btn-sm p-1"
                      title="Print Invoice"
                    >
                      <Printer size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400 text-sm">
                    No sales found for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
