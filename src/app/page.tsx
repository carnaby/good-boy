import type { Metadata } from 'next';
import { Step1 } from '@/features/donation/steps/Step1';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Výber útulku – Good Boy',
  description: 'Vyberte si útulok a sumu, ktorou chcete prispieť na pomoc psom v núdzi.',
  openGraph: {
    title: 'Výber útulku – Good Boy',
    description: 'Vyberte si útulok a sumu, ktorou chcete prispieť na pomoc psom v núdzi.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function Home() {
  return <Step1 />;
}
