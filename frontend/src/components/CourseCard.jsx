import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

const TAG_COLORS = [
  { bg: 'rgba(99,102,241,0.15)', text: '#818cf8' },
  { bg: 'rgba(236,72,153,0.15)', text: '#f472b6' },
  { bg: 'rgba(34,211,238,0.15)', text: '#67e8f9' },
  { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  { bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
  { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
]

function tagStyle(tag) {
  const hash = tag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return TAG_COLORS[hash % TAG_COLORS.length]
}

export default function CourseCard({ course }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/course/${course.id}`)}
      className="rounded-xl cursor-pointer border transition-all overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
    >
      {course.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
        {course.description && (
          <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{course.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1">
            <BookOpen size={14} />
            {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
          </span>
          {course.tags?.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {course.tags.map(tag => {
                const colors = tagStyle(tag)
                return (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
