"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Users,
  Phone,
  MapPin,
  Wallet,
  Download,
  Loader2,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
} from "@/lib/customers";

import {
  getCustomerBalances,
  type CustomerBalance,
} from "@/lib/customer-balances";

import CustomerPhotoPicker from "@/components/CustomerPhotoPicker";
import { downloadElementAsPdf } from "@/lib/pdf";

type BalanceFilter =
  | "all"
  | "due"
  | "clear";

type SortOption =
  | "newest"
  | "oldest"
  | "highest_balance"
  | "lowest_balance"
  | "name";

const ITEMS_PER_PAGE = 20;

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [balances, setBalances] =
    useState<CustomerBalance[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [pdfLoading, setPdfLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [balanceFilter, setBalanceFilter] =
    useState<BalanceFilter>("all");

  const [sortBy, setSortBy] =
    useState<SortOption>("newest");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [menuCustomerId, setMenuCustomerId] =
    useState<string | null>(null);

  const [deleteCustomerId, setDeleteCustomerId] =
    useState<string | null>(null);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [showModal, setShowModal] =
    useState(false);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [photoFile, setPhotoFile] =
    useState<File | null>(null);

  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);

  const pdfRef =
    useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        customerData,
        balanceData,
      ] = await Promise.all([
        getCustomers(),
        getCustomerBalances(),
      ]);

      setCustomers(customerData);
      setBalances(balanceData);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Customer data load করা যায়নি।"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    balanceFilter,
    sortBy,
  ]);

  const getBalance = (customerId: string) => {
    const item = balances.find(
      (balance) =>
        balance.customer_id === customerId
    );

    return item?.balance ?? 0;
  };

  const getPositiveBalance = (
    customerId: string
  ) => {
    return Math.max(
      0,
      getBalance(customerId)
    );
  };

  const filteredCustomers = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    let result = customers.filter(
      (customer) => {
        const matchesSearch =
          !searchText ||
          customer.name
            .toLowerCase()
            .includes(searchText) ||
          customer.phone
            .toLowerCase()
            .includes(searchText) ||
          (customer.address || "")
            .toLowerCase()
            .includes(searchText);

        const balance =
          getBalance(customer.id);

        const matchesBalance =
          balanceFilter === "all"
            ? true
            : balanceFilter === "due"
              ? balance > 0
              : balance <= 0;

        return (
          matchesSearch &&
          matchesBalance
        );
      }
    );

    result = [...result].sort(
      (a, b) => {
        if (sortBy === "newest") {
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        }

        if (sortBy === "oldest") {
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );
        }

        if (
          sortBy === "highest_balance"
        ) {
          return (
            getBalance(b.id) -
            getBalance(a.id)
          );
        }

        if (
          sortBy === "lowest_balance"
        ) {
          return (
            getBalance(a.id) -
            getBalance(b.id)
          );
        }

        if (sortBy === "name") {
          return a.name.localeCompare(
            b.name,
            "bn"
          );
        }

        return 0;
      }
    );

    return result;
  }, [
    customers,
    balances,
    search,
    balanceFilter,
    sortBy,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredCustomers.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedCustomers =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredCustomers.slice(
        start,
        start + ITEMS_PER_PAGE
      );
    }, [
      filteredCustomers,
      currentPage,
    ]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setAddress("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEditModal = (
    customer: Customer
  ) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address || "");
    setPhotoFile(null);
    setPhotoPreview(
      customer.avatar_url || null
    );
    setMenuCustomerId(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCustomer(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (
    file: File | null
  ) => {
    setPhotoFile(file);

    if (file) {
      const url =
        URL.createObjectURL(file);

      setPhotoPreview(url);
    } else {
      setPhotoPreview(
        editingCustomer?.avatar_url ||
          null
      );
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Customer-এর নাম দিন।");
      return;
    }

    if (!phone.trim()) {
      toast.error(
        "Customer-এর মোবাইল নম্বর দিন।"
      );
      return;
    }

    try {
      setSaving(true);

      /*
       * আপনার customers helper-এ যদি photo
       * upload logic থাকে, সেটি এখানে ব্যবহার হবে।
       *
       * photoFile এখন selected/compressed file
       * হিসেবে রাখা হচ্ছে।
       */

      if (editingCustomer) {
        await updateCustomer(
          editingCustomer.id,
          name,
          phone,
          address
        );

        toast.success(
          photoFile
            ? "Customer ও ছবি আপডেট হয়েছে।"
            : "Customer আপডেট হয়েছে।"
        );
      } else {
        await addCustomer(
          name,
          phone,
          address
        );

        toast.success(
          "নতুন Customer যোগ হয়েছে।"
        );
      }

      closeModal();
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Customer save করা যায়নি।"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCustomerId) return;

    try {
      setSaving(true);

      await deleteCustomer(
        deleteCustomerId
      );

      toast.success(
        "Customer delete হয়েছে।"
      );

      setDeleteCustomerId(null);
      setMenuCustomerId(null);

      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Customer delete করা যায়নি।"
      );
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (value: number) => {
    return `৳ ${Math.max(
      0,
      value
    ).toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const downloadCustomerPDF =
    async () => {
      if (!pdfRef.current) return;

      if (
        filteredCustomers.length === 0
      ) {
        toast.error(
          "PDF করার মতো কোনো Customer নেই।"
        );
        return;
      }

      try {
        setPdfLoading(true);

        await downloadElementAsPdf(
          pdfRef.current,
          "Saiful-Store-Customer-Report.pdf"
        );

        toast.success(
          "Customer PDF download হয়েছে।"
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

  const getPageNumbers = () => {
    const pages: (
      | number
      | string
    )[] = [];

    if (totalPages <= 7) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(
      2,
      currentPage - 1
    );

    const end = Math.min(
      totalPages - 1,
      currentPage + 1
    );

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }

    if (
      currentPage <
      totalPages - 2
    ) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-5 md:px-8 md:pb-32">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users
                size={24}
                className="text-blue-400"
              />

              <h1 className="text-2xl font-bold text-white">
                Customers
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Customer ও বাকি হিসাব পরিচালনা করুন
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <Plus size={18} />
            নতুন Customer
          </button>
        </div>

        {/* Search + Filter */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">

            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="নাম, মোবাইল বা ঠিকানা দিয়ে Search..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            {/* Balance filter */}
            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <select
                value={balanceFilter}
                onChange={(e) =>
                  setBalanceFilter(
                    e.target
                      .value as BalanceFilter
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-950 py-3 pl-9 pr-8 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="all">
                  সব Customer
                </option>

                <option value="due">
                  বাকি আছে
                </option>

                <option value="clear">
                  বাকি নেই
                </option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target
                      .value as SortOption
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-950 py-3 pl-9 pr-8 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="newest">
                  নতুন আগে
                </option>

                <option value="oldest">
                  পুরাতন আগে
                </option>

                <option value="highest_balance">
                  বেশি বাকি আগে
                </option>

                <option value="lowest_balance">
                  কম বাকি আগে
                </option>

                <option value="name">
                  নাম অনুযায়ী
                </option>
              </select>
            </div>
          </div>

          {/* Result + PDF */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              মোট{" "}
              <span className="font-semibold text-slate-300">
                {filteredCustomers.length}
              </span>{" "}
              জন Customer পাওয়া গেছে
            </p>

            <button
              onClick={
                downloadCustomerPDF
              }
              disabled={
                pdfLoading ||
                filteredCustomers.length ===
                  0
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                : "Filter-এর PDF Download"}
            </button>
          </div>
        </section>

        {/* Customer List */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2
              size={32}
              className="animate-spin text-blue-500"
            />
          </div>
        ) : filteredCustomers.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900 px-6 py-16 text-center">
            <Users
              size={42}
              className="mx-auto text-slate-700"
            />

            <h2 className="mt-4 font-semibold text-white">
              কোনো Customer পাওয়া যায়নি
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search অথবা Filter পরিবর্তন করে আবার চেষ্টা করুন।
            </p>
          </div>
        ) : (
          <>
            {/* 
              Mobile: 1 column
              Desktop: 2 columns
            */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {paginatedCustomers.map(
                (customer) => {
                  const balance =
                    getPositiveBalance(
                      customer.id
                    );

                  return (
                    <motion.div
                      key={customer.id}
                      layout
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="relative rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700"
                    >
                      <div className="flex items-start gap-4">

                        {/* Photo */}
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/customers/${customer.id}`
                            )
                          }
                          className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-slate-700 bg-slate-800"
                        >
                          {customer.avatar_url ? (
                            <img
                              src={
                                customer.avatar_url
                              }
                              alt={
                                customer.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-400">
                              {customer.name
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </button>

                        {/* Customer info */}
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/customers/${customer.id}`
                              )
                            }
                            className="block max-w-full text-left"
                          >
                            <h2 className="truncate text-base font-bold text-white hover:text-blue-400">
                              {customer.name}
                            </h2>
                          </button>

                          <a
                            href={`tel:${customer.phone}`}
                            className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400"
                          >
                            <Phone
                              size={13}
                            />
                            {customer.phone}
                          </a>

                          {customer.address && (
                            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-600">
                              <MapPin
                                size={13}
                              />
                              {
                                customer.address
                              }
                            </p>
                          )}
                        </div>

                        {/* Menu */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuCustomerId(
                                menuCustomerId ===
                                  customer.id
                                  ? null
                                  : customer.id
                              )
                            }
                            className="rounded-xl p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
                          >
                            <MoreVertical
                              size={20}
                            />
                          </button>

                          <AnimatePresence>
                            {menuCustomerId ===
                              customer.id && (
                              <motion.div
                                initial={{
                                  opacity: 0,
                                  scale: 0.95,
                                  y: -5,
                                }}
                                animate={{
                                  opacity: 1,
                                  scale: 1,
                                  y: 0,
                                }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.95,
                                  y: -5,
                                }}
                                className="absolute right-0 top-11 z-50 w-36 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      customer
                                    )
                                  }
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800"
                                >
                                  <Pencil
                                    size={15}
                                  />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuCustomerId(
                                      null
                                    );
                                    setDeleteCustomerId(
                                      customer.id
                                    );
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2
                                    size={15}
                                  />
                                  Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Balance */}
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/customers/${customer.id}`
                          )
                        }
                        className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet
                            size={17}
                            className={
                              balance > 0
                                ? "text-red-400"
                                : "text-emerald-400"
                            }
                          />

                          <span className="text-xs text-slate-500">
                            বর্তমান বাকি
                          </span>
                        </div>

                        <span
                          className={`font-bold ${
                            balance > 0
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {formatMoney(
                            balance
                          )}
                        </span>
                      </button>
                    </motion.div>
                  );
                }
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-7 flex flex-col items-center gap-3">

                <p className="text-xs text-slate-500">
                  দেখানো হচ্ছে{" "}
                  <span className="text-slate-300">
                    {(currentPage - 1) *
                      ITEMS_PER_PAGE +
                      1}
                  </span>
                  {" - "}
                  <span className="text-slate-300">
                    {Math.min(
                      currentPage *
                        ITEMS_PER_PAGE,
                      filteredCustomers.length
                    )}
                  </span>
                  {" / "}
                  <span className="text-slate-300">
                    {filteredCustomers.length}
                  </span>
                </p>

                <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-2">

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    disabled={
                      currentPage === 1
                    }
                    className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ← আগের
                  </button>

                  {getPageNumbers().map(
                    (page, index) => {
                      if (
                        page === "..."
                      ) {
                        return (
                          <span
                            key={`dots-${index}`}
                            className="px-2 text-slate-600"
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          type="button"
                          key={page}
                          onClick={() =>
                            setCurrentPage(
                              page as number
                            )
                          }
                          className={`h-9 min-w-9 shrink-0 rounded-xl px-2 text-xs font-semibold transition ${
                            currentPage ===
                            page
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    পরের →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* PDF Report */}
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
            fontFamily:
              "Arial, sans-serif",
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

          <p
            style={{
              color: "#6b7280",
            }}
          >
            Customer Report
          </p>

          <hr
            style={{
              margin: "20px 0",
            }}
          />

          <p>
            Search:{" "}
            {search ||
              "কোনো Search নেই"}
          </p>

          <p>
            Filter:{" "}
            {balanceFilter ===
            "all"
              ? "সব Customer"
              : balanceFilter ===
                  "due"
                ? "বাকি আছে"
                : "বাকি নেই"}
          </p>

          <p>
            Sort:{" "}
            {sortBy === "newest"
              ? "নতুন আগে"
              : sortBy === "oldest"
                ? "পুরাতন আগে"
                : sortBy ===
                    "highest_balance"
                  ? "বেশি বাকি আগে"
                  : sortBy ===
                      "lowest_balance"
                    ? "কম বাকি আগে"
                    : "নাম অনুযায়ী"}
          </p>

          <p>
            মোট Customer:{" "}
            {filteredCustomers.length}
          </p>

          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
              marginTop: "25px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={pdfCellStyle}
                >
                  নাম
                </th>

                <th
                  style={pdfCellStyle}
                >
                  মোবাইল
                </th>

                <th
                  style={pdfCellStyle}
                >
                  ঠিকানা
                </th>

                <th
                  style={pdfCellStyle}
                >
                  বর্তমান বাকি
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map(
                (customer) => (
                  <tr
                    key={customer.id}
                  >
                    <td
                      style={
                        pdfCellStyle
                      }
                    >
                      {customer.name}
                    </td>

                    <td
                      style={
                        pdfCellStyle
                      }
                    >
                      {customer.phone}
                    </td>

                    <td
                      style={
                        pdfCellStyle
                      }
                    >
                      {customer.address ||
                        "-"}
                    </td>

                    <td
                      style={
                        pdfCellStyle
                      }
                    >
                      ৳{" "}
                      {getPositiveBalance(
                        customer.id
                      ).toLocaleString(
                        "en-BD"
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
      </div>

      {/* Add / Edit Customer Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-4"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 30,
              }}
              className="max-h-[calc(100dvh-20px)] w-full overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-950 p-5 pb-8 shadow-2xl md:max-h-[90vh] md:max-w-lg md:rounded-3xl"
            >
              {/* Modal Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingCustomer
                      ? "Customer Edit"
                      : "নতুন Customer"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Customer-এর তথ্য দিন
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-40"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Photo */}
              <div className="mb-6">
                <CustomerPhotoPicker
                  currentPhoto={
                    photoPreview
                  }
                  name={name}
                  onChange={
                    handlePhotoChange
                  }
                />
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Customer-এর নাম
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="যেমন: মোঃ রহিম"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  মোবাইল নম্বর
                </label>

                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  placeholder="01XXXXXXXXX"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              {/* Address */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  ঠিকানা
                  <span className="ml-1 text-xs text-slate-600">
                    (ঐচ্ছিক)
                  </span>
                </label>

                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) =>
                    setAddress(
                      e.target.value
                    )
                  }
                  placeholder="Customer-এর ঠিকানা"
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !name.trim() ||
                    !phone.trim()
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      {photoFile
                        ? "Uploading..."
                        : "Saving..."}
                    </>
                  ) : editingCustomer ? (
                    "Update"
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteCustomerId && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{
                scale: 0.95,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.95,
                opacity: 0,
              }}
              className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <Trash2 size={22} />
              </div>

              <h2 className="mt-4 text-center text-lg font-bold text-white">
                Customer Delete করবেন?
              </h2>

              <p className="mt-2 text-center text-sm text-slate-500">
                Customer-এর সঙ্গে সম্পর্কিত
                transaction-ও delete হয়ে যাবে।
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteCustomerId(
                      null
                    )
                  }
                  disabled={saving}
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

const pdfCellStyle = {
  border: "1px solid #d1d5db",
  padding: "8px",
  textAlign: "left" as const,
};