import Header from '@/components/landing/Header';
import Footer from '@/components/ui/footer';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className='min-h-screen'>{children}</main>
      <Footer />
    </>
  );
}
