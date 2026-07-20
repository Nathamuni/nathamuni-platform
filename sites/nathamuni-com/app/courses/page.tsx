import type { Metadata } from 'next'
import { getAllCourses } from '@/lib/courses'
import { CourseCard } from '@/components/courses/CourseCard'
import { CoursesStyles } from '@/components/courses/CoursesStyles'
import { PageHeader } from '@/components/layout/PageHeader'

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
      <PageHeader
        eyebrow="Not lectures — plans"
        title="Paths assembled from what I did."
        lede="Everything here is built from what I actually ran, labeled honestly where research or standard practice fills the gaps."
        accentHue={152}
        stats={[{ value: courses.length, label: 'Courses' }]}
      />
      <div className="crs-index-grid" data-testid="courses-grid">
        {courses.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>
    </section>
  )
}
