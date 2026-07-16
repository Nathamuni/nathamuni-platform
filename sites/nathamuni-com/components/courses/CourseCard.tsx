import Link from 'next/link'
import type { Course } from '@/lib/courses'
import { getActionCount, getReadTimeMinutes } from '@/lib/courses'
import { TiltCard } from '@/components/fx/TiltCard'
import { CourseProgressLine } from './CourseProgress'

const LEVEL_LABEL: Record<Course['level'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
}

export function CourseCard({ course }: { course: Course }) {
  const moduleCount = course.modules.length
  const actionCount = getActionCount(course)
  const readMinutes = getReadTimeMinutes(course)

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
        </div>
        <h2 className="crs-course-card-title">{course.title}</h2>
        <p className="crs-course-card-tagline">{course.tagline}</p>
        <p className="crs-course-card-forwhom">{course.forWhom}</p>
        <ul className="crs-course-card-outcomes">
          {course.outcomes.slice(0, 2).map((outcome) => (
            <li key={outcome}>{outcome}</li>
          ))}
        </ul>
        <p className="crs-meta-row" data-testid="course-card-meta">
          {moduleCount} module{moduleCount === 1 ? '' : 's'}
          <span aria-hidden="true"> · </span>
          {actionCount} action{actionCount === 1 ? '' : 's'}
          <span aria-hidden="true"> · </span>~{readMinutes} min read
        </p>
        <CourseProgressLine
          slug={course.slug}
          moduleActionCounts={course.modules.map((m) => m.actions.length)}
        />
        <span className="crs-course-card-cta">
          View course
          <span aria-hidden="true">→</span>
        </span>
      </Link>
    </TiltCard>
  )
}
