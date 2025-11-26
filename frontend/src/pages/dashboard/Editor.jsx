import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { sectionsAPI } from '../../lib/api'
import BrandingEditor from '../../components/editor/BrandingEditor'
import SectionManager from '../../components/editor/SectionManager'
import {
  Palette,
  LayoutList,
  Building2,
  Eye,
  ExternalLink,
  LogOut,
} from 'lucide-react'

export default function Editor() {
  const { company, signOut, updateCompany } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('branding')

  // Fetch sections with React Query
  const {
    data: sections = [],
    isLoading,
  } = useQuery({
    queryKey: ['sections', company?.id],
    queryFn: () => sectionsAPI.getAll(company.id),
    enabled: !!company?.id && activeTab === 'sections', // only fetch when on sections tab
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'sections', label: 'Sections', icon: LayoutList },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Company Name */}
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <span className="font-bold text-gray-900 text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">
                {company.name}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-3">
              <Link
                to={`/${company.slug}/preview`}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                title="Preview"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Link>

              <a
                href={`/${company.slug}/careers`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                title="View Live"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Live</span>
              </a>

              <button
                onClick={handleSignOut}
                className="flex items-center p-2 text-gray-600 hover:text-gray-900 transition"
                title="Sign Out"
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
            <BrandingEditor company={company} onUpdate={updateCompany} />
          )}
          {activeTab === 'sections' && (
            <SectionManager
              sections={sections}
              companyId={company.id}
              loading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
