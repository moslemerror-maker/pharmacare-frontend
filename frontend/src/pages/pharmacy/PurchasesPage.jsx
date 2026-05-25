import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'

export default function PurchasesPage() {
  const navigate = useNavigate()
  const {data,isLoading} = useQuery({queryKey:['purchases'],queryFn:()=>api.get('/purchases').then(r=>r.data)})
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-gray-900">Purchases / GRN</h1><p className="text-xs text-gray-400">Inward stock with batch tracking</p></div>
        <button className="btn-primary" onClick={()=>navigate('/purchases/new')}><Plus size={15}/>New GRN</button>
      </div>
      <div className="card">
        {isLoading ? <div className="p-8 text-center text-gray-400">Loading…</div> : (
          <table className="w-full">
            <thead><tr><th className="th">GRN No.</th><th className="th">Date</th><th className="th">Supplier</th><th className="th">Invoice No.</th><th className="th">Total</th><th className="th">GST</th><th className="th">Payment</th></tr></thead>
            <tbody>
              {(data?.data||[]).map(g=>(
                <tr key={g.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>navigate(`/purchases/${g.id}`)}>
                  <td className="td font-mono text-xs font-semibold text-primary">{g.grn_number}</td>
                  <td className="td text-xs">{fmt.date(g.received_date)}</td>
                  <td className="td font-medium">{g.supplier_name||'—'}</td>
                  <td className="td text-xs">{g.invoice_number||'—'}</td>
                  <td className="td font-bold text-primary">{fmt.currency(g.total_amount)}</td>
                  <td className="td text-xs">{fmt.currency(parseFloat(g.cgst_amount||0)+parseFloat(g.sgst_amount||0))}</td>
                  <td className="td"><span className={`badge ${g.payment_status==='Paid'?'badge-green':g.payment_status==='Partial'?'badge-yellow':'badge-red'}`}>{g.payment_status}</span></td>
                </tr>
              ))}
              {!data?.data?.length&&<tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No GRNs found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
