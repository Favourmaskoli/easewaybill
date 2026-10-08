"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  Package,
  Send,
  Upload,
  X,
  Image as ImageIcon,
  Mail,
  FileText,
  Banknote,
  Truck,
  MapPin,
  ChevronRight,
  CheckCircle,
  Phone,
  User,
} from "lucide-react";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import { useCreateOrder } from "@/lib/hooks/useOrders";
import AddressAutocomplete, {
  type ResolvedAddress,
} from "./AddressAutocomplete";

// ================================================================
// TYPES
// ================================================================

interface FormData {
  description: string;
  itemName: string;
  pickup: ResolvedAddress | null;
  delivery: ResolvedAddress | null;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string;
  itemPrice: string;
}

type FormErrors = Partial<Record<keyof FormData | "image", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts +234 800 000 0000, 0800 000 0000, 08000000000 etc.
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

// ── Price formatting ────────────────────────────────────────────
// Cleans raw input into a comma-grouped string: strips non-digits
// (except one decimal point), collapses extra dots, strips leading
// zeros, caps decimals at 2 places, and inserts thousands commas.
const formatPrice = (raw: string) => {
  let cleaned = raw.replace(/[^\d.]/g, "");

  // Collapse to at most one decimal point — keep the first, drop the rest
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }

  let [int, dec] = cleaned.split(".");
  int = int ?? "";

  // Strip leading zeros, but keep a single "0" if that's the whole integer part
  int = int.replace(/^0+(?=\d)/, "");

  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${intFmt}.${dec.slice(0, 2)}` : intFmt;
};

const parsePrice = (formatted: string) => Number(formatted.replace(/,/g, ""));

// ================================================================
// SUB-COMPONENTS — defined OUTSIDE main component
// so they never remount on state change
// ================================================================

interface FormFieldProps {
  label: string;
  icon: LucideIcon;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({
  label,
  icon: Icon,
  htmlFor,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-sm font-semibold text-olive-800"
      >
        <Icon size={13} className="text-olive-500" />
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-500 font-medium pl-1">
          {error}
        </p>
      )}
    </div>
  );
}

function ImageUploadZone({
  onTrigger,
  isDesktop = false,
}: {
  onTrigger: () => void;
  isDesktop?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onTrigger}
      className={[
        "clay-inset w-full flex flex-col items-center justify-center",
        "border-2 border-dashed border-olive-300/50",
        "hover:border-olive-500/60 transition-all cursor-pointer group",
        isDesktop ? "py-10 rounded-xl" : "py-8 rounded-xl",
      ].join(" ")}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
        style={{
          background:
            "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
          boxShadow:
            "4px 4px 10px rgba(23,29,9,0.22), -2px -2px 6px rgba(114,143,50,0.18)",
        }}
      >
        <Upload size={20} className="text-white" />
      </div>
      <p className="text-sm font-semibold text-olive-700 mb-1">
        {isDesktop ? "Click to upload item image" : "Tap to upload image"}
      </p>
      <p className="text-xs text-olive-400">PNG, JPG, WEBP — max 5MB</p>
    </button>
  );
}

function ImagePreviewCard({
  src,
  fileName,
  fileSize,
  onRemove,
}: {
  src: string;
  fileName: string;
  fileSize: number;
  onRemove: () => void;
}) {
  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="clay-card flex items-center gap-4 !p-3.5">
      <div className="clay-inset w-16 h-16 rounded-xl overflow-hidden shrink-0">
        <img
          src={src}
          alt="Item preview"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-olive-800 truncate">
          {fileName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-olive-400">{formatSize(fileSize)}</p>
          <span className="flex items-center gap-0.5 text-xs text-olive-600">
            <CheckCircle size={11} /> Ready
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="clay-inset p-2 rounded-xl text-red-400 hover:text-red-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ================================================================
// FORM FIELDS COMPONENT — outside main component
// ================================================================

interface FormFieldsProps {
  formData: FormData;
  errors: FormErrors;
  apiError: string | null;
  imagePreviews: Array<{ file: File; url: string }>;
  imageError: string | null;
  isDesktop?: boolean;
  isSubmitting: boolean;
  isCreating: boolean;
  onFieldChange: <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => void;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageTrigger: () => void;
  onImageRemove: (index: number) => void;
}

function FormFields({
  formData,
  errors,
  apiError,
  imagePreviews,
  imageError,
  isDesktop = false,
  isSubmitting,
  isCreating,
  onFieldChange,
  onPriceChange,
  onImageTrigger,
  onImageRemove,
}: FormFieldsProps) {
  // Prefix ids so the mobile + desktop copies never share an id.
  const p = isDesktop ? "d" : "m";

  return (
    <>
      {/* Item description */}
      <FormField
        label="What are you selling?"
        icon={FileText}
        htmlFor={`${p}-description`}
        error={errors.description}
      >
        <textarea
          id={`${p}-description`}
          placeholder="e.g. iPhone 15 Pro Max 256GB Black — brand new sealed"
          value={formData.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          rows={isDesktop ? 3 : 2}
          className={`clay-textarea ${errors.description ? "border-red-400" : ""}`}
        />
      </FormField>

      {/* Item name */}
      <FormField
        label="Item Name (optional)"
        icon={Package}
        htmlFor={`${p}-itemName`}
      >
        <input
          id={`${p}-itemName`}
          type="text"
          placeholder="e.g. iPhone 15 Pro Max"
          value={formData.itemName}
          onChange={(e) => onFieldChange("itemName", e.target.value)}
          className="clay-input"
        />
      </FormField>

      {/* Addresses */}
      <div className={isDesktop ? "grid grid-cols-2 gap-5" : "space-y-5"}>
        <FormField label="Pickup Address" icon={MapPin} error={errors.pickup}>
          <AddressAutocomplete
            label="Pickup location"
            placeholder="Where are the goods? e.g. 12 Adeola Odeku, VI"
            required
            value={formData.pickup}
            onChange={(a) => onFieldChange("pickup", a)}
          />
        </FormField>

        <FormField
          label="Delivery Address"
          icon={Truck}
          error={errors.delivery}
        >
          <AddressAutocomplete
            label="Delivery location"
            placeholder="Where to deliver? e.g. 45 Admiralty Way, Lekki"
            required
            value={formData.delivery}
            onChange={(a) => onFieldChange("delivery", a)}
          />
        </FormField>
      </div>

      {/* Buyer details */}
      <div className={isDesktop ? "grid grid-cols-2 gap-5" : "space-y-5"}>
        <FormField
          label="Buyer's Email"
          icon={Mail}
          htmlFor={`${p}-buyerEmail`}
          error={errors.buyerEmail}
        >
          <input
            id={`${p}-buyerEmail`}
            type="email"
            placeholder="buyer@example.com"
            value={formData.buyerEmail}
            onChange={(e) => onFieldChange("buyerEmail", e.target.value)}
            className={`clay-input ${errors.buyerEmail ? "border-red-400" : ""}`}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </FormField>

        <FormField
          label="Buyer's Name (optional)"
          icon={User}
          htmlFor={`${p}-buyerName`}
        >
          <input
            id={`${p}-buyerName`}
            type="text"
            placeholder="e.g. Amaka Nwosu"
            value={formData.buyerName}
            onChange={(e) => onFieldChange("buyerName", e.target.value)}
            className="clay-input"
          />
        </FormField>
      </div>

      {/* Buyer phone */}
      <FormField
        label="Buyer's Phone (optional)"
        icon={Phone}
        htmlFor={`${p}-buyerPhone`}
        error={errors.buyerPhone}
      >
        <input
          id={`${p}-buyerPhone`}
          type="tel"
          placeholder="+234 800 000 0000"
          value={formData.buyerPhone}
          onChange={(e) => onFieldChange("buyerPhone", e.target.value)}
          className={`clay-input ${errors.buyerPhone ? "border-red-400" : ""}`}
        />
      </FormField>

      {/* Item price */}
      <FormField
        label="Item Price (₦)"
        icon={Banknote}
        htmlFor={`${p}-itemPrice`}
        error={errors.itemPrice}
      >
        <input
          id={`${p}-itemPrice`}
          type="text"
          placeholder="e.g. 350,000"
          value={formData.itemPrice}
          onChange={onPriceChange}
          className={`clay-input ${errors.itemPrice ? "border-red-400" : ""}`}
          inputMode="decimal"
        />
      </FormField>

      {/* Image upload */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-semibold text-olive-800 mb-2">
          <ImageIcon size={13} className="text-olive-500" />
          Item Image
        </label>
        <div className="space-y-3">
          {imagePreviews.length > 0 && (
            <div className="space-y-2">
              {imagePreviews.map(({ file, url }, index) => (
                <ImagePreviewCard
                  key={`${file.name}-${file.lastModified}-${index}`}
                  src={url}
                  fileName={file.name}
                  fileSize={file.size}
                  onRemove={() => onImageRemove(index)}
                />
              ))}
            </div>
          )}
          {imagePreviews.length < 5 && (
            <ImageUploadZone onTrigger={onImageTrigger} isDesktop={isDesktop} />
          )}
          <p className="text-xs text-olive-500">
            Add up to 5 images. Each image must be 5MB or smaller.
          </p>
        </div>
        {(imageError || errors.image) && (
          <p
            role="alert"
            className="text-xs text-red-500 font-medium pl-1 mt-1.5"
          >
            {imageError || errors.image}
          </p>
        )}
      </div>

      {/* Security notice */}
      <div className="clay-section flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background:
              "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
            boxShadow:
              "3px 3px 7px rgba(23,29,9,0.20), -1px -1px 4px rgba(114,143,50,0.15)",
          }}
        >
          <ShieldCheck size={17} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-olive-800 mb-0.5">
            Escrow Protection
          </p>
          <p className="text-xs text-olive-600 leading-relaxed">
            Payment is held securely in escrow until the buyer confirms
            delivery. Funds are only released when both parties are satisfied.
          </p>
        </div>
      </div>

      {/* API error */}
      {apiError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
        >
          {apiError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || isCreating}
        className="clay-btn w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {isSubmitting || isCreating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating Order...
          </>
        ) : (
          <>
            <Send size={18} />
            Create Escrow Order
          </>
        )}
      </button>
    </>
  );
}

// ================================================================
// MAIN PAGE COMPONENT
// ================================================================

export default function CreateOrderPage() {
  const router = useRouter();
  const {
    createOrder,
    isLoading: isCreating,
    error: apiError,
  } = useCreateOrder();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    description: "",
    itemName: "",
    pickup: null,
    delivery: null,
    buyerEmail: "",
    buyerName: "",
    buyerPhone: "",
    itemPrice: "",
  });

  const [itemImages, setItemImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<
    Array<{ file: File; url: string }>
  >([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Keep the latest previews available to the unmount cleanup.
  const imagePreviewsRef = useRef(imagePreviews);
  imagePreviewsRef.current = imagePreviews;

  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────

  const handleChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  // Formats the price on every keystroke while preserving cursor
  // position by digit count, since a naive controlled-input replace
  // would otherwise force the cursor to the end after every change.
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPos = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = input.value
      .slice(0, cursorPos)
      .replace(/\D/g, "").length;

    const formatted = formatPrice(input.value);
    handleChange("itemPrice", formatted);

    // Wait for React to commit the new value, then re-find the cursor
    // by counting digits rather than raw character index (comma
    // insertion/removal shifts character positions around it).
    requestAnimationFrame(() => {
      let count = 0;
      let newPos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) count++;
        if (count === digitsBeforeCursor) {
          newPos = i + 1;
          break;
        }
      }
      input.setSelectionRange(newPos, newPos);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selectedFiles.length === 0) return;

    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        setImageError(`${file.name} is not a valid image file.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError(`${file.name} exceeds the 5MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    const remainingSlots = Math.max(0, 5 - itemImages.length);
    const filesToAdd = validFiles.slice(0, remainingSlots);
    if (validFiles.length > remainingSlots) {
      setImageError("You can upload a maximum of 5 images.");
    } else if (filesToAdd.length > 0) {
      setImageError(null);
    }
    if (filesToAdd.length === 0) return;

    setItemImages((previous) => [...previous, ...filesToAdd]);
    setImagePreviews((previous) => [
      ...previous,
      ...filesToAdd.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
    setErrors((previous) => ({ ...previous, image: undefined }));
  };

  const handleRemoveImage = (index: number) => {
    setItemImages((previous) => previous.filter((_, i) => i !== index));
    setImagePreviews((previous) => {
      const removed = previous[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return previous.filter((_, i) => i !== index);
    });
    setImageError(null);
  };

  const validateForm = (): boolean => {
    const e: FormErrors = {};
    const price = parsePrice(formData.itemPrice);

    if (!formData.description.trim())
      e.description = "Describe the item you are selling";
    if (!formData.pickup?.formattedAddress.trim())
      e.pickup = "Enter the pickup address";
    if (!formData.delivery?.formattedAddress.trim())
      e.delivery = "Enter the delivery address";

    if (!formData.buyerEmail.trim()) e.buyerEmail = "Enter the buyer's email";
    else if (!EMAIL_RE.test(formData.buyerEmail.trim()))
      e.buyerEmail = "Enter a valid email address";

    if (
      formData.buyerPhone.trim() &&
      !PHONE_RE.test(formData.buyerPhone.trim())
    )
      e.buyerPhone = "Enter a valid phone number";

    if (!formData.itemPrice.trim()) e.itemPrice = "Enter the item price";
    else if (!Number.isFinite(price) || price <= 0)
      e.itemPrice = "Enter an amount greater than zero";

    if (itemImages.length === 0)
      e.image = "Upload at least one photo of the item";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (isSubmitting || isCreating) return;
    if (!validateForm()) return;

    const { pickup, delivery } = formData;
    if (!pickup || !delivery || itemImages.length === 0) return; // narrowed by validateForm

    setIsSubmitting(true);
    try {
      const priceNum = parsePrice(formData.itemPrice);
      const description = formData.description.trim();
      // Log the first 120 characters of the Mapbox IDs for debugging
      console.log(
        "pickup id:",
        pickup.mapboxId?.length,
        pickup.mapboxId?.slice(0, 120),
      );
      console.log(
        "delivery id:",
        delivery.mapboxId?.length,
        delivery.mapboxId?.slice(0, 120),
      );
      const order = await createOrder(
        {
          description,
          pickupAddress: pickup.formattedAddress,
          pickupLat: pickup.lat ?? undefined,
          pickupLng: pickup.lng ?? undefined,
          pickupMapboxId: pickup.mapboxId ?? undefined,
          deliveryAddress: delivery.formattedAddress,
          deliveryLat: delivery.lat ?? undefined,
          deliveryLng: delivery.lng ?? undefined,
          deliveryMapboxId: delivery.mapboxId ?? undefined,
          buyerEmail: formData.buyerEmail.trim().toLowerCase(),
          buyerName: formData.buyerName.trim() || undefined,
          buyerPhone: formData.buyerPhone.trim() || undefined,
          itemPrice: priceNum,
          items: [
            {
              name: formData.itemName.trim() || description,
              quantity: 1,
              unitPrice: priceNum,
            },
          ],
        },
        itemImages,
      );

      // The backend creates orders directly in PENDING_BUYER status and
      // notifies the buyer via ORDER_SENT_TO_BUYER, so no sendToBuyer call.
      if (order) {
        setIsSuccess(true);
        await new Promise((r) => setTimeout(r, 800));
        router.push(`/dashboard/orders/${order.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Shared props for FormFields ───────────────────────────────

  const sharedProps = {
    formData,
    errors,
    apiError,
    imagePreviews,
    imageError,
    isSubmitting,
    isCreating,
    onFieldChange: handleChange,
    onPriceChange: handlePriceChange,
    onImageTrigger: () => fileInputRef.current?.click(),
    onImageRemove: handleRemoveImage,
  };

  // ── Success state ─────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="clay-card text-center max-w-sm w-full !py-12">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              background:
                "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
              boxShadow:
                "6px 6px 14px rgba(23,29,9,0.25), -3px -3px 9px rgba(114,143,50,0.22)",
            }}
          >
            <CheckCircle size={36} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-olive-900 mb-2">
            Order Created!
          </h2>
          <p className="text-sm text-olive-500 mb-6">
            Redirecting to order details...
          </p>
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-olive-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* ── MOBILE VIEW ──────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen">
        <MobilePageHeader title="Create Order" />
        <form
          onSubmit={handleSubmit}
          className="px-4 pt-5 pb-8 space-y-5"
          noValidate
        >
          <FormFields {...sharedProps} />
        </form>
      </div>

      {/* ── DESKTOP VIEW ─────────────────────────────────────── */}
      <div className="hidden lg:block p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-1.5 text-sm text-olive-500">
            <Link
              href="/dashboard/orders"
              className="hover:text-olive-700 transition-colors"
            >
              Orders
            </Link>
            <ChevronRight size={14} className="text-olive-400" />
            <span className="text-olive-800 font-semibold">
              Create New Order
            </span>
          </div>

          <div className="clay-card !p-8">
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background:
                    "linear-gradient(145deg, var(--color-olive-500), var(--color-olive-700))",
                  boxShadow:
                    "6px 6px 14px rgba(23,29,9,0.28), -3px -3px 8px rgba(114,143,50,0.22)",
                }}
              >
                <Package size={26} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-olive-900">
                  Create Escrow Order
                </h2>
                <p className="text-sm text-olive-500 mt-0.5">
                  You are the seller — enter the buyer's details and item info
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <FormFields {...sharedProps} isDesktop />
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
