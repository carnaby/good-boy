import type { Metadata } from 'next';
import { ContactContent } from '@/features/contact/ContactContent';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Kontakt – Good Boy',
  description: 'Kontaktné údaje nadácie Good Boy — e-mail, adresa kancelárie a telefónne číslo.',
  openGraph: {
    title: 'Kontakt – Good Boy',
    description: 'Kontaktné údaje nadácie Good Boy — e-mail, adresa kancelárie a telefónne číslo.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
