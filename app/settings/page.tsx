"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  LogOut,
  Monitor,
  Moon,
  Sun,
  UserRound,
  Code2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Theme = "system" | "light" | "dark";

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("system");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("saiful-store-theme") as Theme | null;

    if (
      savedTheme === "system" ||
      savedTheme === "light" ||
      savedTheme === "dark"
    ) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme("system");
    }
  }, []);

  function applyTheme(selectedTheme: Theme) {
    const root = document.documentElement;

    if (selectedTheme === "system") {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      root.classList.toggle("dark", systemDark);
      root.classList.toggle("light", !systemDark);
    } else if (selectedTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);

    localStorage.setItem("saiful-store-theme", newTheme);

    applyTheme(newTheme);

    toast.success(
      newTheme === "system"
        ? "System theme selected"
        : `${newTheme === "light" ? "Light" : "Dark"} theme selected`
    );
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

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

  const themes = [
    {
      id: "system" as Theme,
      title: "System",
      description: "Use your device theme",
      icon: Monitor,
    },
    {
      id: "light" as Theme,
      title: "Light",
      description: "Use light theme",
      icon: Sun,
    },
    {
      id: "dark" as Theme,
      title: "Dark",
      description: "Use dark theme",
      icon: Moon,
    },
  ];

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
              Manage your app preferences
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
              Manage your account
            </p>
          </div>

          <div className="flex items-center gap-4 px-5 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15 text-blue-400">
              <UserRound size={24} />
            </div>

            <div>
              <p className="font-medium text-white">
                Shopkeeper
              </p>

              <p className="text-sm text-slate-400">
                Saiful Store
              </p>
            </div>
          </div>
        </motion.section>

        {/* Theme */}
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
              Choose how Saiful Store looks
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
                  onClick={() => handleThemeChange(item.id)}
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
                    <p className="font-medium text-white">
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
          className="mb-8 rounded-2xl border border-red-900/40 bg-slate-900 p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <LogOut size={21} />
            </div>

            <div className="flex-1">
              <h2 className="font-semibold">
                Logout
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Sign out from your account
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </motion.section>

        {/* Developer */}
        <section className="border-t border-slate-800 pt-8 text-center">
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