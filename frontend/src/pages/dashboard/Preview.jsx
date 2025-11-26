import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { sectionsAPI, jobsAPI } from '../../lib/api'
import CareersPreview from '../../components/preview/CareersPreview'
import { ArrowLeft, Monitor, Smartphone, Tablet, ExternalLink, Loader2 } from 'lucide-react'

export default function Preview() {
  const { company } = useAuth()
  const [viewMode, setViewMode] = useState('desktop')

  // Fetch sections with React Query
  const { data: allSections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections', company?.id],
    queryFn: () => sectionsAPI.getAll(company.id),
    enabled: !!company?.id,
  })

  // Fetch jobs with React Query
  const { data: allJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', company?.id],
    queryFn: () => jobsAPI.getAll(company.id),
    enabled: !!company?.id,
  })

  // Filter for preview: only visible sections and active jobs
  const sections = allSections.filter((s) => s.is_visible)
  const jobs = allJobs.filter((j) => j.is_active)

  const loading = sectionsLoading || jobsLoading

  const viewModes = [
    { id: 'desktop', icon: Monitor, label: 'Desktop' },
    { id: 'tablet', icon: Tablet, label: 'Tablet' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile' },
  ]

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-[375px]'
      case 'tablet':
        return 'max-w-[768px]'
      default:
        return 'max-w-full'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to={`/${company.slug}/edit`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Editor
              </Link>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition ${
                    viewMode === mode.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <mode.icon className="h-4 w-4" />
                  <span className="text-sm">{mode.label}</span>
                </button>
              ))}
            </div>

            <a
              href={`/${company.slug}/careers`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <ExternalLink className="h-4 w-4" />
              View Live Page
            </a>
          </div>
        </div>
      </header>

      {/* Preview Container */}
      <div className="py-8 px-4">
        <div
          className={`mx-auto bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 ${getPreviewWidth()}`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <CareersPreview
              company={company}
              sections={sections}
              jobs={jobs}
            />
          )}
        </div>
      </div>
    </div>
  )
}
