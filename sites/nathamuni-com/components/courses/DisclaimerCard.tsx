/** Shown at the top of every health-related course (Course.disclaimer === true). */
export function DisclaimerCard() {
  return (
    <div className="crs-disclaimer glass-card" data-testid="course-disclaimer">
      <p>
        This is my tested process, not medical advice. I&apos;m an engineer, not a doctor —
        confirm health decisions with a professional.
      </p>
    </div>
  )
}
