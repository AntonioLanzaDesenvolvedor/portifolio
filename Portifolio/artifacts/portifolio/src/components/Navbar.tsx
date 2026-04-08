import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Code2, Globe } from 'lucide-react';
import { useI18n } from '../i18n/i18n';

const NAV_LINKS = [
  { name: 'About', href: '#about' },
  { name: 'Skills', href: '#skills' },
  { name: 'Projects', href: '#projects' },
  { name: 'Contact', href: '#contact' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const { language, setLanguage } = useI18n();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group outline-none">
          <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            Antônio<span className="text-primary">.dev</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1"
            >
              {link.name}
            </a>
          ))}

          {/* Language Selector */}
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Change language"
            >
              <Globe className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {languageDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[170px] bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50"
                >
                  {['en', 'pt', 'es'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang as 'en' | 'pt' | 'es');
                        setLanguageDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium transition-colors ${
                        language === lang
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {lang === 'en' && 'English'}
                      {lang === 'pt' && 'Português'}
                      {lang === 'es' && 'Español'}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a
            href="#contact"
            className="px-4 py-2 rounded-full font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
          >
            Hire Me
          </a>
        </nav>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-3">
          {/* Mobile Language Selector */}
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted/60 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Change language"
            >
              <Globe className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {languageDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[170px] bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50"
                >
                  {['en', 'pt', 'es'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang as 'en' | 'pt' | 'es');
                        setLanguageDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium transition-colors ${
                        language === lang
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {lang === 'en' && 'English'}
                      {lang === 'pt' && 'Português'}
                      {lang === 'es' && 'Español'}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted/60 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-background/95 backdrop-blur-md overflow-hidden"
          >
            <div className="flex flex-col px-4 py-6 gap-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground py-2 border-b border-border/50"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}