"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  ReceiptText,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import {
  getDashboardStats,
  getMonthlyChart,
  getTodayTransactions,
  type DashboardStats,
  type ChartData,
  type TodayTransaction,
} from "@/lib/dashboard";

const months = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const years = Array.from(
  { length: 6 },
  (_, index) => new Date().getFullYear() - index
);

function formatMoney(value: number) {
  return `৳ ${value.toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("bn-BD", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
  });
}

function CustomTooltip({
  active,
  payload,
  label,
  monthName,
}: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-xl">
      <p className="mb-2 text-sm font-semibold text-white">
        {label} {monthName}
      </p>

      {payload.map((item: any) => (
        <div
          key={item.dataKey}
          className="flex items-center justify-between gap-6 text-sm"
        >
          <span className="text-slate-400">
            {item.dataKey === "due"
              ? "বাকি"
              : item.dataKey === "payment"
              ? "জমা"
              : "নেট"}
          </span>

          <span className="font-semibold text-white">
            {formatMoney(Number(item.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardClient() {
  const now = new Date();

  const [year, setYear] = useState(
    now.getFullYear()
  );

  const [month, setMonth] = useState(
    now.getMonth() + 1
  );

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [chartData, setChartData] =
    useState<ChartData[]>([]);

  const [todayTransactions, setTodayTransactions] =
    useState<TodayTransaction[]>([]);

  const [todayDue, setTodayDue] =
    useState(0);

  const [todayPayment, setTodayPayment] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [email, setEmail] =
    useState("");

  const selectedMonthName =
    months[month - 1];

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const [
          dashboardStats,
          monthlyChart,
          todayData,
        ] = await Promise.all([
          getDashboardStats(year, month),
          getMonthlyChart(year, month),
          getTodayTransactions(),
        ]);

        setStats(dashboardStats);
        setChartData(monthlyChart);

        setTodayTransactions(
          todayData.transactions
        );

        setTodayDue(todayData.totalDue);
        setTodayPayment(
          todayData.totalPayment
        );
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Dashboard data load failed"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [year, month]);

  useEffect(() => {
    async function loadUser() {
      try {
        const { createClient } =
          await import("@/lib/supabase/client");

        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        setEmail(user?.email ?? "");
      } catch (error) {
        console.error(error);
      }
    }

    loadUser();
  }, []);

  const todayBalance = useMemo(
    () => todayDue - todayPayment,
    [todayDue, todayPayment]
  );

  if (loading && !stats) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-5">
            <div className="h-8 w-48 rounded bg-slate-800" />
            <div className="h-4 w-64 rounded bg-slate-800" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="h-36 rounded-2xl bg-slate-900" />
              <div className="h-36 rounded-2xl bg-slate-900" />
              <div className="h-36 rounded-2xl bg-slate-900" />
            </div>

            <div className="h-96 rounded-2xl bg-slate-900" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-6 text-white md:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-7">
          <p className="text-sm text-slate-500">
            Saiful Store Management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Dashboard
          </h1>

          {email && (
            <p className="mt-1 text-sm text-slate-400">
              {email}
            </p>
          )}
        </header>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Customers */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  মোট Customer
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {stats?.totalCustomers ?? 0}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400">
                <Users size={28} />
              </div>
            </div>
          </motion.div>

          {/* Due customers */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  বাকি Customer
                </p>

                <p className="mt-2 text-4xl font-bold text-red-400">
                  {stats?.dueCustomers ?? 0}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <UserCheck size={28} />
              </div>
            </div>
          </motion.div>

          {/* Current balance */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  বর্তমান মোট বাকি
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-400">
                  {formatMoney(
                    stats?.currentBalance ?? 0
                  )}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <WalletCards size={28} />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Monthly report */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <CalendarDays
                  size={21}
                  className="text-blue-400"
                />

                <h2 className="text-xl font-bold">
                  {selectedMonthName} {year}-এর হিসাব
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                প্রতিদিনের বাকি ও জমার পরিমাণ
              </p>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={month}
                onChange={(e) =>
                  setMonth(Number(e.target.value))
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              >
                {months.map((name, index) => (
                  <option
                    key={name}
                    value={index + 1}
                  >
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) =>
                  setYear(Number(e.target.value))
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              >
                {years.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly summary */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="rounded-xl bg-red-500/10 p-4">
              <div className="flex items-center gap-2 text-red-400">
                <ArrowDownLeft size={18} />

                <span className="text-sm">
                  এই মাসে বাকি
                </span>
              </div>

              <p className="mt-2 text-xl font-bold text-red-400">
                {formatMoney(
                  stats?.totalDue ?? 0
                )}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <ArrowUpRight size={18} />

                <span className="text-sm">
                  এই মাসে জমা
                </span>
              </div>

              <p className="mt-2 text-xl font-bold text-emerald-400">
                {formatMoney(
                  stats?.totalPayment ?? 0
                )}
              </p>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-4">
              <div className="flex items-center gap-2 text-blue-400">
                <CircleDollarSign size={18} />

                <span className="text-sm">
                  মাসের নেট
                </span>
              </div>

              <p className="mt-2 text-xl font-bold text-blue-400">
                {formatMoney(
                  (stats?.totalDue ?? 0) -
                    (stats?.totalPayment ?? 0)
                )}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[360px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ComposedChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  strokeOpacity={0.15}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />

                <Tooltip
                  content={
                    <CustomTooltip
                      monthName={selectedMonthName}
                    />
                  }
                />

                <Bar
                  dataKey="due"
                  name="Due"
                  fill="#ef4444"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={18}
                />

                <Bar
                  dataKey="payment"
                  name="Payment"
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={18}
                />

                <Line
                  type="monotone"
                  dataKey="net"
                  name="Net"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              বাকি
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              জমা
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              নেট
            </div>
          </div>
        </section>

        {/* Today's transactions */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-5">
            <div className="flex items-center gap-2">
              <ReceiptText
                size={22}
                className="text-blue-400"
              />

              <h2 className="text-xl font-bold">
                আজকের লেনদেন
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              আজকের সকল বাকি ও জমার হিসাব
            </p>
          </div>

          {/* Today's summary */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="rounded-xl bg-red-500/10 p-4">
              <p className="text-sm text-slate-400">
                আজকের বাকি
              </p>

              <p className="mt-2 text-xl font-bold text-red-400">
                {formatMoney(todayDue)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-500/10 p-4">
              <p className="text-sm text-slate-400">
                আজকের জমা
              </p>

              <p className="mt-2 text-xl font-bold text-emerald-400">
                {formatMoney(todayPayment)}
              </p>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-4">
              <p className="text-sm text-slate-400">
                আজকের নেট
              </p>

              <p
                className={`mt-2 text-xl font-bold ${
                  todayBalance > 0
                    ? "text-amber-400"
                    : todayBalance < 0
                    ? "text-emerald-400"
                    : "text-slate-300"
                }`}
              >
                {formatMoney(todayBalance)}
              </p>
            </div>
          </div>

          {/* Transaction list */}
          {todayTransactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 py-10 text-center">
              <ReceiptText
                size={35}
                className="mx-auto text-slate-600"
              />

              <p className="mt-3 font-medium text-slate-400">
                আজ এখনো কোনো লেনদেন নেই
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Customer-এর হিসাব থেকে নতুন লেনদেন যোগ করুন
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTransactions.map(
                (transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        transaction.type ===
                        "due"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {transaction.type ===
                      "due" ? (
                        <ArrowDownLeft
                          size={21}
                        />
                      ) : (
                        <ArrowUpRight
                          size={21}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">
                        {transaction.customer_name}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {transaction.description ||
                          (transaction.type ===
                          "due"
                            ? "বাকি"
                            : "জমা")}
                        {" • "}
                        {formatTime(
                          transaction.created_at
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.type ===
                          "due"
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {transaction.type ===
                        "due"
                          ? "+"
                          : "-"}
                        {formatMoney(
                          transaction.amount
                        )}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-600">
                        {formatDate(
                          transaction.created_at
                        )}
                      </p>
                    </div>
                  </motion.div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}