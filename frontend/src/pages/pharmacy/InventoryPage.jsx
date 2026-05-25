import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search,AlertTriangle,Package,TrendingDown,Clock } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'
import { format,parseISO,differenceInDays } from 'date-fns'

export default function InventoryPage() {
  const [tab,setTab] = useState('summary')
  const [search,setSearch] = useState('')
  const [category,setCategory] = useState('')

  const {data:summary,isLoading} = useQuery({queryKey:['inv-summary'],queryFn:()=>api.get('/inventory/summary').then(r=>r.data)})
  const {data:alerts} = useQuery({queryKey:['inv-alerts'],queryFn:()=>api.get('/inventory/alerts').then(r=>r.data),refetchInterval:120000})
  const {data:batches} = useQuery({queryKey:['inv-batches',search,category],queryFn:()=>api.get('/inventory',{params:{search:search||undefined,category:category||undefined}}).then(r=>r.data),enabled:tab==='batches'})
  const {data:expiring} = useQuery({queryKey:['expiring'],queryFn:()=>api.get('/reports/expiring',{params:{days:90}}).then(r=>r.data),enabled:tab==='expiring'})

  const categories = [...new Set((summary||[]).map(m=>m.category).filter(Boolean))].sort()

  const filtered = (summary||[]).filter(m=>{
    if(search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.generic_name?.toLowerCase().includes(search.toLowerCase())) return false
    if(category && m.category!==category) return false
    if(tab==='shortstock' && parseInt(m.total_stock)>parseInt(m.reorder_level)) return false
    return true
  })

  const stockColor = (stock,reorder,min) => {
    if(stock<=0) return 'text-red-600 font-bold'
    if(stock<min) return 'text-red-500 font-semibold'
    if(stock<=reorder) return 'text-amber-600 font-semibold'
    return 'text-gray-800'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-gray-900">Inventory</h1><p className="text-xs text-gray-400">{(summary||[]).length} medicines</p></div>
      </div>

      {/* Alert cards */}
      {alerts && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="card-p flex items-center gap-3 cursor-pointer hover:shadow-md" onClick={()=>setTab('shortstock')}>
            <div className="p-2.5 bg-red-50 rounded-xl"><TrendingDown size={18} className="text-red-500"/></div>
            <div><p className="text-xs text-gray-500">Short Stock</p><p className="text-xl font-bold text-red-600">{alerts.lowStock?.length||0}</p></div>
          </div>
          <div className="card-p flex items-center gap-3 cursor-pointer hover:shadow-md" onClick={()=>setTab('expiring')}>
            <div className="p-2.5 bg-amber-50 rounded-xl"><Clock size={18} className="text-amber-500"/></div>
            <div><p className="text-xs text-gray-500">Expiring in 30d</p><p className="text-xl font-bold text-amber-600">{alerts.expiring30?.length||0}</p></div>
          </div>
          <div className="card-p flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-xl"><Package size={18} className="text-gray-500"/></div>
            <div><p className="text-xs text-gray-500">Out of Stock</p><p className="text-xl font-bold text-gray-700">{alerts.outOfStock?.length||0}</p></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200 px-4 flex-wrap">
          {[['summary','Stock Summary'],['batches','Batch-wise'],['shortstock','Short Stock'],['expiring','Expiring Soon']].map(([t,l])=>(
            <button key={t} className={`tab ${tab===t?'tab-active':'tab-idle'}`} onClick={()=>setTab(t)}>{l}</button>
          ))}
        </div>

        {/* Filters */}
        {(tab==='summary'||tab==='batches'||tab==='shortstock') && (
          <div className="p-3 border-b border-gray-100 flex gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search size={14} className="text-gray-400"/>
              <input className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent" placeholder="Search medicine…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="select py-1.5 text-xs w-40" value={category} onChange={e=>setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        )}

        <div className="overflow-x-auto">
          {(tab==='summary'||tab==='shortstock') && (
            <table className="w-full">
              <thead><tr><th className="th">Medicine</th><th className="th">Generic</th><th className="th">Category</th><th className="th">Form</th><th className="th">Batches</th><th className="th">Nearest Expiry</th><th className="th">Reorder Lvl</th><th className="th">Stock</th><th className="th">MRP</th></tr></thead>
              <tbody>
                {filtered.map(m=>{
                  const exp = m.nearest_expiry ? differenceInDays(parseISO(m.nearest_expiry),new Date()) : null
                  return (
                    <tr key={m.medicine_id} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="td"><p className="font-medium text-sm">{m.name}</p>{m.rack_location&&<p className="text-[10px] text-gray-400">Rack: {m.rack_location}</p>}</td>
                      <td className="td text-xs text-gray-500">{m.generic_name||'—'}</td>
                      <td className="td"><span className="badge-gray badge">{m.category||'—'}</span></td>
                      <td className="td text-xs">{m.form}</td>
                      <td className="td text-center">{m.batches||0}</td>
                      <td className="td text-xs">
                        {m.nearest_expiry ? <span className={exp<=30?'text-red-600 font-semibold':exp<=90?'text-amber-600':'text-gray-600'}>{format(parseISO(m.nearest_expiry),'MMM yyyy')} {exp<=30&&`(${exp}d)`}</span> : '—'}
                      </td>
                      <td className="td text-center text-xs">{m.reorder_level}</td>
                      <td className={`td text-center text-sm ${stockColor(m.total_stock,m.reorder_level,m.min_stock)}`}>
                        {parseInt(m.total_stock)<=0?'OUT':m.total_stock}
                        {parseInt(m.total_stock)<=0&&<span className="ml-1 badge-red badge text-[9px]">OUT</span>}
                        {parseInt(m.total_stock)>0&&parseInt(m.total_stock)<=parseInt(m.min_stock)&&<span className="ml-1 badge-red badge text-[9px]">CRITICAL</span>}
                        {parseInt(m.total_stock)>parseInt(m.min_stock)&&parseInt(m.total_stock)<=parseInt(m.reorder_level)&&<span className="ml-1 badge-yellow badge text-[9px]">LOW</span>}
                      </td>
                      <td className="td text-xs">{m.max_mrp?fmt.currency(m.max_mrp):'—'}</td>
                    </tr>
                  )
                })}
                {!filtered.length&&<tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">No items</td></tr>}
              </tbody>
            </table>
          )}

          {tab==='batches' && (
            <table className="w-full">
              <thead><tr><th className="th">Medicine</th><th className="th">Batch No.</th><th className="th">Expiry</th><th className="th">MRP</th><th className="th">Purchase Rate</th><th className="th">In</th><th className="th">Out</th><th className="th">Stock</th></tr></thead>
              <tbody>
                {(batches||[]).map(b=>{
                  const exp = b.expiry_date ? differenceInDays(parseISO(b.expiry_date),new Date()) : null
                  const qty = parseInt(b.current_qty)
                  return (
                    <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="td"><p className="font-medium text-sm">{b.medicine_name}</p><p className="text-xs text-gray-400">{b.generic_name}</p></td>
                      <td className="td font-mono text-xs font-semibold">{b.batch_number}</td>
                      <td className="td text-xs"><span className={exp!==null&&exp<=30?'text-red-600 font-semibold':exp!==null&&exp<=90?'text-amber-600':''}>{b.expiry_date?format(parseISO(b.expiry_date),'MMM yyyy'):'—'} {exp!==null&&exp<=30&&`(${exp}d)`}</span></td>
                      <td className="td text-xs font-semibold">{fmt.currency(b.mrp)}</td>
                      <td className="td text-xs">{fmt.currency(b.purchase_rate)}</td>
                      <td className="td text-center text-xs">{b.quantity_in}</td>
                      <td className="td text-center text-xs">{b.quantity_out}</td>
                      <td className={`td text-center font-bold ${qty<=0?'text-red-600':qty<=5?'text-amber-600':'text-gray-800'}`}>{qty}</td>
                    </tr>
                  )
                })}
                {!batches?.length&&<tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No batches found</td></tr>}
              </tbody>
            </table>
          )}

          {tab==='expiring' && (
            <table className="w-full">
              <thead><tr><th className="th">Medicine</th><th className="th">Batch</th><th className="th">Expiry Date</th><th className="th">Days Left</th><th className="th">Stock</th><th className="th">MRP</th><th className="th">Value at Risk</th></tr></thead>
              <tbody>
                {(expiring||[]).map(b=>{
                  const days = parseInt(b.days_to_expiry)
                  const qty = parseInt(b.current_qty)
                  return (
                    <tr key={b.id} className={`border-b border-gray-100 ${days<=30?'bg-red-50':days<=60?'bg-amber-50':''}`}>
                      <td className="td font-medium text-sm">{b.medicine_name}</td>
                      <td className="td font-mono text-xs">{b.batch_number}</td>
                      <td className="td text-xs">{b.expiry_date?format(parseISO(b.expiry_date),'dd MMM yyyy'):'—'}</td>
                      <td className={`td font-bold text-sm ${days<=30?'text-red-600':days<=60?'text-amber-600':'text-gray-700'}`}>{days}d</td>
                      <td className="td text-center">{qty}</td>
                      <td className="td text-xs">{fmt.currency(b.mrp)}</td>
                      <td className="td text-xs font-semibold text-red-600">{fmt.currency(qty*parseFloat(b.mrp))}</td>
                    </tr>
                  )
                })}
                {!expiring?.length&&<tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No items expiring soon 🎉</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
