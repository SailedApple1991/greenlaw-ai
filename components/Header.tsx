export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-b from-emerald-50/80 to-transparent dark:from-emerald-900/20 dark:to-transparent pt-6 pb-4">
      <div className="px-4 flex justify-center">
        <div className="layout-content-container flex flex-col w-full max-w-3xl">
          <div className="flex items-center gap-3 p-4">
            <div className="flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 rounded-full w-12 h-12">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-2xl">
                eco
              </span>
            </div>
            <div className="flex flex-col">
              <p className="text-[#2D3748] dark:text-white text-2xl font-bold leading-tight tracking-tight font-display">
                GreenLaw AI
              </p>
              <p className="text-[#333333] dark:text-gray-300 text-sm font-normal leading-normal">
                Environmental law &amp; policy assistant
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
