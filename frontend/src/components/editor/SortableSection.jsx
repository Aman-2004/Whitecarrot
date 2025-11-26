import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Edit, Eye, EyeOff, Trash2 } from 'lucide-react'

export default function SortableSection({ section, onEdit, onToggleVisibility, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,// Ref to attach to draggable element
    transform,// Current x/y position during drag
    transition,
    isDragging,// Boolean - true while being dragged
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const sectionTypeLabels = {
    about: 'About Us',
    mission: 'Mission',
    values: 'Values',
    culture: 'Culture',
    life: 'Life at Company',
    benefits: 'Benefits',
    custom: 'Custom',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${!section.is_visible ? 'opacity-60' : ''}`}
    >
      {/* Top row: Drag Handle + Section Info */}
      <div className="flex items-start gap-3 w-full sm:w-auto sm:flex-1 sm:min-w-0">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-0.5"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Section Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900 line-clamp-2 sm:truncate">{section.title}</h3>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
              {sectionTypeLabels[section.type] || section.type}
            </span>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 sm:truncate mt-1">
            {section.content ? section.content.substring(0, 100) + '...' : 'No content yet'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="Edit section"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleVisibility}
          className={`p-2 rounded-lg transition ${
            section.is_visible
              ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              : 'text-orange-500 hover:bg-orange-50'
          }`}
          title={section.is_visible ? 'Hide section' : 'Show section'}
        >
          {section.is_visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
