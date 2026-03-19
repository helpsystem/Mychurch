// src/app/documents/page.tsx
// This file redirects the old /documents route to the current /admin/documents path.
import { redirect } from 'next/navigation';

export default function DocumentsRedirectPage() {
  redirect('/admin/documents');
}
