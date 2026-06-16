import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Store, Phone, MapPin, Plus, X, CreditCard } from 'lucide-react'
import Select from '@/components/ui/Select'

export default function Vendors() {
  const [vendors, setVendors] = useState([
    { id: 1, name: 'Toko Tirta Jaya', phone: '0812-3456-7890', address: 'Jl. Merdeka No. 45', price: 18000, status: 'Utama', accountNumber: 'BCA 1234567890' },
    { id: 2, name: 'Agen Galon Barokah', phone: '0856-7890-1234', address: 'Jl. Pahlawan No. 12', price: 19000, status: 'Cadangan', accountNumber: '' }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    price: '',
    accountNumber: '',
    status: 'Cadangan'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return
    
    const newKios = {
      id: Date.now(),
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      price: Number(formData.price) || 0,
      accountNumber: formData.accountNumber,
      status: formData.status
    }
    
    setVendors([...vendors, newKios])
    setIsModalOpen(false)
    setFormData({ name: '', phone: '', address: '', price: '', accountNumber: '', status: 'Cadangan' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Store className="mr-3 text-primary w-8 h-8" />
            Kios Galon
          </h1>
          <p className="text-text-secondary mt-1">Kelola kontak toko penyedia galon untuk kemudahan pemesanan.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
          <Plus className="w-5 h-5 mr-2" /> Tambah Kios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map(vendor => (
          <div key={vendor.id} className="card-container p-6 relative">
            <div className="absolute top-4 right-4">
              <span className={`badge ${vendor.status === 'Utama' ? 'badge-success' : 'badge-warning'}`}>
                {vendor.status}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4 pr-16">{vendor.name}</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-3 text-gray-400" />
                {vendor.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                {vendor.address || '-'}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CreditCard className="w-4 h-4 mr-3 text-gray-400" />
                {vendor.accountNumber || '-'}
              </div>
              <div className="flex items-center text-sm text-gray-600 font-semibold pt-1">
                <span className="text-gray-400 mr-3">Rp</span>
                {vendor.price.toLocaleString('id-ID')} / galon
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex gap-3">
              <a href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn-primary flex-1 text-center py-2 text-sm">
                Chat WA
              </a>
            </div>
          </div>
        ))}
        {vendors.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Belum ada data kios. Klik <b>Tambah Kios</b> untuk menambahkan.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Store className="w-5 h-5 mr-2 text-primary" />
                Tambah Kios Galon
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Kios</label>
                <input 
                  type="text" 
                  required
                  placeholder="Misal: Toko Tirta Jaya"
                  className="w-full text-sm p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor WhatsApp</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Misal: 081234567890"
                    className="w-full text-sm p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Harga per Galon</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">Rp</span>
                    </div>
                    <input 
                      type="number" 
                      required
                      className="w-full text-sm p-2.5 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Rekening (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Misal: BCA 1234567890 a.n Bapak Budi"
                  className="w-full text-sm p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Lokasi kios"
                  className="w-full text-sm p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status Kios</label>
                <Select 
                  value={formData.status}
                  onChange={(val) => setFormData({...formData, status: val})}
                  options={[
                    { label: 'Utama', value: 'Utama' },
                    { label: 'Cadangan', value: 'Cadangan' }
                  ]}
                />
              </div>
              
              <div className="pt-4 flex gap-3 mt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1 py-2.5">Batal</button>
                <button type="submit" className="btn-primary flex-1 py-2.5">Simpan Kios</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
