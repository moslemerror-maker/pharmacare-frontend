import { useState } from 'react'
import { useParams,useNavigate } from 'react-router-dom'
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query'
import { ArrowLeft,Printer,ShoppingCart,CheckCircle,FlaskConical } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'
import { useAuth } from '../../store/authStore'
import toast from 'react-hot-toast'
import PrintModal from '../../components/shared/PrintModal'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function PrescriptionView() {
  const {id} = useParams(); const navigate = useNavigate()
  const {isRole} = useAuth(); const qc = useQueryClient()
  const [printUrlFn, setPrintUrlFn] = useState(null)
  const {data:rx,isLoading} = useQuery({
    queryKey:['rx',id],
    queryFn:()=>api.get(`/prescriptions/${id}`).then(r=>r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const dispense = useMutation({
    mutationFn:()=>api.patch(`/prescriptions/${rx.id}/status`,{status:'Dispensed'}).then(r=>r.data),
    onSuccess:()=>{ toast.success('Marked as dispensed'); qc.invalidateQueries(['rx',id]); qc.invalidateQueries(['prescriptions']) },
    onError:()=>toast.error('Failed')
  })

  const openPDF = () => {
    const token = localStorage.getItem('pc_token')
    setPrintUrlFn(() => (size) => `${API_BASE}/api/prescriptions/${id}/pdf?size=${size}&token=${token}`)
  }

  if(isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
  if(!rx) return <div className="p-6 text-red-500">Prescription not found</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PrintModal urlFn={printUrlFn} onClose={() => setPrintUrlFn(null)} />
      <button onClick={()=>navigate(-1)} className="btn-ghost btn-sm mb-4"><ArrowLeft size={14}/>Back</button>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{rx.rx_number}</h1>
          <p className="text-xs text-gray-400">{fmt.dateTime(rx.visit_date)}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={openPDF}><Printer size={14}/>Print PDF</button>
          {isRole('pharmacist','admin') && rx.status==='Active' && (
            <button className="btn-primary btn-sm" onClick={()=>navigate(`/sales/new?prescription_id=${rx.id}&patient_id=${rx.patient_id}`)}><ShoppingCart size={14}/>Dispense & Bill</button>
          )}
          {isRole('pharmacist','admin') && rx.status==='Active' && (
            <button className="btn-secondary btn-sm" onClick={()=>dispense.mutate()}><CheckCircle size={14}/>Mark Dispensed</button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-2 mb-4">
        <span className={`badge text-sm px-3 py-1 ${rx.status==='Active'?'badge-blue':rx.status==='Dispensed'?'badge-green':'badge-yellow'}`}>{rx.status}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Doctor */}
        <div className="card-p">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Doctor</h3>
          <p className="font-semibold text-gray-900">{rx.doctor_name}</p>
          <p className="text-sm text-gray-500">{rx.qualification}</p>
          <p className="text-sm text-gray-500">{rx.specialization}</p>
          <p className="text-xs text-gray-400 mt-1">Reg: {rx.registration_number}</p>
          {rx.clinic_name && <p className="text-xs text-gray-400">{rx.clinic_name}</p>}
        </div>
        {/* Patient */}
        <div className="card-p">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Patient</h3>
          <p className="font-semibold text-gray-900">{rx.patient_name}</p>
          <p className="text-sm text-gray-500">{rx.patient_age}y · {rx.patient_gender} {rx.blood_group&&`· ${rx.blood_group}`}</p>
          {rx.patient_phone && <p className="text-sm text-gray-500">📞 {rx.patient_phone}</p>}
          {rx.allergies && <p className="text-xs text-red-600 mt-1 font-medium">⚠ {rx.allergies}</p>}
        </div>
      </div>

      {/* Clinical */}
      {(rx.chief_complaint||rx.diagnosis) && (
        <div className="card-p mb-4">
          {rx.chief_complaint && <p className="text-sm mb-1"><span className="font-medium text-gray-700">Complaint: </span>{rx.chief_complaint}</p>}
          {rx.diagnosis && <p className="text-sm"><span className="font-medium text-gray-700">Diagnosis: </span>{rx.diagnosis}</p>}
        </div>
      )}

      {/* Medicines */}
      {rx.medicines?.length>0 && (
        <div className="card mb-4">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg">💊</span><h3 className="font-semibold text-gray-800 text-sm">Medications</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {rx.medicines.map((m,i)=>(
              <div key={m.id} className="px-4 py-3 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{m.medicine_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{[m.dosage,m.frequency,m.duration].filter(Boolean).join(' · ')}</p>
                  {m.instructions && <p className="text-xs text-gray-400 mt-0.5 italic">{m.instructions}</p>}
                </div>
                {m.quantity && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Qty: {m.quantity}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab tests */}
      {rx.lab_tests?.length>0 && (
        <div className="card mb-4">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <FlaskConical size={16} className="text-blue-500"/><h3 className="font-semibold text-gray-800 text-sm">Lab Investigations</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {rx.lab_tests.map((lt,i)=>(
              <div key={lt.id} className="px-4 py-3 flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-800">{lt.test_name}</p>{lt.instructions&&<p className="text-xs text-gray-400">{lt.instructions}</p>}</div>
                <span className={`badge ${lt.urgency==='Routine'?'badge-gray':'badge-red'}`}>{lt.urgency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advice */}
      {rx.advice && (
        <div className="card-p mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Advice</h3>
          <p className="text-sm text-gray-700">{rx.advice}</p>
        </div>
      )}
      {rx.follow_up_date && (
        <div className="card-p bg-green-50 border-green-200">
          <p className="text-sm text-green-800">📅 Follow-up: <strong>{fmt.date(rx.follow_up_date)}</strong></p>
        </div>
      )}
    </div>
  )
}
