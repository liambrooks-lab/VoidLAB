import LoginForm from "@/components/auth/LoginForm";
import Navbar from "@/components/layout/Navbar";

export default function LoginPage() {
  return (
    <main className="hero-grid relative min-h-screen overflow-hidden px-4 pb-8 pt-6 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(191,219,254,0.45),transparent_22%)]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col">
        <Navbar />
        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-600 shadow-[0_12px_30px_rgba(148,163,184,0.12)]">
              Premium cloud workspace
            </div>
            <h1 className="display-font text-5xl font-bold tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
              Build faster in the cloud with{" "}
              <span className="text-sky-700">VoidLAB</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              A polished online IDE and compiler for builders who want a clean,
              modern workspace. Write from any device, run instantly, and shape
              your identity later from the in-product profile section.
            </p>
          </div>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
