import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { companiesAPI } from '../../lib/api'
import { Upload, Image, Video, Loader2, Check } from 'lucide-react'

export default function BrandingEditor({ company, onUpdate }) {
  const [uploading, setUploading] = useState(false)
  const [primaryColor, setPrimaryColor] = useState(company?.primary_color || '#3B82F6')
  const [secondaryColor, setSecondaryColor] = useState(company?.secondary_color || '#1E40AF')
  const [saved, setSaved] = useState(false)

  // Color save mutation
  const colorMutation = useMutation({
    mutationFn: (colors) => companiesAPI.update(company.id, colors),
    onSuccess: () => {
      onUpdate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${company.id}/${type}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage (keep this as per user request)
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath)

      // Update company via API
      const updateField = type === 'logo' ? 'logo_url' : type === 'banner' ? 'banner_url' : 'culture_video_url'
      await companiesAPI.update(company.id, { [updateField]: publicUrl })

      onUpdate()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file. Make sure the storage bucket is configured.')
    } finally {
      setUploading(false)
    }
  }

  const handleColorSave = () => {
    colorMutation.mutate({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Branding</h2>
        <p className="text-gray-600 mb-6">
          Customize how your careers page looks to candidates.
        </p>
      </div>

      {/* Logo Upload */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Image className="h-5 w-5" />
          Company Logo
        </h3>
        <div className="flex items-center gap-6">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt="Company logo"
              className="h-20 w-20 object-contain bg-gray-100 rounded-lg"
            />
          ) : (
            <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <Image className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div>
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Upload Logo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'logo')}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Recommended: 200x200px, PNG or SVG
            </p>
          </div>
        </div>
      </div>

      {/* Banner Upload */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Image className="h-5 w-5" />
          Banner Image
        </h3>
        <div className="space-y-4">
          {company?.banner_url ? (
            <img
              src={company.banner_url}
              alt="Company banner"
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <Image className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>Upload Banner</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'banner')}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-gray-500">
            Recommended: 1920x400px, JPG or PNG
          </p>
        </div>
      </div>

      {/* Culture Video */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Video className="h-5 w-5" />
          Culture Video (Optional)
        </h3>
        <div className="space-y-4">
          {company?.culture_video_url ? (
            <video
              src={company.culture_video_url}
              controls
              className="w-full h-64 rounded-lg bg-black"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <Video className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>Upload Video</span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'culture_video')}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-gray-500">
            Max file size: 50MB, MP4 recommended
          </p>
        </div>
      </div>

      {/* Colors */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Brand Colors</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleColorSave}
          disabled={colorMutation.isPending}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {colorMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {colorMutation.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Colors'}
        </button>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Color Preview</h3>
        <div className="flex gap-4">
          <div
            className="w-32 h-20 rounded-lg flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            Primary
          </div>
          <div
            className="w-32 h-20 rounded-lg flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: secondaryColor }}
          >
            Secondary
          </div>
        </div>
      </div>
    </div>
  )
}
