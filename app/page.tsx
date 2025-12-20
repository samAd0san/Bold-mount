import Header from '@/components/header'
import HeroSlider from '@/components/hero-slider'
import TalbeenSection from '@/components/talbeenah-section'
import HoneySection from '@/components/honey-section'
import DatesSection from '@/components/dates-section'
import VolunteerSection from '@/components/volunteer-section'
import FAQSection from '@/components/faq-section'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSlider />
      <TalbeenSection />
      <HoneySection />
      <DatesSection />
      <VolunteerSection />
      <FAQSection />
      <Footer />
    </main>
  )
}
