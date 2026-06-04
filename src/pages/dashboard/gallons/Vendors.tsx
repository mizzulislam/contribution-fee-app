import { useState } from 'react'
import { Store, Phone, MapPin, Plus } from 'lucide-react'

export default function Vendors() {
  const [vendors] = useState([
    { id: 1, name: 'Toko Tirta Jaya', phone: '0812-3456-7890', address: 'Jl. Merdeka No. 45', price: 18000, status: 'Utama' },
    { id: 2, name: 'Agen Galon Barokah', phone: '0856-7890-1234', address: 'Jl. Pahlawan No. 12', price: 19000, status: 'Cadangan' }
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Store className="mr-3 text-primary w-8 h-8" />
            Vendor Galon
          </h1>
          <p className="text-text-secondary mt-1">Kelola kontak toko penyedia galon untuk kemudahan pemesanan.</p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" /> Tambah Vendor
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
                {vendor.address}
              </div>
              <div className="flex items-center text-sm text-gray-600 font-semibold">
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
      </div>
    </div>
  )
}
