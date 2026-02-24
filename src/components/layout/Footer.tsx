export function Footer () {
  return (
    <footer className="border-border-subtle bg-surface-base/60 text-muted-foreground mt-10 border-t px-6 py-6 text-center text-xs md:px-10">
      <span>© {new Date().getFullYear()} </span>
      <a
        href="https://pbsabella.github.io/"
        className="text-primary dark:text-primary-subtle font-semibold hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        pbsabella
      </a>
    </footer>
  )
}
