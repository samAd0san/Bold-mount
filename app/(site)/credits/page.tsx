import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { Container } from '@/components/ui/container';
import stockCredits from '@/public/images/stock/credits.json';
import datesCredits from '@/public/images/dates/credits.json';
import honeyCredits from '@/public/images/honey/credits.json';

export const metadata: Metadata = {
  title: 'Photo credits',
  description: 'Photographers and licences for the photos used on the Bold Mount website.',
  robots: { index: false },
};

type Credit = {
  path: string;
  topic: string;
  description: string;
  photographer: string;
  source_url: string;
  licence: string;
  replaced_by?: string;
};

// Only photos still on the site: replaced entries and files moved out of public/ are skipped.
const live = (list: Credit[]) =>
  list.filter((c) => !c.replaced_by && c.source_url && fs.existsSync(path.join(process.cwd(), 'public', c.path)));

const GROUPS: { title: string; items: Credit[] }[] = [
  { title: 'Dates', items: live(datesCredits as Credit[]) },
  { title: 'Honey', items: live(honeyCredits as Credit[]) },
  { title: 'Lifestyle, services and clothing', items: live(stockCredits as Credit[]) },
];

export default function CreditsPage() {
  return (
    <section className="py-14 md:py-20">
      <Container className="max-w-4xl">
        <p className="eyebrow">Thank you</p>
        <h1 className="mt-3 text-4xl text-ink md:text-5xl">Photo credits</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
          Product photos of our Talbeenah are our own. The photos below are used under the Unsplash, Pexels and Pixabay
          licences or Creative Commons licences as noted — with thanks to each photographer.
        </p>

        {GROUPS.filter((g) => g.items.length).map((g) => (
          <div key={g.title} className="mt-10">
            <h2 className="text-xl text-ink">{g.title}</h2>
            <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-pearl">
              {g.items.map((c) => (
                <li key={c.path} className="flex flex-col gap-1 px-5 py-4 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <span className="text-ink">{c.description.split(/[.;(]/)[0]}</span>
                  <span className="shrink-0 text-ink-soft">
                    <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="font-medium text-navy underline-offset-4 hover:underline">
                      {c.photographer}
                    </a>{' '}
                    · {c.licence.replace(' (attribution required)', '')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
    </section>
  );
}
