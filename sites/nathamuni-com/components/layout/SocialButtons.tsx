import { SOCIAL_LINKS } from '@/lib/social'

export function SocialButtons() {
  return (
    <div className="social-buttons" data-testid="social-buttons">
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noreferrer"
        className="social-button social-button-primary"
        data-testid="social-button-instagram"
      >
        Follow on Instagram
      </a>
      <a
        href={SOCIAL_LINKS.youtube}
        target="_blank"
        rel="noreferrer"
        className="social-button social-button-secondary"
        data-testid="social-button-youtube"
      >
        YouTube
      </a>
    </div>
  )
}
