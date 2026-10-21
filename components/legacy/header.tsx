'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, Search, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

const dateVarieties = [
  'Ajwah Madeenah Premium',
  'Medjoul Jordanian',
  'Amber Madinah',
  'Safawi (Kalmi) Madeenah',
  'Mabroom Premium Saudi',
  'Sukkary',
  'Zahdi Iraqi',
  'Tunisian (Deglet Noor)',
  'Suqai',
  'Safawi Madina',
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        isScrolled 
          ? 'glass-nav shadow-lg' 
          : 'bg-white'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 md:h-18 items-center justify-between">
          {/* Logo - Appropriate size */}
          <Link href="/" className="flex-shrink-0 transition-transform hover:scale-105">
            <Image
              src="/logo-cropped-bgremoved.png"
              alt="Bold Mount"
              width={180}
              height={50}
              className="h-12 sm:h-14 md:h-16 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link
              href="#talbeenah"
              className="text-sm xl:text-base font-medium text-secondary hover:text-primary transition-colors relative group"
            >
              Talbeenah
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>

            <Link
              href="#honey"
              className="text-sm xl:text-base font-medium text-secondary hover:text-primary transition-colors relative group"
            >
              Premium Honey
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-sm xl:text-base font-medium text-secondary hover:text-primary hover:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-primary p-0">
                    Dates Gallery
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[400px] p-4 bg-white border border-tertiary shadow-xl rounded-xl">
                      <div className="grid grid-cols-2 gap-2">
                        {dateVarieties.map((variety) => (
                          <NavigationMenuLink key={variety} asChild>
                            <Link
                              href="#dates"
                              className="block p-2.5 rounded-lg hover:bg-primary/5 hover:text-primary transition-all text-sm font-medium text-secondary"
                            >
                              {variety}
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link
              href="#volunteer"
              className="text-sm xl:text-base font-medium text-secondary hover:text-primary transition-colors relative group"
            >
              Volunteer
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>

            <Link
              href="#contact"
              className="text-sm xl:text-base font-medium text-secondary hover:text-primary transition-colors relative group"
            >
              Contact Us
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>

            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" size="icon" className="text-secondary hover:text-primary hover:bg-primary/5 h-10 w-10">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative text-secondary hover:text-primary hover:bg-primary/5 h-10 w-10">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-xs flex items-center justify-center text-white font-bold">0</span>
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary h-9 w-9">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-secondary hover:text-primary h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-full bg-white shadow-lg border-t border-tertiary/30 animate-in slide-in-from-top-2 duration-200">
            <nav className="container mx-auto px-4 py-4 flex flex-col space-y-1">
              <Link 
                href="#talbeenah" 
                className="text-base font-medium text-secondary hover:text-primary hover:bg-primary/5 py-3 px-4 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Talbeenah
              </Link>
              <Link 
                href="#honey" 
                className="text-base font-medium text-secondary hover:text-primary hover:bg-primary/5 py-3 px-4 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Premium Honey
              </Link>
              <Link 
                href="#dates" 
                className="text-base font-medium text-secondary hover:text-primary hover:bg-primary/5 py-3 px-4 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dates Gallery
              </Link>
              <Link 
                href="#volunteer" 
                className="text-base font-medium text-secondary hover:text-primary hover:bg-primary/5 py-3 px-4 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Volunteer
              </Link>
              <Link 
                href="#contact" 
                className="text-base font-medium text-secondary hover:text-primary hover:bg-primary/5 py-3 px-4 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
