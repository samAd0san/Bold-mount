import { Card } from '@/components/ui/card'
import { Heart, Zap, Shield, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'

const benefits = [
  {
    icon: Heart,
    title: 'Emotional Wellness',
    description: 'Soothe the heart during times of sadness or loss.',
  },
  {
    icon: Zap,
    title: 'Physical Vitality',
    description: 'High-energy boost for muscle recovery and sustained performance.',
  },
  {
    icon: Shield,
    title: 'Heart Health',
    description: 'Supports cardiovascular function with essential minerals.',
  },
  {
    icon: Leaf,
    title: '100% Natural',
    description: 'No artificial additives. Just pure roasted barley goodness.',
  },
]

const quickBuyPoints = [
  '✅ Authentic Sunnah: Recommended in Sahih Bukhari',
  '✅ Heart Health: Supports cardiovascular wellness',
  '✅ Mood Support: Natural relief for sadness',
  '✅ 100% Pure: No chemicals, just roasted barley',
]

export default function TalbeenSection() {
  return (
    <section id="talbeenah" className="py-12 md:py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12 lg:mb-16 max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-secondary mb-4 md:mb-6">
            The Sunnah Superfood
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-3 md:mb-4 italic">
            &ldquo;Talbeenah gives rest to the heart of the patient and makes it active and relieves some of his sorrow and grief.&rdquo;
          </p>
          <p className="text-xs sm:text-sm md:text-base text-secondary font-semibold">
            — Sahih al-Bukhari 5417
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12 lg:mb-16">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-500 p-4 sm:p-5 md:p-6 lg:p-8 group hover:scale-[1.02] rounded-xl md:rounded-2xl cursor-pointer"
            >
              <benefit.icon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 text-primary mb-3 md:mb-4 lg:mb-5 group-hover:scale-110 transition-all duration-300" />
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-secondary mb-1 md:mb-2 lg:mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">{benefit.description}</p>
            </Card>
          ))}
        </div>

        {/* Product Details Card */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center mt-10 md:mt-16 lg:mt-20">
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-secondary">
              Bold Mount Premium Roasted Talbeenah
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">
              Experience the ultimate Sunnah Superfood. Our premium roasted barley powder soothes the heart, fights fatigue, and nourishes your body with essential minerals.
            </p>
            
            {/* Nutritional Highlights */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 py-3 md:py-4 lg:py-6">
              <div className="space-y-1 md:space-y-2">
                <span className="text-primary font-bold text-xs sm:text-sm md:text-base lg:text-lg">Magnesium & Potassium</span>
                <p className="text-muted-foreground text-xs sm:text-sm">For nerve function and heart health</p>
              </div>
              <div className="space-y-1 md:space-y-2">
                <span className="text-primary font-bold text-xs sm:text-sm md:text-base lg:text-lg">Calcium & Phosphorus</span>
                <p className="text-muted-foreground text-xs sm:text-sm">For strong bones and teeth</p>
              </div>
              <div className="space-y-1 md:space-y-2">
                <span className="text-primary font-bold text-xs sm:text-sm md:text-base lg:text-lg">Selenium</span>
                <p className="text-muted-foreground text-xs sm:text-sm">Antioxidant for immune support</p>
              </div>
              <div className="space-y-1 md:space-y-2">
                <span className="text-primary font-bold text-xs sm:text-sm md:text-base lg:text-lg">Fiber</span>
                <p className="text-muted-foreground text-xs sm:text-sm">For digestion and treating anemia</p>
              </div>
            </div>

            {/* Quick Buy Points */}
            <div className="space-y-2 md:space-y-3 py-3 md:py-4 lg:py-6 border-t border-tertiary">
              {quickBuyPoints.map((point, index) => (
                <p key={index} className="text-secondary text-xs sm:text-sm md:text-base">
                  {point}
                </p>
              ))}
            </div>

            <Button
              size="lg"
              className="bg-secondary hover:bg-primary text-white font-bold px-6 sm:px-8 md:px-10 lg:px-12 py-3 md:py-4 text-sm md:text-base lg:text-lg rounded-xl transition-all duration-300 w-full sm:w-auto"
            >
              Shop Talbeenah Now
            </Button>
          </div>

          {/* How to Prepare */}
          <Card className="bg-white border-0 p-5 sm:p-6 md:p-8 lg:p-10 shadow-xl rounded-xl md:rounded-2xl lg:rounded-3xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 cursor-pointer group">
            <h4 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-secondary mb-4 md:mb-6 lg:mb-8 group-hover:text-primary transition-colors">How to Prepare</h4>
            <div className="space-y-4 md:space-y-5 lg:space-y-6">
              <div className="flex items-start gap-3 md:gap-4 lg:gap-5">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm md:text-base lg:text-lg">1</span>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg">Add 2-3 tablespoons of Bold Mount Talbeenah to a cup of milk or water.</p>
              </div>
              <div className="flex items-start gap-3 md:gap-4 lg:gap-5">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm md:text-base lg:text-lg">2</span>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg">Cook on low heat, stirring constantly until the mixture thickens.</p>
              </div>
              <div className="flex items-start gap-3 md:gap-4 lg:gap-5">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm md:text-base lg:text-lg">3</span>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg">Sweeten with honey and garnish with dates or nuts for a complete superfood meal.</p>
              </div>
            </div>
            
            <div className="mt-5 md:mt-8 lg:mt-10 p-3 md:p-4 lg:p-6 bg-tertiary/50 rounded-lg md:rounded-xl border border-primary/10">
              <p className="text-xs sm:text-sm md:text-base text-secondary">
                <span className="text-secondary font-bold">Pro Tip:</span> Best enjoyed warm in the morning or evening for maximum digestive benefits.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
