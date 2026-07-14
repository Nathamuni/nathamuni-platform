import type { Metadata } from 'next'
import { getAllCourses } from '@/lib/courses'
import { CourseCard } from '@/components/courses/CourseCard'
import { CoursesStyles } from '@/components/courses/CoursesStyles'

export const metadata: Metadata = {
  title: 'Courses',
  description:
    'Structured learning paths assembled from what Nathamuni actually did — systems, calisthenics, diet, and local-first AI, labeled honestly where research or standard practice fills the gaps.',
  alternates: { canonical: '/courses' },
}

export default function CoursesPage() {
  const courses = getAllCourses()
  return (
    <section className="section">
      <CoursesStyles />
      <div className="crs-header">
        <h1 className="section-title">Courses</h1>
        <p className="section-sub">
          Not lectures. Plans. Everything below is assembled from what I actually did — labeled
          honestly where research or standard practice fills the gaps.
        </p>
      </div>
      <div className="crs-index-grid" data-testid="courses-grid">
        {courses.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>
    </section>
  )
}
