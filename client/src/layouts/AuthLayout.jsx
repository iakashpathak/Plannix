import { CheckCircle2, FolderKanban, ListChecks } from "lucide-react";
import { Logo } from "./AppLayout";

export default function AuthLayout({ title, subtitle, children, footer, mobileBrandHeader = false }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-ink-800 p-10 text-ink-300 lg:flex xl:p-14">
        <div className="pointer-events-none absolute -right-36 -top-32 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 my-14 max-w-xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-100">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
            A clearer way to work
          </p>
          <h2 className="max-w-lg text-4xl font-bold leading-[1.12] text-white xl:text-5xl">
            Bring your projects into focus.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-ink-300">
            Organize the work, keep priorities visible, and know what needs your attention next.
          </p>

          <ul className="mt-9 max-w-lg space-y-3">
            {[
              { icon: FolderKanban, title: "Projects with purpose", description: "Keep related tasks together." },
              { icon: ListChecks, title: "Clear next steps", description: "Track priorities, status, and due dates." },
              { icon: CheckCircle2, title: "Progress at a glance", description: "See what is moving and what is done." },
            ].map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-100">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="mt-0.5 block text-sm text-ink-300">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs font-medium tracking-wide text-ink-400">Projects <span className="px-1.5 text-brand-500">·</span> Tasks <span className="px-1.5 text-brand-500">·</span> Progress</p>
      </aside>

      <main
        className={`flex min-h-screen px-4 sm:px-8 sm:py-10 ${mobileBrandHeader ? "flex-col justify-start py-4" : "items-center justify-center py-8"} lg:items-center lg:justify-center`}
      >
        {mobileBrandHeader && (
          <div className="relative -mx-4 -mt-4 flex w-[calc(100%+2rem)] shrink-0 justify-start bg-gradient-to-r from-brand-50 via-white to-cyan-50/80 px-4 pb-4 pt-4 shadow-[0_4px_18px_rgba(15,135,145,0.06)] sm:-mx-8 sm:w-[calc(100%+4rem)] sm:px-8 lg:hidden">
            <div className="brand-intro">
              <Logo dark={false} large />
            </div>
            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-brand-500 via-brand-600 to-cyan-400 shadow-[0_0_12px_rgba(15,135,145,0.5)]" aria-hidden="true" />
          </div>
        )}
        <div className={`w-full max-w-md ${mobileBrandHeader ? "my-auto lg:my-0" : ""}`}>
          {!mobileBrandHeader && (
            <div className="mb-7 flex justify-center lg:hidden">
              <Logo dark={false} large />
            </div>
          )}
          <h1 className="text-center text-2xl font-bold leading-tight sm:text-left sm:text-3xl">{title}</h1>
          <p className="mt-2 text-center text-sm leading-6 text-ink-500 sm:text-left sm:text-base">{subtitle}</p>
          <div className="mt-6 rounded-2xl border border-line/80 bg-white p-5 shadow-sm sm:mt-8 sm:p-8">{children}</div>
          <p className="mt-6 text-center text-sm text-ink-500">{footer}</p>
        </div>
      </main>
    </div>
  );
}
