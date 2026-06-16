import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Save, Shield, Pencil, User, Eye, EyeOff } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'
import toast from 'react-hot-toast'

const ALLOWED_ROLES = ['doctor', 'pharmacist', 'admin']

const ROLE_BADGE = {
  admin:      'badge-red',
  doctor:     'badge-blue',
  pharmacist: 'badge-green',
  cashier:    'badge-gray',
  manager:    'badge-purple',
}

const ROLE_PERMS = {
  admin:      'Full access — all modules, user management, settings',
  doctor:     'Write prescriptions, view patients, order lab tests',
  pharmacist: 'Sales, billing, inventory, purchases, view prescriptions',
}

function UserModal({ onClose }) {
  const qc = useQueryClient()
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '', password: '',
    role_name: 'pharmacist',
    specialization: '', registration_number: '', qualification: '',
    clinic_name: '', clinic_address: '', clinic_phone: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => api.post('/users', form),
    onSuccess: () => { toast.success('User created'); qc.invalidateQueries(['users']); onClose() },
    onError: e => toast.error(e.response?.data?.error || 'Failed to create user'),
  })

  const canSubmit = form.name.trim() && form.username.trim() && form.password.length >= 6 && !mutation.isPending

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-lg w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Add New User</h2>
            <p className="text-xs text-gray-400 mt-0.5">Username and password required · Email is optional</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Account details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" placeholder="e.g. Dr. Rajesh Kumar" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Username * <span className="text-gray-400 font-normal">(for login)</span></label>
              <input className="input font-mono" placeholder="e.g. dr.rajesh" value={form.username}
                onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, ''))} />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="select" value={form.role_name} onChange={e => set('role_name', e.target.value)}>
                {ALLOWED_ROLES.map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Password * <span className="text-gray-400 font-normal">(min 6 chars)</span></label>
              <div className="relative">
                <input className="input pr-9" type={showPass ? 'text' : 'password'} placeholder="Set login password"
                  value={form.password} onChange={e => set('password', e.target.value)} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="input" type="email" placeholder="user@clinic.com (optional)" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          </div>

          {/* Doctor profile fields */}
          {form.role_name === 'doctor' && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor Profile</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Registration No. *</label>
                  <input className="input" placeholder="MCI-XXXX-XXXXXX" value={form.registration_number} onChange={e => set('registration_number', e.target.value)} />
                </div>
                <div>
                  <label className="label">Specialization *</label>
                  <input className="input" placeholder="General Physician" value={form.specialization} onChange={e => set('specialization', e.target.value)} />
                </div>
                <div>
                  <label className="label">Qualification</label>
                  <input className="input" placeholder="MBBS, MD..." value={form.qualification} onChange={e => set('qualification', e.target.value)} />
                </div>
                <div>
                  <label className="label">Clinic Name</label>
                  <input className="input" value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">Clinic Address</label>
                  <input className="input" placeholder="Street, City, State – PIN" value={form.clinic_address} onChange={e => set('clinic_address', e.target.value)} />
                </div>
                <div>
                  <label className="label">Clinic Phone</label>
                  <input className="input" placeholder="+91 XXXXX XXXXX" value={form.clinic_phone} onChange={e => set('clinic_phone', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!canSubmit} onClick={() => mutation.mutate()}>
            <Save size={14} />{mutation.isPending ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DoctorProfileModal({ userId, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(null)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useQuery({
    queryKey: ['doctor-profile', userId],
    queryFn: () => api.get('/users/doctors').then(r => {
      const doc = r.data.find(d => d.id === userId) || {}
      setForm({
        specialization: doc.specialization || '',
        registration_number: doc.registration_number || '',
        qualification: doc.qualification || '',
        clinic_name: doc.clinic_name || '',
        clinic_address: doc.clinic_address || '',
        clinic_phone: doc.clinic_phone || '',
      })
      return doc
    }),
    enabled: !!userId,
  })

  const mutation = useMutation({
    mutationFn: () => api.put(`/users/${userId}/doctor-profile`, form),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries(['users']); onClose() },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })

  if (!form) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-lg w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Edit Doctor Profile</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Registration No.</label><input className="input" value={form.registration_number} onChange={e => set('registration_number', e.target.value)} /></div>
            <div><label className="label">Specialization</label><input className="input" value={form.specialization} onChange={e => set('specialization', e.target.value)} /></div>
            <div><label className="label">Qualification</label><input className="input" placeholder="MBBS, MD..." value={form.qualification} onChange={e => set('qualification', e.target.value)} /></div>
            <div><label className="label">Clinic Name</label><input className="input" value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)} /></div>
            <div className="col-span-2"><label className="label">Clinic Address</label><input className="input" placeholder="Street, City, State – PIN" value={form.clinic_address} onChange={e => set('clinic_address', e.target.value)} /></div>
            <div><label className="label">Clinic Phone</label><input className="input" placeholder="+91 XXXXX XXXXX" value={form.clinic_phone} onChange={e => set('clinic_phone', e.target.value)} /></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            <Save size={14} />{mutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editDoctor, setEditDoctor] = useState(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
    staleTime: 30_000,
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, name, phone, username, is_active }) =>
      api.put(`/users/${id}`, { name, phone, username, is_active: !is_active }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['users']) },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users & Access Control</h1>
          <p className="text-xs text-gray-400">{users.length} users · Username-based login · Role-based permissions</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={15} />Add User</button>
      </div>

      {/* Roles reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {Object.entries(ROLE_PERMS).map(([role, desc]) => (
          <div key={role} className="card-p flex items-start gap-3">
            <Shield size={16} className="mt-0.5 text-primary opacity-60 flex-shrink-0" />
            <div>
              <span className={`badge ${ROLE_BADGE[role] || 'badge-gray'} mb-1`}>{role}</span>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Loading users...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="th">Name</th>
              <th className="th">Username</th>
              <th className="th">Phone</th>
              <th className="th">Role</th>
              <th className="th">Created</th>
              <th className="th">Status</th>
              <th className="th"></th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {u.name?.split(' ').map(w => w[0]).join('').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        {u.email && <p className="text-xs text-gray-400">{u.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {u.username || <span className="text-gray-300 not-italic font-sans">—</span>}
                    </span>
                  </td>
                  <td className="td text-gray-500 text-xs">{u.phone || '—'}</td>
                  <td className="td"><span className={`badge ${ROLE_BADGE[u.role_name] || 'badge-gray'}`}>{u.role_name}</span></td>
                  <td className="td text-xs text-gray-400">{fmt.date(u.created_at)}</td>
                  <td className="td">
                    <button
                      onClick={() => toggleActive.mutate(u)}
                      className={`badge cursor-pointer hover:opacity-80 ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="td">
                    {u.role_name === 'doctor' && (
                      <button onClick={() => setEditDoctor(u.id)} className="btn-ghost btn-sm p-1.5" title="Edit doctor profile">
                        <Pencil size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && <UserModal onClose={() => setModal(false)} />}
      {editDoctor && <DoctorProfileModal userId={editDoctor} onClose={() => setEditDoctor(null)} />}
    </div>
  )
}
