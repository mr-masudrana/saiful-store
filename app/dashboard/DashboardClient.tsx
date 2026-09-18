"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserRoundCheck,
  Wallet,
  CreditCard,
  TrendingUp,
  Download,
  RefreshCw,
  LogOut,
  UserPlus,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import {
  getDashboardOverview,
  getMonthlyStats,
  getMonthlyChart,
  type DashboardStats,
  type MonthlyStats,
  type ChartData,
} from "@/lib/dashboard";

import DashboardChart from "@/components/DashboardChart";

type Props = {
  user: {
    email?: string;
  };
};

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

export default function DashboardClient({
  user,
}: Props) {
  const router = useRouter();

  const now = new Date();

  const [selectedMonth, setSelectedMonth] =
    useState(now.getMonth() + 1);

  const [selectedYear, setSelectedYear] =
    useState(now.getFullYear());

  const [overview, setOverview] =
    useState<DashboardStats | null>(null);

  const [monthly, setMonthly] =
    useState<MonthlyStats | null>(null);

  const [chart, setChart] =
    useState<ChartData[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [pdfLoading, setPdfLoading] =
    useState(false);

  const reportRef =
    useRef<HTMLDivElement>(null);

  const years = useMemo(() => {
    const currentYear = now.getFullYear();

    return Array.from(
      { length: 10 },
      (_, index) =>
        currentYear - 5 + index
    );
  }, []);

  const formatMoney = (value: number) => {
    return `৳ ${value.toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        overviewData,
        monthlyData,
        chartData,
      ] = await Promise.all([
        getDashboardOverview(),
        getMonthlyStats(
          selectedYear,
          selectedMonth
        ),
        getMonthlyChart(
          selectedYear,
          selectedMonth
        ),
      ]);

      setOverview(overviewData);
      setMonthly(monthlyData);
      setChart(chartData);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Dashboard load করা যায়নি।"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth, selectedYear]);

  const handleLogout = async () => {
    try {
      const { createClient } =
        await import("@/lib/supabase/client");

      const supabase = createClient();

      await supabase.auth.signOut();

      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout করা যায়নি।");
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current || !monthly || !overview) {
      return;
    }

    try {
      setPdfLoading(true);

      const canvas = await html2canvas(
        reportRef.current,
        {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
        }
      );

      const imageData =
        canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 10;

      const imageWidth =
        pageWidth - margin * 2;

      const imageHeight =
        (canvas.height * imageWidth) /
        canvas.width;

      let heightLeft = imageHeight;
      let position = margin;

      pdf.addImage(
        imageData,
        "PNG",
        margin,
        position,
        imageWidth,
        imageHeight
      );

      heightLeft -=
        pageHeight - margin * 2;

      while (heightLeft > 0) {
        position =
          heightLeft -
          imageHeight +
          margin;

        pdf.addPage();

        pdf.addImage(
          imageData,
          "PNG",
          margin,
          position,
          imageWidth,
          imageHeight
        );

        heightLeft -=
          pageHeight - margin * 2;
      }

      const monthName =
        months[selectedMonth - 1];

      pdf.save(
        `Saiful-Store-${monthName}-${selectedYear}.pdf`
      );

      toast.success(
        "PDF সফলভাবে download হয়েছে।"
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "PDF তৈরি করা যায়নি।"
      );
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-5 md:px-8 md:pb-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Saiful Store Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white">
              Dashboard
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              {user.email}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                router.push("/customers")
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Users size={17} />
              Customers
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>

        {/* ================================= */}
        {/* OVERVIEW */}
        {/* ================================= */}

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-white">
            দোকানের বর্তমান অবস্থা
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            {/* Total Customers */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    মোট Customer
                  </p>

                  <p className="mt-2 text-3xl font-bold text-white">
                    {loading
                      ? "—"
                      : overview?.totalCustomers ?? 0}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Users size={23} />
                </div>
              </div>
            </div>

            {/* Customers With Due */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    বাকি Customer
                  </p>

                  <p className="mt-2 text-3xl font-bold text-red-400">
                    {loading
                      ? "—"
                      : overview?.customersWithDue ??
                        0}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <UserRoundCheck size={23} />
                </div>
              </div>
            </div>

            {/* Current Balance */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    বর্তমান মোট বাকি
                  </p>

                  <p className="mt-2 text-3xl font-bold text-amber-400">
                    {loading
                      ? "—"
                      : formatMoney(
                          overview?.totalCurrentBalance ??
                            0
                        )}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <Wallet size={23} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================= */}
        {/* MONTH FILTER */}
        {/* ================================= */}

        <section className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

            <div>
              <h2 className="font-bold text-white">
                মাসিক হিসাব
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                যে মাসের হিসাব দেখতে চান নির্বাচন করুন
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  মাস
                </label>

                <select
                  value={selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 sm:w-40"
                >
                  {months.map(
                    (month, index) => (
                      <option
                        key={month}
                        value={index + 1}
                      >
                        {month}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  বছর
                </label>

                <select
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 sm:w-32"
                >
                  {years.map((year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={loadDashboard}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>

              <button
                onClick={downloadPDF}
                disabled={
                  pdfLoading ||
                  loading ||
                  !monthly
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {pdfLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={16} />
                )}

                {pdfLoading
                  ? "PDF তৈরি হচ্ছে..."
                  : "PDF Download"}
              </button>
            </div>
          </div>
        </section>

        {/* ================================= */}
        {/* MONTHLY STATS */}
        {/* ================================= */}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

          {/* Monthly Due */}
          <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  এই মাসের মোট বাকি
                </p>

                <p className="mt-2 text-2xl font-bold text-red-400">
                  {loading
                    ? "—"
                    : formatMoney(
                        monthly?.totalDue ?? 0
                      )}
                </p>
              </div>

              <TrendingUp
                className="text-red-400"
                size={24}
              />
            </div>
          </div>

          {/* Monthly Payment */}
          <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  এই মাসের মোট জমা
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  {loading
                    ? "—"
                    : formatMoney(
                        monthly?.totalPayment ?? 0
                      )}
                </p>
              </div>

              <CreditCard
                className="text-emerald-400"
                size={24}
              />
            </div>
          </div>

          {/* Monthly Net */}
          <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  এই মাসের নেট বাকি
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-400">
                  {loading
                    ? "—"
                    : formatMoney(
                        monthly?.balance ?? 0
                      )}
                </p>
              </div>

              <Wallet
                className="text-blue-400"
                size={24}
              />
            </div>
          </div>
        </div>

        {/* ================================= */}
        {/* CHART */}
        {/* ================================= */}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">
              {months[selectedMonth - 1]}{" "}
              {selectedYear}-এর হিসাব
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              প্রতিদিনের বাকি ও জমার পরিমাণ
            </p>
          </div>

          {loading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2
                className="animate-spin text-slate-600"
                size={30}
              />
            </div>
          ) : (
            <DashboardChart data={chart} />
          )}
        </section>

        {/* ================================= */}
        {/* QUICK ACTIONS */}
        {/* ================================= */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">
              দ্রুত কাজ
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Customer হিসাব দ্রুত পরিচালনা করুন
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            <button
              onClick={() =>
                router.push("/customers")
              }
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left hover:bg-slate-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <UserPlus size={20} />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Customer যোগ করুন
                </p>

                <p className="text-xs text-slate-500">
                  নতুন customer সংরক্ষণ করুন
                </p>
              </div>
            </button>

            <button
              onClick={() =>
                router.push("/customers")
              }
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left hover:bg-slate-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <FileText size={20} />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  বাকি হিসাব দেখুন
                </p>

                <p className="text-xs text-slate-500">
                  Customer-এর হিসাব পরিচালনা করুন
                </p>
              </div>
            </button>
          </div>
        </section>

      </div>

      {/* ================================= */}
      {/* PDF REPORT */}
      {/* ================================= */}

      <div
        ref={reportRef}
        style={{
          position: "absolute",
          left: "-10000px",
          top: "0",
          width: "794px",
          background: "#ffffff",
          color: "#111827",
          padding: "40px",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            borderBottom:
              "2px solid #111827",
            paddingBottom: "20px",
            marginBottom: "25px",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              margin: 0,
            }}
          >
            Saiful Store
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#6b7280",
            }}
          >
            Customer Credit Management
          </p>

          <h2
            style={{
              marginTop: "20px",
              fontSize: "22px",
            }}
          >
            মাসিক হিসাব
          </h2>

          <p>
            {months[selectedMonth - 1]}{" "}
            {selectedYear}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr 1fr",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              border: "1px solid #e5e7eb",
              padding: "18px",
              borderRadius: "10px",
            }}
          >
            <p>মোট Customer</p>

            <strong
              style={{
                fontSize: "24px",
              }}
            >
              {overview?.totalCustomers ?? 0}
            </strong>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              padding: "18px",
              borderRadius: "10px",
            }}
          >
            <p>বাকি Customer</p>

            <strong
              style={{
                fontSize: "24px",
              }}
            >
              {overview?.customersWithDue ?? 0}
            </strong>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              padding: "18px",
              borderRadius: "10px",
            }}
          >
            <p>বর্তমান মোট বাকি</p>

            <strong
              style={{
                fontSize: "24px",
              }}
            >
              {formatMoney(
                overview?.totalCurrentBalance ??
                  0
              )}
            </strong>
          </div>
        </div>

        <h3
          style={{
            fontSize: "20px",
            marginBottom: "15px",
          }}
        >
          নির্বাচিত মাসের হিসাব
        </h3>

        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
            marginBottom: "30px",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                }}
              >
                মোট বাকি
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  fontWeight: "bold",
                }}
              >
                {formatMoney(
                  monthly?.totalDue ?? 0
                )}
              </td>
            </tr>

            <tr>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                }}
              >
                মোট জমা
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  fontWeight: "bold",
                }}
              >
                {formatMoney(
                  monthly?.totalPayment ?? 0
                )}
              </td>
            </tr>

            <tr>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                }}
              >
                নেট বাকি
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  fontWeight: "bold",
                }}
              >
                {formatMoney(
                  monthly?.balance ?? 0
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <p
          style={{
            color: "#6b7280",
            fontSize: "12px",
            marginTop: "40px",
          }}
        >
          Generated by Saiful Store
        </p>
      </div>
    </main>
  );
}