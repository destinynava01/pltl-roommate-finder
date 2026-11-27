// Shared building blocks with the Octet Arms look: lobby panels on a night street, rose neon buttons, and an amber
// "MOVED IN" tag

export function CenterCard({ title, children }) {
  return (
    <main className="lab-bg flex min-h-dvh items-center justify-center p-4 text-ink">
      <div className="paper pinned w-full max-w-md rounded-2xl p-8 text-center">
        <h1 className="font-display text-4xl font-bold text-ink">{title}</h1>
        {children}
      </div>
    </main>
  )
}

export function Label({ children, className = '' }) {
  return <p className={`text-xs font-bold uppercase tracking-[0.2em] text-muted ${className}`}>{children}</p>
}

const BUTTONS = {
  primary: 'bg-accent text-on-accent shadow-[0_0_18px_rgb(251_113_133/0.35)] hover:brightness-110',
  fire: 'bg-fire text-on-accent shadow-[0_0_18px_rgb(245_158_11/0.4)] hover:brightness-110',
  outline: 'border border-line bg-panel text-ink hover:bg-hover',
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`rounded-full px-7 py-3 font-display text-lg font-bold tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${BUTTONS[variant]} ${className}`}
      {...props}
    />
  )
}

// A lobby panel
export function Paper({ children, className = '', pinned = true }) {
  return <section className={`paper rounded-2xl p-5 ${pinned ? 'pinned' : ''} ${className}`}>{children}</section>
}

// The amber tag ("MOVED IN", "DONE")
export function Stamp({ children, className = '' }) {
  return <span className={`stamp stamp-in ${className}`}>{children}</span>
}
