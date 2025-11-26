import { MapPin, Clock, Briefcase } from 'lucide-react'

export default function CareersPreview({ company, sections, jobs, viewMode = 'desktop' }) {
  const isMobile = viewMode === 'mobile'
  return (
    <div className="min-h-screen">
      {/* Header/Banner */}
      <div
        className="relative h-64 bg-gradient-to-r from-blue-600 to-blue-800"
        style={{
          backgroundImage: company.banner_url ? `url(${company.banner_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full max-w-4xl mx-auto px-4 flex flex-col justify-center items-center text-center">
          {company.logo_url && (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-20 w-20 object-contain bg-white rounded-xl shadow-lg mb-4"
            />
          )}
          <h1 className="text-3xl font-bold text-white mb-2">
            Join {company.name}
          </h1>
          <p className="text-white/90">
            Explore opportunities and be part of our journey
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {sections.map((section) => (
          <div key={section.id} className="scroll-mt-20" id={section.type}>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: company.primary_color }}
            >
              {section.title}
            </h2>
            {section.media_url && (
              <img
                src={section.media_url}
                alt={section.title}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}
            <div className="prose prose-gray max-w-none">
              {section.content?.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-gray-600 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}

        {/* Culture Video */}
        {company.culture_video_url && (
          <div className="scroll-mt-20">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: company.primary_color }}
            >
              Life at {company.name}
            </h2>
            <video
              src={company.culture_video_url}
              controls
              className="w-full rounded-lg"
            />
          </div>
        )}

        {/* Jobs Section */}
        <div className="scroll-mt-20" id="jobs">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: company.primary_color }}
          >
            Open Positions
          </h2>

          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No open positions at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 hover:shadow-sm transition cursor-pointer"
                >
                  <div className={`flex gap-3 flex-col sm:flex-row sm:justify-between sm:items-start ${isMobile ? '!flex-col !items-stretch' : ''}`}>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {job.title}
                      </h3>
                      <div className={`flex flex-wrap items-center mt-2 text-sm text-gray-600 gap-3 sm:gap-4 ${isMobile ? '!gap-3' : ''}`}>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                        {job.job_type && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.job_type}
                          </span>
                        )}
                        {job.department && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.department}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="mt-3 text-gray-600 text-sm line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>
                    <button
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition shrink-0 w-full sm:w-auto ${isMobile ? '!w-full' : ''}`}
                      style={{
                        backgroundColor: company.primary_color,
                        color: 'white',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} {company.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
