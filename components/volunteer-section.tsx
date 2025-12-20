import { Button } from '@/components/ui/button'
import { Heart, Users, HandHeart } from 'lucide-react'

export default function VolunteerSection() {
  return (
    <section id="volunteer" className="py-12 md:py-16 lg:py-24 bg-primary/5">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Quote */}
          <div className="mb-8 md:mb-12 lg:mb-16">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-secondary italic leading-relaxed mb-4 md:mb-6 px-4">
              &ldquo;The best of people are those that bring most benefit to the rest of mankind.&rdquo;
            </p>
            <span className="text-primary font-bold text-sm md:text-base lg:text-lg">— Prophet Muhammad (PBUH)</span>
          </div>

          {/* Main Content */}
          <div className="space-y-4 md:space-y-6 mb-8 md:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-secondary">
              Bold Mount Volunteering
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-4">
              We don&apos;t just sell food; we serve the community. A portion of every purchase funds our Social Service Initiatives.
            </p>
          </div>

          {/* Impact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12 lg:mb-16">
            <div className="p-5 md:p-6 lg:p-8 bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer group hover:scale-[1.02]">
              <Heart className="h-10 w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-primary mx-auto mb-3 md:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-secondary mb-2 md:mb-3 group-hover:text-primary transition-colors">Feed the Hungry</h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                Every purchase contributes to meals for those in need.
              </p>
            </div>
            <div className="p-5 md:p-6 lg:p-8 bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer group hover:scale-[1.02]">
              <Users className="h-10 w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-primary mx-auto mb-3 md:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-secondary mb-2 md:mb-3 group-hover:text-primary transition-colors">Youth Programs</h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                Empowering the next generation through service.
              </p>
            </div>
            <div className="p-5 md:p-6 lg:p-8 bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer group hover:scale-[1.02] sm:col-span-2 md:col-span-1">
              <HandHeart className="h-10 w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-primary mx-auto mb-3 md:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-secondary mb-2 md:mb-3 group-hover:text-primary transition-colors">Community Support</h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                Building stronger communities together.
              </p>
            </div>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="bg-secondary hover:bg-primary text-white font-bold px-6 sm:px-8 md:px-10 lg:px-12 py-3 md:py-4 text-sm md:text-base lg:text-lg rounded-xl transition-all duration-300"
          >
            Learn How to Volunteer
          </Button>
        </div>
      </div>
    </section>
  )
}
