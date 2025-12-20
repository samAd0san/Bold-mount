'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

const slides = [
  {
    image: '/img1.jpg',
    quote: 'Nourish Your Body, Relieve Your Heart.',
    subtext: 'The Sunnah Superfood that restores vitality.',
  },
  {
    image: '/img2.jpg',
    quote: 'Modern Life is Stressful. We Have the Cure.',
    subtext: 'Soothe the heart and wash away grief.',
  },
  {
    image: '/img3.jpg',
    quote: 'Energy for Body, Peace for Mind.',
    subtext: '100% Natural roasted barley goodness.',
  },
]

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const nextSlide = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
      setIsAnimating(false)
    }, 300)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 6500)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/mountain-bg.jpg"
          alt="Mountain Background"
          fill
          className="object-cover"
          style={{ opacity: 0.9 }}
          priority
          quality={95}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center min-h-[70vh] md:min-h-[75vh]">
          {/* Left: Text Content */}
          <div className="space-y-4 md:space-y-6 text-left order-2 lg:order-1">
            <div
              key={`quote-${currentSlide}`}
              className={`transition-all duration-500 min-h-[180px] sm:min-h-[200px] md:min-h-[220px] flex flex-col justify-center ${
                isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
              }`}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-secondary leading-tight mb-3 md:mb-4">
                {slides[currentSlide].quote}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground font-light leading-relaxed">
                {slides[currentSlide].subtext}
              </p>
            </div>

            <div className="flex flex-row gap-3 md:gap-4 pt-2 md:pt-4">
              <Button
                size="lg"
                className="bg-secondary hover:bg-primary text-white font-semibold px-4 sm:px-6 md:px-8 py-3 md:py-4 text-xs sm:text-sm md:text-base rounded-lg md:rounded-xl transition-all duration-300"
              >
                Shop Collection
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-white font-semibold px-4 sm:px-6 md:px-8 py-3 md:py-4 text-xs sm:text-sm md:text-base rounded-lg md:rounded-xl transition-all duration-300 bg-white/50"
              >
                Learn More
              </Button>
            </div>

            {/* Slide Indicators - Dots Only */}
            <div className="flex items-center gap-2 pt-4 md:pt-6">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 md:h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 md:w-10 bg-primary'
                      : 'w-2 md:w-2.5 bg-secondary/30 hover:bg-secondary/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Product Image - Fixed rectangular shape, no white box */}
          <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] h-[200px] sm:h-[280px] md:h-[350px] lg:h-[420px] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ${
                    index === currentSlide
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <Image
                    src={slide.image}
                    alt={`Slide ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    quality={95}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
