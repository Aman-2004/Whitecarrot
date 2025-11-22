import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { companiesAPI, sectionsAPI, jobsAPI } from '../../lib/api'
import {
  MapPin,
  Clock,
  Briefcase,
  Search,
  Filter,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react'

export default function CareersPage() {
  const { companySlug } = useParams()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedJobType, setSelectedJobType] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch company with React Query
  const {
    data: company,
    isLoading: companyLoading,
    error: companyError,
  } = useQuery({
    queryKey: ['company', companySlug],
    queryFn: () => companiesAPI.getBySlug(companySlug),
    enabled: !!companySlug,
    retry: false,
  })

  // Fetch sections with React Query
  const { data: sections = [] } = useQuery({
    queryKey: ['sections-public', company?.id],
    queryFn: () => sectionsAPI.getPublic(company.id),
    enabled: !!company?.id,
  })

  // Fetch jobs with React Query
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-public', company?.id],
    queryFn: () => jobsAPI.getPublic(company.id),
    enabled: !!company?.id,
  })

  // Generate JSON-LD structured data for jobs
  const jobPostingsSchema = useMemo(() => {
    if (!company || jobs.length === 0) return null
    return jobs.map((job) => ({
      '@context': 'https://schema.org/',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description || `${job.title} position at ${company.name}`,
      datePosted: job.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      hiringOrganization: {
        '@type': 'Organization',
        name: company.name,
        logo: company.logo_url,
      },
      jobLocation: {
        '@type': 'Place',
        address: job.location || 'Remote',
      },
      employmentType: job.job_type?.toUpperCase().replace('-', '_') || 'FULL_TIME',
      ...(job.salary_range && { baseSalary: { '@type': 'MonetaryAmount', currency: 'USD', value: job.salary_range } }),
    }))
  }, [company, jobs])

  // Get unique locations and job types for filters
  const locations = useMemo(() => {
    const locs = jobs.map((job) => job.location).filter(Boolean)
    return [...new Set(locs)]
  }, [jobs])

  const jobTypes = useMemo(() => {
    const types = jobs.map((job) => job.job_type).filter(Boolean)
    return [...new Set(types)]
  }, [jobs])

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesLocation =
        !selectedLocation || job.location === selectedLocation

      const matchesJobType =
        !selectedJobType || job.job_type === selectedJobType

      return matchesSearch && matchesLocation && matchesJobType
    })
  }, [jobs, searchQuery, selectedLocation, selectedJobType])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedLocation('')
    setSelectedJobType('')
  }

  const hasActiveFilters = searchQuery || selectedLocation || selectedJobType

  if (companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label="Loading" />
      </div>
    )
  }

  if (companyError || !company) {
    return (
      <>
        <Helmet>
          <title>Page Not Found | Careers</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center" role="alert">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Page not found
            </h1>
            <p className="text-gray-600">
              The careers page you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </>
    )
  }

  const pageTitle = `Careers at ${company.name} | ${jobs.length} Open Positions`
  const pageDescription = `Join ${company.name}! Browse ${jobs.length} open positions and find your next career opportunity. Explore roles in ${[...new Set(jobs.map(j => j.department).filter(Boolean))].slice(0, 3).join(', ') || 'various departments'}.`

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${window.location.origin}/${companySlug}/careers`} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${window.location.origin}/${companySlug}/careers`} />
        {company.banner_url && <meta property="og:image" content={company.banner_url} />}
        {company.logo_url && <meta property="og:image" content={company.logo_url} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {company.banner_url && <meta name="twitter:image" content={company.banner_url} />}

        {/* JSON-LD Structured Data */}
        {jobPostingsSchema && (
          <script type="application/ld+json">
            {JSON.stringify(jobPostingsSchema)}
          </script>
        )}
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header/Banner */}
        <header
          className="relative h-72 md:h-80 bg-gradient-to-r"
          style={{
            backgroundImage: company.banner_url
              ? `url(${company.banner_url})`
              : `linear-gradient(to right, ${company.primary_color}, ${company.secondary_color})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          role="banner"
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative h-full max-w-5xl mx-auto px-4 flex flex-col justify-center items-center text-center">
            {company.logo_url && (
              <img
                src={company.logo_url}
                alt={`${company.name} logo`}
                className="h-16 w-16 md:h-20 md:w-20 object-contain bg-white rounded-xl shadow-lg mb-4"
              />
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Careers at {company.name}
            </h1>
            <p className="text-white/90 text-lg">
              Join our team and make an impact
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 py-12" id="main-content">
          {/* Sections */}
          {sections.length > 0 && (
            <div className="space-y-12 mb-16">
              {sections.map((section) => (
                <section key={section.id} className="scroll-mt-20" aria-labelledby={`section-${section.id}`}>
                  <h2
                    id={`section-${section.id}`}
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{ color: company.primary_color }}
                  >
                    {section.title}
                  </h2>
                  {section.media_url && (
                    <img
                      src={section.media_url}
                      alt={section.title}
                      className="w-full h-64 md:h-80 object-cover rounded-xl mb-6"
                    />
                  )}
                  <div className="prose prose-lg max-w-none">
                    {section.content?.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="text-gray-600 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}

              {/* Culture Video */}
              {company.culture_video_url && (
                <section className="scroll-mt-20" aria-labelledby="culture-video">
                  <h2
                    id="culture-video"
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{ color: company.primary_color }}
                  >
                    Life at {company.name}
                  </h2>
                  <video
                    src={company.culture_video_url}
                    controls
                    className="w-full rounded-xl"
                    poster={company.banner_url}
                    aria-label={`Culture video for ${company.name}`}
                  />
                </section>
              )}
            </div>
          )}

          {/* Jobs Section */}
          <section id="jobs" className="scroll-mt-20" aria-labelledby="jobs-heading">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2
                id="jobs-heading"
                className="text-2xl md:text-3xl font-bold"
                style={{ color: company.primary_color }}
              >
                Open Positions
                {jobs.length > 0 && (
                  <span className="text-gray-400 font-normal text-xl ml-2" aria-label={`${filteredJobs.length} jobs shown`}>
                    ({filteredJobs.length})
                  </span>
                )}
              </h2>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={showFilters}
                aria-controls="filters"
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full" aria-label="Filters active" />
                )}
              </button>
            </div>

            {/* Filters */}
            <div
              id="filters"
              className={`mb-6 space-y-4 md:space-y-0 md:flex md:gap-4 ${
                showFilters ? 'block' : 'hidden md:flex'
              }`}
              role="search"
              aria-label="Job filters"
            >
              {/* Search */}
              <div className="relative flex-1">
                <label htmlFor="job-search" className="sr-only">Search jobs</label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                <input
                  id="job-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Location Filter */}
              {locations.length > 0 && (
                <div className="relative">
                  <label htmlFor="location-filter" className="sr-only">Filter by location</label>
                  <select
                    id="location-filter"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="appearance-none w-full md:w-48 px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                </div>
              )}

              {/* Job Type Filter */}
              {jobTypes.length > 0 && (
                <div className="relative">
                  <label htmlFor="type-filter" className="sr-only">Filter by job type</label>
                  <select
                    id="type-filter"
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="appearance-none w-full md:w-48 px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Types</option>
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                </div>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                  aria-label="Clear all filters"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Clear
                </button>
              )}
            </div>

            {/* Job Listings */}
            {jobs.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl" role="status">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No open positions
                </h3>
                <p className="text-gray-600">
                  We don't have any openings right now, but check back soon!
                </p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl" role="status">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No matching jobs
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="space-y-4" role="list" aria-label="Job listings">
                {filteredJobs.map((job) => (
                  <article
                    key={job.id}
                    className="group border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition focus-within:ring-2 focus-within:ring-blue-500"
                    role="listitem"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-xl group-hover:text-blue-600 transition">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
                          {job.department && (
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="h-4 w-4" aria-hidden="true" />
                              <span>{job.department}</span>
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" aria-hidden="true" />
                              <span>{job.location}</span>
                            </span>
                          )}
                          {job.job_type && (
                            <span className="flex items-center gap-1.5 capitalize">
                              <Clock className="h-4 w-4" aria-hidden="true" />
                              <span>{job.job_type}</span>
                            </span>
                          )}
                          {job.salary_range && (
                            <span className="font-medium text-green-600">
                              {job.salary_range}
                            </span>
                          )}
                        </div>
                        {job.description && (
                          <p className="mt-4 text-gray-600 line-clamp-2">
                            {job.description}
                          </p>
                        )}
                      </div>
                      <button
                        className="shrink-0 px-6 py-2.5 font-medium rounded-lg transition text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: company.primary_color,
                          '--tw-ring-color': company.primary_color,
                        }}
                        aria-label={`Apply for ${job.title} position`}
                      >
                        Apply Now
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 mt-12" role="contentinfo">
          <div className="max-w-5xl mx-auto px-4 text-center text-gray-600 text-sm">
            <p>
              &copy; {new Date().getFullYear()} {company.name}. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
