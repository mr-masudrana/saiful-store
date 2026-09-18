"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();

      setInstallEvent(event as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  if (!show || !installEvent) return null;

  const handleInstall = async () => {
    await installEvent.prompt();

    const result = await installEvent.userChoice;

    if (result.outcome === "accepted") {
      setShow(false);
    }

    setInstallEvent(null);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-[380px]">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600">
            <Download size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white">
              Saiful Store App
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              দ্রুত ব্যবহারের জন্য Saiful Store আপনার ফোনে ইনস্টল করুন।
            </p>

            <button
              onClick={handleInstall}
              className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Install App
            </button>
          </div>

          <button
            onClick={() => setShow(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
