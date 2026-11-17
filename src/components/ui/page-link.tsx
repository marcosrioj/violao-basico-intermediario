'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { opensNewTab, type LinkPurpose } from '@/lib/link-navigation';

type PageLinkProps = Omit<ComponentProps<typeof NextLink>, 'href' | 'as' | 'target'> & {
  href: string;
  /** Mark supporting material explicitly; internal navigation uses the current tab. */
  purpose?: LinkPurpose;
};

export default function PageLink({
  href,
  rel,
  title,
  download,
  purpose = 'navigation',
  ...props
}: PageLinkProps) {
  const pathname = usePathname();
  const isDownload = download !== undefined && download !== false;
  const newTab =
    !isDownload && opensNewTab(href, pathname, process.env.NEXT_PUBLIC_SITE_URL, purpose);
  const description = props['aria-description'];
  return (
    <NextLink
      {...props}
      href={href}
      download={download}
      prefetch={newTab ? false : props.prefetch}
      target={newTab ? '_blank' : undefined}
      rel={
        newTab
          ? [...new Set(`${rel || ''} noopener noreferrer`.trim().split(/\s+/))].join(' ')
          : rel
      }
      title={newTab ? `${title ? `${title} · ` : ''}Abre em nova aba` : title}
      aria-description={
        newTab ? `${description ? `${description}. ` : ''}Abre em nova aba` : description
      }
    />
  );
}
