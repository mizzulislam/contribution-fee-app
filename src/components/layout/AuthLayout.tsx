import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Kiri: Visual / Branding (Desktop only) */}
      <div className="hidden md:flex md:w-1/2 bg-[#ECFDF5] flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-8 border border-[#D1FAE5]">
            <svg className="w-12 h-12 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-[#047857] mb-4">Splitz</h1>
          <p className="text-[#047857]/80 text-lg">Sistem Cerdas untuk Manajemen Iuran & Split Bill secara transparan, tertib, dan aman.</p>
        </div>
      </div>
      
      {/* Kanan: Content / Form (All devices) */}
      <div className="w-full md:w-1/2 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-gradient-to-tr from-[#ECFDF5]/60 via-white to-[#ECFDF5]/30 md:bg-none md:bg-white">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm md:bg-transparent p-6 sm:p-8 md:p-0 rounded-2xl shadow-xl shadow-[#047857]/5 border border-[#D1FAE5]/60 md:border-none md:shadow-none">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
