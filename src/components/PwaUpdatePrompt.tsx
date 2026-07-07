import { useRegisterSW } from 'virtual:pwa-register/react'

// New deploys land on `main` frequently (auto-publish on push, see CLAUDE.md).
// `registerType: 'prompt'` in vite.config.ts means the new service worker
// waits rather than taking over immediately, so an in-progress journal entry
// is never silently reloaded out from under the user — they choose when to
// pick up the update.
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg">
      <p className="flex-1 text-sm text-zinc-800">A new version is available.</p>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="rounded bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
      >
        Reload
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        className="text-sm text-zinc-500 hover:text-zinc-700"
      >
        Dismiss
      </button>
    </div>
  )
}
