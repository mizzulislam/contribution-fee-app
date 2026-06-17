import { FlaskConical } from 'lucide-react'

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mb-6 border border-[#D1FAE5]">
        <FlaskConical className="w-10 h-10 text-[#10B981]" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
        <FlaskConical className="mr-3 text-primary w-8 h-8" />
        {title}
      </h1>
      <p className="text-text-secondary max-w-md mx-auto">{description}</p>
      <p className="text-sm text-text-muted mt-8">Halaman ini masih dalam tahap pengembangan (Placeholder).</p>
    </div>
  )
}
