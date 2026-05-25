import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Search, Save, X, FlaskConical, Pill, ArrowLeft, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { useAuth } from '../../store/authStore'
import { frequencyOptions, durationOptions } from '../../utils/helpers'

function PatientSearch({ value, onChange }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const { data } = useQuery({
    queryKey: ['pt-search', q],
    queryFn: () => api.get('/patients', { params:{ search:q, limit:8 } }).then(r=>r.data.data),
    enabled: q.length > 1,
  })
  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  if (value) return (
    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <User size={16} className="text-primary"/>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{value.name}</p>
        <p className="text-xs text-gray-500">{value.patient_id} · {value.age ? value.age+'y' : ''} · {value.gender||''} · {value.phone||''}</p>
      </div>
      <button onClick={()=>onChange(null)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><X size={14}/></button>
    </div>
  )
  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input className="input pl-9" placeholder="Search patient by name or phone..."
          value={q} onChange={e=>{setQ(e.target.value);setOpen(true)}} onFocus={()=>setOpen(true)}/>
      </div>
      {open && (data?.length > 0) && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lift overflow-hidden">
          {data.map(p=>(
            <button key={p.id} onClick={()=>{onChange(p);setOpen(false);setQ('')}}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between">
              <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-gray-500">{p.patient_id} · {p.phone||'—'}</p></div>
              <span className="text-xs text-gray-400">{p.age ? p.age+'y' : ''} {p.gender||''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MedRow({ med, idx, onChange, onRemove }) {
  const [q, setQ] = useState(med.medicine_name || '')
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const { data: suggestions } = useQuery({
    queryKey: ['med-suggest', q],
    queryFn: () => api.get('/medicines', { params:{ search:q, limit:8 } }).then(r=>r.data),
    enabled: q.length > 1 && !med.medicine_id,
  })
  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx+1}</span>
        <div ref={ref} className="flex-1 relative">
          <input className="input" placeholder="Type medicine name to search..."
            value={q}
            onChange={e=>{setQ(e.target.value);onChange({medicine_name:e.target.value,medicine_id:null});setOpen(true)}}
            onFocus={()=>setOpen(true)}/>
          {open && suggestions?.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lift overflow-hidden">
              {suggestions.map(s=>(
                <button key={s.id} className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex justify-between"
                  onClick={()=>{
                    setQ(s.name); setOpen(false)
                    onChange({ medicine_name:s.name, medicine_id:s.id, dosage:s.strength||'', frequency:'Twice daily (BD)', duration:'5 days', quantity:10 })
                  }}>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-gray-400">{s.form} · {s.strength}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onRemove} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div><label className="label">Dosage</label><input className="input" placeholder="1 tablet" value={med.dosage||''} onChange={e=>onChange({dosage:e.target.value})}/></div>
        <div><label className="label">Frequency</label>
          <select className="select" value={med.frequency||''} onChange={e=>onChange({frequency:e.target.value})}>
            <option value="">Select...</option>{frequencyOptions.map(f=><option key={f}>{f}</option>)}
          </select>
        </div>
        <div><label className="label">Duration</label>
          <select className="select" value={med.duration||''} onChange={e=>onChange({duration:e.target.value})}>
            <option value="">Select...</option>{durationOptions.map(d=><option key={d}>{d}</option>)}
          </select>
        </div>
        <div><label className="label">Qty</label><input className="input" type="number" min="1" value={med.quantity||''} onChange={e=>onChange({quantity:parseInt(e.target.value)||''})}/></div>
      </div>
      <div><label className="label">Instructions</label>
        <input className="input" placeholder="e.g. After meals, avoid alcohol..." value={med.instructions||''} onChange={e=>onChange({instructions:e.target.value})}/>
      </div>
    </div>
  )
}

function LabRow({ test, onChange, onRemove }) {
  const [q, setQ] = useState(test.test_name || '')
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const { data: suggestions } = useQuery({
    queryKey: ['lab-suggest', q],
    queryFn: () => api.get('/lab', { params:{ search:q } }).then(r=>r.data),
    enabled: q.length > 1,
  })
  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="flex gap-2 items-start bg-blue-50 border border-blue-100 rounded-xl p-3">
      <div ref={ref} className="flex-1 relative">
        <input className="input bg-white" placeholder="Search lab test..."
          value={q}
          onChange={e=>{setQ(e.target.value);onChange({test_name:e.target.value});setOpen(true)}}
          onFocus={()=>setOpen(true)}/>
        {open && suggestions?.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lift overflow-hidden">
            {suggestions.map(s=>(
              <button key={s.id} className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex justify-between"
                onClick={()=>{setQ(s.name);setOpen(false);onChange({test_name:s.name})}}>
                <span>{s.name}</span><span className="text-xs text-gray-400">{s.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <select className="select w-28 bg-white" value={test.urgency||'Routine'} onChange={e=>onChange({urgency:e.target.value})}>
        <option>Routine</option><option>Urgent</option><option>Stat</option>
      </select>
      <input className="input w-40 bg-white" placeholder="Instructions..." value={test.instructions||''} onChange={e=>onChange({instructions:e.target.value})}/>
      <button onClick={onRemove} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
    </div>
  )
}

function VitalsForm({ patient, onSaved }) {
  const [v, setV] = useState({ weight:'', height:'', bp_systolic:'', bp_diastolic:'', pulse:'', temperature:'', oxygen_saturation:'', blood_sugar:'', notes:'' })
  const mutation = useMutation({
    mutationFn: () => api.post(`/patients/${patient.id}/vitals`, v),
    onSuccess: () => { toast.success('Vitals recorded'); onSaved?.() },
    onError: () => toast.error('Failed to save vitals'),
  })
  const bmi = v.weight && v.height ? (v.weight / ((v.height/100)**2)).toFixed(1) : null
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['weight','Weight (kg)'],['height','Height (cm)'],['bp_systolic','BP Systolic (mmHg)'],['bp_diastolic','BP Diastolic (mmHg)'],
          ['pulse','Pulse (bpm)'],['temperature','Temperature (°F)'],['oxygen_saturation','SpO₂ (%)'],['blood_sugar','Blood Sugar (mg/dL)']
        ].map(([k,lbl])=>(
          <div key={k}><label className="label">{lbl}</label>
            <input className="input" type="number" step="0.1" value={v[k]} onChange={e=>setV(p=>({...p,[k]:e.target.value}))}/>
          </div>
        ))}
      </div>
      {bmi && <p className="text-xs text-gray-500">BMI: <span className={`font-bold ${bmi<18.5||bmi>30?'text-red-600':'text-green-600'}`}>{bmi}</span></p>}
      <div><label className="label">Notes</label>
        <input className="input" placeholder="Any observations..." value={v.notes} onChange={e=>setV(p=>({...p,notes:e.target.value}))}/></div>
      <button className="btn-primary btn-sm" onClick={()=>mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending?'Saving...':'Save Vitals'}
      </button>
    </div>
  )
}

export default function NewPrescription() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [patient, setPatient] = useState(null)
  const [form, setForm] = useState({ chief_complaint:'', diagnosis:'', advice:'', follow_up_date:'', notes:'' })
  const [medicines, setMedicines] = useState([{ medicine_name:'', medicine_id:null, dosage:'', frequency:'', duration:'', quantity:'', instructions:'' }])
  const [labTests, setLabTests] = useState([])
  const [activeTab, setActiveTab] = useState('rx')

  const mutation = useMutation({
    mutationFn: () => api.post('/prescriptions', {
      patient_id: patient?.id, ...form,
      medicines: medicines.filter(m=>m.medicine_name.trim()),
      lab_tests: labTests.filter(l=>l.test_name?.trim()),
    }),
    onSuccess: res => {
      toast.success(`Prescription ${res.data.rx_number} created!`)
      qc.invalidateQueries(['prescriptions'])
      navigate(`/prescriptions/${res.data.rx_number}`)
    },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })

  const addMed = () => setMedicines(p=>[...p,{ medicine_name:'',medicine_id:null,dosage:'',frequency:'',duration:'',quantity:'',instructions:'' }])
  const updateMed = (i,patch) => setMedicines(p=>p.map((m,idx)=>idx===i?{...m,...patch}:m))
  const removeMed = i => setMedicines(p=>p.filter((_,idx)=>idx!==i))
  const addLab = () => setLabTests(p=>[...p,{test_name:'',urgency:'Routine',instructions:''}])
  const updateLab = (i,patch) => setLabTests(p=>p.map((l,idx)=>idx===i?{...l,...patch}:l))
  const removeLab = i => setLabTests(p=>p.filter((_,idx)=>idx!==i))
  const canSave = patient && (medicines.some(m=>m.medicine_name.trim()) || labTests.some(l=>l.test_name?.trim()))

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={()=>navigate(-1)} className="btn-ghost btn-sm p-2"><ArrowLeft size={18}/></button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Prescription</h1>
          <p className="text-xs text-gray-500">Dr. {user?.name} · {user?.doctorProfile?.specialization}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="btn-secondary" onClick={()=>navigate(-1)}>Cancel</button>
          <button className="btn-primary" disabled={!canSave||mutation.isPending} onClick={()=>mutation.mutate()}>
            <Save size={15}/>{mutation.isPending?'Saving...':'Save Prescription'}
          </button>
        </div>
      </div>

      <div className="card-p mb-4">
        <label className="label text-sm font-semibold mb-2 block">Select Patient *</label>
        <PatientSearch value={patient} onChange={setPatient}/>
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        {[['rx','℞ Prescription'],['vitals','Vitals'],['notes','Notes']].map(([k,l])=>(
          <button key={k} className={`tab ${activeTab===k?'tab-active':'tab-idle'}`} onClick={()=>setActiveTab(k)}>{l}</button>
        ))}
      </div>

      {activeTab==='rx' && (
        <div className="space-y-4">
          <div className="card-p grid grid-cols-2 gap-4">
            <div><label className="label">Chief Complaint</label>
              <input className="input" placeholder="e.g. Fever with headache for 3 days..." value={form.chief_complaint} onChange={e=>setForm(p=>({...p,chief_complaint:e.target.value}))}/></div>
            <div><label className="label">Diagnosis</label>
              <input className="input" placeholder="e.g. Viral fever, T2DM..." value={form.diagnosis} onChange={e=>setForm(p=>({...p,diagnosis:e.target.value}))}/></div>
          </div>
          <div className="card-p">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Pill size={16} className="text-primary"/>Medications</h3>
              <button className="btn-secondary btn-sm" onClick={addMed}><Plus size={13}/>Add</button>
            </div>
            <div className="space-y-3">
              {medicines.map((m,i)=><MedRow key={i} med={m} idx={i} onChange={p=>updateMed(i,p)} onRemove={()=>removeMed(i)}/>)}
            </div>
          </div>
          <div className="card-p">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><FlaskConical size={16} className="text-blue-600"/>Lab Investigations</h3>
              <button className="btn-secondary btn-sm" onClick={addLab}><Plus size={13}/>Add Test</button>
            </div>
            {labTests.length===0
              ? <p className="text-sm text-gray-400 text-center py-4">No lab tests added.</p>
              : <div className="space-y-2">{labTests.map((l,i)=><LabRow key={i} test={l} onChange={p=>updateLab(i,p)} onRemove={()=>removeLab(i)}/>)}</div>}
          </div>
          <div className="card-p grid grid-cols-2 gap-4">
            <div><label className="label">Advice / Instructions</label>
              <textarea className="input resize-none h-20" placeholder="Rest, diet advice..." value={form.advice} onChange={e=>setForm(p=>({...p,advice:e.target.value}))}/></div>
            <div className="space-y-3">
              <div><label className="label">Follow-up Date</label>
                <input className="input" type="date" value={form.follow_up_date} onChange={e=>setForm(p=>({...p,follow_up_date:e.target.value}))}/></div>
              <div><label className="label">Internal Notes</label>
                <input className="input" placeholder="Internal reference..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
            </div>
          </div>
        </div>
      )}

      {activeTab==='vitals' && (
        <div className="card-p">
          {patient ? <VitalsForm patient={patient} onSaved={()=>setActiveTab('rx')}/> : <p className="text-center py-10 text-gray-400">Select a patient first.</p>}
        </div>
      )}

      {activeTab==='notes' && (
        <div className="card-p space-y-4">
          <div><label className="label">Detailed Complaint</label>
            <textarea className="input resize-none h-28" value={form.chief_complaint} onChange={e=>setForm(p=>({...p,chief_complaint:e.target.value}))}/></div>
          <div><label className="label">Diagnosis</label>
            <textarea className="input resize-none h-20" value={form.diagnosis} onChange={e=>setForm(p=>({...p,diagnosis:e.target.value}))}/></div>
          <div><label className="label">Internal Notes</label>
            <textarea className="input resize-none h-20" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
        </div>
      )}
    </div>
  )
}
