'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

const dateVarieties = [
  { 
    name: 'Ajwah Madeenah Premium', 
    desc: 'The King of dates; soft, dark, and healing.',
    image: '/Ajwah Madeenah Premium.webp'
  },
  { 
    name: 'Medjoul Jordanian', 
    desc: 'Large, succulent, caramel-like texture.',
    image: '/jordan-s-medjoul-dates.jpeg'
  },
  { 
    name: 'Safawi (Kalmi) Madeenah', 
    desc: 'Deep black and mineral-rich.',
    image: '/Safawi (kalmi) Madeenah.webp'
  },
  { 
    name: 'Mabroom Premium Saudi', 
    desc: 'Slender, firm, and high in fiber.',
    image: '/Mabroom Premium Saudi Dates.jpg'
  },
  { 
    name: 'Sukkary', 
    desc: 'The "Golden Date"—crisp and naturally sugary.',
    image: '/Sukkary.jpeg'
  },
  { 
    name: 'Zahdi Iraqi', 
    desc: 'A nutty, semi-dry classic.',
    image: '/Zahdi Iraqi Dates.jpg'
  },
  { 
    name: 'Tunisian (Deglet Noor)', 
    desc: 'The "Date of Light."',
    image: '/Tunisian Dates.jpeg'
  },
  { 
    name: 'Suqai', 
    desc: 'Premium quality from blessed lands.',
    image: '/Suqai Dates.jpeg'
  },
  { 
    name: 'Safawi Madina', 
    desc: 'Rich and nourishing.',
    image: '/Safawi Madina Dates.jpg'
  },
]

export default function DatesSection() {
  const [showAll, setShowAll] = useState(false)
  
  // Show first 3 on mobile/tablet, first 3 on desktop (first row)
  const visibleDates = showAll ? dateVarieties : dateVarieties.slice(0, 3)

  return (
    <section id="dates" className="py-12 md:py-16 lg:py-24 bg-tertiary/30">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-secondary mb-4 md:mb-6">
            Premium Date Selection
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            Blessed varieties sourced from Madinah, Jordan, Iraq, and beyond.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {visibleDates.map((date, index) => (
            <Card
              key={index}
              className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden group cursor-pointer rounded-xl md:rounded-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Image Container - Fixed height rectangle */}
              <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 w-full overflow-hidden">
                <Image
                  src={date.image}
                  alt={date.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              {/* Text Content */}
              <div className="p-4 md:p-5 lg:p-6">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-secondary mb-1 md:mb-2 group-hover:text-primary transition-colors">
                  {date.name}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{date.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Show More/Less Button */}
        <div className="flex justify-center mt-8 md:mt-10 lg:mt-12">
          <Button
            onClick={() => setShowAll(!showAll)}
            className="bg-secondary hover:bg-primary text-white font-semibold px-6 sm:px-8 md:px-10 py-3 md:py-4 text-sm md:text-base rounded-xl transition-all duration-300 flex items-center gap-2"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp className="h-4 w-4 md:h-5 md:w-5" />
              </>
            ) : (
              <>
                View All Dates <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
              </>
            )}
          </Button>
        </div>

        {/* CTA Banner */}
        <div className="mt-12 md:mt-16 lg:mt-20 p-6 md:p-8 lg:p-10 bg-white rounded-2xl md:rounded-3xl shadow-lg text-center hover:shadow-xl transition-all duration-500">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary mb-3 md:mb-4">
            Looking for a Gift Set?
          </h3>
          <p className="text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed px-4">
            Explore our curated gift boxes featuring premium dates, raw honey, and Talbeenah.
          </p>
          <Button className="bg-secondary hover:bg-primary text-white font-bold px-6 sm:px-8 md:px-10 py-3 md:py-4 rounded-xl transition-all text-sm md:text-base">
            View Gift Collections
          </Button>
        </div>
      </div>
    </section>
  )
}
