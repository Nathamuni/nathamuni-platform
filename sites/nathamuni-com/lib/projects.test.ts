import { describe, expect, it } from 'vitest'
import { getProjects } from './projects'

describe('projects', () => {
  it('returns a non-empty list with unique slugs', () => {
    const projects = getProjects()
    expect(projects.length).toBeGreaterThanOrEqual(7)
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length)
  })

  it('gives every project a name, problem, build summary, stack, and status', () => {
    for (const project of getProjects()) {
      expect(project.name.length).toBeGreaterThan(0)
      expect(project.problem.length).toBeGreaterThan(0)
      expect(project.built.length).toBeGreaterThan(0)
      expect(project.stack.length).toBeGreaterThan(0)
      expect(['live', 'internal', 'in-progress', 'student-era']).toContain(project.status)
      expect(project.statusLabel.length).toBeGreaterThan(0)
    }
  })

  it('includes BrainBox as live on Google Play', () => {
    const brainbox = getProjects().find((p) => p.slug === 'brainbox')
    expect(brainbox?.status).toBe('live')
    expect(brainbox?.statusLabel).toContain('Google Play')
  })
})
