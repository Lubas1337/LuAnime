import { HeroBanner } from '@/components/home/hero-banner';
import { TrendingSection } from '@/components/home/trending-section';
import { NewReleasesSection } from '@/components/home/new-releases-section';
import { ScheduleSection } from '@/components/home/schedule-section';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-16">
      <HeroBanner />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <TrendingSection />
        <NewReleasesSection />
        <ScheduleSection />
      </div>
    </div>
  );
}
