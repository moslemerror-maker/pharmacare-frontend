import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Save, Settings, Building2, Key } from 'lucide-react'
import { useAuth } from '../../store/authStore'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('pharmacy')
  const [pwd, setPwd] = useState({ currentPassword:'', newPassword:'', confirm:'' })

  const { data: info } = useQuery({
    queryKey: ['pharmacy-info'],
    queryFn: () => api.get('/dashboard').then(() => null), // placeholder — extend API later
  })

  const changePwd = useMutation({
    mutationFn: () => {
      if (pwd.newPassword !== pwd.confirm) throw new Error('Passwords do not match')
      return api.post('/auth/change-password', { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
    },
    onSuccess: () => { toast.success('Password changed'); setPwd({ currentPassword:'', newPassword:'', confirm:'' }) },
    onError: e => toast.error(e.message || e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-400">Pharmacy configuration and account settings</p>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {[['pharmacy','Pharmacy Info'],['account','My Account'],['about','About']].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'tab-active':'tab-idle'}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'pharmacy' && (
        <div className="card-p space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Building2 size={20} className="text-primary"/>
            <h2 className="font-semibold text-gray-900">Pharmacy Information</h2>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            📋 Pharmacy info is seeded in the database. To update, run an SQL UPDATE on the <code>pharmacy_info</code> table via Neon console, or we'll add a UI form in the next iteration.
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Name','PharmaCare Medical Store'],
              ['Address','456 Health Avenue, Park Street'],
              ['City / State','Kolkata, West Bengal'],
              ['GST Number','19AABCP1234C1Z5'],
              ['Drug License','WB-KOL-DL-012345'],
              ['Phone','9000000010'],
            ].map(([k,v])=>(
              <div key={k} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                <p className="font-medium text-gray-800">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-4">
          <div className="card-p">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Key size={16}/>Change Password</h2>
            <div className="space-y-3 max-w-sm">
              <div><label className="label">Current Password</label>
                <input className="input" type="password" value={pwd.currentPassword} onChange={e=>setPwd(p=>({...p,currentPassword:e.target.value}))}/></div>
              <div><label className="label">New Password (min 8 chars)</label>
                <input className="input" type="password" value={pwd.newPassword} onChange={e=>setPwd(p=>({...p,newPassword:e.target.value}))}/></div>
              <div><label className="label">Confirm New Password</label>
                <input className="input" type="password" value={pwd.confirm} onChange={e=>setPwd(p=>({...p,confirm:e.target.value}))}/></div>
              <button className="btn-primary" disabled={!pwd.currentPassword||!pwd.newPassword||changePwd.isPending} onClick={()=>changePwd.mutate()}>
                <Save size={14}/>{changePwd.isPending?'Saving...':'Change Password'}
              </button>
            </div>
          </div>
          <div className="card-p">
            <h2 className="font-semibold text-gray-900 mb-3">My Profile</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-lg font-bold text-primary">
                {user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className="badge badge-blue mt-1">{user?.role_name}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div className="card-p text-center py-10">
          <div className="text-5xl mb-4">💊</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">PharmaCare Pro</h2>
          <p className="text-gray-500 text-sm mb-4">Complete Pharmacy & Doctor Management System</p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Backend: Node.js + Express · Railway</p>
            <p>Database: PostgreSQL · Neon</p>
            <p>Frontend: React + Vite · Vercel</p>
            <p className="mt-3 text-primary font-medium">Cloud-first · Local-ready</p>
          </div>
        </div>
      )}
    </div>
  )
}
