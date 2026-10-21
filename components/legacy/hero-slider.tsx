'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

const slides = [
  {
    image: '/img1.jpg',
    quote: 'Nourish Your Body, Relieve Your Heart.',
    subtext: 'Discover Talbeenah: The Sunnah Superfood that restores vitality and calms the soul.',
  },
  {
    image: '/img2.jpg',
    quote: 'Modern Life is Stressful. Our Superfood is Timeless.',
    subtext: 'Recommended by the Prophet (PBUH) to soothe the heart and wash away grief.',
  },
  {
    image: '/img3.jpg',
    quote: 'Energy for the Body, Peace for the Mind.',
    subtext: '100% Natural roasted barley. High in Magnesium, Potassium, and Fiber.',
  },
]

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLElement>(null)

  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.9, 0.5])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05])
  
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 })

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 6500)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <section ref={ref} className="relative min-h-[85vh] md:min-h-[90vh] w-full overflow-hidden bg-white">
      {/* Background - fades on scroll */}
      <motion.div 
        style={{ opacity }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/mountain-bg.jpg"
          alt="Mountain Background"
          fill
          className="object-cover"
          style={{ opacity: 0.85 }}
          priority
          quality={95}
        />
      </motion.div>

      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(0,194,232,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(0,194,232,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(0,194,232,0.08) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Content Container */}
      <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-16 items-center min-h-[70vh] md:min-h-[75vh]">
          {/* Left: Text Content with staggered animation */}
          <motion.div 
            className="space-y-6 md:space-y-8 text-left order-2 lg:order-1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`quote-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="min-h-[200px] sm:min-h-[220px] md:min-h-[240px] flex flex-col justify-center"
              >
                {/* Decorative element */}
                <motion.div
                  className="h-1 w-16 bg-primary mb-6 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: 64 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                />

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-secondary leading-tight mb-4 md:mb-6">
                  {slides[currentSlide].quote.split(' ').map((word, i) => (
                    <motion.span
                      key={i}
                      className="inline-block mr-2 md:mr-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </h1>

                <motion.p 
                  className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground font-light leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {slides[currentSlide].subtext}
                </motion.p>
              </motion.div>
            </AnimatePresence>

            {/* Animated CTAs */}
            <motion.div 
              className="flex flex-row gap-3 md:gap-4 pt-2 md:pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="bg-secondary hover:bg-primary/90 text-white font-semibold px-6 sm:px-8 md:px-10 py-4 md:py-6 text-sm md:text-base rounded-xl shadow-lg hover:shadow-primary/30 transition-all group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    SHOP COLLECTION
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold px-6 sm:px-8 md:px-10 py-4 md:py-6 text-sm md:text-base rounded-xl transition-all"
                >
                  Learn More
                </Button>
              </motion.div>
            </motion.div>

            {/* Animated indicators */}
            <div className="flex items-center gap-3 pt-4 md:pt-6">
              {slides.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 md:h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-10 md:w-14 bg-primary shadow-lg shadow-primary/50'
                      : 'w-2 md:w-3 bg-tertiary/40 hover:bg-tertiary/60'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Right: 3D Product Image with depth */}
          <motion.div 
            className="relative order-1 lg:order-2 flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            {/* Floating orbs for depth */}
            <motion.div
              className="absolute -top-10 -left-10 w-32 h-32 md:w-40 md:h-40 bg-primary/10 rounded-full blur-3xl"
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-10 -right-10 w-48 h-48 md:w-60 md:h-60 bg-primary/5 rounded-full blur-3xl"
              animate={{
                y: [0, 20, 0],
                x: [0, -10, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Main image card - COMPLETELY TRANSPARENT */}
            <motion.div 
              className="relative w-full max-w-[300px] sm:max-w-[380px] md:max-w-[440px] lg:max-w-[500px] aspect-[4/5]"
              animate={{ 
                y: isHovered ? -8 : 0,
                filter: isHovered 
                  ? 'drop-shadow(0 25px 50px rgba(0, 194, 232, 0.3))' 
                  : 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1))'
              }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {slides.map((slide, index) => (
                  index === currentSlide && (
                    <motion.div
                      key={index}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.7, ease: [0.43, 0.13, 0.23, 0.96] }}
                    >
                      {/* Image wrapper - full transparent */}
                      <div className="relative w-full h-full p-6">
                        <Image
                          src={slide.image}
                          alt={`Bold Mount ${slide.quote}`}
                          fill
                          className="object-contain"
                          priority={index === 0}
                          quality={100}
                          sizes="(max-width: 768px) 300px, (max-width: 1024px) 440px, 500px"
                        />
                      </div>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>

              {/* Shine Effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                initial={{ x: '-100%', skewX: -15 }}
                animate={{ x: isHovered ? '200%' : '-100%' }}
                transition={{ duration: 0.8 }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
