import { createClient } from "@/lib/supabase/client";

export type DashboardStats = {
  totalCustomers: number;
  dueCustomers: number;
  totalDue: number;
  totalPayment: number;
  currentBalance: number;
};

export type ChartData = {
  date: string;
  label: string;
  due: number;
  payment: number;
  net: number;
};

export type TodayTransaction = {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  type: "due" | "payment";
  amount: number;
  description: string | null;
  created_at: string;
};

function getMonthRange(year: number, month: number) {
  // month = 1-12
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function getDashboardStats(
  year: number,
  month: number
): Promise<DashboardStats> {
  const supabase = createClient();

  const { data: customers, error: customerError } = await supabase
    .from("customers")
    .select("id");

  if (customerError) {
    throw new Error(customerError.message);
  }

  const { data: transactions, error: transactionError } = await supabase
    .from("transactions")
    .select("customer_id,type,amount");

  if (transactionError) {
    throw new Error(transactionError.message);
  }

  const { start, end } = getMonthRange(year, month);

  const { data: monthTransactions, error: monthError } =
    await supabase
      .from("transactions")
      .select("type,amount")
      .gte("created_at", start)
      .lt("created_at", end);

  if (monthError) {
    throw new Error(monthError.message);
  }

  let totalDue = 0;
  let totalPayment = 0;

  for (const transaction of monthTransactions ?? []) {
    const amount = Number(transaction.amount);

    if (transaction.type === "due") {
      totalDue += amount;
    } else if (transaction.type === "payment") {
      totalPayment += amount;
    }
  }

  // Current balance of all customers
  const balanceMap = new Map<string, number>();

  for (const transaction of transactions ?? []) {
    const customerId = transaction.customer_id;
    const amount = Number(transaction.amount);

    if (!balanceMap.has(customerId)) {
      balanceMap.set(customerId, 0);
    }

    const current = balanceMap.get(customerId)!;

    if (transaction.type === "due") {
      balanceMap.set(customerId, current + amount);
    } else {
      balanceMap.set(customerId, current - amount);
    }
  }

  let currentBalance = 0;
  let dueCustomers = 0;

  for (const balance of balanceMap.values()) {
    if (balance > 0) {
      currentBalance += balance;
      dueCustomers++;
    }
  }

  return {
    totalCustomers: customers?.length ?? 0,
    dueCustomers,
    totalDue,
    totalPayment,
    currentBalance,
  };
}

export async function getMonthlyChart(
  year: number,
  month: number
): Promise<ChartData[]> {
  const supabase = createClient();

  const { start, end } = getMonthRange(year, month);

  const { data, error } = await supabase
    .from("transactions")
    .select("type,amount,created_at")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const daysInMonth = new Date(year, month, 0).getDate();

  const map = new Map<
    string,
    {
      due: number;
      payment: number;
    }
  >();

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    map.set(key, {
      due: 0,
      payment: 0,
    });
  }

  for (const transaction of data ?? []) {
    const date = new Date(transaction.created_at);

    const day = date.getDate();

    const key = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    const current = map.get(key);

    if (!current) continue;

    const amount = Number(transaction.amount);

    if (transaction.type === "due") {
      current.due += amount;
    } else {
      current.payment += amount;
    }
  }

  return Array.from(map.entries()).map(([date, values]) => {
    const day = Number(date.slice(-2));

    return {
      date,
      label: `${day}`,
      due: values.due,
      payment: values.payment,
      net: values.due - values.payment,
    };
  });
}

export async function getTodayTransactions(): Promise<{
  transactions: TodayTransaction[];
  totalDue: number;
  totalPayment: number;
}> {
  const supabase = createClient();

  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id,customer_id,type,amount,description,created_at"
    )
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const customerIds = [
    ...new Set(
      (data ?? []).map(
        (transaction) => transaction.customer_id
      )
    ),
  ];

  let customers: {
    id: string;
    name: string;
    phone: string;
  }[] = [];

  if (customerIds.length > 0) {
    const { data: customerData, error: customersError } =
      await supabase
        .from("customers")
        .select("id,name,phone")
        .in("id", customerIds);

    if (customersError) {
      throw new Error(customersError.message);
    }

    customers = customerData ?? [];
  }

  const customerMap = new Map(
    customers.map((customer) => [
      customer.id,
      customer,
    ])
  );

  let totalDue = 0;
  let totalPayment = 0;

  const transactions: TodayTransaction[] = (data ?? []).map(
    (transaction) => {
      const customer = customerMap.get(
        transaction.customer_id
      );

      const amount = Number(transaction.amount);

      if (transaction.type === "due") {
        totalDue += amount;
      } else {
        totalPayment += amount;
      }

      return {
        id: transaction.id,
        customer_id: transaction.customer_id,
        customer_name:
          customer?.name ?? "Unknown Customer",
        customer_phone:
          customer?.phone ?? "",
        type: transaction.type,
        amount,
        description: transaction.description,
        created_at: transaction.created_at,
      };
    }
  );

  return {
    transactions,
    totalDue,
    totalPayment,
  };
}