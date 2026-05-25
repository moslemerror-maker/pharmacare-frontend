import { useQuery } from '@tanstack/react-query'
import { AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,BarChart,Bar } from 'recharts'
import { ShoppingCart,AlertTriangle,ClipboardCheck,TrendingUp,Package,Pill,IndianRupee,Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { fmt } from '../utils/helpers'
import { format } from 'date-fns'

function Stat({icon:Icon,label,value,sub,color='green',onClick}) {
  const bg={green:'bg-primary/10 text-primary',blue:'bg-blue-50 text-blue-600',red:'bg-red-50 text-red-600',yellow:'bg-yellow-50 text-yellow-600'}
  return (
    <div className={`card-p flex items-start justify-between ${onClick?'cursor-pointer hover:shadow-md transition-shadow':''}`} onClick={onClick}>
      <div><p className="text-xs text-gray-500 mb-1">{label}</p><p className="text-2xl font-bold text-gray-900">{value}</p>{sub&&<p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}</div>
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${bg[color]}`}><Icon size={18}/></div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const {data,isLoading} = useQuery({queryKey:['dashboard'],queryFn:()=>api.get('/dashboard').then(r=>r.data),refetchInterval:60000})
  if(isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
  const d = data||{}
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(),'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Alert banner */}
      {(d.alerts?.lowStock>0||d.alerts?.outOfStock>0||d.alerts?.expiring30>0)&&(
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
          <Bell className="text-amber-500 flex-shrink-0" size={16}/>
          <div className="flex flex-wrap gap-4 text-xs text-amber-800">
            {d.alerts.outOfStock>0 && <span>⛔ <strong>{d.alerts.outOfStock}</strong> out of stock</span>}
            {d.alerts.lowStock>0   && <span>⚠️ <strong>{d.alerts.lowStock}</strong> low stock</span>}
            {d.alerts.expiring30>0 && <span>📅 <strong>{d.alerts.expiring30}</strong> expiring in 30 days</span>}
            {d.alerts.pendingRx>0  && <span>📋 <strong>{d.alerts.pendingRx}</strong> pending prescriptions</span>}
          </div>
          <button onClick={()=>navigate('/inventory')} className="ml-auto text-xs text-amber-700 underline whitespace-nowrap">View →</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={IndianRupee} label="Today's Sales"    value={fmt.currency(d.today?.sales?.amount)} sub={`${d.today?.sales?.count||0} bills`}/>
        <Stat icon={TrendingUp}  label="Month Sales"      value={fmt.currency(d.month?.sales?.amount)} sub={`${d.month?.sales?.count||0} bills`}/>
        <Stat icon={ClipboardCheck} label="Pending Prescriptions" value={d.alerts?.pendingRx||0} color="blue" onClick={()=>navigate('/prescriptions?status=Active')}/>
        <Stat icon={Package}     label="Low / Out of Stock" value={`${d.alerts?.lowStock||0} / ${d.alerts?.outOfStock||0}`} color={d.alerts?.outOfStock>0?'red':'yellow'} onClick={()=>navigate('/inventory')}/>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-p lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Sales — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.salesTrend||[]}>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1a5e3a" stopOpacity={0.25}/><stop offset="95%" stopColor="#1a5e3a" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>format(new Date(v),'dd MMM')}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>[fmt.currency(v),'Sales']} labelFormatter={v=>format(new Date(v),'dd MMM yyyy')}/>
              <Area type="monotone" dataKey="amount" stroke="#1a5e3a" fill="url(#sg)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card-p">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Today's Payment Modes</h2>
          {d.paymentBreakdown?.length ? (
            <div className="space-y-3 mt-2">
              {d.paymentBreakdown.map(p=>(
                <div key={p.payment_mode} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"/><span className="text-sm text-gray-700">{p.payment_mode}</span></div>
                  <div className="text-right"><p className="text-sm font-semibold">{fmt.currency(p.amount)}</p><p className="text-[10px] text-gray-400">{p.count} bills</p></div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-10">No sales today</p>}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-p">
          <h2 className="font-semibold text-gray-800 mb-3 text-sm">Top Medicines This Month</h2>
          <div className="space-y-2.5">
            {(d.topMedicines||[]).slice(0,6).map((m,i)=>(
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4 flex-shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{m.name}</p><p className="text-[10px] text-gray-400">{m.qty} units sold</p></div>
                <span className="text-sm font-semibold text-primary">{fmt.currency(m.revenue)}</span>
              </div>
            ))}
            {!d.topMedicines?.length && <p className="text-xs text-gray-400 text-center py-6">No data this month</p>}
          </div>
        </div>
        <div className="card-p">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Pending Prescriptions</h2>
            <button onClick={()=>navigate('/prescriptions')} className="text-xs text-primary hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {(d.recentRx||[]).map(rx=>(
              <div key={rx.rx_number} onClick={()=>navigate(`/prescriptions/${rx.rx_number}`)}
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors">
                <div><p className="text-sm font-medium text-gray-800">{rx.patient_name}</p><p className="text-[11px] text-gray-500">Dr. {rx.doctor_name}</p></div>
                <div className="text-right"><span className="badge-yellow badge text-[10px]">{rx.status}</span><p className="text-[10px] text-gray-400 mt-1">{fmt.dateTime(rx.visit_date)}</p></div>
              </div>
            ))}
            {!d.recentRx?.length && <p className="text-xs text-gray-400 text-center py-6">No pending prescriptions 🎉</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
