import type { Metadata } from 'next';
import { ContactContent } from '@/features/contact/ContactContent';

export const metadata: Metadata = {
  title: 'Kontakt – Good Boy',
  description: 'Kontaktné údaje nadácie Good Boy — e-mail, adresa kancelárie a telefónne číslo.',
};

export default function ContactPage() {
  return <ContactContent />;
}
