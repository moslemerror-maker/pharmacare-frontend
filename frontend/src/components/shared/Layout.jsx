import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/authStore'
import { LayoutDashboard,Users,ClipboardList,Pill,ShoppingCart,Package,Receipt,TrendingUp,Settings,LogOut,UserCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../../utils/api'

const NAV = [
  { path:'/', icon:LayoutDashboard, label:'Dashboard', end:true },
  { path:'/patients', icon:UserCircle, label:'Patients' },
  { path:'/prescriptions', icon:ClipboardList, label:'Prescriptions' },
  { divider:'Pharmacy' },
  { path:'/sales', icon:ShoppingCart, label:'Sales / Billing', roles:['pharmacist','cashier','admin'] },
  { path:'/inventory', icon:Package, label:'Inventory', roles:['pharmacist','admin','manager'] },
  { path:'/purchases', icon:Receipt, label:'Purchases (GRN)', roles:['pharmacist','admin','manager'] },
  { path:'/medicines', icon:Pill, label:'Medicines', roles:['pharmacist','admin','manager'] },
  { divider:'Reports & Admin' },
  { path:'/reports', icon:TrendingUp, label:'Reports / MIS', roles:['admin','manager','pharmacist'] },
  { path:'/users', icon:Users, label:'Users & Roles', roles:['admin'] },
  { path:'/settings', icon:Settings, label:'Settings', roles:['admin'] },
]

function AlertBadge() {
  const { data } = useQuery({ queryKey:['alerts'], queryFn:()=>api.get('/dashboard').then(r=>r.data.alerts), refetchInterval:60000, select:d=>(d.lowStock||0)+(d.outOfStock||0) })
  if (!data) return null
  return <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{data}</span>
}

export default function Layout() {
  const { user, logout, isRole } = useAuth()
  const navigate = useNavigate()
  const visible = NAV.filter(n => { if(n.divider)return true; if(!n.roles?.length)return true; return isRole(...n.roles) })
  const initials = user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'U'
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-xl">💊</div>
            <div><p className="font-bold text-gray-900 text-[15px]">PharmaCare Pro</p><p className="text-[11px] text-gray-400">Management System</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {visible.map((item,i) => {
            if(item.divider) return (
              <div key={i} className="mt-4 mb-1 px-2">
                <hr className="border-gray-100 mb-2.5"/>
                <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-[0.13em]">{item.divider}</p>
              </div>
            )
            const Icon=item.icon
            return (
              <NavLink key={item.path} to={item.path} end={item.end}
                className={({isActive})=>`nav-item mt-0.5 ${isActive?'active':''}`}>
                <Icon size={16} strokeWidth={1.9} className="flex-shrink-0"/>
                <span className="flex-1 truncate">{item.label}</span>
                {item.path==='/inventory' && <AlertBadge/>}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-primary">{initials}</span></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p><p className="text-[11px] text-gray-400 capitalize">{user?.role_name}</p></div>
            <button onClick={()=>{logout();navigate('/login')}} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400"><LogOut size={15}/></button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><div className="page-enter min-h-full"><Outlet /></div></main>
    </div>
  )
}
