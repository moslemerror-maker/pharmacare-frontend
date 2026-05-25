import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Save, Users, Shield } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'
import toast from 'react-hot-toast'

function UserModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', role_name:'pharmacist', specialization:'', registration_number:'', qualification:'', clinic_name:'' })
  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const { data: roles=[] } = useQuery({ queryKey:['roles'], queryFn:()=>api.get('/users/roles').then(r=>r.data) })

  const mutation = useMutation({
    mutationFn: () => api.post('/users', form),
    onSuccess: () => { toast.success('User created'); qc.invalidateQueries(['users']); onClose() },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal max-w-lg w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Add New User</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)}/></div>
            <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
            <div><label className="label">Password *</label><input className="input" type="password" placeholder="Min 8 chars" value={form.password} onChange={e=>set('password',e.target.value)}/></div>
            <div>
              <label className="label">Role *</label>
              <select className="select" value={form.role_name} onChange={e=>set('role_name',e.target.value)}>
                {roles.map(r=><option key={r.name} value={r.name}>{r.name.charAt(0).toUpperCase()+r.name.slice(1)}</option>)}
              </select>
            </div>
          </div>
          {form.role_name === 'doctor' && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor Profile</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Registration No. *</label><input className="input" value={form.registration_number} onChange={e=>set('registration_number',e.target.value)}/></div>
                <div><label className="label">Specialization *</label><input className="input" value={form.specialization} onChange={e=>set('specialization',e.target.value)}/></div>
                <div><label className="label">Qualification</label><input className="input" placeholder="MBBS, MD..." value={form.qualification} onChange={e=>set('qualification',e.target.value)}/></div>
                <div><label className="label">Clinic Name</label><input className="input" value={form.clinic_name} onChange={e=>set('clinic_name',e.target.value)}/></div>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!form.name||!form.email||!form.password||mutation.isPending} onClick={()=>mutation.mutate()}>
            <Save size={14}/>{mutation.isPending?'Creating...':'Create User'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ROLE_BADGE = { admin:'badge-red', doctor:'badge-blue', pharmacist:'badge-green', cashier:'badge-gray', manager:'badge-purple' }
const ROLE_PERMS = {
  admin:      'Full access to all modules',
  doctor:     'Write prescriptions, view patients, order lab tests',
  pharmacist: 'Sales, inventory, billing, view prescriptions',
  cashier:    'Sales and billing only',
  manager:    'Reports, inventory, purchases — no sales',
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)

  const { data: users=[], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r=>r.data),
  })

  const toggleActive = useMutation({
    mutationFn: ({id, name, phone, is_active}) => api.put(`/users/${id}`, { name, phone, is_active: !is_active }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['users']) },
  })

  const byRole = users.reduce((acc, u) => {
    const r = u.role_name
    if (!acc[r]) acc[r] = []
    acc[r].push(u)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-xs text-gray-400">{users.length} users · Role-based access control</p></div>
        <button className="btn-primary" onClick={()=>setModal(true)}><Plus size={15}/>Add User</button>
      </div>

      {/* Roles reference */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Object.entries(ROLE_PERMS).map(([role, desc])=>(
          <div key={role} className="card-p text-center">
            <Shield size={18} className="mx-auto mb-1 text-primary opacity-60"/>
            <p className={`badge ${ROLE_BADGE[role]||'badge-gray'} mb-1`}>{role}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {isLoading ? <div className="text-center py-10 text-gray-400">Loading...</div> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="th">Name</th><th className="th">Email</th>
              <th className="th">Phone</th><th className="th">Role</th>
              <th className="th">Created</th><th className="th">Status</th>
            </tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!u.is_active?'opacity-50':''}`}>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {u.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                    </div>
                  </td>
                  <td className="td text-gray-500">{u.email}</td>
                  <td className="td text-gray-500">{u.phone||'—'}</td>
                  <td className="td"><span className={`badge ${ROLE_BADGE[u.role_name]||'badge-gray'}`}>{u.role_name}</span></td>
                  <td className="td text-xs text-gray-400">{fmt.date(u.created_at)}</td>
                  <td className="td">
                    <button
                      onClick={()=>toggleActive.mutate(u)}
                      className={`badge cursor-pointer ${u.is_active?'badge-green':'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <UserModal onClose={()=>setModal(false)} />}
    </div>
  )
}
