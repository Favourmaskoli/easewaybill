// // app/dashboard/orders/create/page.tsx
// // ================================================================
// // CREATE ORDER PAGE — Claymorphism Style
// // ================================================================
// // Full escrow order creation form with:
// //   • Seller username/email
// //   • Seller phone number       ← NEW
// //   • Item description
// //   • Item image upload          ← NEW
// //   • Amount
// //   • Delivery / Waybill info
// //
// // Desktop: Centred clay-card form with breadcrumb
// // Mobile:  Full-width clay form matching "Create Order Screen"
// // ================================================================

// "use client";

// import { useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import {
//   ShieldCheck,
//   Package,
//   Send,
//   Upload,
//   X,
//   Image as ImageIcon,
//   Phone,
//   Mail,
//   FileText,
//   DollarSign,
//   Truck,
// } from "lucide-react";

// // ── Shared Components ─────────────────────────────────────────
// import MobilePageHeader from "@/components/layout/MobilePageHeader";

// // ================================================================
// // COMPONENT
// // ================================================================

// export default function CreateOrderPage() {
//   const router = useRouter();

//   // ── File input ref for triggering the upload dialog ─────────
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // ── Form state ──────────────────────────────────────────────
//   const [formData, setFormData] = useState({
//     seller: "",
//     sellerPhone: "",
//     itemDescription: "",
//     amount: "",
//     waybillInfo: "",
//   });

//   // ── Image upload state ──────────────────────────────────────
//   const [itemImage, setItemImage] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);

//   // ── Loading state for form submission ───────────────────────
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   /**
//    * Updates a single form field by key.
//    */
//   const handleChange = (field: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   /**
//    * Handles image file selection.
//    * Creates a preview URL and stores the file.
//    */
//   const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Validate file type
//     if (!file.type.startsWith("image/")) {
//       alert("Please select an image file");
//       return;
//     }

//     // Validate file size (max 5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       alert("Image must be under 5MB");
//       return;
//     }

//     setItemImage(file);
//     setImagePreview(URL.createObjectURL(file));
//   };

//   /**
//    * Removes the selected image and clears the preview.
//    */
//   const handleRemoveImage = () => {
//     setItemImage(null);
//     if (imagePreview) URL.revokeObjectURL(imagePreview);
//     setImagePreview(null);
//     // Reset the file input so the same file can be re-selected
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   /**
//    * Handles form submission.
//    */
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     // TODO: Replace with real API call
//     console.log("Creating order:", { ...formData, itemImage });

//     // Simulate network delay
//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     setIsSubmitting(false);
//     router.push("/dashboard/orders");
//   };

//   return (
//     <>
//       {/* ============================================================
//           MOBILE VIEW
//           ============================================================ */}
//       <div className="lg:hidden min-h-screen">
//         {/* ── Sticky Header ────────────────────────────────── */}
//         <MobilePageHeader title="Create Order Screen" />

//         {/* ── Mobile Form ──────────────────────────────────── */}
//         <form
//           onSubmit={handleSubmit}
//           className="px-5 pt-5 pb-8 space-y-5"
//         >
//           {/* ── Seller Email/Username ───────────────────────── */}
//           <FormField label="Seller" icon={Mail}>
//             <input
//               type="text"
//               placeholder="Seller username/email"
//               value={formData.seller}
//               onChange={(e) => handleChange("seller", e.target.value)}
//               className="clay-input"
//               required
//             />
//           </FormField>

//           {/* ── Seller Phone Number (NEW) ───────────────────── */}
//           <FormField label="Phone number" icon={Phone}>
//             <input
//               type="tel"
//               placeholder="+234 800 000 0000"
//               value={formData.sellerPhone}
//               onChange={(e) =>
//                 handleChange("sellerPhone", e.target.value)
//               }
//               className="clay-input"
//               required
//             />
//           </FormField>

//           {/* ── Item Description ────────────────────────────── */}
//           <FormField label="Item description" icon={FileText}>
//             <textarea
//               placeholder="Describe the item being purchased..."
//               value={formData.itemDescription}
//               onChange={(e) =>
//                 handleChange("itemDescription", e.target.value)
//               }
//               rows={3}
//               className="clay-textarea"
//               required
//             />
//           </FormField>

//           {/* ── Item Image Upload (NEW) ─────────────────────── */}
//           <div>
//             <label className="block text-sm font-semibold text-olive-800 mb-2">
//               Item image
//             </label>

//             {/* Image preview or upload zone */}
//             {imagePreview ? (
//               <ImagePreviewCard
//                 src={imagePreview}
//                 fileName={itemImage?.name || ""}
//                 onRemove={handleRemoveImage}
//               />
//             ) : (
//               <ImageUploadZone
//                 onTrigger={() => fileInputRef.current?.click()}
//               />
//             )}

//             {/* Hidden file input */}
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               onChange={handleImageSelect}
//               className="hidden"
//               aria-label="Upload item image"
//             />
//           </div>

//           {/* ── Amount ─────────────────────────────────────── */}
//           <FormField label="Amount" icon={DollarSign}>
//             <input
//               type="text"
//               placeholder="₦ 150,000.00"
//               value={formData.amount}
//               onChange={(e) => handleChange("amount", e.target.value)}
//               className="clay-input"
//               required
//             />
//           </FormField>

//           {/* ── Delivery Details ────────────────────────────── */}
//           <FormField label="Delivery details" icon={Truck}>
//             <input
//               type="text"
//               placeholder="Waybill info (optional)"
//               value={formData.waybillInfo}
//               onChange={(e) =>
//                 handleChange("waybillInfo", e.target.value)
//               }
//               className="clay-input"
//             />
//           </FormField>

//           {/* ── Submit Button ──────────────────────────────── */}
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="clay-btn w-full py-4 flex items-center
//                        justify-center gap-3"
//           >
//             {/* Icon in a subtle pill */}
//             <div
//               className="w-10 h-10 bg-white/15 rounded-lg
//                          flex items-center justify-center"
//             >
//               <Package size={20} />
//             </div>
//             <span>
//               {isSubmitting ? "Creating..." : "Create Escrow"}
//             </span>
//           </button>
//         </form>
//       </div>

//       {/* ============================================================
//           DESKTOP VIEW
//           ============================================================ */}
//       <div className="hidden lg:block p-6">
//         <div className="max-w-2xl mx-auto space-y-6">
//           {/* ── Breadcrumb ─────────────────────────────────── */}
//           <div className="flex items-center gap-2 text-sm text-gray-500">
//             <Link
//               href="/dashboard/orders"
//               className="hover:text-olive-600 transition-colors"
//             >
//               Orders
//             </Link>
//             <span>/</span>
//             <span className="text-olive-800 font-medium">
//               Create New Order
//             </span>
//           </div>

//           {/* ── Form Card (Clay) ───────────────────────────── */}
//           <div className="clay-card !p-8">
//             {/* Card header */}
//             <div className="flex items-center gap-3 mb-8">
//               <div
//                 className="clay-inset w-14 h-14 flex items-center
//                            justify-center"
//               >
//                 <Package size={26} className="text-olive-600" />
//               </div>
//               <div>
//                 <h2 className="text-xl font-bold text-olive-900">
//                   Create Escrow Order
//                 </h2>
//                 <p className="text-sm text-gray-500">
//                   Fill in the details to start a secure transaction
//                 </p>
//               </div>
//             </div>

//             {/* ── Desktop Form ─────────────────────────────── */}
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Two-column row: Seller + Phone */}
//               <div className="grid grid-cols-2 gap-5">
//                 <FormField label="Seller Username / Email" icon={Mail}>
//                   <input
//                     type="text"
//                     placeholder="e.g. jane@example.com"
//                     value={formData.seller}
//                     onChange={(e) =>
//                       handleChange("seller", e.target.value)
//                     }
//                     className="clay-input"
//                     required
//                   />
//                 </FormField>

//                 <FormField label="Seller Phone Number" icon={Phone}>
//                   <input
//                     type="tel"
//                     placeholder="+234 800 000 0000"
//                     value={formData.sellerPhone}
//                     onChange={(e) =>
//                       handleChange("sellerPhone", e.target.value)
//                     }
//                     className="clay-input"
//                     required
//                   />
//                 </FormField>
//               </div>

//               {/* Item Description */}
//               <FormField label="Item Description" icon={FileText}>
//                 <textarea
//                   placeholder="Describe the item being purchased..."
//                   value={formData.itemDescription}
//                   onChange={(e) =>
//                     handleChange("itemDescription", e.target.value)
//                   }
//                   rows={4}
//                   className="clay-textarea"
//                   required
//                 />
//               </FormField>

//               {/* Item Image Upload */}
//               <div>
//                 <label className="block text-sm font-semibold text-olive-800 mb-2">
//                   Item Image
//                 </label>

//                 {imagePreview ? (
//                   <ImagePreviewCard
//                     src={imagePreview}
//                     fileName={itemImage?.name || ""}
//                     onRemove={handleRemoveImage}
//                   />
//                 ) : (
//                   <ImageUploadZone
//                     onTrigger={() => fileInputRef.current?.click()}
//                     isDesktop
//                   />
//                 )}

//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageSelect}
//                   className="hidden"
//                   aria-label="Upload item image"
//                 />
//               </div>

//               {/* Two-column row: Amount + Waybill */}
//               <div className="grid grid-cols-2 gap-5">
//                 <FormField label="Amount (₦)" icon={DollarSign}>
//                   <input
//                     type="text"
//                     placeholder="e.g. 150,000"
//                     value={formData.amount}
//                     onChange={(e) =>
//                       handleChange("amount", e.target.value)
//                     }
//                     className="clay-input"
//                     required
//                   />
//                 </FormField>

//                 <FormField label="Delivery / Waybill Info" icon={Truck}>
//                   <input
//                     type="text"
//                     placeholder="Tracking number (optional)"
//                     value={formData.waybillInfo}
//                     onChange={(e) =>
//                       handleChange("waybillInfo", e.target.value)
//                     }
//                     className="clay-input"
//                   />
//                 </FormField>
//               </div>

//               {/* Security Notice (Clay Section) */}
//               <div className="clay-section flex items-center gap-3">
//                 <ShieldCheck
//                   size={20}
//                   className="text-olive-600 shrink-0"
//                 />
//                 <p className="text-xs text-olive-700">
//                   Your payment will be held securely in escrow until the
//                   buyer confirms delivery. Both parties are protected.
//                 </p>
//               </div>

//               {/* Submit Button */}
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="clay-btn w-full py-3.5 flex items-center
//                            justify-center gap-2"
//               >
//                 <Send size={18} />
//                 {isSubmitting
//                   ? "Creating Escrow..."
//                   : "Create Escrow Order"}
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// // ================================================================
// // SUB-COMPONENT: FormField
// // ================================================================
// // Wraps a label + icon + input child in a consistent layout.
// // Keeps the form markup DRY and consistent across both views.
// // ================================================================

// import type { LucideIcon } from "lucide-react";

// interface FormFieldProps {
//   /** Label text above the input */
//   label: string;
//   /** Lucide icon displayed next to the label */
//   icon: LucideIcon;
//   /** The input/textarea element */
//   children: React.ReactNode;
// }

// function FormField({ label, icon: Icon, children }: FormFieldProps) {
//   return (
//     <div>
//       {/* Label row with icon */}
//       <label className="flex items-center gap-1.5 text-sm font-semibold
//                         text-olive-800 mb-2">
//         <Icon size={14} className="text-olive-500" aria-hidden="true" />
//         {label}
//       </label>

//       {/* Input child */}
//       {children}
//     </div>
//   );
// }

// // ================================================================
// // SUB-COMPONENT: ImageUploadZone
// // ================================================================
// // Dashed upload area users click/tap to select an image.
// // Uses clay-inset styling for the sunken claymorphism look.
// // ================================================================

// interface ImageUploadZoneProps {
//   /** Callback to trigger the hidden file input */
//   onTrigger: () => void;
//   /** Show larger layout on desktop */
//   isDesktop?: boolean;
// }

// function ImageUploadZone({
//   onTrigger,
//   isDesktop = false,
// }: ImageUploadZoneProps) {
//   return (
//     <button
//       type="button"
//       onClick={onTrigger}
//       className={[
//         "clay-inset w-full flex flex-col items-center justify-center",
//         "border-2 border-dashed border-cream-400",
//         "hover:border-olive-400 transition-colors cursor-pointer",
//         isDesktop ? "py-10" : "py-8",
//       ].join(" ")}
//     >
//       {/* Upload icon */}
//       <div
//         className="w-12 h-12 bg-olive-50 rounded-xl flex items-center
//                    justify-center mb-3"
//       >
//         <Upload size={22} className="text-olive-500" />
//       </div>

//       {/* Instructional text */}
//       <p className="text-sm font-medium text-olive-800 mb-1">
//         {isDesktop ? "Click to upload item image" : "Tap to upload image"}
//       </p>
//       <p className="text-xs text-gray-400">
//         PNG, JPG, WEBP up to 5MB
//       </p>
//     </button>
//   );
// }

// // ================================================================
// // SUB-COMPONENT: ImagePreviewCard
// // ================================================================
// // Shows a thumbnail preview of the uploaded image with the file
// // name and a remove button. Uses claymorphism card style.
// // ================================================================

// interface ImagePreviewCardProps {
//   /** Object URL for the preview image */
//   src: string;
//   /** Original file name */
//   fileName: string;
//   /** Callback to remove the image */
//   onRemove: () => void;
// }

// function ImagePreviewCard({
//   src,
//   fileName,
//   onRemove,
// }: ImagePreviewCardProps) {
//   return (
//     <div className="clay-card flex items-center gap-4 !p-3">
//       {/* ── Image Thumbnail ────────────────────────────────── */}
//       <div className="clay-inset w-16 h-16 overflow-hidden shrink-0">
//         <img
//           src={src}
//           alt="Item preview"
//           className="w-full h-full object-cover rounded-lg"
//         />
//       </div>

//       {/* ── File Info ──────────────────────────────────────── */}
//       <div className="flex-1 min-w-0">
//         <div className="flex items-center gap-1.5 mb-0.5">
//           <ImageIcon
//             size={14}
//             className="text-olive-500 shrink-0"
//           />
//           <p className="text-sm font-medium text-olive-800 truncate">
//             {fileName}
//           </p>
//         </div>
//         <p className="text-xs text-gray-400">Image uploaded</p>
//       </div>

//       {/* ── Remove Button ──────────────────────────────────── */}
//       <button
//         type="button"
//         onClick={onRemove}
//         className="clay-inset p-2 text-red-400 hover:text-red-600
//                    transition-colors shrink-0"
//         aria-label="Remove image"
//       >
//         <X size={16} />
//       </button>
//     </div>
//   );
// }


// app/dashboard/orders/create/page.tsx
// ================================================================
// CREATE ORDER PAGE — Deep Olive Claymorphism (Complete)
// ================================================================
// Escrow order creation form with:
//   • Seller username/email
//   • Seller phone number
//   • Item description
//   • Item image upload (with preview + remove)
//   • Amount
//   • Delivery / Waybill info
//
// Desktop: Centred clay card form with breadcrumb navigation
// Mobile:  Full-width scrollable form with sticky back header
// ================================================================

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
  Phone,
  Mail,
  FileText,
  DollarSign,
  Truck,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

// ── Shared Components ─────────────────────────────────────────
import MobilePageHeader from "@/components/layout/MobilePageHeader";

// ================================================================
// TYPES
// ================================================================

interface FormData {
  seller: string;
  sellerPhone: string;
  itemDescription: string;
  amount: string;
  waybillInfo: string;
}

// ================================================================
// MAIN PAGE COMPONENT
// ================================================================

export default function CreateOrderPage() {
  const router = useRouter();

  // ── Ref for the hidden file input ───────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form field values ────────────────────────────────────────
  const [formData, setFormData] = useState<FormData>({
    seller: "",
    sellerPhone: "",
    itemDescription: "",
    amount: "",
    waybillInfo: "",
  });

  // ── Image upload states ──────────────────────────────────────
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ── UI states ─────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // ================================================================
  // HANDLERS
  // ================================================================

  /**
   * Updates a single form field value.
   * Also clears any existing error for that field.
   */
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handles image file selection from the hidden input.
   * Validates file type (image/*) and size (max 5MB).
   * Creates a local object URL for preview.
   */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: must be an image
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    // Validate: max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image must be under 5MB.");
      return;
    }

    // Store file + create preview URL
    setItemImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /**
   * Removes the selected image and revokes the preview URL
   * to free memory.
   */
  const handleRemoveImage = () => {
    setItemImage(null);
    // Revoke the object URL to avoid memory leaks
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    // Reset the file input so the same file can be reselected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /**
   * Client-side form validation.
   * Returns true if all required fields are filled.
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.seller.trim()) {
      newErrors.seller = "Seller username or email is required";
    }
    if (!formData.sellerPhone.trim()) {
      newErrors.sellerPhone = "Phone number is required";
    }
    if (!formData.itemDescription.trim()) {
      newErrors.itemDescription = "Item description is required";
    }
    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission.
   * Runs validation, shows loading state, then navigates.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // TODO: Replace with real API call
    // e.g. await createEscrowOrder({ ...formData, itemImage });
    console.log("Creating escrow order:", { ...formData, itemImage });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Show brief success state before navigating
    setIsSubmitting(false);
    setIsSuccess(true);

    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push("/dashboard/orders");
  };

  // ================================================================
  // RENDER — SUCCESS STATE
  // ================================================================

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="clay-card text-center max-w-sm w-full !py-12">
          {/* Animated check icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center
                       justify-center mx-auto mb-5"
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
            Escrow Created!
          </h2>
          <p className="text-sm text-olive-500 mb-6">
            Your order has been created. Redirecting...
          </p>

          {/* Loading dots */}
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-olive-500 rounded-full
                           animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // RENDER — MAIN FORM
  // ================================================================

  return (
    <>
      {/* ============================================================
          MOBILE VIEW — full-width scrollable form
          Matches "Create Order Screen" from the design mockups.
          ============================================================ */}
      <div className="lg:hidden min-h-screen">
        {/* ── Sticky Page Header with back button ────────────── */}
        <MobilePageHeader title="Create Order" />

        {/* ── Form ───────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="px-4 pt-5 pb-8 space-y-5"
          noValidate
        >
          {/* Seller username/email */}
          <FormField
            label="Seller"
            icon={Mail}
            error={errors.seller}
          >
            <input
              type="text"
              placeholder="Seller username/email"
              value={formData.seller}
              onChange={(e) => handleChange("seller", e.target.value)}
              className={`clay-input ${
                errors.seller ? "border-red-400 focus:border-red-400" : ""
              }`}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </FormField>

          {/* Seller phone number */}
          <FormField
            label="Phone number"
            icon={Phone}
            error={errors.sellerPhone}
          >
            <input
              type="tel"
              placeholder="+234 800 000 0000"
              value={formData.sellerPhone}
              onChange={(e) =>
                handleChange("sellerPhone", e.target.value)
              }
              className={`clay-input ${
                errors.sellerPhone ? "border-red-400 focus:border-red-400" : ""
              }`}
            />
          </FormField>

          {/* Item description */}
          <FormField
            label="Item description"
            icon={FileText}
            error={errors.itemDescription}
          >
            <textarea
              placeholder="Describe the item being purchased..."
              value={formData.itemDescription}
              onChange={(e) =>
                handleChange("itemDescription", e.target.value)
              }
              rows={3}
              className={`clay-textarea ${
                errors.itemDescription
                  ? "border-red-400 focus:border-red-400"
                  : ""
              }`}
            />
          </FormField>

          {/* Item image upload */}
          <div>
            <label
              className="flex items-center gap-1.5 text-sm
                         font-semibold text-olive-800 mb-2"
            >
              <ImageIcon
                size={13}
                className="text-olive-500"
                aria-hidden="true"
              />
              Item image
            </label>

            {imagePreview ? (
              <ImagePreviewCard
                src={imagePreview}
                fileName={itemImage?.name ?? ""}
                fileSize={itemImage?.size ?? 0}
                onRemove={handleRemoveImage}
              />
            ) : (
              <ImageUploadZone
                onTrigger={() => fileInputRef.current?.click()}
              />
            )}

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              aria-label="Upload item image"
            />
          </div>

          {/* Amount */}
          <FormField
            label="Amount"
            icon={DollarSign}
            error={errors.amount}
          >
            <input
              type="text"
              placeholder="₦ 150,000.00"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              className={`clay-input ${
                errors.amount ? "border-red-400 focus:border-red-400" : ""
              }`}
              inputMode="decimal"
            />
          </FormField>

          {/* Delivery / Waybill info */}
          <FormField label="Delivery details" icon={Truck}>
            <input
              type="text"
              placeholder="Waybill info (optional)"
              value={formData.waybillInfo}
              onChange={(e) =>
                handleChange("waybillInfo", e.target.value)
              }
              className="clay-input"
            />
          </FormField>

          {/* Security notice */}
          <div className="clay-section flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center
                         justify-center shrink-0"
              style={{
                background:
                  "linear-gradient(145deg, var(--color-olive-400), var(--color-olive-600))",
                boxShadow:
                  "3px 3px 7px rgba(23,29,9,0.20)," +
                  " -1px -1px 4px rgba(114,143,50,0.15)",
              }}
            >
              <ShieldCheck size={18} className="text-white" />
            </div>
            <p className="text-xs text-olive-700 leading-relaxed">
              Payment is held securely in escrow until the buyer
              confirms delivery. Both parties are fully protected.
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="clay-btn w-full py-4 flex items-center
                       justify-center gap-3"
          >
            {/* Icon pill */}
            <div
              className="w-9 h-9 bg-white/10 rounded-lg flex
                         items-center justify-center"
            >
              <Package size={18} />
            </div>
            <span>
              {isSubmitting ? "Creating Escrow..." : "Create Escrow"}
            </span>
          </button>
        </form>
      </div>

      {/* ============================================================
          DESKTOP VIEW — centred card layout
          ============================================================ */}
      <div className="hidden lg:block p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* ── Breadcrumb ─────────────────────────────────── */}
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

          {/* ── Main Clay Form Card ─────────────────────────── */}
          <div className="clay-card !p-8">
            {/* Card header */}
            <div className="flex items-center gap-4 mb-8">
              {/* Raised icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center
                           justify-center shrink-0"
                style={{
                  background:
                    "linear-gradient(145deg, var(--color-olive-500)," +
                    " var(--color-olive-700))",
                  boxShadow:
                    "6px 6px 14px rgba(23,29,9,0.28)," +
                    " -3px -3px 8px rgba(114,143,50,0.22)," +
                    " inset 0 1px 2px rgba(255,255,255,0.10)",
                }}
              >
                <Package size={26} className="text-white" />
              </div>

              {/* Title + subtitle */}
              <div>
                <h2 className="text-xl font-bold text-olive-900">
                  Create Escrow Order
                </h2>
                <p className="text-sm text-olive-500 mt-0.5">
                  Secure transaction between buyer and seller
                </p>
              </div>
            </div>

            {/* ── Desktop Form ─────────────────────────────── */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              noValidate
            >
              {/* Row 1: Seller email + Phone */}
              <div className="grid grid-cols-2 gap-5">
                <FormField
                  label="Seller Username / Email"
                  icon={Mail}
                  error={errors.seller}
                >
                  <input
                    type="text"
                    placeholder="e.g. jane@example.com"
                    value={formData.seller}
                    onChange={(e) =>
                      handleChange("seller", e.target.value)
                    }
                    className={`clay-input ${
                      errors.seller
                        ? "border-red-400 focus:border-red-400"
                        : ""
                    }`}
                    autoCapitalize="none"
                  />
                </FormField>

                <FormField
                  label="Seller Phone Number"
                  icon={Phone}
                  error={errors.sellerPhone}
                >
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={formData.sellerPhone}
                    onChange={(e) =>
                      handleChange("sellerPhone", e.target.value)
                    }
                    className={`clay-input ${
                      errors.sellerPhone
                        ? "border-red-400 focus:border-red-400"
                        : ""
                    }`}
                  />
                </FormField>
              </div>

              {/* Item description */}
              <FormField
                label="Item Description"
                icon={FileText}
                error={errors.itemDescription}
              >
                <textarea
                  placeholder="Describe the item being purchased..."
                  value={formData.itemDescription}
                  onChange={(e) =>
                    handleChange("itemDescription", e.target.value)
                  }
                  rows={4}
                  className={`clay-textarea ${
                    errors.itemDescription
                      ? "border-red-400 focus:border-red-400"
                      : ""
                  }`}
                />
              </FormField>

              {/* Item image upload */}
              <div>
                <label
                  className="flex items-center gap-1.5 text-sm
                             font-semibold text-olive-800 mb-2"
                >
                  <ImageIcon
                    size={13}
                    className="text-olive-500"
                    aria-hidden="true"
                  />
                  Item Image
                </label>

                {imagePreview ? (
                  <ImagePreviewCard
                    src={imagePreview}
                    fileName={itemImage?.name ?? ""}
                    fileSize={itemImage?.size ?? 0}
                    onRemove={handleRemoveImage}
                  />
                ) : (
                  <ImageUploadZone
                    onTrigger={() => fileInputRef.current?.click()}
                    isDesktop
                  />
                )}

                {/* Hidden native file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  aria-label="Upload item image"
                />
              </div>

              {/* Row 2: Amount + Waybill */}
              <div className="grid grid-cols-2 gap-5">
                <FormField
                  label="Amount (₦)"
                  icon={DollarSign}
                  error={errors.amount}
                >
                  <input
                    type="text"
                    placeholder="e.g. 150,000"
                    value={formData.amount}
                    onChange={(e) =>
                      handleChange("amount", e.target.value)
                    }
                    className={`clay-input ${
                      errors.amount
                        ? "border-red-400 focus:border-red-400"
                        : ""
                    }`}
                    inputMode="decimal"
                  />
                </FormField>

                <FormField
                  label="Delivery / Waybill Info"
                  icon={Truck}
                >
                  <input
                    type="text"
                    placeholder="Tracking number (optional)"
                    value={formData.waybillInfo}
                    onChange={(e) =>
                      handleChange("waybillInfo", e.target.value)
                    }
                    className="clay-input"
                  />
                </FormField>
              </div>

              {/* Security notice */}
              <div className="clay-section flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center
                             justify-center shrink-0 mt-0.5"
                  style={{
                    background:
                      "linear-gradient(145deg, var(--color-olive-400)," +
                      " var(--color-olive-600))",
                    boxShadow:
                      "3px 3px 7px rgba(23,29,9,0.20)," +
                      " -1px -1px 4px rgba(114,143,50,0.15)",
                  }}
                >
                  <ShieldCheck size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-olive-800 mb-0.5">
                    Escrow Protection
                  </p>
                  <p className="text-xs text-olive-600 leading-relaxed">
                    Payment is held securely in escrow until the buyer
                    confirms delivery. Funds are only released when both
                    parties are satisfied.
                  </p>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="clay-btn w-full py-3.5 flex items-center
                           justify-center gap-2"
              >
                <Send size={18} />
                <span>
                  {isSubmitting
                    ? "Creating Escrow..."
                    : "Create Escrow Order"}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ================================================================
// SUB-COMPONENT: FormField
// ================================================================
// Wraps a label (with icon), an input child, and an optional
// error message. Keeps form markup DRY across both views.
// ================================================================

interface FormFieldProps {
  /** Label text above the input */
  label: string;
  /** Lucide icon for the label */
  icon: LucideIcon;
  /** Optional error message shown in red below the input */
  error?: string;
  /** The input or textarea element */
  children: React.ReactNode;
}

function FormField({
  label,
  icon: Icon,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      {/* ── Label + Icon ─────────────────────────────────── */}
      <label
        className="flex items-center gap-1.5 text-sm font-semibold
                   text-olive-800"
      >
        <Icon size={13} className="text-olive-500" aria-hidden="true" />
        {label}
      </label>

      {/* ── Input Child ──────────────────────────────────── */}
      {children}

      {/* ── Error Message ────────────────────────────────── */}
      {error && (
        <p className="text-xs text-red-500 font-medium pl-1">
          {error}
        </p>
      )}
    </div>
  );
}

// ================================================================
// SUB-COMPONENT: ImageUploadZone
// ================================================================
// Dashed upload zone that triggers the hidden file input.
// Has two size variants — compact (mobile) and large (desktop).
// ================================================================

interface ImageUploadZoneProps {
  /** Triggers the hidden native file input */
  onTrigger: () => void;
  /** Show a taller, more prominent layout on desktop */
  isDesktop?: boolean;
}

function ImageUploadZone({
  onTrigger,
  isDesktop = false,
}: ImageUploadZoneProps) {
  return (
    <button
      type="button"
      onClick={onTrigger}
      className={[
        // Base clay inset + dashed border
        "clay-inset w-full flex flex-col items-center justify-center",
        "border-2 border-dashed border-olive-300/50",
        "hover:border-olive-500/60 transition-all cursor-pointer group",
        // Height varies by context
        isDesktop ? "py-10 rounded-xl" : "py-8 rounded-xl",
      ].join(" ")}
    >
      {/* Upload icon — raised olive circle */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center
                   mb-3 transition-transform group-hover:scale-105"
        style={{
          background:
            "linear-gradient(145deg, var(--color-olive-400)," +
            " var(--color-olive-600))",
          boxShadow:
            "4px 4px 10px rgba(23,29,9,0.22)," +
            " -2px -2px 6px rgba(114,143,50,0.18)",
        }}
      >
        <Upload size={20} className="text-white" />
      </div>

      {/* Instructions */}
      <p className="text-sm font-semibold text-olive-700 mb-1">
        {isDesktop ? "Click to upload item image" : "Tap to upload image"}
      </p>
      <p className="text-xs text-olive-400">
        PNG, JPG, WEBP — max 5MB
      </p>
    </button>
  );
}

// ================================================================
// SUB-COMPONENT: ImagePreviewCard
// ================================================================
// Shows a thumbnail of the uploaded image, the file name,
// human-readable file size, and a remove (×) button.
// ================================================================

interface ImagePreviewCardProps {
  /** Object URL for the preview thumbnail */
  src: string;
  /** Original file name */
  fileName: string;
  /** File size in bytes — formatted to KB or MB */
  fileSize: number;
  /** Callback to remove the image */
  onRemove: () => void;
}

/**
 * Formats bytes into a human-readable string.
 * e.g. 2048 → "2.0 KB"   |   1572864 → "1.5 MB"
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImagePreviewCard({
  src,
  fileName,
  fileSize,
  onRemove,
}: ImagePreviewCardProps) {
  return (
    <div className="clay-card flex items-center gap-4 !p-3.5">
      {/* ── Thumbnail ────────────────────────────────────── */}
      <div className="clay-inset w-16 h-16 rounded-xl overflow-hidden shrink-0">
        <img
          src={src}
          alt="Item preview"
          className="w-full h-full object-cover"
        />
      </div>

      {/* ── File Info ──────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Filename */}
        <div className="flex items-center gap-1.5 mb-1">
          <ImageIcon
            size={13}
            className="text-olive-500 shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-olive-800 truncate">
            {fileName}
          </p>
        </div>

        {/* File size + success indicator */}
        <div className="flex items-center gap-2">
          <p className="text-xs text-olive-400">
            {formatFileSize(fileSize)}
          </p>
          <span className="flex items-center gap-0.5 text-xs font-medium text-olive-600">
            <CheckCircle size={11} />
            Ready
          </span>
        </div>
      </div>

      {/* ── Remove Button ──────────────────────────────────── */}
      <button
        type="button"
        onClick={onRemove}
        className="clay-inset p-2 rounded-xl text-red-400
                   hover:text-red-600 transition-colors shrink-0"
        aria-label="Remove image"
      >
        <X size={16} />
      </button>
    </div>
  );
}