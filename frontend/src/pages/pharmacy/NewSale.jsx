import { useState,useEffect } from 'react'
import { useNavigate,useSearchParams } from 'react-router-dom'
import { useQuery,useMutation } from '@tanstack/react-query'
import { Plus,Trash2,ArrowLeft,Search,ShoppingCart,Scan } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'
import toast from 'react-hot-toast'

const PAYMENT_MODES = ['Cash','Card','UPI','Credit','Insurance']

export default function NewSale() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [patientId,setPatientId] = useState(sp.get('patient_id')||'')
  const [prescriptionId,setPrescriptionId] = useState(sp.get('prescription_id')||'')
  const [patientSearch,setPatientSearch] = useState('')
  const [items,setItems] = useState([])
  const [medSearch,setMedSearch] = useState('')
  const [medResults,setMedResults] = useState([])
  const [activeMedIdx,setActiveMedIdx] = useState(null)
  const [paymentMode,setPaymentMode] = useState('Cash')
  const [discount,setDiscount] = useState(0)
  const [amountPaid,setAmountPaid] = useState('')
  const [barcodeInput,setBarcodeInput] = useState('')

  const {data:patientResults} = useQuery({queryKey:['pt-search-sale',patientSearch],queryFn:()=>api.get('/patients',{params:{search:patientSearch,limit:8}}).then(r=>r.data),enabled:patientSearch.length>1})
  const {data:selectedPatient} = useQuery({queryKey:['patient',patientId],queryFn:()=>api.get(`/patients/${patientId}`).then(r=>r.data),enabled:!!patientId})
  const {data:rxData} = useQuery({queryKey:['rx-sale',prescriptionId],queryFn:()=>api.get(`/prescriptions/${prescriptionId}`).then(r=>r.data),enabled:!!prescriptionId})

  // Pre-fill from prescription
  useEffect(()=>{
    if(!rxData?.medicines?.length) return
    const load = async () => {
      const newItems = []
      for(const m of rxData.medicines) {
        if(!m.medicine_id) continue
        try {
          const {data:batches} = await api.get(`/inventory/batches/${m.medicine_id}`)
          if(batches.length) {
            const b = batches[0]
            newItems.push({medicine_id:m.medicine_id,medicine_name:m.medicine_name,batch_number:b.batch_number,mrp:parseFloat(b.mrp),quantity:m.quantity||1,discount_percent:0,available_qty:b.available_qty,batches})
          }
        } catch{}
      }
      if(newItems.length) setItems(newItems)
    }
    load()
  },[rxData])

  const searchMedicine = async (val) => {
    setMedSearch(val)
    if(val.length<2) return setMedResults([])
    const {data} = await api.get('/medicines',{params:{search:val,limit:12}})
    setMedResults(data)
  }

  const scanBarcode = async () => {
    if(!barcodeInput) return
    try {
      const {data} = await api.get(`/inventory/barcode/${barcodeInput}`)
      if(!data.batches?.length) return toast.error('No stock for this barcode')
      const b = data.batches[0]
      const exists = items.findIndex(i=>i.medicine_id===data.medicine.id&&i.batch_number===b.batch_number)
      if(exists>=0) { setItems(it=>it.map((x,i)=>i===exists?{...x,quantity:x.quantity+1}:x)) }
      else { setItems(it=>[...it,{medicine_id:data.medicine.id,medicine_name:data.medicine.name,batch_number:b.batch_number,mrp:parseFloat(b.mrp),quantity:1,discount_percent:0,available_qty:b.available_qty,batches:data.batches}]) }
      setBarcodeInput('')
      toast.success(`Added: ${data.medicine.name}`)
    } catch { toast.error('Medicine not found') }
  }

  const addMedicine = async (med) => {
    const {data:batches} = await api.get(`/inventory/batches/${med.id}`)
    if(!batches.length) { toast.error('No stock available'); return }
    const b = batches[0]
    setItems(it=>[...it,{medicine_id:med.id,medicine_name:med.name,batch_number:b.batch_number,mrp:parseFloat(b.mrp),quantity:1,discount_percent:0,available_qty:b.available_qty,batches}])
    setMedSearch(''); setMedResults([])
  }

  const changeBatch = async (idx,batchNo) => {
    const item = items[idx]
    const b = item.batches.find(x=>x.batch_number===batchNo)
    if(!b) return
    setItems(it=>it.map((x,i)=>i===idx?{...x,batch_number:batchNo,mrp:parseFloat(b.mrp),available_qty:b.available_qty}:x))
  }

  // Totals
  const subtotal = items.reduce((a,it)=>a+(it.quantity*it.mrp*(1-(it.discount_percent||0)/100)),0)
  const discAmt  = subtotal * (discount/100)
  const afterDisc= subtotal - discAmt
  const gstAmt   = afterDisc * 0.12 // simplified; actual per-item in backend
  const total    = Math.round(afterDisc)
  const balance  = total - (parseFloat(amountPaid)||0)

  const mut = useMutation({
    mutationFn:d=>api.post('/sales',d).then(r=>r.data),
    onSuccess:(r)=>{ toast.success(`Bill ${r.bill_number} created!`); window.open(`https://web-production-36db0.up.railway.app/api/sales/${r.id}/pdf`,'_blank'); navigate('/sales') },
    onError:e=>toast.error(e.response?.data?.error||'Failed to create bill')
  })

  const submit = () => {
    if(!items.length) return toast.error('Add at least one medicine')
    const payload = { patient_id:patientId?parseInt(patientId):undefined, prescription_id:prescriptionId?parseInt(prescriptionId):undefined, payment_mode:paymentMode, discount_percent:parseFloat(discount)||0, amount_paid:parseFloat(amountPaid)||total, items:items.map(it=>({medicine_id:it.medicine_id,batch_number:it.batch_number,quantity:parseInt(it.quantity),mrp:it.mrp,discount_percent:parseFloat(it.discount_percent)||0})) }
    mut.mutate(payload)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={()=>navigate(-1)} className="btn-ghost btn-sm mb-4"><ArrowLeft size={14}/>Back</button>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><ShoppingCart size={18} className="text-primary"/></div>
        <div><h1 className="text-xl font-bold text-gray-900">New Sale / Bill</h1>{prescriptionId&&<p className="text-xs text-green-600">📋 Linked to Prescription</p>}</div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          {/* Patient */}
          <div className="card-p">
            <h2 className="font-semibold text-sm text-gray-700 mb-2">Patient (Optional)</h2>
            {selectedPatient ? (
              <div className="flex items-center justify-between bg-green-50 rounded-xl p-3">
                <div><p className="font-medium text-sm">{selectedPatient.name}</p><p className="text-xs text-gray-400">{selectedPatient.patient_id}</p></div>
                <button className="btn-ghost btn-sm" onClick={()=>setPatientId('')}>×</button>
              </div>
            ) : (
              <div className="relative">
                <input className="input" placeholder="Search patient…" value={patientSearch} onChange={e=>setPatientSearch(e.target.value)}/>
                {patientResults?.data?.length>0&&patientSearch&&(
                  <div className="absolute z-30 top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                    {patientResults.data.map(p=><div key={p.id} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={()=>{setPatientId(String(p.id));setPatientSearch('')}}>{p.name} <span className="text-gray-400 text-xs">· {p.phone}</span></div>)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Barcode scanner */}
          <div className="card-p">
            <h2 className="font-semibold text-sm text-gray-700 mb-2">Barcode / Manual Search</h2>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                <Scan size={14} className="text-gray-400"/>
                <input className="flex-1 text-sm outline-none" placeholder="Scan barcode or type…" value={barcodeInput} onChange={e=>setBarcodeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&scanBarcode()}/>
              </div>
              <button className="btn-primary btn-sm" onClick={scanBarcode}>Add</button>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                <Search size={14} className="text-gray-400"/>
                <input className="flex-1 text-sm outline-none" placeholder="Search medicine by name…" value={medSearch} onChange={e=>searchMedicine(e.target.value)}/>
              </div>
              {medResults.length>0&&medSearch&&(
                <div className="absolute z-30 top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden max-h-56 overflow-y-auto">
                  {medResults.map(m=>(
                    <div key={m.id} className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer" onClick={()=>addMedicine(m)}>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.generic_name} · {m.form} · {m.strength}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items table */}
          <div className="card">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Items ({items.length})</h2>
            </div>
            {items.length===0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No items added yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className="th">Medicine</th><th className="th">Batch</th><th className="th">MRP</th><th className="th">Qty</th><th className="th">Disc%</th><th className="th">Amount</th><th className="th"></th></tr></thead>
                  <tbody>
                    {items.map((it,i)=>(
                      <tr key={i} className="border-b border-gray-100">
                        <td className="td"><p className="font-medium text-xs">{it.medicine_name}</p></td>
                        <td className="td">
                          {it.batches?.length>1 ? (
                            <select className="select text-xs py-1 w-28" value={it.batch_number} onChange={e=>changeBatch(i,e.target.value)}>
                              {it.batches.map(b=><option key={b.batch_number} value={b.batch_number}>{b.batch_number} (Qty:{b.available_qty})</option>)}
                            </select>
                          ) : <span className="text-xs font-mono">{it.batch_number}</span>}
                        </td>
                        <td className="td text-xs">₹{it.mrp}</td>
                        <td className="td w-20"><input type="number" min="1" max={it.available_qty} className="input py-1 text-xs w-16" value={it.quantity} onChange={e=>setItems(it2=>it2.map((x,j)=>j===i?{...x,quantity:Math.max(1,parseInt(e.target.value)||1)}:x))}/></td>
                        <td className="td w-20"><input type="number" min="0" max="100" className="input py-1 text-xs w-16" value={it.discount_percent} onChange={e=>setItems(it2=>it2.map((x,j)=>j===i?{...x,discount_percent:parseFloat(e.target.value)||0}:x))}/></td>
                        <td className="td font-semibold text-xs">{fmt.currency(it.quantity*it.mrp*(1-(it.discount_percent||0)/100))}</td>
                        <td className="td"><button className="text-red-400 hover:text-red-600" onClick={()=>setItems(it2=>it2.filter((_,j)=>j!==i))}><Trash2 size={13}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — payment */}
        <div className="space-y-4">
          <div className="card-p">
            <h2 className="font-semibold text-sm text-gray-700 mb-3">Payment</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Payment Mode</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_MODES.map(m=>(
                    <button key={m} onClick={()=>setPaymentMode(m)}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${paymentMode===m?'bg-primary text-white border-primary':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="label">Overall Discount %</label><input type="number" min="0" max="100" className="input" value={discount} onChange={e=>setDiscount(parseFloat(e.target.value)||0)}/></div>
            </div>
          </div>

          <div className="card-p">
            <h2 className="font-semibold text-sm text-gray-700 mb-3">Bill Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmt.currency(subtotal)}</span></div>
              {discAmt>0&&<div className="flex justify-between text-red-600"><span>Discount ({discount}%)</span><span>-{fmt.currency(discAmt)}</span></div>}
              <div className="flex justify-between border-t pt-2 font-bold text-base"><span>Total</span><span className="text-primary">{fmt.currency(total)}</span></div>
              <div><label className="label mt-2">Amount Received (₹)</label><input type="number" className="input" placeholder={total} value={amountPaid} onChange={e=>setAmountPaid(e.target.value)}/></div>
              {amountPaid&&<div className={`flex justify-between font-semibold ${balance>0?'text-red-600':'text-green-600'}`}><span>{balance>0?'Balance Due':'Change'}</span><span>{fmt.currency(Math.abs(balance))}</span></div>}
            </div>
          </div>

          <button className="btn-primary w-full justify-center py-3 text-base" disabled={!items.length||mut.isPending} onClick={submit}>
            {mut.isPending?'Creating Bill…':'🖨 Create Bill & Print'}
          </button>
        </div>
      </div>
    </div>
  )
}
