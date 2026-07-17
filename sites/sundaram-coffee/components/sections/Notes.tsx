import type { SectionProps } from "@/lib/business";

export default function Notes({ business }: SectionProps) {
  const notes = business.notes ?? [];
  if (notes.length === 0) return null;

  return (
    <section className="section notes" aria-labelledby="notes-title">
      <div className="container">
        <h2 id="notes-title">Good to know</h2>
        <ul className="notes-list">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
