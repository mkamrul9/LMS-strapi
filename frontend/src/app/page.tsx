import Navbar from '@/components/layout/Navbar';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-24">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-6">
          Welcome to the LMS Platform
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl text-center mb-10">
          A production-grade learning management system built with Next.js and Strapi.
        </p>
      </main>
    </>
  );
}
