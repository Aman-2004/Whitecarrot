import { useAuth } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function Dashboard() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Setting up your dashboard...
        </h1>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
      </div>
    </div>
  )
}
