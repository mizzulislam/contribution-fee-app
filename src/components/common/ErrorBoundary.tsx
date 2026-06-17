import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronRight, ChevronDown } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary menangkap error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  public render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            <div className="p-6 sm:p-10 text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-[#FEE2E2] rounded-2xl flex items-center justify-center border border-[#FCA5A5] text-[#EF4444] mx-auto mb-6">
                <AlertTriangle className="w-8 h-8" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Terjadi Kesalahan Sistem</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Aplikasi mengalami kendala teknis saat memuat data. Jangan khawatir, data transaksi Anda tetap tersimpan dengan aman di database.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <button
                  onClick={this.handleReload}
                  className="btn-primary flex items-center justify-center py-2.5 px-5"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang Halaman
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="btn-secondary flex items-center justify-center py-2.5 px-5"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Kembali ke Dashboard
                </button>
              </div>

              {/* Developer Details (Dev context only) */}
              {isDev && (
                <div className="mt-8 text-left border-t border-gray-100 pt-6">
                  <button
                    onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                    className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                  >
                    {this.state.showDetails ? <ChevronDown className="w-3.5 h-3.5 mr-1" /> : <ChevronRight className="w-3.5 h-3.5 mr-1" />}
                    {this.state.showDetails ? 'Sembunyikan Informasi Teknis' : 'Tampilkan Informasi Teknis (Mode Dev)'}
                  </button>

                  {this.state.showDetails && (
                    <div className="mt-3 bg-gray-900 text-[#F9FAFB] rounded-xl p-4 text-xs font-mono overflow-auto max-h-60 space-y-2 border border-gray-800 shadow-inner">
                      <p className="text-[#FCA5A5] font-bold">Error: {this.state.error?.message || String(this.state.error)}</p>
                      <pre className="text-gray-400 whitespace-pre-wrap leading-relaxed">
                        {this.state.error?.stack}
                      </pre>
                      {this.state.errorInfo && (
                        <pre className="text-gray-500 border-t border-gray-800 pt-2 mt-2 whitespace-pre-wrap leading-relaxed">
                          Component Stack: {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
