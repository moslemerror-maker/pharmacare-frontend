import { useState } from 'react'
import { useQuery,useQueryClient,useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus,Search,UserCircle } from 'lucide-react'
import api from '../utils/api'
import { fmt } from '../utils/helpers'
import toast from 'react-hot-toast'

function NewPatientModal({onClose}) {
  const qc = useQueryClient()
  const [f,setF] = useState({name:'',age:'',gender:'Male',phone:'',blood_group:'',allergies:''})
  const mut = useMutation({
    mutationFn: d=>api.post('/patients',d).then(r=>r.data),
    onSuccess:(p)=>{ toast.success(`Patient ${p.patient_id} created`); qc.invalidateQueries(['patients']); onClose() },
    onError:e=>toast.error(e.response?.data?.error||'Failed')
  })
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal max-w-lg p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4">New Patient</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Full Name *</label><input className="input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Patient full name"/></div>
          <div><label className="label">Age</label><input className="input" type="number" value={f.age} onChange={e=>setF({...f,age:e.target.value})} placeholder="Years"/></div>
          <div><label className="label">Gender</label>
            <select className="select" value={f.gender} onChange={e=>setF({...f,gender:e.target.value})}>
              {['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label">Phone</label><input className="input" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="Mobile number"/></div>
          <div><label className="label">Blood Group</label>
            <select className="select" value={f.blood_group} onChange={e=>setF({...f,blood_group:e.target.value})}>
              <option value="">Select</option>
              {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Known Allergies</label><input className="input" value={f.allergies} onChange={e=>setF({...f,allergies:e.target.value})} placeholder="e.g. Penicillin, Sulfa drugs"/></div>
        </div>
        <div className="flex gap-2 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" disabled={!f.name||mut.isPending} onClick={()=>mut.mutate(f)}>{mut.isPending?'Saving…':'Create Patient'}</button>
        </div>
      </div>
    </div>
  )
}

export default function PatientsPage() {
  const navigate = useNavigate()
  const [search,setSearch] = useState('')
  const [showNew,setShowNew] = useState(false)
  const {data,isLoading} = useQuery({
    queryKey:['patients',search],
    queryFn:()=>api.get('/patients',{params:{search,limit:100}}).then(r=>r.data)
  })
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-gray-900">Patients</h1><p className="text-xs text-gray-400">{data?.total||0} registered</p></div>
        <button className="btn-primary" onClick={()=>setShowNew(true)}><Plus size={15}/>New Patient</button>
      </div>
      <div className="card mb-4">
        <div className="p-3 flex gap-3 items-center border-b border-gray-100">
          <Search size={15} className="text-gray-400"/>
          <input className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent" placeholder="Search by name, phone or patient ID…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {isLoading ? <div className="p-8 text-center text-gray-400 text-sm">Loading…</div> : (
          <table className="w-full">
            <thead><tr><th className="th">Patient ID</th><th className="th">Name</th><th className="th">Age/Gender</th><th className="th">Phone</th><th className="th">Blood Group</th><th className="th">Allergies</th></tr></thead>
            <tbody>
              {(data?.data||[]).map(p=>(
                <tr key={p.id} onClick={()=>navigate(`/patients/${p.id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="td font-mono text-xs text-primary font-semibold">{p.patient_id}</td>
                  <td className="td font-medium text-gray-900">{p.name}</td>
                  <td className="td">{p.age?`${p.age} yrs`:''}{p.age&&p.gender?' · ':''}{p.gender||''}</td>
                  <td className="td">{p.phone||'—'}</td>
                  <td className="td">{p.blood_group?<span className="badge-red badge">{p.blood_group}</span>:'—'}</td>
                  <td className="td text-xs text-red-600">{p.allergies||'—'}</td>
                </tr>
              ))}
              {!data?.data?.length && <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No patients found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {showNew && <NewPatientModal onClose={()=>setShowNew(false)}/>}
    </div>
  )
}
