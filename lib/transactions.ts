import { createClient } from "@/lib/supabase/client";

export type TransactionType = "due" | "payment";

export type Transaction = {
  id: string;
  customer_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  created_at: string;
};

export type CustomerDetails = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
};

export async function getCustomerById(
  customerId: string
): Promise<CustomerDetails> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CustomerDetails;
}

export async function getCustomerTransactions(
  customerId: string
): Promise<Transaction[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data as Transaction[];
}

export async function addTransaction({
  customerId,
  type,
  amount,
  description,
}: {
  customerId: string;
  type: TransactionType;
  amount: number;
  description?: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      customer_id: customerId,
      type,
      amount,
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Transaction;
}

export async function updateTransaction({
  transactionId,
  type,
  amount,
  description,
}: {
  transactionId: string;
  type: TransactionType;
  amount: number;
  description?: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .update({
      type,
      amount,
      description: description?.trim() || null,
    })
    .eq("id", transactionId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Transaction;
}

export async function deleteTransaction(
  transactionId: string
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (error) {
    throw new Error(error.message);
  }
}