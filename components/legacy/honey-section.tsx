import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HoneySection() {
  return (
    <section id="honey" className="py-12 md:py-16 lg:py-24 bg-tertiary/30">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Image - Fixed rectangular shape */}
          <div className="relative h-[250px] sm:h-[300px] md:h-[400px] lg:h-[450px] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl bg-white">
            <Image
              src="/Natural Bee Honey.webp"
              alt="Premium Natural Honey"
              fill
              className="object-contain p-6 md:p-8"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Content */}
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-secondary">
              Premium Sidr Honey
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed">
              Sourced from the blessed lands, our raw Sidr honey is prized for its rich flavor and medicinal properties.
            </p>
            
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-5 py-2 md:py-4">
              <Card className="bg-white border-0 p-3 md:p-4 lg:p-5 shadow-md rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <h4 className="text-primary font-bold text-sm md:text-base lg:text-lg mb-1">Immune Booster</h4>
                <p className="text-muted-foreground text-xs md:text-sm">Natural antibacterial properties</p>
              </Card>
              <Card className="bg-white border-0 p-3 md:p-4 lg:p-5 shadow-md rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <h4 className="text-primary font-bold text-sm md:text-base lg:text-lg mb-1">Energy Source</h4>
                <p className="text-muted-foreground text-xs md:text-sm">Natural sustained energy</p>
              </Card>
              <Card className="bg-white border-0 p-3 md:p-4 lg:p-5 shadow-md rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <h4 className="text-primary font-bold text-sm md:text-base lg:text-lg mb-1">Digestive Aid</h4>
                <p className="text-muted-foreground text-xs md:text-sm">Supports gut health</p>
              </Card>
              <Card className="bg-white border-0 p-3 md:p-4 lg:p-5 shadow-md rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <h4 className="text-primary font-bold text-sm md:text-base lg:text-lg mb-1">Sunnah Food</h4>
                <p className="text-muted-foreground text-xs md:text-sm">Mentioned in Quran</p>
              </Card>
            </div>

            <Button
              size="lg"
              className="bg-secondary hover:bg-primary text-white font-bold px-6 sm:px-8 md:px-10 py-3 md:py-4 text-sm md:text-base lg:text-lg rounded-xl transition-all duration-300 w-full sm:w-auto"
            >
              Shop Premium Honey
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
