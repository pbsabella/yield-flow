export function Footer () {
  return (
    <footer className="border-border-subtle bg-surface-base/60 text-muted-foreground mt-10 border-t px-6 py-6 text-center text-xs md:px-10">
      Built by{" "}
      <a
        href="https://pbsabella.vercel.app/"
        className="text-primary dark:text-primary-subtle font-semibold hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        pbsabella
      </a>
      <span className="mx-2">·</span>
      <a
        href="https://github.com/pbsabella/yield-flow"
        target="_blank"
        rel="noreferrer"
        className="hover:underline"
      >
        View source
      </a>
      <span className="mx-2">·</span>
      <a
        href="https://github.com/pbsabella/yield-flow/issues"
        target="_blank"
        rel="noreferrer"
        className="hover:underline"
      >
        Feedback
      </a>
    </footer>
  )
}
