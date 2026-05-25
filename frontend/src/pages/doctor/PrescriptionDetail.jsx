import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Printer, ShoppingCart, CheckCircle, Pill, FlaskConical, Activity } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { fmtDate, fmtDateTime, statusBadge } from '../../utils/helpers'
import { useAuth } from '../../store/authStore'

export default function PrescriptionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isRole } = useAuth()
  const qc = useQueryClient()

  const { data: rx, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => api.get(`/prescriptions/${id}`).then(r=>r.data),
  })

  const statusMut = useMutation({
    mutationFn: status => api.patch(`/prescriptions/${rx.id}/status`, { status }).then(r=>r.data),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['prescription', id]) }
  })

  const printPdf = () => window.open(`${import.meta.env.VITE_API_URL||'https://web-production-36db0.up.railway.app'}/api/prescriptions/${id}/pdf?token=${localStorage.getItem('pc_token')}`, '_blank')
  const dispense = () => navigate(`/sales/new?rx=${rx?.id}&patient=${rx?.patient_id}`)

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading prescription…</div>
  if (!rx) return <div className="p-8 text-center text-red-500">Prescription not found</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={()=>navigate(-1)} className="btn-ghost btn-sm"><ArrowLeft size={15}/></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-mono">{rx.rx_number}</h1>
            <p className="text-xs text-gray-400">{fmtDateTime(rx.visit_date)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`badge text-sm px-3 py-1 ${statusBadge(rx.status)}`}>{rx.status}</span>
          <button onClick={printPdf} className="btn-secondary btn-sm"><Printer size={14}/>Print PDF</button>
          {isRole('pharmacist','cashier','admin') && rx.status==='Active' && (
            <button onClick={dispense} className="btn-primary btn-sm"><ShoppingCart size={14}/>Dispense</button>
          )}
          {isRole('doctor','admin') && rx.status==='Active' && (
            <button onClick={()=>statusMut.mutate('Expired')} className="btn-secondary btn-sm text-red-600 border-red-200">Mark Expired</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Doctor & Patient cards */}
        <div className="card-p">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Doctor</p>
          <p className="font-bold text-gray-900">Dr. {rx.doctor_name}</p>
          <p className="text-sm text-gray-500">{rx.qualification}</p>
          <p className="text-sm text-gray-500">{rx.specialization}</p>
          <p className="text-xs text-gray-400 mt-1">Reg: {rx.registration_number}</p>
          {rx.clinic_name && <><hr className="my-2"/><p className="text-xs text-gray-600">{rx.clinic_name}</p><p className="text-xs text-gray-400">{rx.clinic_address}</p></>}
        </div>

        <div className="card-p">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Patient</p>
          <p className="font-bold text-gray-900">{rx.patient_name}</p>
          <p className="text-sm text-gray-500">{rx.patient_age?`${rx.patient_age} yrs`:''} {rx.patient_gender?`· ${rx.patient_gender}`:''}</p>
          <p className="text-sm text-gray-500">{rx.patient_phone}</p>
          {rx.blood_group && <span className="badge badge-red mt-1">{rx.blood_group}</span>}
          {rx.allergies && <p className="text-xs text-red-600 mt-1">⚠ {rx.allergies}</p>}
        </div>

        <div className="card-p">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Visit Details</p>
          {rx.chief_complaint && <div className="mb-2"><p className="text-xs text-gray-400">Chief Complaint</p><p className="text-sm text-gray-800">{rx.chief_complaint}</p></div>}
          {rx.diagnosis && <div className="mb-2"><p className="text-xs text-gray-400">Diagnosis</p><p className="text-sm font-medium text-gray-800">{rx.diagnosis}</p></div>}
          {rx.follow_up_date && <div><p className="text-xs text-gray-400">Follow-up</p><p className="text-sm text-primary font-medium">{fmtDate(rx.follow_up_date)}</p></div>}
          {rx.vitals && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Activity size={11}/>Latest Vitals</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {rx.vitals.bp_systolic && <span className="text-gray-600">BP: {rx.vitals.bp_systolic}/{rx.vitals.bp_diastolic}</span>}
                {rx.vitals.pulse && <span className="text-gray-600">Pulse: {rx.vitals.pulse}</span>}
                {rx.vitals.temperature && <span className="text-gray-600">Temp: {rx.vitals.temperature}°C</span>}
                {rx.vitals.oxygen_saturation && <span className="text-gray-600">SpO₂: {rx.vitals.oxygen_saturation}%</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Medicines */}
      <div className="card-p mt-5">
        <h2 className="font-semibold text-sm text-gray-800 mb-4 flex items-center gap-2"><Pill size={15} className="text-primary"/>Medications ({rx.medicines?.length||0})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="th">#</th><th className="th">Medicine</th><th className="th">Dosage</th><th className="th">Frequency</th><th className="th">Duration</th><th className="th">Qty</th><th className="th">Instructions</th></tr></thead>
            <tbody>
              {(rx.medicines||[]).map((m,i)=>(
                <tr key={m.id} className={m.is_dispensed?'bg-green-50':''}>
                  <td className="td text-gray-400">{i+1}</td>
                  <td className="td font-semibold">{m.medicine_name} {m.is_dispensed&&<CheckCircle size={12} className="inline text-green-500 ml-1"/>}</td>
                  <td className="td">{m.dosage||'—'}</td><td className="td">{m.frequency||'—'}</td>
                  <td className="td">{m.duration||'—'}</td><td className="td">{m.quantity||'—'}</td>
                  <td className="td text-gray-500 text-xs">{m.instructions||'—'}</td>
                </tr>
              ))}
              {!rx.medicines?.length && <tr><td colSpan={7} className="td text-center text-gray-400 py-4">No medicines prescribed</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lab Tests */}
      {rx.lab_tests?.length > 0 && (
        <div className="card-p mt-5">
          <h2 className="font-semibold text-sm text-gray-800 mb-4 flex items-center gap-2"><FlaskConical size={15} className="text-primary"/>Lab Investigations ({rx.lab_tests.length})</h2>
          <div className="space-y-2">
            {rx.lab_tests.map((t,i)=>(
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div><p className="font-medium text-sm">{i+1}. {t.test_name}</p>{t.instructions&&<p className="text-xs text-gray-400 mt-0.5">{t.instructions}</p>}</div>
                <span className={`badge ${t.urgency==='Stat'?'badge-red':t.urgency==='Urgent'?'badge-yellow':'badge-gray'}`}>{t.urgency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advice */}
      {rx.advice && (
        <div className="card-p mt-5">
          <h2 className="font-semibold text-sm text-gray-800 mb-2">Advice / Instructions</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{rx.advice}</p>
        </div>
      )}

      {rx.notes && <div className="card-p mt-5"><p className="text-xs text-gray-400">Notes</p><p className="text-sm text-gray-700 mt-1">{rx.notes}</p></div>}
    </div>
  )
}
