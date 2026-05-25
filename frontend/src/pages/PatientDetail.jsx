import { useState } from 'react'
import { useParams,useNavigate } from 'react-router-dom'
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query'
import { ArrowLeft,Plus,Activity,ClipboardList,ShoppingCart,Heart } from 'lucide-react'
import api from '../utils/api'
import { fmt } from '../utils/helpers'
import toast from 'react-hot-toast'

function VitalsModal({patientId,onClose}) {
  const qc = useQueryClient()
  const [f,setF] = useState({weight:'',height:'',bp_systolic:'',bp_diastolic:'',pulse:'',temperature:'',oxygen_saturation:'',blood_sugar:'',notes:''})
  const mut = useMutation({ mutationFn:d=>api.post(`/patients/${patientId}/vitals`,d).then(r=>r.data),
    onSuccess:()=>{ toast.success('Vitals recorded'); qc.invalidateQueries(['patient',patientId]); onClose() }, onError:e=>toast.error('Failed') })
  const F=({label,k,type='number',placeholder=''})=>(<div><label className="label">{label}</label><input className="input" type={type} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})} placeholder={placeholder}/></div>)
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal max-w-lg p-6">
        <h2 className="font-bold text-lg mb-4">Record Vitals</h2>
        <div className="grid grid-cols-2 gap-3">
          <F label="Weight (kg)" k="weight" placeholder="70.5"/>
          <F label="Height (cm)" k="height" placeholder="175"/>
          <F label="BP Systolic" k="bp_systolic" placeholder="120"/>
          <F label="BP Diastolic" k="bp_diastolic" placeholder="80"/>
          <F label="Pulse (bpm)" k="pulse" placeholder="72"/>
          <F label="Temperature (°C)" k="temperature" placeholder="98.6"/>
          <F label="SpO2 (%)" k="oxygen_saturation" placeholder="99"/>
          <F label="Blood Sugar (mg/dL)" k="blood_sugar" placeholder="90"/>
          <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" disabled={mut.isPending} onClick={()=>mut.mutate(f)}>{mut.isPending?'Saving…':'Save Vitals'}</button>
        </div>
      </div>
    </div>
  )
}

export default function PatientDetail() {
  const {id} = useParams(); const navigate = useNavigate()
  const [tab,setTab] = useState('vitals')
  const [showVitals,setShowVitals] = useState(false)
  const {data:p,isLoading} = useQuery({queryKey:['patient',id],queryFn:()=>api.get(`/patients/${id}`).then(r=>r.data)})
  if(isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
  if(!p) return <div className="p-6 text-red-500">Patient not found</div>
  const latestVitals = p.vitals?.[0]
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={()=>navigate(-1)} className="btn-ghost btn-sm mb-4"><ArrowLeft size={14}/>Back</button>
      {/* Header */}
      <div className="card-p mb-5 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center"><span className="text-2xl font-bold text-primary">{p.name[0]}</span></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{p.name}</h1>
            <p className="text-sm text-gray-500">{p.patient_id} · {p.age&&`${p.age} yrs`} {p.gender&&`· ${p.gender}`} {p.blood_group&&<span className="ml-1 badge-red badge">{p.blood_group}</span>}</p>
            {p.phone && <p className="text-sm text-gray-500 mt-0.5">📞 {p.phone}</p>}
            {p.allergies && <p className="text-xs text-red-600 mt-1 font-medium">⚠ Allergies: {p.allergies}</p>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary btn-sm" onClick={()=>setShowVitals(true)}><Activity size={13}/>Record Vitals</button>
          <button className="btn-primary btn-sm" onClick={()=>navigate(`/prescriptions/new?patient_id=${p.id}`)}><Plus size={13}/>New Prescription</button>
        </div>
      </div>

      {/* Quick stats */}
      {latestVitals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[['BP',latestVitals.bp_systolic?`${latestVitals.bp_systolic}/${latestVitals.bp_diastolic} mmHg`:'—'],['Pulse',latestVitals.pulse?`${latestVitals.pulse} bpm`:'—'],['SpO2',latestVitals.oxygen_saturation?`${latestVitals.oxygen_saturation}%`:'—'],['Sugar',latestVitals.blood_sugar?`${latestVitals.blood_sugar} mg/dL`:'—']].map(([l,v])=>(
            <div key={l} className="card-p text-center"><p className="text-xs text-gray-400 mb-1">{l}</p><p className="font-bold text-gray-800">{v}</p></div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200 px-4">
          {[['vitals','Vitals History'],['prescriptions','Prescriptions'],['sales','Purchase History']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className={`tab ${tab===t?'tab-active':'tab-idle'}`}>{l}</button>
          ))}
        </div>
        <div className="p-4">
          {tab==='vitals' && (
            <div>
              {p.vitals?.length ? (
                <table className="w-full text-sm">
                  <thead><tr><th className="th">Date</th><th className="th">BP</th><th className="th">Pulse</th><th className="th">Temp</th><th className="th">SpO2</th><th className="th">Weight</th><th className="th">Sugar</th></tr></thead>
                  <tbody>{p.vitals.map(v=>(
                    <tr key={v.id}><td className="td text-xs">{fmt.dateTime(v.recorded_at)}</td><td className="td">{v.bp_systolic?`${v.bp_systolic}/${v.bp_diastolic}`:'—'}</td><td className="td">{v.pulse||'—'}</td><td className="td">{v.temperature||'—'}</td><td className="td">{v.oxygen_saturation?`${v.oxygen_saturation}%`:'—'}</td><td className="td">{v.weight?`${v.weight} kg`:'—'}</td><td className="td">{v.blood_sugar||'—'}</td></tr>
                  ))}</tbody>
                </table>
              ) : <p className="text-center text-gray-400 py-8 text-sm">No vitals recorded yet</p>}
            </div>
          )}
          {tab==='prescriptions' && (
            <div>
              {p.prescriptions?.length ? (
                <table className="w-full text-sm">
                  <thead><tr><th className="th">Rx No.</th><th className="th">Date</th><th className="th">Doctor</th><th className="th">Diagnosis</th><th className="th">Status</th></tr></thead>
                  <tbody>{p.prescriptions.map(rx=>(
                    <tr key={rx.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>navigate(`/prescriptions/${rx.rx_number}`)}>
                      <td className="td font-mono text-xs text-primary font-semibold">{rx.rx_number}</td>
                      <td className="td text-xs">{fmt.date(rx.visit_date)}</td>
                      <td className="td">{rx.doctor_name}</td>
                      <td className="td text-xs text-gray-500 max-w-xs truncate">{rx.diagnosis||'—'}</td>
                      <td className="td"><span className={`badge ${rx.status==='Active'?'badge-blue':rx.status==='Dispensed'?'badge-green':'badge-yellow'}`}>{rx.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p className="text-center text-gray-400 py-8 text-sm">No prescriptions yet</p>}
            </div>
          )}
          {tab==='sales' && (
            <div>
              {p.sales?.length ? (
                <table className="w-full text-sm">
                  <thead><tr><th className="th">Bill No.</th><th className="th">Date</th><th className="th">Amount</th><th className="th">Mode</th><th className="th">Status</th></tr></thead>
                  <tbody>{p.sales.map(s=>(
                    <tr key={s.id}><td className="td font-mono text-xs font-semibold">{s.bill_number}</td><td className="td text-xs">{fmt.dateTime(s.bill_date)}</td><td className="td font-semibold text-primary">{fmt.currency(s.total_amount)}</td><td className="td">{s.payment_mode}</td><td className="td"><span className={`badge ${s.payment_status==='Paid'?'badge-green':'badge-red'}`}>{s.payment_status}</span></td></tr>
                  ))}</tbody>
                </table>
              ) : <p className="text-center text-gray-400 py-8 text-sm">No purchase history</p>}
            </div>
          )}
        </div>
      </div>
      {showVitals && <VitalsModal patientId={p.id} onClose={()=>setShowVitals(false)}/>}
    </div>
  )
}
