import { createClient } from "@/lib/supabase/client";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
};

const BUCKET_NAME = "customer-photos";

function validateImage(file: File) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("শুধু JPG, PNG অথবা WebP ছবি ব্যবহার করুন।");
  }

  // Maximum 5 MB
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("ছবির সর্বোচ্চ সাইজ 5 MB হতে পারবে।");
  }
}

async function uploadCustomerPhoto(
  customerId: string,
  file: File
): Promise<string> {
  validateImage(file);

  const supabase = createClient();

  const extension =
    file.name.split(".").pop()?.toLowerCase() || "jpg";

  const filePath = `${customerId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function getCustomers(): Promise<Customer[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data as Customer[];
}

export async function addCustomer(
  name: string,
  phone: string,
  address?: string,
  avatarFile?: File | null
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: name.trim(),
      phone: phone.trim(),
      address: address?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  let customer = data as Customer;

  if (avatarFile) {
    try {
      const avatarUrl = await uploadCustomerPhoto(
        customer.id,
        avatarFile
      );

      const { data: updatedCustomer, error: updateError } =
        await supabase
          .from("customers")
          .update({
            avatar_url: avatarUrl,
          })
          .eq("id", customer.id)
          .select()
          .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      customer = updatedCustomer as Customer;
    } catch (error) {
      // Customer তৈরি হয়েছে, কিন্তু photo upload failed
      console.error("Photo upload failed:", error);
    }
  }

  return customer;
}

export async function updateCustomer(
  customerId: string,
  name: string,
  phone: string,
  address?: string,
  avatarFile?: File | null
) {
  const supabase = createClient();

  let avatarUrl: string | undefined;

  if (avatarFile) {
    avatarUrl = await uploadCustomerPhoto(
      customerId,
      avatarFile
    );
  }

  const updateData: {
    name: string;
    phone: string;
    address: string | null;
    avatar_url?: string;
  } = {
    name: name.trim(),
    phone: phone.trim(),
    address: address?.trim() || null,
  };

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl;
  }

  const { data, error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", customerId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Customer;
}

export async function deleteCustomer(
  customerId: string
) {
  const supabase = createClient();

  // Customer-এর photo folder খুঁজে বের করি
  const { data: files } = await supabase.storage
    .from(BUCKET_NAME)
    .list(customerId);

  if (files && files.length > 0) {
    const filePaths = files.map(
      (file) => `${customerId}/${file.name}`
    );

    await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);
  }

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) {
    throw new Error(error.message);
  }
}