import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, TrendingUp, AlertTriangle, Calendar, BarChart2, FileSpreadsheet, IndianRupee } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'
import { format, subDays } from 'date-fns'

const API_URL = import.meta.env.VITE_API_URL || ''

const defaultFrom = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
const defaultTo   = format(new Date(), 'yyyy-MM-dd')

export default function ReportsPage() {
  const [tab, setTab] = useState('mis')
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo,   setDateTo]   = useState(defaultTo)
  const [misType,  setMisType]  = useState('all')
  const [downloading, setDownloading] = useState(false)

  const token = localStorage.getItem('pc_token')

  // Short stock
  const { data: shortStock=[] } = useQuery({
    queryKey: ['shortstock'],
    queryFn: () => api.get('/reports/shortstock').then(r=>r.data),
    enabled: tab==='shortstock',
    refetchInterval: 60000,
  })

  // Expiring
  const [expiryDays, setExpiryDays] = useState(90)
  const { data: expiring=[] } = useQuery({
    queryKey: ['expiring', expiryDays],
    queryFn: () => api.get('/reports/expiring', { params:{ days:expiryDays } }).then(r=>r.data),
    enabled: tab==='expiring',
  })

  // GST
  const { data: gstData } = useQuery({
    queryKey: ['gst-report', dateFrom, dateTo],
    queryFn: () => api.get('/reports/gst', { params:{ date_from:dateFrom, date_to:dateTo } }).then(r=>r.data),
    enabled: tab==='gst',
  })

  const downloadMIS = async () => {
    setDownloading(true)
    try {
      const res = await fetch(
        `${API_URL}/api/reports/mis?type=${misType}&date_from=${dateFrom}&date_to=${dateTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `MIS-${dateFrom}-${dateTo}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Download failed') }
    setDownloading(false)
  }

  const TABS = [
    { key:'mis',        label:'MIS / Excel',     icon:FileSpreadsheet },
    { key:'shortstock', label:'Short Stock',      icon:AlertTriangle },
    { key:'expiring',   label:'Expiring Batches', icon:Calendar },
    { key:'gst',        label:'GST Summary',      icon:IndianRupee },
  ]

  const totalGST = gstData?.data?.reduce((a,r)=>a+parseFloat(r.cgst||0)+parseFloat(r.sgst||0),0)||0
  const totalTaxable = gstData?.data?.reduce((a,r)=>a+parseFloat(r.taxable_value||0),0)||0

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Reports & MIS</h1>
        <p className="text-xs text-gray-400">Sales analytics, stock alerts, GST reports, Excel exports</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setTab(key)}
            className={`tab flex items-center gap-1.5 ${tab===key?'tab-active':'tab-idle'}`}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </div>

      {/* Date range (shared) */}
      {(tab==='mis'||tab==='gst') && (
        <div className="card-p mb-4 flex flex-wrap gap-4 items-end">
          <div><label className="label">From Date</label>
            <input className="input w-44" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></div>
          <div><label className="label">To Date</label>
            <input className="input w-44" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></div>
          {tab==='mis' && (
            <div>
              <label className="label">Report Type</label>
              <select className="select w-48" value={misType} onChange={e=>setMisType(e.target.value)}>
                <option value="all">All Sheets</option>
                <option value="sales">Sales Only</option>
                <option value="inventory">Stock Only</option>
                <option value="shortstock">Short Stock</option>
                <option value="gst">GST Only</option>
              </select>
            </div>
          )}
          {tab==='mis' && (
            <button className="btn-primary" onClick={downloadMIS} disabled={downloading}>
              <Download size={15}/>{downloading ? 'Generating...' : 'Download Excel'}
            </button>
          )}
        </div>
      )}

      {/* MIS Info */}
      {tab==='mis' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:'Sales Report',  type:'sales',      desc:'All bills, GST breakdown, payment modes', icon:'📊' },
            { label:'Stock Report',  type:'inventory',  desc:'All batches with expiry and valuation',   icon:'📦' },
            { label:'Short Stock',   type:'shortstock', desc:'Low, critical & out of stock items',       icon:'⚠️' },
            { label:'GST Summary',   type:'gst',        desc:'HSN-wise CGST/SGST for return filing',     icon:'🧾' },
          ].map(({label,type,desc,icon})=>(
            <button key={label} onClick={()=>{ setMisType(type); }}
              className={`card-p text-center hover:shadow-md transition-shadow w-full border-2 ${misType===type?'border-primary bg-primary/5':'border-transparent'}`}>
              <div className="text-3xl mb-2">{icon}</div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-1">{desc}</p>
            </button>
          ))}
          <div className="col-span-2 md:col-span-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            ✅ Excel will contain <strong>{misType==='all'?'4 sheets (Info, Sales, Stock, GST)':'1 sheet'}</strong> for the period <strong>{dateFrom}</strong> to <strong>{dateTo}</strong>. Frozen header rows, color-coded alerts for low/expiring stock included.
          </div>
        </div>
      )}

      {/* Short Stock */}
      {tab==='shortstock' && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500"/>Short & Negative Stock
            </h2>
            <span className="badge badge-red">{shortStock.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr>
                <th className="th">Medicine</th><th className="th">Category</th>
                <th className="th">Current Stock</th><th className="th">Reorder Level</th>
                <th className="th">Min Stock</th><th className="th">Nearest Expiry</th><th className="th">Alert</th>
              </tr></thead>
              <tbody>
                {shortStock.map(m=>(
                  <tr key={m.id} className={`border-b border-gray-100 ${parseInt(m.total_stock)<=0?'bg-red-50':parseInt(m.total_stock)<m.min_stock?'bg-orange-50':'bg-yellow-50'}`}>
                    <td className="td font-medium">{m.name}<p className="text-xs text-gray-400">{m.generic_name}</p></td>
                    <td className="td text-xs">{m.category}</td>
                    <td className="td font-bold text-lg text-center">{parseInt(m.total_stock)}</td>
                    <td className="td text-center text-gray-500">{m.reorder_level}</td>
                    <td className="td text-center text-gray-500">{m.min_stock}</td>
                    <td className="td text-xs">{m.nearest_expiry ? fmt.date(m.nearest_expiry) : '—'}</td>
                    <td className="td">
                      {parseInt(m.total_stock)<=0
                        ? <span className="badge badge-red">⛔ OUT</span>
                        : parseInt(m.total_stock)<m.min_stock
                          ? <span className="badge badge-red">⚠ Critical</span>
                          : <span className="badge badge-yellow">↓ Low</span>}
                    </td>
                  </tr>
                ))}
                {!shortStock.length && <tr><td colSpan={7} className="text-center py-10 text-green-600 text-sm">✅ All medicines are adequately stocked!</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expiring */}
      {tab==='expiring' && (
        <div>
          <div className="card-p mb-4 flex gap-4 items-end">
            <div>
              <label className="label">Show expiring within</label>
              <select className="select w-40" value={expiryDays} onChange={e=>setExpiryDays(parseInt(e.target.value))}>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>6 months</option>
              </select>
            </div>
            <span className="badge badge-yellow mb-0.5">{expiring.length} batches</span>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr>
                <th className="th">Medicine</th><th className="th">Batch</th>
                <th className="th">Expiry Date</th><th className="th">Days Left</th>
                <th className="th">Stock</th><th className="th">MRP</th><th className="th">Value</th>
              </tr></thead>
              <tbody>
                {expiring.map((b,i)=>{
                  const days = parseInt(b.days_to_expiry)
                  return (
                    <tr key={i} className={`border-b border-gray-100 ${days<=30?'bg-red-50':days<=60?'bg-orange-50':'bg-yellow-50'}`}>
                      <td className="td font-medium">{b.medicine_name}<p className="text-xs text-gray-400">{b.generic_name}</p></td>
                      <td className="td font-mono text-xs">{b.batch_number}</td>
                      <td className="td text-sm">{fmt.date(b.expiry_date)}</td>
                      <td className="td">
                        <span className={`badge ${days<=30?'badge-red':days<=60?'badge-yellow':'badge-gray'}`}>{days}d</span>
                      </td>
                      <td className="td font-semibold">{b.current_qty}</td>
                      <td className="td">{fmt.currency(b.mrp)}</td>
                      <td className="td font-medium text-gray-700">{fmt.currency(b.current_qty * b.mrp)}</td>
                    </tr>
                  )
                })}
                {!expiring.length && <tr><td colSpan={7} className="text-center py-10 text-green-600 text-sm">✅ No batches expiring in {expiryDays} days</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GST */}
      {tab==='gst' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="card-p"><p className="text-xs text-gray-400 mb-1">Taxable Value</p><p className="text-xl font-bold text-gray-900">{fmt.currency(totalTaxable)}</p></div>
            <div className="card-p"><p className="text-xs text-gray-400 mb-1">Total GST Collected</p><p className="text-xl font-bold text-primary">{fmt.currency(totalGST)}</p></div>
            <div className="card-p"><p className="text-xs text-gray-400 mb-1">Total Billed</p><p className="text-xl font-bold text-gray-900">{fmt.currency(totalTaxable + totalGST)}</p></div>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr>
                <th className="th">GST Rate</th><th className="th">HSN Code</th>
                <th className="th">Taxable Value</th><th className="th">CGST</th>
                <th className="th">SGST</th><th className="th">Total GST</th><th className="th">Total Billed</th>
              </tr></thead>
              <tbody>
                {(gstData?.data||[]).map((r,i)=>(
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="td"><span className="badge badge-blue">{r.gst_rate}%</span></td>
                    <td className="td font-mono text-xs">{r.hsn_code||'—'}</td>
                    <td className="td">{fmt.currency(r.taxable_value)}</td>
                    <td className="td">{fmt.currency(r.cgst)}</td>
                    <td className="td">{fmt.currency(r.sgst)}</td>
                    <td className="td font-semibold text-primary">{fmt.currency(parseFloat(r.cgst||0)+parseFloat(r.sgst||0))}</td>
                    <td className="td font-semibold">{fmt.currency(r.total_billed)}</td>
                  </tr>
                ))}
                {!gstData?.data?.length && <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No sales data for this period</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">CGST = SGST = GST Rate / 2 · For inter-state supply, IGST applies instead</p>
        </div>
      )}
    </div>
  )
}
