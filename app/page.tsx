import type { Metadata } from 'next';
import { HeroSlider } from '@/components/home/hero-slider';
import { ExploreSections } from '@/components/home/explore-sections';
import { PromoTrio } from '@/components/home/promo-trio';
import { Bestsellers } from '@/components/home/bestsellers';
import { JourneyCards } from '@/components/home/journey-cards';
import { MissionPanel } from '@/components/home/mission-panel';
import { TalbeenahStory } from '@/components/home/talbeenah-story';
import { ServeAndGive } from '@/components/home/serve-and-give';
import { HomeFaq } from '@/components/home/home-faq';

export const metadata: Metadata = {
  description:
    'Shop slow-roasted Talbeenah, hand-picked dates and pure Sidr honey — and give through Zakat, Umrah Badal, Khidmat-e-Khalq and free Qur’an giveaways. Order easily on WhatsApp.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      {/* Slide titles rotate, so the page's single h1 lives here for screen readers and search. */}
      <h1 className="sr-only">Bold Mount — Talbeenah, premium dates, Sidr honey and community service</h1>
      {/* Shop first (what most visitors came for), then the story, then giving; trust points live in the header. */}
      <HeroSlider />
      <ExploreSections />
      <PromoTrio />
      <Bestsellers />
      <TalbeenahStory />
      <JourneyCards />
      <MissionPanel />
      <ServeAndGive joined />
      <HomeFaq />
    </>
  );
}
