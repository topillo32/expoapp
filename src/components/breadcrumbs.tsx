import Link from "next/link";
import { ChevronRight, LayoutDashboard } from "lucide-react";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      <Link
        href="/organizador"
        className="flex items-center gap-1 hover:text-foreground"
      >
        <LayoutDashboard className="size-3.5" />
        Mis expos
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5 shrink-0" />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
