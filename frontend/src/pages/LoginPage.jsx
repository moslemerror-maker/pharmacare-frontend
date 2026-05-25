import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

const DEMOS = [
  { role:'Admin',      email:'admin@pharmacare.com',      pass:'Admin@123',  color:'bg-purple-100 text-purple-700' },
  { role:'Doctor',     email:'doctor@pharmacare.com',     pass:'Doctor@123', color:'bg-blue-100 text-blue-700' },
  { role:'Pharmacist', email:'pharmacist@pharmacare.com', pass:'Pharm@123',  color:'bg-green-100 text-green-700' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome, ${user.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-3 shadow-lg">
              <span className="text-2xl">💊</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">PharmaCare Pro</h1>
            <p className="text-gray-400 text-xs mt-1">Pharmacy Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@pharmacy.com"
                value={email} onChange={e=>setEmail(e.target.value)} autoFocus required/>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass?'text':'password'} className="input pr-10" placeholder="••••••••"
                  value={password} onChange={e=>setPassword(e.target.value)} required/>
                <button type="button" onClick={()=>setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm mt-1">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo logins */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center mb-3 font-medium uppercase tracking-wide">Demo logins</p>
            <div className="space-y-1.5">
              {DEMOS.map(d=>(
                <button key={d.role} onClick={()=>{setEmail(d.email);setPassword(d.pass)}}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.color}`}>{d.role}</span>
                  <span className="text-xs text-gray-400">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
