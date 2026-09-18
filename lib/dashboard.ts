import { createClient } from "@/lib/supabase/client";

export type DashboardStats = {
  totalCustomers: number;
  customersWithDue: number;
  totalCurrentBalance: number;
};

export type MonthlyStats = {
  totalDue: number;
  totalPayment: number;
  balance: number;
};

export type ChartData = {
  date: string;
  label: string;
  due: number;
  payment: number;
};

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return {
    start,
    end,
  };
}

export async function getDashboardOverview(): Promise<DashboardStats> {
  const supabase = createClient();

  const [
    { data: customers, error: customersError },
    { data: transactions, error: transactionsError },
  ] = await Promise.all([
    supabase.from("customers").select("id"),
    supabase.from("transactions").select("customer_id,type,amount"),
  ]);

  if (customersError) {
    throw new Error(customersError.message);
  }

  if (transactionsError) {
    throw new Error(transactionsError.message);
  }

  const balanceMap = new Map<string, number>();

  for (const transaction of transactions ?? []) {
    const current =
      balanceMap.get(transaction.customer_id) ?? 0;

    const amount = Number(transaction.amount);

    if (transaction.type === "due") {
      balanceMap.set(
        transaction.customer_id,
        current + amount
      );
    } else {
      balanceMap.set(
        transaction.customer_id,
        current - amount
      );
    }
  }

  let totalCurrentBalance = 0;
  let customersWithDue = 0;

  for (const balance of balanceMap.values()) {
    if (balance > 0) {
      customersWithDue++;
      totalCurrentBalance += balance;
    }
  }

  return {
    totalCustomers: customers?.length ?? 0,
    customersWithDue,
    totalCurrentBalance,
  };
}

export async function getMonthlyStats(
  year: number,
  month: number
): Promise<MonthlyStats> {
  const supabase = createClient();

  const { start, end } = getMonthRange(
    year,
    month
  );

  const { data, error } = await supabase
    .from("transactions")
    .select("type,amount,created_at")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  let totalDue = 0;
  let totalPayment = 0;

  for (const transaction of data ?? []) {
    const amount = Number(transaction.amount);

    if (transaction.type === "due") {
      totalDue += amount;
    }

    if (transaction.type === "payment") {
      totalPayment += amount;
    }
  }

  return {
    totalDue,
    totalPayment,
    balance: totalDue - totalPayment,
  };
}

export async function getMonthlyChart(
  year: number,
  month: number
): Promise<ChartData[]> {
  const supabase = createClient();

  const { start, end } = getMonthRange(
    year,
    month
  );

  const { data, error } = await supabase
    .from("transactions")
    .select("type,amount,created_at")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const daysInMonth = new Date(
    year,
    month,
    0
  ).getDate();

  const days: ChartData[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      year,
      month - 1,
      day
    );

    const dateKey = [
      year,
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");

    days.push({
      date: dateKey,
      label: date.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "short",
      }),
      due: 0,
      payment: 0,
    });
  }

  for (const transaction of data ?? []) {
    const transactionDate =
      new Date(transaction.created_at);

    const day = transactionDate.getDate();

    const item = days[day - 1];

    if (!item) continue;

    const amount = Number(transaction.amount);

    if (transaction.type === "due") {
      item.due += amount;
    }

    if (transaction.type === "payment") {
      item.payment += amount;
    }
  }

  return days;
}