import { useState } from 'react'
import { Building2, Plus, Edit, MapPin, DoorOpen } from 'lucide-react'

export default function UnitsManagement() {
  const [units, setUnits] = useState([
    { id: 1, name: 'Soematra Kost Pusat', address: 'Jl. Melati No. 12, Yogyakarta', rooms: 20, occupied: 18, status: 'active' },
    { id: 2, name: 'Soematra Kost Cabang Utara', address: 'Jl. Kaliurang KM 5, Yogyakarta', rooms: 15, occupied: 15, status: 'active' },
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Building2 className="mr-3 text-primary w-8 h-8" />
            Manajemen Kos / Unit
          </h1>
          <p className="text-text-secondary mt-1">Kelola daftar properti, alamat, dan kapasitas kamar.</p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Tambah Cabang / Unit Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {units.map((unit) => (
          <div key={unit.id} className="card-container overflow-hidden group">
            <div className="h-32 bg-primary/10 relative">
              {/* Image Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-primary/30" />
              </div>
              <div className="absolute top-4 right-4">
                <span className="badge badge-success">Aktif</span>
              </div>
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{unit.name}</h2>
              <div className="flex items-start text-sm text-text-secondary mb-4">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <p>{unit.address}</p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 mb-6">
                <div className="flex items-center">
                  <DoorOpen className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-xs text-text-muted">Kapasitas</p>
                    <p className="font-semibold text-gray-900">{unit.rooms} Kamar</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Terisi</p>
                  <p className="font-semibold text-primary">{unit.occupied} Kamar</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="btn-secondary w-full py-2 flex items-center justify-center">
                  <Edit className="w-4 h-4 mr-2" /> Edit Detail
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
