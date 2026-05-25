import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate,useSearchParams } from 'react-router-dom'
import { Plus,Search,FileText } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'
import { useAuth } from '../../store/authStore'

const STATUSES = ['','Active','Dispensed','Partial','Expired']

export default function PrescriptionList() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const {isRole} = useAuth()
  const [status,setStatus] = useState(sp.get('status')||'')
  const [search,setSearch] = useState('')

  const {data,isPending,isError} = useQuery({
    queryKey:['prescriptions',status],
    queryFn:()=>api.get('/prescriptions',{params:{status:status||undefined,limit:100}}).then(r=>r.data),
    retry:1
  })

  const rows = (data?.data||[]).filter(rx=>!search||rx.patient_name?.toLowerCase().includes(search.toLowerCase())||rx.rx_number?.includes(search))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-gray-900">Prescriptions</h1><p className="text-xs text-gray-400">{data?.total||0} total</p></div>
        {isRole('doctor','admin') && <button className="btn-primary" onClick={()=>navigate('/prescriptions/new')}><Plus size={15}/>New Prescription</button>}
      </div>
      <div className="card mb-4">
        <div className="p-3 border-b border-gray-100 flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search size={14} className="text-gray-400"/>
            <input className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent" placeholder="Search patient or Rx number…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map(s=>(
              <button key={s} onClick={()=>setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${status===s?'bg-primary text-white border-primary':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {s||'All'}
              </button>
            ))}
          </div>
        </div>
        {isPending ? <div className="p-8 text-center text-gray-400 text-sm">Loading…</div> : isError ? <div className="p-8 text-center text-red-400 text-sm">Failed to load prescriptions — please refresh</div> : (
          <table className="w-full">
            <thead><tr><th className="th">Rx No.</th><th className="th">Patient</th><th className="th">Doctor</th><th className="th">Diagnosis</th><th className="th">Date</th><th className="th">Status</th><th className="th"></th></tr></thead>
            <tbody>
              {rows.map(rx=>(
                <tr key={rx.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>navigate(`/prescriptions/${rx.rx_number}`)}>
                  <td className="td font-mono text-xs text-primary font-semibold">{rx.rx_number}</td>
                  <td className="td"><p className="font-medium">{rx.patient_name}</p><p className="text-xs text-gray-400">{rx.patient_age}y · {rx.patient_gender}</p></td>
                  <td className="td"><p className="text-sm">{rx.doctor_name}</p><p className="text-xs text-gray-400">{rx.specialization}</p></td>
                  <td className="td text-xs text-gray-500 max-w-xs truncate">{rx.diagnosis||'—'}</td>
                  <td className="td text-xs">{fmt.dateTime(rx.visit_date)}</td>
                  <td className="td"><span className={`badge ${rx.status==='Active'?'badge-blue':rx.status==='Dispensed'?'badge-green':rx.status==='Expired'?'badge-red':'badge-yellow'}`}>{rx.status}</span></td>
                  <td className="td"><FileText size={14} className="text-gray-400"/></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No prescriptions found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
