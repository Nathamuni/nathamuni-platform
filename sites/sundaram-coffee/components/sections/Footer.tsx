import type { SectionProps } from "@/lib/business";

/** Always rendered — platform branding lives here. */
export default function Footer({ business }: SectionProps) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>
          &copy; {new Date().getFullYear()} {business.name}
        </p>
        <p>
          A{" "}
          <a href="https://nathamuni.com" rel="noopener">
            nathamuni.com
          </a>{" "}
          site
        </p>
      </div>
    </footer>
  );
}
