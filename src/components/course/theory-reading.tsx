import type { TheoryReference } from '@/content/types';
import { RichText } from './rich-text';

/** Same reading structure for the course and its limited demonstration. */
export function TheoryReading({
  reference,
  demo = false,
}: {
  reference: TheoryReference;
  demo?: boolean;
}) {
  const rich = (text: string, field: string) => (
    <RichText text={text} theoryId={reference.id} field={field} demo={demo} />
  );
  return (
    <section className="card theory-reading">
      <p className="reading-lead">{rich(reference.lead, 'lead')}</p>
      {reference.blocks.map((block, i) => (
        <details key={block.heading} name={`theory-${reference.id}`} suppressHydrationWarning>
          <summary>{rich(block.heading, `heading-${i}`)}</summary>
          <p>{rich(block.text, `block-${i}`)}</p>
        </details>
      ))}
      <details name={`theory-${reference.id}`} suppressHydrationWarning>
        <summary>Tabela de consulta</summary>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label={`Tabela: ${reference.title}`}
        >
          <table>
            <thead>
              <tr>
                {reference.table.headers.map((heading, i) => (
                  <th scope="col" key={i}>
                    {rich(heading, `head-${i}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reference.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{rich(cell, `cell-${i}-${j}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
