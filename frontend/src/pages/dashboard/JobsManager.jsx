import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { jobsAPI } from '../../lib/api'
import JobForm from '../../components/editor/JobForm'
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Loader2,
  MapPin,
  Clock,
} from 'lucide-react'

export default function JobsManager() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState(null)

  // Fetch jobs with React Query
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', company?.id],
    queryFn: () => jobsAPI.getAll(company.id),
    enabled: !!company?.id,
  })

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ jobId, isActive }) => jobsAPI.update(jobId, { is_active: !isActive }),
    onMutate: async ({ jobId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['jobs', company?.id] })
      const previousJobs = queryClient.getQueryData(['jobs', company?.id])
      queryClient.setQueryData(['jobs', company?.id], (old) =>
        old?.map((job) => (job.id === jobId ? { ...job, is_active: !isActive } : job))
      )
      return { previousJobs }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['jobs', company?.id], context.previousJobs)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', company?.id] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (jobId) => jobsAPI.delete(jobId),
    onMutate: async (jobId) => {
      await queryClient.cancelQueries({ queryKey: ['jobs', company?.id] })
      const previousJobs = queryClient.getQueryData(['jobs', company?.id])
      queryClient.setQueryData(['jobs', company?.id], (old) =>
        old?.filter((job) => job.id !== jobId)
      )
      return { previousJobs }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['jobs', company?.id], context.previousJobs)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', company?.id] })
    },
  })

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (jobData) => {
      if (editingJob) {
        return jobsAPI.update(editingJob.id, jobData)
      }
      return jobsAPI.create({ ...jobData, company_id: company.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', company?.id] })
      setShowForm(false)
      setEditingJob(null)
    },
  })

  const handleToggleActive = (jobId, currentStatus) => {
    toggleActiveMutation.mutate({ jobId, isActive: currentStatus })
  }

  const handleDelete = (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    deleteMutation.mutate(jobId)
  }

  const handleSaveJob = (jobData) => {
    saveMutation.mutate(jobData)
  }

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
      <header className="bg-white border-b border-gray-200">
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
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-gray-900">Job Listings</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
            <p className="text-gray-600 mt-1">
              Create and manage job listings for your careers page.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingJob(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Job
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              No jobs yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first job listing to start attracting candidates.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              Create Job
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{job.title}</div>
                      {job.department && (
                        <div className="text-sm text-gray-500">{job.department}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {job.location || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        {job.job_type || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          job.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(job.id, job.is_active)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
                          title={job.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {job.is_active ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingJob(job)
                            setShowForm(true)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job Form Modal */}
      {showForm && (
        <JobForm
          job={editingJob}
          onSave={handleSaveJob}
          onClose={() => {
            setShowForm(false)
            setEditingJob(null)
          }}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  )
}
