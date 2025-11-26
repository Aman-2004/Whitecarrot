import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { sectionsAPI } from '../../lib/api'
import SortableSection from './SortableSection'
import SectionEditor from './SectionEditor'
import { Plus, Loader2 } from 'lucide-react'

const SECTION_TYPES = [
  { value: 'about', label: 'About Us' },
  { value: 'mission', label: 'Our Mission' },
  { value: 'values', label: 'Our Values' },
  { value: 'culture', label: 'Company Culture' },
  { value: 'life', label: 'Life at Company' },
  { value: 'benefits', label: 'Benefits & Perks' },
  { value: 'custom', label: 'Custom Section' },
]

export default function SectionManager({ sections, companyId, loading }) {
  const queryClient = useQueryClient()
  const [editingSection, setEditingSection] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSectionType, setNewSectionType] = useState('custom')
  const [newSectionTitle, setNewSectionTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Add section mutation uses setQueryData to append new section
  const addMutation = useMutation({
    mutationFn: (data) => sectionsAPI.create(data),
    onSuccess: (newSection) => {
      queryClient.setQueryData(['sections', companyId], (old) =>
        [...(old || []), newSection].sort((a, b) => a.order_index - b.order_index)
      )
      setShowAddModal(false)
      setNewSectionTitle('')
      setNewSectionType('custom')
    },
  })

  // Update section mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => sectionsAPI.update(id, updates),
    onSuccess: (updatedSection) => {
      queryClient.setQueryData(['sections', companyId], (old) =>
        old?.map((s) => s.id === updatedSection.id ? updatedSection : s)
      )
      setEditingSection(null)
    },
  })

  // Delete section mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => sectionsAPI.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['sections', companyId], (old) =>
        old?.filter((s) => s.id !== deletedId)
      )
    },
  })

  // Update order mutation
  const orderMutation = useMutation({
    mutationFn: (orderUpdates) => sectionsAPI.updateOrder(orderUpdates),
  })

  const handleDragEnd = async (event) => {
    const { active, over } = event //// active = dragged item,over = drop target

    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id)
      const newIndex = sections.findIndex((s) => s.id === over.id)

      const newSections = arrayMove(sections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          order_index: index,
        })
      )

      // Update cache immediately (optimistic)
      queryClient.setQueryData(['sections', companyId], newSections)

      // Sync with backend
      const orderUpdates = newSections.map((s) => ({
        id: s.id,
        order_index: s.order_index,
      }))
      await orderMutation.mutateAsync(orderUpdates)
    }
  }

  const handleToggleVisibility = async (sectionId) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return

    const newVisibility = !section.is_visible

    updateMutation.mutate({ id: sectionId, updates: { is_visible: newVisibility } })
  }

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Are you sure you want to delete this section?')) return
    deleteMutation.mutate(sectionId)
  }

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return

    addMutation.mutate({
      company_id: companyId,
      type: newSectionType,
      title: newSectionTitle,
      content: '',
      order_index: sections.length,
      is_visible: true,
    })
  }

  const handleSaveSection = (sectionId, updates) => {
    updateMutation.mutate({ id: sectionId, updates })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Page Sections</h2>
          <p className="text-gray-600 mt-1">
            Drag and drop to reorder sections. Click to edit content.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No sections yet. Add your first section!</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onEdit={() => setEditingSection(section)}
                  onToggleVisibility={() => handleToggleVisibility(section.id)}
                  onDelete={() => handleDeleteSection(section.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Section
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Type
                </label>
                <select
                  value={newSectionType}
                  onChange={(e) => {
                    setNewSectionType(e.target.value)
                    const type = SECTION_TYPES.find((t) => t.value === e.target.value)
                    if (type && e.target.value !== 'custom') {
                      setNewSectionTitle(type.label)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SECTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter section title"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                disabled={addMutation.isPending || !newSectionTitle.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          onSave={(updates) => handleSaveSection(editingSection.id, updates)}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  )
}
