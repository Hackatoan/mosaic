import { localizeLinks } from "../lib/localize-links.js";

// Renders a legal page from an ordered list of dictionary blocks. Server
// component — the prose is SSR-localized per route (/privacy, /<locale>/privacy)
// so search engines see it in each language. Inline markup (links, <code>,
// <strong>, <em>) is preserved inside each translated block via innerHTML;
// internal /privacy and /terms links are re-pointed to the current locale.
export function Policy({ blocks, locale = "en" }) {
  const html = (s) => ({ __html: localizeLinks(s, locale) });
  return (
    <article className="policy">
      {blocks.map((b, i) => {
        if (b.h1) return <h1 key={i}>{b.h1}</h1>;
        if (b.h2) return <h2 key={i}>{b.h2}</h2>;
        if (b.p) return <p key={i} dangerouslySetInnerHTML={html(b.p)} />;
        if (b.ul)
          return (
            <ul key={i}>
              {b.ul.map((li, j) => (
                <li key={j} dangerouslySetInnerHTML={html(li)} />
              ))}
            </ul>
          );
        return null;
      })}
    </article>
  );
}
