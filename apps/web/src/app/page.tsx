import LoginForm from "@/components/auth/LoginForm";
import Navbar from "@/components/layout/Navbar";

export default function LoginPage() {
  return (
    <main className="hero-grid relative min-h-screen overflow-hidden px-4 pb-8 pt-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.16),transparent_22%)]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col">
        <Navbar />
        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-300">
              Enterprise-grade cloud workspace
            </div>
            <h1 className="display-font text-5xl font-bold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Build faster in the cloud with{" "}
              <span className="text-teal-300">VoidLAB</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              A sleek online IDE and compiler for modern teams, creators, and
              students. Write from any device, run instantly, and keep your
              workspace personalized.
            </p>
          </div>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
