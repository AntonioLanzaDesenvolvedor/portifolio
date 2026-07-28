import { Code2 } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';

export function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-sky-400/15 bg-transparent py-8 sm:py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 text-center sm:px-6 md:flex-row md:gap-6 md:text-left lg:px-8">
        <div className="flex items-center gap-2 opacity-90 transition-opacity hover:opacity-100">
          <Code2 className="h-5 w-5 text-sky-300" />
          <span className="font-display text-lg font-bold text-sky-50">
            Antônio<span className="text-sky-300">.dev</span>
          </span>
        </div>

        <p className="max-w-sm text-sm text-sky-100/50">
          &copy; {currentYear} {t('footer.credit') as string}
        </p>

        <div className="flex items-center gap-6 text-sm font-medium text-sky-100/50">
          <a href="#" className="transition-colors hover:text-sky-200">
            Top
          </a>
          <a
            href="https://github.com/antonio-lanza"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-sky-200"
          >
            Source
          </a>
        </div>
      </div>
    </footer>
  );
}
