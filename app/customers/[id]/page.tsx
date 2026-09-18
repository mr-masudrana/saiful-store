"use client";

import { AnimatePresence, motion } from "framer-motion";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Phone,
  MapPin,
  MessageCircle,
  Wallet,
  CreditCard,
  Plus,
  Download,
  Loader2,
  CalendarDays,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

import {
  getCustomerById,
  getCustomerTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  type CustomerDetails,
  type Transaction,
  type TransactionType,
} from "@/lib/transactions";

import { downloadElementAsPdf } from "@/lib/pdf";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type TransactionFilter =
  | "all"
  | "due"
  | "payment";

export default function CustomerDetailsPage({
  params,
}: PageProps) {
  const { id } = use(params);

  const [customer, setCustomer] =
    useState<CustomerDetails | null>(null);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] =
    useState(new Date().getMonth() + 1);

  const [selectedYear, setSelectedYear] =
    useState(new Date().getFullYear());

  const [transactionFilter, setTransactionFilter] =
    useState<TransactionFilter>("all");

  const [transactionModal, setTransactionModal] =
    useState<{
      mode: "add" | "edit";
      type: TransactionType;
      transaction?: Transaction;
    } | null>(null);

  const [transactionType, setTransactionType] =
    useState<TransactionType>("due");

  const [amount, setAmount] = useState("");
  const [description, setDescription] =
    useState("");

  const [menuTransactionId, setMenuTransactionId] =
    useState<string | null>(null);

  const [deleteTransactionId, setDeleteTransactionId] =
    useState<string | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);

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

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from(
      { length: 10 },
      (_, index) => currentYear - 5 + index
    );
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [customerData, transactionData] =
        await Promise.all([
          getCustomerById(id),
          getCustomerTransactions(id),
        ]);

      setCustomer(customerData);
      setTransactions(transactionData);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Customer তথ্য load করা যায়নি।"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const totalDue = useMemo(() => {
    return transactions
      .filter((item) => item.type === "due")
      .reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );
  }, [transactions]);

  const totalPayment = useMemo(() => {
    return transactions
      .filter((item) => item.type === "payment")
      .reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );
  }, [transactions]);

  const currentBalance =
    totalDue - totalPayment;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const date = new Date(
        transaction.created_at
      );

      const matchesMonth =
        date.getMonth() + 1 === selectedMonth;

      const matchesYear =
        date.getFullYear() === selectedYear;

      const matchesType =
        transactionFilter === "all" ||
        transaction.type === transactionFilter;

      return (
        matchesMonth &&
        matchesYear &&
        matchesType
      );
    });
  }, [
    transactions,
    selectedMonth,
    selectedYear,
    transactionFilter,
  ]);

  const filteredDue = useMemo(() => {
    return filteredTransactions
      .filter((item) => item.type === "due")
      .reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );
  }, [filteredTransactions]);

  const filteredPayment = useMemo(() => {
    return filteredTransactions
      .filter((item) => item.type === "payment")
      .reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );
  }, [filteredTransactions]);

  const formatMoney = (value: number) => {
    return `৳ ${value.toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      "bn-BD",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString(
      "bn-BD",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const openAddTransaction = (
    type: TransactionType
  ) => {
    setTransactionModal({
      mode: "add",
      type,
    });

    setTransactionType(type);
    setAmount("");
    setDescription("");
  };

  const openEditTransaction = (
    transaction: Transaction
  ) => {
    setTransactionModal({
      mode: "edit",
      type: transaction.type,
      transaction,
    });

    setTransactionType(transaction.type);
    setAmount(String(transaction.amount));
    setDescription(
      transaction.description || ""
    );

    setMenuTransactionId(null);
  };

  const handleSaveTransaction = async () => {
    const numericAmount = Number(amount);

    if (!amount.trim()) {
      toast.error("Amount দিন।");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      toast.error("সঠিক amount দিন।");
      return;
    }

    try {
      setSaving(true);

      if (transactionModal?.mode === "add") {
        if (
          transactionType === "payment" &&
          numericAmount > currentBalance
        ) {
          toast.error(
            `Payment বর্তমান বাকি (${formatMoney(
              currentBalance
            )}) এর বেশি হতে পারবে না।`
          );
          return;
        }

        await addTransaction({
          customerId: id,
          type: transactionType,
          amount: numericAmount,
          description,
        });

        toast.success(
          transactionType === "due"
            ? "নতুন বাকি যোগ হয়েছে।"
            : "Payment যোগ হয়েছে।"
        );
      }

      if (
        transactionModal?.mode === "edit" &&
        transactionModal.transaction
      ) {
        const old =
          transactionModal.transaction;

        let balanceWithoutCurrent =
          currentBalance;

        if (old.type === "due") {
          balanceWithoutCurrent -= Number(
            old.amount
          );
        } else {
          balanceWithoutCurrent += Number(
            old.amount
          );
        }

        if (
          transactionType === "payment" &&
          numericAmount >
            Math.max(0, balanceWithoutCurrent)
        ) {
          toast.error(
            `Payment available balance-এর বেশি হতে পারবে না।`
          );
          return;
        }

        await updateTransaction({
          transactionId: old.id,
          type: transactionType,
          amount: numericAmount,
          description,
        });

        toast.success(
          "Transaction আপডেট হয়েছে।"
        );
      }

      setTransactionModal(null);
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Transaction save করা যায়নি।"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteTransactionId) return;

    try {
      setSaving(true);

      await deleteTransaction(
        deleteTransactionId
      );

      setDeleteTransactionId(null);

      toast.success(
        "Transaction delete হয়েছে।"
      );

      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Transaction delete করা যায়নি।"
      );
    } finally {
      setSaving(false);
    }
  };

  const downloadTransactionPDF = async () => {
    if (!pdfRef.current || !customer) return;

    try {
      setPdfLoading(true);

      const typeName =
        transactionFilter === "due"
          ? "দেনা"
          : transactionFilter === "payment"
            ? "জমা"
            : "সব";

      const filename =
        `Saiful-Store-${customer.name}-` +
        `${months[selectedMonth - 1]}-` +
        `${selectedYear}-${typeName}.pdf`;

      await downloadElementAsPdf(
        pdfRef.current,
        filename
      );

      toast.success(
        "Transaction PDF download হয়েছে।"
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

  const whatsappUrl = useMemo(() => {
    if (!customer) return "#";

    const message = `
আসসালামু আলাইকুম ${customer.name},

Saiful Store-এর আপনার বর্তমান হিসাব:

মোট বাকি: ${formatMoney(totalDue)}
মোট জমা: ${formatMoney(totalPayment)}
বর্তমান বাকি: ${formatMoney(currentBalance)}

ধন্যবাদ।
Saiful Store
`.trim();

    let phone =
      customer.phone.replace(/\D/g, "");

    if (phone.startsWith("01")) {
      phone =
        "880" + phone.substring(1);
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;
  }, [
    customer,
    totalDue,
    totalPayment,
    currentBalance,
  ]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2
          className="animate-spin text-blue-500"
          size={32}
        />
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Customer পাওয়া যায়নি।
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-5 md:px-8 md:pb-10">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/customers"
          className="mb-5 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
        >
          <ArrowLeft size={18} />
          Customers
        </Link>

        {/* Customer Profile */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col items-center text-center">

            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-slate-700 bg-slate-800 text-4xl font-bold text-slate-300">
              {customer.avatar_url ? (
                <img
                  src={customer.avatar_url}
                  alt={customer.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                customer.name
                  .trim()
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            <h1 className="mt-4 text-2xl font-bold text-white">
              {customer.name}
            </h1>

            <a
              href={`tel:${customer.phone}`}
              className="mt-2 flex items-center gap-2 text-sm text-slate-400"
            >
              <Phone size={15} />
              {customer.phone}
            </a>

            {customer.address && (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={15} />
                {customer.address}
              </div>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <MessageCircle size={19} />
              WhatsApp হিসাব পাঠান
            </a>
          </div>
        </section>

        {/* Summary */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-5">
            <p className="text-sm text-slate-500">
              মোট বাকি
            </p>

            <p className="mt-2 text-2xl font-bold text-red-400">
              {formatMoney(totalDue)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5">
            <p className="text-sm text-slate-500">
              মোট জমা
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {formatMoney(totalPayment)}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5">
            <p className="text-sm text-slate-500">
              বর্তমান বাকি
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-400">
              {formatMoney(currentBalance)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() =>
              openAddTransaction("due")
            }
            className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-semibold text-white hover:bg-red-500"
          >
            <Plus size={19} />
            নতুন বাকি
          </button>

          <button
            onClick={() =>
              openAddTransaction("payment")
            }
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-semibold text-white hover:bg-emerald-500"
          >
            <CreditCard size={19} />
            Payment
          </button>
        </div>

        {/* Transaction Header */}
        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">
              Transaction History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              মাস ও transaction type অনুযায়ী হিসাব দেখুন
            </p>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Filter size={17} />
              Filter
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">

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
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
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

              <div className="col-span-2 md:col-span-1">
                <label className="mb-1 block text-xs text-slate-500">
                  ধরন
                </label>

                <select
                  value={transactionFilter}
                  onChange={(e) =>
                    setTransactionFilter(
                      e.target.value as TransactionFilter
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="all">
                    সব transaction
                  </option>

                  <option value="due">
                    শুধু দেনা
                  </option>

                  <option value="payment">
                    শুধু জমা
                  </option>
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 grid grid-cols-3 gap-2">

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  দেনা
                </p>

                <p className="mt-1 font-bold text-red-400">
                  {formatMoney(filteredDue)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  জমা
                </p>

                <p className="mt-1 font-bold text-emerald-400">
                  {formatMoney(filteredPayment)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Transaction
                </p>

                <p className="mt-1 font-bold text-white">
                  {filteredTransactions.length}
                </p>
              </div>
            </div>

            {/* PDF */}
            <button
              onClick={downloadTransactionPDF}
              disabled={
                pdfLoading ||
                filteredTransactions.length === 0
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pdfLoading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Download size={17} />
              )}

              {pdfLoading
                ? "PDF তৈরি হচ্ছে..."
                : "এই Filter-এর PDF Download"}
            </button>
          </div>

          {/* Transactions */}
          <div className="mt-4 space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
                <CalendarDays
                  size={38}
                  className="mx-auto text-slate-700"
                />

                <p className="mt-3 text-sm text-slate-500">
                  এই filter অনুযায়ী কোনো transaction নেই।
                </p>
              </div>
            ) : (
              filteredTransactions.map(
                (transaction) => (
                  <div
                    key={transaction.id}
                    className="relative rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <div className="flex items-start gap-3">

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          transaction.type === "due"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {transaction.type ===
                        "due" ? (
                          <ArrowDownLeft size={20} />
                        ) : (
                          <ArrowUpRight size={20} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            transaction.type ===
                            "due"
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {transaction.type ===
                          "due"
                            ? "দেনা"
                            : "জমা"}
                        </p>

                        {transaction.description && (
                          <p className="mt-1 text-sm text-slate-300">
                            {transaction.description}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            transaction.created_at
                          )}{" "}
                          ·{" "}
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
                            Number(
                              transaction.amount
                            )
                          )}
                        </p>

                        <div className="relative mt-1">
                          <button
                            onClick={() =>
                              setMenuTransactionId(
                                menuTransactionId ===
                                  transaction.id
                                  ? null
                                  : transaction.id
                              )
                            }
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white"
                          >
                            <MoreVertical
                              size={18}
                            />
                          </button>

                          {menuTransactionId ===
                            transaction.id && (
                            <div className="absolute right-0 top-9 z-30 w-36 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                              <button
                                onClick={() =>
                                  openEditTransaction(
                                    transaction
                                  )
                                }
                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800"
                              >
                                <Pencil size={15} />
                                Edit
                              </button>

                              <button
                                onClick={() => {
                                  setMenuTransactionId(
                                    null
                                  );
                                  setDeleteTransactionId(
                                    transaction.id
                                  );
                                }}
                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2
                                  size={15}
                                />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>

      {/* PDF REPORT */}
      <div
        ref={pdfRef}
        style={{
          position: "fixed",
          left: "-10000px",
          top: "0",
          width: "794px",
          background: "#ffffff",
          color: "#111827",
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            marginBottom: "5px",
          }}
        >
          Saiful Store
        </h1>

        <p style={{ color: "#6b7280" }}>
          Customer Transaction Report
        </p>

        <hr
          style={{
            margin: "20px 0",
          }}
        />

        <h2>
          {customer.name}
        </h2>

        <p>
          মোবাইল: {customer.phone}
        </p>

        {customer.address && (
          <p>
            ঠিকানা: {customer.address}
          </p>
        )}

        <p>
          সময়কাল:{" "}
          {months[selectedMonth - 1]}{" "}
          {selectedYear}
        </p>

        <p>
          Filter:{" "}
          {transactionFilter === "all"
            ? "সব"
            : transactionFilter === "due"
              ? "দেনা"
              : "জমা"}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: "10px",
            margin: "25px 0",
          }}
        >
          <div
            style={{
              border: "1px solid #ddd",
              padding: "15px",
            }}
          >
            <strong>দেনা</strong>
            <br />
            {formatMoney(filteredDue)}
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              padding: "15px",
            }}
          >
            <strong>জমা</strong>
            <br />
            {formatMoney(filteredPayment)}
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              padding: "15px",
            }}
          >
            <strong>বর্তমান বাকি</strong>
            <br />
            {formatMoney(currentBalance)}
          </div>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={cellStyle}>
                তারিখ
              </th>

              <th style={cellStyle}>
                ধরন
              </th>

              <th style={cellStyle}>
                বিবরণ
              </th>

              <th style={cellStyle}>
                টাকা
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map(
              (transaction) => (
                <tr key={transaction.id}>
                  <td style={cellStyle}>
                    {formatDate(
                      transaction.created_at
                    )}
                  </td>

                  <td style={cellStyle}>
                    {transaction.type ===
                    "due"
                      ? "দেনা"
                      : "জমা"}
                  </td>

                  <td style={cellStyle}>
                    {transaction.description ||
                      "-"}
                  </td>

                  <td style={cellStyle}>
                    {formatMoney(
                      Number(
                        transaction.amount
                      )
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        <p
          style={{
            marginTop: "30px",
            color: "#6b7280",
            fontSize: "12px",
          }}
        >
          Generated by Saiful Store
        </p>
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {transactionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-4"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="max-h-[calc(100dvh-20px)] w-full overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-950 p-5 pb-8 md:max-w-lg md:rounded-3xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {transactionModal.mode ===
                  "edit"
                    ? "Transaction Edit"
                    : "নতুন Transaction"}
                </h2>

                <button
                  onClick={() =>
                    setTransactionModal(null)
                  }
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    setTransactionType("due")
                  }
                  className={`rounded-xl py-3 font-semibold ${
                    transactionType === "due"
                      ? "bg-red-600 text-white"
                      : "bg-slate-900 text-slate-400"
                  }`}
                >
                  দেনা
                </button>

                <button
                  onClick={() =>
                    setTransactionType(
                      "payment"
                    )
                  }
                  className={`rounded-xl py-3 font-semibold ${
                    transactionType ===
                    "payment"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-slate-400"
                  }`}
                >
                  জমা
                </button>
              </div>

              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="Amount"
                className="mb-4 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              />

              <textarea
                rows={3}
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="বিবরণ"
                className="mb-5 w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              />

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setTransactionModal(null)
                  }
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-slate-300"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleSaveTransaction
                  }
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTransactionId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
          >
            <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <Trash2
                size={30}
                className="mx-auto text-red-400"
              />

              <h2 className="mt-4 text-center font-bold text-white">
                Transaction Delete করবেন?
              </h2>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() =>
                    setDeleteTransactionId(null)
                  }
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-slate-300"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleDeleteTransaction
                  }
                  disabled={saving}
                  className="flex-1 rounded-xl bg-red-600 py-3 font-semibold text-white"
                >
                  {saving
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

const cellStyle = {
  border: "1px solid #d1d5db",
  padding: "8px",
  textAlign: "left" as const,
};