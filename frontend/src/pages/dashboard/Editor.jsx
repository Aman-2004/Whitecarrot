import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { sectionsAPI } from '../../lib/api'
import BrandingEditor from '../../components/editor/BrandingEditor'
import SectionManager from '../../components/editor/SectionManager'
import {
  Palette,
  LayoutList,
  Briefcase,
  Eye,
  ExternalLink,
  LogOut,
  Save,
  Loader2,
  Check,
} from 'lucide-react'

export default function Editor() {
  const { company, signOut, refreshCompany } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('branding')
  const [saved, setSaved] = useState(false)

  // Fetch sections with React Query
  const {
    data: sections = [],
    isLoading,
    refetch: refetchSections,
  } = useQuery({
    queryKey: ['sections', company?.id],
    queryFn: () => sectionsAPI.getAll(company.id),
    enabled: !!company?.id,
  })

  // Local state for optimistic updates
  const [localSections, setLocalSections] = useState(null)
  const displaySections = localSections ?? sections

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (sectionsToSave) => {
      // Save sections order
      const orderUpdates = sectionsToSave.map((s, index) => ({
        id: s.id,
        order_index: index,
      }))
      await sectionsAPI.updateOrder(orderUpdates)

      // Save individual section updates
      for (const section of sectionsToSave) {
        await sectionsAPI.update(section.id, {
          title: section.title,
          content: section.content,
          is_visible: section.is_visible,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', company?.id] })
      setLocalSections(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const handleSave = () => {
    saveMutation.mutate(displaySections)
  }

  const handleSectionsChange = (newSections) => {
    setLocalSections(newSections)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'sections', label: 'Sections', icon: LayoutList },
  ]

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-gray-900">{company.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saveMutation.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save'}
              </button>

              <Link
                to={`/${company.slug}/preview`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Link>

              <Link
                to={`/${company.slug}/jobs`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Briefcase className="h-4 w-4" />
                Jobs
              </Link>

              <a
                href={`/${company.slug}/careers`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <ExternalLink className="h-4 w-4" />
                View Live
              </a>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'branding' && (
            <BrandingEditor company={company} onUpdate={refreshCompany} />
          )}
          {activeTab === 'sections' && (
            <SectionManager
              sections={displaySections}
              setSections={handleSectionsChange}
              companyId={company.id}
              loading={isLoading}
              refetchSections={refetchSections}
            />
          )}
        </div>
      </div>
    </div>
  )
}
