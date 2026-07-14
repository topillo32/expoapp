import { Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-background">
      <div className="flex w-full flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} FeriaSync</p>
        <a
          href="mailto:soportebeymatch@gmail.com"
          className="flex items-center gap-1.5 hover:text-foreground"
        >
          <Mail className="size-3.5" />
          soportebeymatch@gmail.com
        </a>
      </div>
    </footer>
  );
}
