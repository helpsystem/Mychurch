'use client';

import React from 'react';
import { FloatingDock } from '@/components/ui/floating-dock';
import { Home, Info, Image as ImageIcon, Video, BookOpen, FileText, Phone, Music } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

const localDict = {
  en: {
    home: 'Home',
    about: 'About',
    gallery: 'Gallery',
    sermons: 'Sermons',
    worship: 'Worship',
    bible: 'Bible',
    documents: 'Documents',
    contact: 'Contact',
  },
  fa: {
    home: 'خانه',
    about: 'درباره ما',
    gallery: 'گالری',
    sermons: 'موعظه‌ها',
    worship: 'پرستش',
    bible: 'کتاب مقدس',
    documents: 'مدارک رسمی',
    contact: 'ارتباط با ما',
  },
  es: {
    home: 'Inicio',
    about: 'Acerca de',
    gallery: 'Galería',
    sermons: 'Sermones',
    worship: 'Adoración',
    bible: 'Biblia',
    documents: 'Documentos',
    contact: 'Contacto',
  },
};

export function FloatingNav() {
  const { language } = useLanguage();
  const d = localDict[language] || localDict.fa;

  const links = [
    {
      title: d.home,
      icon: <Home className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/',
    },
    {
      title: d.about,
      icon: <Info className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/about',
    },
    {
      title: d.gallery,
      icon: <ImageIcon className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/gallery',
    },
    {
      title: d.sermons,
      icon: <Video className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/sermons',
    },
    {
      title: d.worship,
      icon: <Music className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/worship',
    },
    {
      title: d.bible,
      icon: <BookOpen className="h-full w-full text-neutral-500 dark:text-amber-400" />,
      href: '/bible',
    },
    {
      title: d.documents,
      icon: <FileText className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: '/documents',
    },
    {
      title: d.contact,
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
