import { Search } from 'lucide-react'
export default function SearchInput({ value, onChange, placeholder='Search...' }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
      <input className="input pl-9 pr-3 py-2" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
    </div>
  )
}
