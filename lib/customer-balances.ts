import { createClient } from "@/lib/supabase/client";

export type CustomerBalance = {
  customer_id: string;
  total_due: number;
  total_payment: number;
  balance: number;
};

export async function getCustomerBalances(): Promise<
  CustomerBalance[]
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("customer_id, type, amount");

  if (error) {
    throw new Error(error.message);
  }

  const balanceMap = new Map<
    string,
    {
      total_due: number;
      total_payment: number;
    }
  >();

  for (const transaction of data ?? []) {
    const customerId = transaction.customer_id;

    if (!balanceMap.has(customerId)) {
      balanceMap.set(customerId, {
        total_due: 0,
        total_payment: 0,
      });
    }

    const current = balanceMap.get(customerId)!;

    if (transaction.type === "due") {
      current.total_due += Number(transaction.amount);
    } else {
      current.total_payment += Number(transaction.amount);
    }
  }

  return Array.from(balanceMap.entries()).map(
    ([customer_id, values]) => ({
      customer_id,
      total_due: values.total_due,
      total_payment: values.total_payment,
      balance: values.total_due - values.total_payment,
    })
  );
}