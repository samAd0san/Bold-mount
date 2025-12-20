import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'How do I prepare Bold Mount Talbeenah?',
    answer: 'Add 2-3 tablespoons to milk or water. Cook on low heat, stirring constantly until the mixture thickens. Garnish with our Raw Honey and Medjoul dates for a complete superfood meal.',
  },
  {
    question: 'Is this product effective for mood support?',
    answer: 'Yes. Hadith [Bukhari 5417] notes its ability to relieve sorrow. Scientifically, barley is rich in Magnesium and Tryptophan, which help regulate mood naturally.',
  },
  {
    question: 'Are your dates and honey 100% natural?',
    answer: 'Absolutely. We source directly from the blessed lands of Madinah, Jordan, and beyond. No preservatives, no artificial processing.',
  },
  {
    question: 'What makes your Talbeenah different from others?',
    answer: 'Our premium roasted barley is carefully prepared according to traditional Sunnah recommendations, with no shortcuts or artificial additives.',
  },
  {
    question: 'Do you ship internationally?',
    answer: 'Yes, we ship to most countries worldwide. Shipping times and costs vary by location.',
  },
  {
    question: 'How should I store these products?',
    answer: 'Store Talbeenah in a cool, dry place. Honey at room temperature. Dates can be refrigerated for extended freshness.',
  },
]

export default function FAQSection() {
  return (
    <section id="faq" className="py-12 md:py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-secondary mb-4 md:mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-4">
            Find answers to common questions about our products.
          </p>
        </div>
        
        <Accordion type="single" collapsible className="space-y-3 md:space-y-4 lg:space-y-5">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-tertiary/30 border-0 rounded-xl md:rounded-2xl px-4 md:px-6 lg:px-8 data-[state=open]:bg-white data-[state=open]:shadow-lg transition-all"
            >
              <AccordionTrigger className="text-secondary hover:text-primary text-left py-4 md:py-5 lg:py-6 font-semibold text-sm sm:text-base md:text-lg hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 md:pb-5 lg:pb-6 text-xs sm:text-sm md:text-base leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
