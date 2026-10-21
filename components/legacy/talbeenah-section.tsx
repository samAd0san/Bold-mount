'use client'

import { Card } from '@/components/ui/card'
import { Brain, Flame, HeartPulse, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'

const benefits = [
  {
    icon: Brain,
    title: 'Mind & Soul Balance',
    description: 'Ancient wisdom meets modern wellness. Calms anxiety and uplifts mood naturally.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-500',
    stat: '87%',
    statLabel: 'report better sleep',
  },
  {
    icon: Flame,
    title: 'Sustained Energy',
    description: 'Complex carbs for steady power. No crashes, just clean fuel for your day.',
    gradient: 'from-orange-500/20 to-amber-500/20',
    iconColor: 'text-orange-500',
    stat: '3x',
    statLabel: 'longer lasting energy',
  },
  {
    icon: HeartPulse,
    title: 'Heart Vitality',
    description: 'Rich in magnesium & potassium. Supports healthy blood pressure & circulation.',
    gradient: 'from-rose-500/20 to-pink-500/20',
    iconColor: 'text-rose-500',
    stat: '40%',
    statLabel: 'daily fiber needs',
  },
  {
    icon: Sparkles,
    title: 'Pure & Authentic',
    description: 'Single-ingredient simplicity. Just premium roasted barley, nothing else.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-500',
    stat: '100%',
    statLabel: 'natural ingredients',
  },
]

const quickBuyPoints = [
  '✅ Authentic Sunnah: Recommended in Sahih Bukhari',
  '✅ Heart Health: Supports cardiovascular wellness',
  '✅ Mood Support: Natural relief for sadness',
  '✅ 100% Pure: No chemicals, just roasted barley',
]

function BenefitCard({ benefit, index }: { benefit: typeof benefits[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef(null)
  const isInView = useInView(cardRef, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="h-full" // Add this
    >
      <motion.div
        onHoverStart={() => setIsHovered}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="h-full" // Add this
      >
        <Card
          className={`relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 p-6 sm:p-8 rounded-2xl md:rounded-3xl cursor-pointer group h-full flex flex-col`}
        >
          {/* Rest of the card content remains the same */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          />
          
          <motion.div
            className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl"
            animate={{
              scale: isHovered ? 1.5 : 1,
              opacity: isHovered ? 0.8 : 0.3,
            }}
            transition={{ duration: 0.5 }}
          />

          <div className="relative z-10 flex flex-col flex-1">
            <motion.div
              className={`relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${benefit.gradient} mb-5 md:mb-6`}
              animate={{ rotate: isHovered ? [0, -5, 5, 0] : 0 }}
              transition={{ duration: 0.5 }}
            >
              <benefit.icon className={`h-8 w-8 md:h-10 md:w-10 ${benefit.iconColor} transition-all duration-300 group-hover:scale-110`} />
              
              <motion.div
                className={`absolute inset-0 rounded-2xl border-2 ${benefit.iconColor.replace('text-', 'border-')}`}
                animate={{
                  scale: isHovered ? [1, 1.2, 1] : 1,
                  opacity: isHovered ? [0.5, 0, 0.5] : 0,
                }}
                transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
              />
            </motion.div>

            <motion.h3 
              className="text-lg sm:text-xl md:text-2xl font-bold text-secondary mb-2 md:mb-3 group-hover:text-primary transition-colors duration-300"
              animate={{ x: isHovered ? 4 : 0 }}
            >
              {benefit.title}
            </motion.h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4 md:mb-6 flex-1">
              {benefit.description}
            </p>

            <motion.div
              className="flex items-center gap-3 pt-4 border-t border-tertiary/50 mt-auto"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: isHovered ? 1 : 0.7 }}
            >
              <span className={`text-2xl md:text-3xl font-bold ${benefit.iconColor}`}>
                {benefit.stat}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">
                {benefit.statLabel}
              </span>
            </motion.div>
          </div>

          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
            initial={{ x: '-100%', skewX: -15 }}
            animate={{ x: isHovered ? '200%' : '-100%' }}
            transition={{ duration: 0.8 }}
          />
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default function TalbeenSection() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section id="talbeenah" className="py-16 md:py-20 lg:py-28 bg-gradient-to-b from-white via-tertiary/10 to-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          ref={sectionRef}
          className="text-center mb-12 md:mb-16 lg:mb-20 max-w-3xl mx-auto px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-secondary mb-6 md:mb-8">
            The Sunnah <span className="text-gradient-animate">Superfood</span>
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-4 italic">
            &ldquo;Talbeenah gives rest to the heart of the patient and makes it active and relieves some of his sorrow and grief.&rdquo;
          </p>
          <p className="text-sm md:text-base text-secondary font-semibold">
            — Sahih al-Bukhari 5417
          </p>
        </motion.div>

        {/* Benefits Grid - Premium Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16 md:mb-20 items-start">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} benefit={benefit} index={index} />
          ))}
        </div>

        {/* Product Details Card */}
        <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center mt-12 md:mt-20">
          <motion.div 
            className="space-y-6 md:space-y-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary">
              Bold Mount Premium Roasted Talbeenah
            </h3>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Experience the ultimate Sunnah Superfood. Our premium roasted barley powder soothes the heart, fights fatigue, and nourishes your body with essential minerals.
            </p>
            
            {/* Nutritional Highlights */}
            <div className="grid grid-cols-2 gap-4 md:gap-6 py-4 md:py-6">
              {[
                { title: 'Magnesium & Potassium', desc: 'For nerve function and heart health' },
                { title: 'Calcium & Phosphorus', desc: 'For strong bones and teeth' },
                { title: 'Selenium', desc: 'Antioxidant for immune support' },
                { title: 'Fiber', desc: 'For digestion and treating anemia' },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="space-y-1 md:space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-primary font-bold text-sm md:text-base">{item.title}</span>
                  <p className="text-muted-foreground text-xs sm:text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="bg-secondary hover:bg-primary/90 text-white font-bold px-8 md:px-12 py-4 md:py-6 text-base md:text-lg rounded-xl transition-all duration-300 w-full sm:w-auto shadow-lg hover:shadow-primary/30"
              >
                Shop Talbeenah Now
              </Button>
            </motion.div>
          </motion.div>

          {/* How to Prepare - Glass Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Card className="glass-card border-0 p-6 sm:p-8 md:p-10 rounded-2xl md:rounded-3xl hover:shadow-2xl transition-all duration-500 cursor-pointer group">
              <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary mb-6 md:mb-8 group-hover:text-primary transition-colors">
                How to Prepare
              </h4>
              <div className="space-y-5 md:space-y-6">
                {[
                  'Add 2-3 tablespoons of Bold Mount Talbeenah to a cup of milk or water.',
                  'Cook on low heat, stirring constantly until the mixture thickens.',
                  'Sweeten with honey and garnish with dates or nuts for a complete superfood meal.',
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-start gap-4 md:gap-5"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <span className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base md:text-lg shadow-lg">
                      {i + 1}
                    </span>
                    <p className="text-muted-foreground text-sm md:text-base lg:text-lg leading-relaxed">
                      {step}
                    </p>
                  </motion.div>
                ))}
              </div>
              
              <motion.div 
                className="mt-8 md:mt-10 p-4 md:p-6 bg-primary/5 rounded-xl border border-primary/20"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-sm md:text-base text-secondary">
                  <span className="text-secondary font-bold"> Pro Tip:</span> Best enjoyed warm in the morning or evening for maximum digestive benefits.
                </p>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
