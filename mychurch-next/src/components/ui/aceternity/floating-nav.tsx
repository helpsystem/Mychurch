'use client';

import React from 'react';
import { FloatingDock } from '@/components/ui/floating-dock';
import { Home, Info, Image as ImageIcon, Video, BookOpen, FileText, Phone } from 'lucide-react';

export function FloatingNav() {
  const links = [
    {
      title: 'Home / خانه',
      icon: <Home className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/',
    },
    {
      title: 'About / درباره ما',
      icon: <Info className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/about',
    },
    {
      title: 'Gallery / گالری',
      icon: <ImageIcon className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/gallery',
    },
    {
      title: 'Sermons / موعظه‌ها',
      icon: <Video className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/sermons',
    },
    {
      title: 'Bible / کتاب مقدس',
      icon: <BookOpen className="h-full w-full text-neutral-500 dark:text-amber-400" />,
      href: '/bible',
    },
    {
      title: 'Documents / مدارک رسمی',
      icon: <FileText className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/documents',
    },
    {
      title: 'Contact / ارتباط با ما',
      icon: <Phone className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/contact',
    },
  ];

  return (
    <div className="flex items-center justify-center fixed bottom-8 inset-x-0 z-50">
      <FloatingDock items={links} />
    </div>
  );
}
