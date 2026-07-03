"use client";

import { useState, useRef } from "react";
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
  DollarSign,
  Truck,
  MapPin,
  ChevronRight,
  CheckCircle,
  Phone,
  User,
} from "lucide-react";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import { useCreateOrder } from "@/lib/hooks/useOrders";

// ================================================================
// TYPES
// ================================================================

interface FormData {
  description: string;
  itemName: string;
  pickupAddress: string;
  deliveryAddress: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string;
  itemPrice: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

// ================================================================
// SUB-COMPONENTS — defined OUTSIDE main component
// so they never remount on state change
// ================================================================

interface FormFieldProps {
  label: string;
  icon: LucideIcon;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, icon: Icon, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-olive-800">
        <Icon size={13} className="text-olive-500" />
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 font-medium pl-1">{error}</p>
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
  imagePreview: string | null;
  itemImage: File | null;
  isDesktop?: boolean;
  isSubmitting: boolean;
  isCreating: boolean;
  onFieldChange: (field: keyof FormData, value: string) => void;
  onImageTrigger: () => void;
  onImageRemove: () => void;
}

function FormFields({
  formData,
  errors,
  apiError,
  imagePreview,
  itemImage,
  isDesktop = false,
  isSubmitting,
  isCreating,
  onFieldChange,
  onImageTrigger,
  onImageRemove,
}: FormFieldsProps) {
  return (
    <>
      {/* Item description */}
      <FormField
        label="What are you selling?"
        icon={FileText}
        error={errors.description}
      >
        <textarea
          placeholder="e.g. iPhone 15 Pro Max 256GB Black — brand new sealed"
          value={formData.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          rows={isDesktop ? 3 : 2}
          className={`clay-textarea ${errors.description ? "border-red-400" : ""}`}
        />
      </FormField>

      {/* Item name */}
      <FormField label="Item Name (optional)" icon={Package}>
        <input
          type="text"
          placeholder="e.g. iPhone 15 Pro Max"
          value={formData.itemName}
          onChange={(e) => onFieldChange("itemName", e.target.value)}
          className="clay-input"
        />
      </FormField>

      {/* Addresses */}
      <div className={isDesktop ? "grid grid-cols-2 gap-5" : "space-y-5"}>
        <FormField
          label="Pickup Address"
          icon={MapPin}
          error={errors.pickupAddress}
        >
          <input
            type="text"
            placeholder="Where are the goods? e.g. 12 Adeola Odeku, VI Lagos"
            value={formData.pickupAddress}
            onChange={(e) => onFieldChange("pickupAddress", e.target.value)}
            className={`clay-input ${errors.pickupAddress ? "border-red-400" : ""}`}
          />
        </FormField>

        <FormField
          label="Delivery Address"
          icon={Truck}
          error={errors.deliveryAddress}
        >
          <input
            type="text"
            placeholder="Where to deliver? e.g. 45 Admiralty Way, Lekki"
            value={formData.deliveryAddress}
            onChange={(e) => onFieldChange("deliveryAddress", e.target.value)}
            className={`clay-input ${errors.deliveryAddress ? "border-red-400" : ""}`}
          />
        </FormField>
      </div>

      {/* Buyer details */}
      <div className={isDesktop ? "grid grid-cols-2 gap-5" : "space-y-5"}>
        <FormField label="Buyer's Email" icon={Mail} error={errors.buyerEmail}>
          <input
            type="email"
            placeholder="buyer@example.com"
            value={formData.buyerEmail}
            onChange={(e) => onFieldChange("buyerEmail", e.target.value)}
            className={`clay-input ${errors.buyerEmail ? "border-red-400" : ""}`}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </FormField>

        <FormField label="Buyer's Name (optional)" icon={User}>
          <input
            type="text"
            placeholder="e.g. Amaka Nwosu"
            value={formData.buyerName}
            onChange={(e) => onFieldChange("buyerName", e.target.value)}
            className="clay-input"
          />
        </FormField>
      </div>

      {/* Buyer phone */}
      <FormField label="Buyer's Phone (optional)" icon={Phone}>
        <input
          type="tel"
          placeholder="+234 800 000 0000"
          value={formData.buyerPhone}
          onChange={(e) => onFieldChange("buyerPhone", e.target.value)}
          className="clay-input"
        />
      </FormField>

      {/* Item price */}
      <FormField
        label="Item Price (₦)"
        icon={DollarSign}
        error={errors.itemPrice}
      >
        <input
          type="text"
          placeholder="e.g. 350,000"
          value={formData.itemPrice}
          onChange={(e) => onFieldChange("itemPrice", e.target.value)}
          className={`clay-input ${errors.itemPrice ? "border-red-400" : ""}`}
          inputMode="decimal"
        />
      </FormField>

      {/* Image upload */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-semibold text-olive-800 mb-2">
          <ImageIcon size={13} className="text-olive-500" />
          Item Image (optional)
        </label>
        {imagePreview ? (
          <ImagePreviewCard
            src={imagePreview}
            fileName={itemImage?.name ?? ""}
            fileSize={itemImage?.size ?? 0}
            onRemove={onImageRemove}
          />
        ) : (
          <ImageUploadZone onTrigger={onImageTrigger} isDesktop={isDesktop} />
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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
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
    pickupAddress: "",
    deliveryAddress: "",
    buyerEmail: "",
    buyerName: "",
    buyerPhone: "",
    itemPrice: "",
  });

  const [itemImage, setItemImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Handlers ──────────────────────────────────────────────────

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }
    setItemImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setItemImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.description.trim())
      newErrors.description = "Item description is required";
    if (!formData.pickupAddress.trim())
      newErrors.pickupAddress = "Pickup address is required";
    if (!formData.deliveryAddress.trim())
      newErrors.deliveryAddress = "Delivery address is required";
    if (!formData.buyerEmail.trim())
      newErrors.buyerEmail = "Buyer email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail))
      newErrors.buyerEmail = "Enter a valid email address";
    if (!formData.itemPrice.trim())
      newErrors.itemPrice = "Item price is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const priceNum = parseFloat(formData.itemPrice.replace(/[₦,\s]/g, ""));

    const order = await createOrder({
      description: formData.description,
      pickupAddress: formData.pickupAddress,
      deliveryAddress: formData.deliveryAddress,
      buyerEmail: formData.buyerEmail,
      buyerName: formData.buyerName || undefined,
      buyerPhone: formData.buyerPhone || undefined,
      itemPrice: priceNum,
      items: [
        {
          name: formData.itemName || formData.description,
          quantity: 1,
          unitPrice: priceNum,
        },
      ],
    });

    // ✅ No sendToBuyer call needed — the backend now creates orders
    // directly in PENDING_BUYER status (orders.service.ts create method).
    // The buyer is notified via ORDER_SENT_TO_BUYER event immediately.

    setIsSubmitting(false);

    if (order) {
      setIsSuccess(true);
      await new Promise((r) => setTimeout(r, 800));
      router.push(`/dashboard/orders/${order.id}`);
    }
  };

  // ── Shared props for FormFields ───────────────────────────────

  const sharedProps = {
    formData,
    errors,
    apiError,
    imagePreview,
    itemImage,
    isSubmitting,
    isCreating,
    onFieldChange: handleChange,
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
