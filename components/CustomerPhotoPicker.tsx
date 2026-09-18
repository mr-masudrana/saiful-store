"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";

type CustomerPhotoPickerProps = {
  currentPhoto?: string | null;
  name?: string;
  onChange: (file: File | null) => void;
};

const MAX_INPUT_SIZE = 5 * 1024 * 1024;
const TARGET_SIZE = 500 * 1024;

function createCompressedFile(
  file: File
): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;

      let width = image.width;
      let height = image.height;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(
          MAX_WIDTH / width,
          MAX_HEIGHT / height
        );

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Image processing failed."));
        return;
      }

      context.drawImage(
        image,
        0,
        0,
        width,
        height
      );

      let quality = 0.85;

      const compress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error("ছবি compress করা যায়নি।")
              );
              return;
            }

            if (
              blob.size <= TARGET_SIZE ||
              quality <= 0.35
            ) {
              const compressedFile = new File(
                [blob],
                `customer-${Date.now()}.jpg`,
                {
                  type: "image/jpeg",
                }
              );

              resolve(compressedFile);
              return;
            }

            quality -= 0.1;
            compress();
          },
          "image/jpeg",
          quality
        );
      };

      compress();
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(
        new Error("ছবিটি পড়া যায়নি।")
      );
    };

    image.src = objectUrl;
  });
}

export default function CustomerPhotoPicker({
  currentPhoto,
  name = "",
  onChange,
}: CustomerPhotoPickerProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [preview, setPreview] =
    useState<string | null>(
      currentPhoto || null
    );

  const [processing, setProcessing] =
    useState(false);

  useEffect(() => {
    setPreview(currentPhoto || null);
  }, [currentPhoto]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "শুধু JPG, PNG অথবা WebP ছবি ব্যবহার করুন।"
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_INPUT_SIZE) {
      alert(
        "মূল ছবির সর্বোচ্চ সাইজ 5 MB হতে পারবে।"
      );

      event.target.value = "";
      return;
    }

    try {
      setProcessing(true);

      const compressedFile =
        await createCompressedFile(file);

      const previewUrl =
        URL.createObjectURL(compressedFile);

      setPreview(previewUrl);

      onChange(compressedFile);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "ছবি প্রস্তুত করা যায়নি।"
      );
    } finally {
      setProcessing(false);
    }
  };

  const removePhoto = () => {
    setPreview(null);
    onChange(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const initial =
    name.trim().charAt(0).toUpperCase() || "👤";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-slate-700 bg-slate-800 text-3xl font-bold text-slate-300 shadow-xl">
          {preview ? (
            <img
              src={preview}
              alt="Customer preview"
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}

          {processing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
              <Loader2
                size={28}
                className="animate-spin text-white"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={processing}
          onClick={() =>
            inputRef.current?.click()
          }
          className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
          aria-label="Choose customer photo"
        >
          <Camera size={19} />
        </button>

        {preview && !processing && (
          <button
            type="button"
            onClick={removePhoto}
            className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-500"
            aria-label="Remove photo"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        disabled={processing}
        onClick={() =>
          inputRef.current?.click()
        }
        className="mt-3 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
      >
        {processing ? (
          <>
            <Loader2
              size={17}
              className="animate-spin"
            />
            ছবি প্রস্তুত হচ্ছে...
          </>
        ) : (
          <>
            <ImagePlus size={17} />
            {preview
              ? "ছবি পরিবর্তন করুন"
              : "কাস্টমারের ছবি দিন"}
          </>
        )}
      </button>

      <p className="mt-2 text-center text-xs text-slate-500">
        JPG, PNG বা WebP · মূল ছবি সর্বোচ্চ 5 MB
        <br />
        Upload-এর আগে ছবি কমপ্রেস করা হবে
      </p>
    </div>
  );
}