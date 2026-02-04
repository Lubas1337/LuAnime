import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { WebsiteJsonLd, OrganizationJsonLd } from '@/components/seo/json-ld';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnalyticsProvider>
      <div className="flex min-h-screen flex-col">
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </AnalyticsProvider>
  );
}
