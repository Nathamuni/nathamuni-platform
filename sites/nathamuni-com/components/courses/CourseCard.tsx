import Link from 'next/link'
import type { Course } from '@/lib/courses'
import { TiltCard } from '@/components/fx/TiltCard'

const LEVEL_LABEL: Record<Course['level'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
}

export function CourseCard({ course }: { course: Course }) {
  return (
    <TiltCard>
      <Link
        href={`/courses/${course.slug}`}
        className="crs-course-card glass-card"
        style={{ '--cat': course.hue } as React.CSSProperties}
        data-testid="course-card"
      >
        <div className="crs-course-card-top">
          <span className="crs-level-chip">{LEVEL_LABEL[course.level]}</span>
          <span className="crs-module-count">
            {course.modules.length} module{course.modules.length === 1 ? '' : 's'}
          </span>
        </div>
        <h2 className="crs-course-card-title">{course.title}</h2>
        <p className="crs-course-card-tagline">{course.tagline}</p>
        <p className="crs-course-card-forwhom">{course.forWhom}</p>
        <ul className="crs-course-card-outcomes">
          {course.outcomes.slice(0, 2).map((outcome) => (
            <li key={outcome}>{outcome}</li>
          ))}
        </ul>
        <span className="crs-course-card-cta">
          View course
          <span aria-hidden="true">→</span>
        </span>
      </Link>
    </TiltCard>
  )
}
