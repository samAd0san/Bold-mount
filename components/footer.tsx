import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Send } from 'lucide-react'

export default function Footer() {
  return (
    <footer id="contact" className="bg-secondary text-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12 lg:mb-16">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1 space-y-4 md:space-y-6">
            <Image
              src="/logo-cropped-bgremoved.png"
              alt="Bold Mount - Sunnah Superfood"
              width={200}
              height={75}
              className="h-10 md:h-12 lg:h-16 w-auto brightness-0 invert"
            />
            <p className="text-white/70 text-xs sm:text-sm md:text-base leading-relaxed">
              Luxury Sunnah Wellness. Sustainably Sourced. Nourishing body and soul since 2025.
            </p>
            <div className="flex space-x-3 md:space-x-4">
              <a 
                href="#" 
                className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-white transition-all duration-300" 
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 md:h-5 md:w-5" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-white transition-all duration-300" 
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 md:h-5 md:w-5" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-white transition-all duration-300" 
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4 md:h-5 md:w-5" />
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="text-white font-bold text-base md:text-lg lg:text-xl mb-3 md:mb-4 lg:mb-6">Shop</h3>
            <ul className="space-y-2 md:space-y-3 lg:space-y-4">
              <li>
                <Link href="#talbeenah" className="text-white/70 hover:text-primary transition-colors text-xs sm:text-sm md:text-base flex items-center gap-2 md:gap-3">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary"></span>
                  Talbeenah
                </Link>
              </li>
              <li>
                <Link href="#dates" className="text-white/70 hover:text-primary transition-colors text-xs sm:text-sm md:text-base flex items-center gap-2 md:gap-3">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary"></span>
                  Premium Dates
                </Link>
              </li>
              <li>
                <Link href="#honey" className="text-white/70 hover:text-primary transition-colors text-xs sm:text-sm md:text-base flex items-center gap-2 md:gap-3">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary"></span>
                  Sidr Honey
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-primary transition-colors text-xs sm:text-sm md:text-base flex items-center gap-2 md:gap-3">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary"></span>
                  Gift Sets
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-white font-bold text-base md:text-lg lg:text-xl mb-3 md:mb-4 lg:mb-6">Support</h3>
            <ul className="space-y-2 md:space-y-3 lg:space-y-4">
              <li>
                <Link href="#contact" className="text-white/70 hover:text-primary transition-colors text-xs sm:text-sm md:text-base flex items-center gap-2 md:gap-3">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-primary transition-colors text-xs sm:text-sm md:text-base flex items-center gap-2 md:gap-3">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary"></span>
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="#volunteer" className="text-white/70 hover:text-primary transition-colors text-xs sm:text-sm md:text-base flex items-center gap-2 md:gap-3">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary"></span>
                  Volunteer Log
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-white/70 hover:text-primary transition-colors text-xs sm:text-sm md:text-base flex items-center gap-2 md:gap-3">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary"></span>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <h3 className="text-white font-bold text-base md:text-lg lg:text-xl mb-3 md:mb-4 lg:mb-6">Contact</h3>
            <ul className="space-y-3 md:space-y-4 lg:space-y-5">
              <li className="flex items-start gap-3 md:gap-4">
                <Mail className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-xs sm:text-sm md:text-base">support@boldmount.com</span>
              </li>
              <li className="flex items-start gap-3 md:gap-4">
                <Phone className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-xs sm:text-sm md:text-base">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 md:gap-4">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-xs sm:text-sm md:text-base">Blessed Lands Worldwide</span>
              </li>
            </ul>
            
            {/* Newsletter Mini Form */}
            <div className="mt-5 md:mt-6 lg:mt-8">
              <p className="text-white font-semibold mb-2 md:mb-3 lg:mb-4 text-sm md:text-base">Stay Connected</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-l-lg md:rounded-l-xl px-3 md:px-4 lg:px-5 py-2 md:py-2.5 lg:py-3 text-xs sm:text-sm md:text-base text-white placeholder-white/50 focus:outline-none focus:border-primary"
                />
                <button className="bg-primary hover:bg-primary/90 text-white px-3 md:px-4 lg:px-5 py-2 md:py-2.5 lg:py-3 rounded-r-lg md:rounded-r-xl transition-colors">
                  <Send className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-5 md:pt-6 lg:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <p className="text-white/60 text-xs sm:text-sm md:text-base text-center md:text-left">
              © 2025 Bold Mount. All rights reserved.
            </p>
            <div className="flex gap-4 md:gap-6 lg:gap-8">
              <Link href="#" className="text-white/60 hover:text-primary text-xs sm:text-sm md:text-base transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-white/60 hover:text-primary text-xs sm:text-sm md:text-base transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
