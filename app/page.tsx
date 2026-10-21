import type { Metadata } from 'next';
import { HeroSlider } from '@/components/home/hero-slider';
import { ExploreSections } from '@/components/home/explore-sections';
import { PromoTrio } from '@/components/home/promo-trio';
import { Bestsellers } from '@/components/home/bestsellers';
import { JourneyCards } from '@/components/home/journey-cards';
import { MissionPanel } from '@/components/home/mission-panel';
import { TalbeenahStory } from '@/components/home/talbeenah-story';
import { ServeAndGive } from '@/components/home/serve-and-give';
import { WhyBoldMount } from '@/components/home/why-bold-mount';
import { CampaignWall } from '@/components/home/campaign-wall';
import { HomeFaq } from '@/components/home/home-faq';
import { CtaBand } from '@/components/home/cta-band';

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
      <HeroSlider />
      <ExploreSections />
      <PromoTrio />
      <Bestsellers />
      <JourneyCards />
      <TalbeenahStory />
      <ServeAndGive />
      <MissionPanel />
      <WhyBoldMount />
      <CampaignWall />
      <HomeFaq />
      <CtaBand />
    </>
  );
}
