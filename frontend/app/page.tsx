import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-neutral-950 text-white">
      <h1 className="text-5xl font-bold mb-8 tracking-tighter">Gym Appointments</h1>
      <p className="text-xl text-neutral-400 mb-12">Book your session with our top trainers.</p>
      <div className="flex gap-4">
        <Link href="/login" className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition">
          Login / Register
        </Link>
        <Link href="/login" className="px-6 py-3 border border-neutral-700 text-neutral-300 font-semibold rounded-lg hover:bg-neutral-900 transition">
          Browse Trainers
        </Link>
      </div>
    </main>
  );
}
