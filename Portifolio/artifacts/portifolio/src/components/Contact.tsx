import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, ArrowRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { useI18n } from '@/i18n/i18n';

export function Contact() {
  const { t } = useI18n();
  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-secondary/20 border-t border-border/50">
      {/* Decorative glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <SectionHeading 
          title={t('contact.title') as string}
          subtitle={t('contact.subtitle') as string}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-10 md:p-16 rounded-[2.5rem] mt-12 flex flex-col items-center"
        >
          <a 
            href="mailto:hello@example.com"
            className="group flex items-center justify-center gap-3 px-8 py-4 mb-10 text-lg font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1"
          >
            {t('contact.send') as string}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-lg">
            <ContactLink 
              href="mailto:hello@example.com" 
              icon={<Mail className="w-6 h-6" />} 
              label="Email" 
            />
            <ContactLink 
              href="https://github.com" 
              icon={<Github className="w-6 h-6" />} 
              label="GitHub" 
            />
            <ContactLink 
              href="https://linkedin.com" 
              icon={<Linkedin className="w-6 h-6" />} 
              label="LinkedIn" 
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ContactLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-background/50 hover:bg-background border border-border/50 hover:border-primary/30 transition-all duration-300 group"
    >
      <div className="p-3 rounded-xl bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <span className="font-medium text-sm text-muted-foreground group-hover:text-foreground">{label}</span>
    </a>
  );
}
