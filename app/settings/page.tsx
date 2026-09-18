"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Code2,
  LogOut,
  Monitor,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Theme = "system" | "light" | "dark";

const themes = [
  {
    id: "system" as Theme,
    title: "System",
    description: "আপনার ফোনের থিম অনুসরণ করবে",
    icon: Monitor,
  },
  {
    id: "light" as Theme,
    title: "Light",
    description: "উজ্জ্বল Light theme ব্যবহার করুন",
    icon: Sun,
  },
  {
    id: "dark" as Theme,
    title: "Dark",
    description: "ডার্ক theme ব্যবহার করুন",
    icon: Moon,
  },
];

function applyTheme(selectedTheme: Theme) {
  const root = document.documentElement;

  root.classList.remove("light", "dark");

  if (selectedTheme === "system") {
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    root.classList.add(systemDark ? "dark" : "light");
    return;
  }

  root.classList.add(selectedTheme);
}

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("system");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(
      "saiful-store-theme"
    ) as Theme | null;

    const initialTheme: Theme =
      savedTheme === "system" ||
      savedTheme === "light" ||
      savedTheme === "dark"
        ? savedTheme
        : "system";

    setTheme(initialTheme);
    applyTheme(initialTheme);

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemThemeChange = () => {
      const currentTheme = localStorage.getItem(
        "saiful-store-theme"
      );

      if (!currentTheme || currentTheme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, []);

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);

    localStorage.setItem(
      "saiful-store-theme",
      newTheme
    );

    applyTheme(newTheme);

    const message =
      newTheme === "system"
        ? "System theme চালু হয়েছে"
        : newTheme === "light"
        ? "Light theme চালু হয়েছে"
        : "Dark theme চালু হয়েছে";

    toast.success(message);
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const supabase = createClient();

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      window.location.href = "/login";
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Logout failed"
      );

      setLoggingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-5 text-white md:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold">
              Settings
            </h1>

            <p className="text-sm text-slate-400">
              অ্যাপের সেটিংস পরিচালনা করুন
            </p>
          </div>
        </div>

        {/* Account */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
        >
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold">
              Account
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              আপনার অ্যাকাউন্ট
            </p>
          </div>

          <div className="flex items-center gap-4 px-5 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15 text-blue-400">
              <UserRound size={24} />
            </div>

            <div>
              <p className="font-medium">
                Shopkeeper
              </p>

              <p className="text-sm text-slate-400">
                Saiful Store
              </p>
            </div>
          </div>
        </motion.section>

        {/* Appearance */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
        >
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold">
              Appearance
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              অ্যাপের থিম নির্বাচন করুন
            </p>
          </div>

          <div className="space-y-2 p-3">
            {themes.map((item) => {
              const Icon = item.icon;
              const selected = theme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleThemeChange(item.id)
                  }
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-blue-500 bg-blue-600/10"
                      : "border-transparent bg-slate-800/50 hover:bg-slate-800"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon size={21} />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium">
                      {item.title}
                    </p>

                    <p className="text-sm text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  {selected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check size={15} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Logout */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10 rounded-2xl border border-red-900/40 bg-slate-900 p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <LogOut size={21} />
            </div>

            <div className="flex-1">
              <h2 className="font-semibold">
                Logout
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                আপনার অ্যাকাউন্ট থেকে লগআউট করুন
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </div>
        </motion.section>

        {/* Developer */}
        <section className="border-t border-slate-800 pb-5 pt-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-blue-400">
            <Code2 size={28} />
          </div>

          <h2 className="mt-4 text-lg font-semibold">
            App Developer
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Saiful Store Management App
          </p>

          <p className="mt-3 text-xs text-slate-500">
            Built with Next.js, Supabase & Tailwind CSS
          </p>

          <p className="mt-2 text-xs text-slate-600">
            © {new Date().getFullYear()} Masud Rana
          </p>
        </section>
      </div>
    </main>
  );
}