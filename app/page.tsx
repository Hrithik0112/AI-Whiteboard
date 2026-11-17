import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
  return <LandingPage authConfigured={authConfigured} />;
}
