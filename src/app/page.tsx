export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          The Harm Watch
        </h1>
        <p className="text-muted-foreground text-base leading-7">
          A public reporting service for websites that may breach the Online
          Safety Act 2023. Opening soon.
        </p>
        <p className="text-sm text-muted-foreground">
          harm.watch
        </p>
      </div>
    </main>
  );
}
