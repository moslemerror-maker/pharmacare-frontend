import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery,useMutation } from '@tanstack/react-query'
import { Plus,Trash2,ArrowLeft } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'
import toast from 'react-hot-toast'

const BLANK = {medicine_id:'',medicine_name:'',batch_number:'',expiry_date:'',quantity:'',free_quantity:'0',purchase_rate:'',mrp:'',discount_percent:'0',cgst_percent:'6',sgst_percent:'6'}

export default function NewGRN() {
  const navigate = useNavigate()
  const [supplierId,setSupplierId] = useState('')
  const [invoiceNo,setInvoiceNo] = useState('')
  const [invoiceDate,setInvoiceDate] = useState('')
  const [items,setItems] = useState([{...BLANK}])
  const [medSearches,setMedSearches] = useState([''])
  const [medResults,setMedResults] = useState([])
  const [activeIdx,setActiveIdx] = useState(null)

  const {data:suppliers} = useQuery({queryKey:['suppliers'],queryFn:()=>api.get('/suppliers').then(r=>r.data)})

  const searchMed = async (idx,val) => {
    const searches = [...medSearches]; searches[idx]=val; setMedSearches(searches)
    setItems(it=>it.map((x,i)=>i===idx?{...x,medicine_name:val,medicine_id:''}:x))
    setActiveIdx(idx)
    if(val.length<2) return setMedResults([])
    const {data} = await api.get('/medicines',{params:{search:val,limit:12}})
    setMedResults(data.map(d=>({...d,_idx:idx})))
  }

  const pickMed = (m) => {
    setItems(it=>it.map((x,i)=>i===m._idx?{...x,medicine_id:m.id,medicine_name:m.name}:x))
    const searches=[...medSearches]; searches[m._idx]=m.name; setMedSearches(searches)
    setMedResults([]); setActiveIdx(null)
  }

  const upd = (idx,key,val) => setItems(it=>it.map((x,i)=>i===idx?{...x,[key]:val}:x))

  const subtotal = items.reduce((a,it)=>{
    const qty=parseFloat(it.quantity)||0, rate=parseFloat(it.purchase_rate)||0, disc=parseFloat(it.discount_percent)||0
    return a + qty*rate*(1-disc/100)
  },0)
  const gst = items.reduce((a,it)=>{
    const qty=parseFloat(it.quantity)||0, rate=parseFloat(it.purchase_rate)||0, disc=parseFloat(it.discount_percent)||0
    const base=qty*rate*(1-disc/100)
    return a+base*(parseFloat(it.cgst_percent||0)+parseFloat(it.sgst_percent||0))/100
  },0)

  const mut = useMutation({
    mutationFn:d=>api.post('/purchases',d).then(r=>r.data),
    onSuccess:r=>{ toast.success(`GRN ${r.grn_number} created`); navigate('/purchases') },
    onError:e=>toast.error(e.response?.data?.error||'Failed')
  })

  const submit = () => {
    const validItems = items.filter(i=>i.medicine_id&&i.batch_number&&i.expiry_date&&i.quantity&&i.purchase_rate&&i.mrp)
    if(!validItems.length) return toast.error('Add at least one valid item')
    mut.mutate({supplier_id:supplierId?parseInt(supplierId):undefined,invoice_number:invoiceNo,invoice_date:invoiceDate||undefined,items:validItems})
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={()=>navigate(-1)} className="btn-ghost btn-sm mb-4"><ArrowLeft size={14}/>Back</button>
      <h1 className="text-xl font-bold text-gray-900 mb-5">New GRN — Inward Stock</h1>

      <div className="card-p mb-4">
        <div className="grid grid-cols-3 gap-4">
          <div><label className="label">Supplier</label>
            <select className="select" value={supplierId} onChange={e=>setSupplierId(e.target.value)}>
              <option value="">Select supplier</option>
              {(suppliers||[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Invoice Number</label><input className="input" value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} placeholder="Supplier invoice no."/></div>
          <div><label className="label">Invoice Date</label><input type="date" className="input" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)}/></div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Items</h2>
          <button className="btn-secondary btn-sm" onClick={()=>{setItems(i=>[...i,{...BLANK}]);setMedSearches(s=>[...s,''])}}><Plus size={13}/>Add Row</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th className="th">Medicine</th><th className="th">Batch No.</th><th className="th">Expiry</th><th className="th">Qty</th><th className="th">Free</th><th className="th">Rate</th><th className="th">MRP</th><th className="th">Disc%</th><th className="th">CGST%</th><th className="th">SGST%</th><th className="th">Amount</th><th className="th"></th></tr></thead>
            <tbody>
              {items.map((item,idx)=>{
                const lineAmt = (parseFloat(item.quantity)||0)*(parseFloat(item.purchase_rate)||0)*(1-(parseFloat(item.discount_percent)||0)/100)
                const lineGst = lineAmt*((parseFloat(item.cgst_percent||0)+parseFloat(item.sgst_percent||0))/100)
                return (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="td relative min-w-[160px]">
                      <input className="input py-1 text-xs" value={medSearches[idx]} onChange={e=>searchMed(idx,e.target.value)} placeholder="Search…"/>
                      {medResults.length>0&&activeIdx===idx&&(
                        <div className="absolute z-30 top-full left-0 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                          {medResults.map(m=><div key={m.id} className="px-3 py-1.5 hover:bg-gray-50 cursor-pointer" onClick={()=>pickMed(m)}><p className="font-medium">{m.name}</p><p className="text-gray-400 text-[10px]">{m.form} · {m.strength}</p></div>)}
                        </div>
                      )}
                    </td>
                    <td className="td"><input className="input py-1 w-24" value={item.batch_number} onChange={e=>upd(idx,'batch_number',e.target.value)} placeholder="Batch"/></td>
                    <td className="td"><input type="month" className="input py-1 w-28" value={item.expiry_date} onChange={e=>upd(idx,'expiry_date',e.target.value+'-01')}/></td>
                    <td className="td"><input type="number" className="input py-1 w-16" value={item.quantity} onChange={e=>upd(idx,'quantity',e.target.value)} placeholder="0"/></td>
                    <td className="td"><input type="number" className="input py-1 w-14" value={item.free_quantity} onChange={e=>upd(idx,'free_quantity',e.target.value)}/></td>
                    <td className="td"><input type="number" className="input py-1 w-20" value={item.purchase_rate} onChange={e=>upd(idx,'purchase_rate',e.target.value)} placeholder="0.00"/></td>
                    <td className="td"><input type="number" className="input py-1 w-20" value={item.mrp} onChange={e=>upd(idx,'mrp',e.target.value)} placeholder="0.00"/></td>
                    <td className="td"><input type="number" className="input py-1 w-14" value={item.discount_percent} onChange={e=>upd(idx,'discount_percent',e.target.value)}/></td>
                    <td className="td"><input type="number" className="input py-1 w-14" value={item.cgst_percent} onChange={e=>upd(idx,'cgst_percent',e.target.value)}/></td>
                    <td className="td"><input type="number" className="input py-1 w-14" value={item.sgst_percent} onChange={e=>upd(idx,'sgst_percent',e.target.value)}/></td>
                    <td className="td font-semibold whitespace-nowrap">{fmt.currency(lineAmt+lineGst)}</td>
                    <td className="td"><button className="text-red-400 hover:text-red-600" onClick={()=>{setItems(i=>i.filter((_,j)=>j!==idx));setMedSearches(s=>s.filter((_,j)=>j!==idx))}}><Trash2 size={13}/></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end gap-8 text-sm">
          <span className="text-gray-500">Subtotal: <strong>{fmt.currency(subtotal)}</strong></span>
          <span className="text-gray-500">GST: <strong>{fmt.currency(gst)}</strong></span>
          <span className="text-lg font-bold text-primary">Total: {fmt.currency(subtotal+gst)}</span>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={()=>navigate(-1)}>Cancel</button>
        <button className="btn-primary px-8" disabled={mut.isPending} onClick={submit}>{mut.isPending?'Saving…':'Save GRN & Update Stock'}</button>
      </div>
    </div>
  )
}
