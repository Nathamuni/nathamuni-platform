import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllCourses, getCourseBySlug, getActionCount, getReadTimeMinutes } from '@/lib/courses'
import { SITE_URL } from '@/lib/site'
import { CoursesStyles } from '@/components/courses/CoursesStyles'
import { CourseProgressRing } from '@/components/courses/CourseProgress'
import { DisclaimerCard } from '@/components/courses/DisclaimerCard'
import { ModuleSection } from '@/components/courses/ModuleSection'

export function generateStaticParams() {
  return getAllCourses().map((course) => ({ slug: course.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const course = getCourseBySlug(slug)
  if (!course) return {}
  return {
    title: course.title,
    description: course.tagline,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: {
      type: 'article',
      title: course.title,
      description: course.tagline,
      images: [{ url: '/images/generated/og-banner.jpg', width: 1200, height: 630 }],
    },
  }
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const course = getCourseBySlug(slug)
  if (!course) notFound()

  const moduleCount = course.modules.length
  const actionCount = getActionCount(course)
  const readMinutes = getReadTimeMinutes(course)

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.tagline,
    provider: { '@type': 'Person', name: 'Nathamuni', url: SITE_URL },
    url: `${SITE_URL}/courses/${course.slug}`,
  }

  return (
    <article className="section" style={{ '--cat': course.hue } as React.CSSProperties}>
      <CoursesStyles />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />

      <Link href="/courses" className="detail-category-chip">
        ← All courses
      </Link>

      {course.disclaimer && <DisclaimerCard />}

      <div className="crs-hero glass-card" data-testid="course-hero">
        <div className="crs-hero-top">
          <span className="crs-level-chip">
            {course.level === 'beginner' ? 'Beginner' : 'Intermediate'}
          </span>
        </div>
        <h1 className="post-title">{course.title}</h1>
        <p className="crs-meta-row" data-testid="course-meta">
          {moduleCount} module{moduleCount === 1 ? '' : 's'}
          <span aria-hidden="true"> · </span>
          {actionCount} action{actionCount === 1 ? '' : 's'}
          <span aria-hidden="true"> · </span>~{readMinutes} min read
        </p>
        <p className="crs-hero-forwhom" data-testid="course-forwhom">
          <em>For {course.forWhom}</em>
        </p>
        <CourseProgressRing
          slug={course.slug}
          moduleActionCounts={course.modules.map((m) => m.actions.length)}
        />
        <div>
          <p className="crs-hero-outcomes-heading">What we&apos;re going to do</p>
          <ul className="crs-hero-outcomes-chips" data-testid="course-outcomes">
            {course.outcomes.map((outcome) => (
              <li key={outcome} className="crs-outcome-chip">
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="crs-modules" data-testid="course-modules">
        {course.modules.map((courseModule, index) => (
          <ModuleSection
            key={courseModule.title}
            courseSlug={course.slug}
            courseModule={courseModule}
            index={index}
          />
        ))}
      </div>

      <Link href="/courses" className="link-more">
        ← All courses
      </Link>
    </article>
  )
}
