import { SOCIAL_LINKS } from '@/lib/social'

export function Footer() {
  return (
    <footer className="site-footer" data-testid="site-footer">
      <p>Nathamuni. All rights reserved.</p>
      <div className="site-footer-social">
        <a
          href={SOCIAL_LINKS.instagram}
          target="_blank"
          rel="noreferrer"
          data-testid="footer-instagram"
        >
          Instagram
        </a>
        <a
          href={SOCIAL_LINKS.youtube}
          target="_blank"
          rel="noreferrer"
          data-testid="footer-youtube"
        >
          YouTube
        </a>
      </div>
    </footer>
  )
}
