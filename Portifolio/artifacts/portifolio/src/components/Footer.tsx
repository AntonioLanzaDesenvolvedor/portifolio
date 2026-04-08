import { Code2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';

export function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
          <Code2 className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-lg">
            Antônio<span className="text-primary">.dev</span>
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground text-center md:text-left">
          &copy; {currentYear} {t('footer.credit') as string}
        </p>

        <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Top</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Source</a>
        </div>
      </div>
    </footer>
  );
}
