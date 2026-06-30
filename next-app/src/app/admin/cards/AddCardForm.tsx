"use client";

import { useState, useRef } from "react";
import { CATEGORIES } from "@/lib/card-data";

interface AddCardFormProps {
  onClose: () => void;
  onCardAdded: () => void;
}

export function AddCardForm({ onClose, onCardAdded }: AddCardFormProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]?.id || "daily");
  const [icon, setIcon] = useState("star");
  const [isCharacter, setIsCharacter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Image upload state
  const [images, setImages] = useState<Record<string, File | null>>({
    neutral: null,
    boy: null,
    girl: null,
    brown: null,
    single: null, // For neutral card type
  });

  const [previews, setPreviews] = useState<Record<string, string>>({
    neutral: "",
    boy: "",
    girl: "",
    brown: "",
    single: "",
  });

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Auto-generate card ID from name
  const generateCardId = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const cardId = generateCardId(nameEn);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, variant: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews((prev) => ({
        ...prev,
        [variant]: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);

    // Store file
    setImages((prev) => ({
      ...prev,
      [variant]: file,
    }));

    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!nameEn) {
      setError("Name is required");
      return;
    }

    if (isCharacter) {
      if (!images.neutral || !images.boy || !images.girl || !images.brown) {
        setError("All 4 character variant images are required");
        return;
      }
    } else {
      if (!images.single) {
        setError("Image is required");
        return;
      }
    }

    setLoading(true);

    try {
      // Step 1: Create the card metadata
      const cardPayload = {
        id: cardId,
        icon,
        categoryId: category,
        isCharacter,
        translations: {
          en: nameEn,
          hi: nameHi || nameEn,
        },
      };

      const cardRes = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardPayload),
      });

      if (!cardRes.ok) {
        let errorMsg = "Failed to create card";
        try {
          const data = await cardRes.json();
          errorMsg = data.error || errorMsg;
        } catch {
          errorMsg = `Card creation failed (${cardRes.status}): ${cardRes.statusText}`;
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Step 2: Upload images
      const imagesToUpload = isCharacter
        ? { neutral: images.neutral, boy: images.boy, girl: images.girl, brown: images.brown }
        : { neutral: images.single };

      for (const [variant, file] of Object.entries(imagesToUpload)) {
        if (!file) continue;

        const formData = new FormData();
        formData.append("cardId", cardId);
        formData.append("variant", variant);
        formData.append("image", file);

        const uploadRes = await fetch("/api/admin/cards/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          let errorMsg = "Failed to upload image";
          try {
            const data = await uploadRes.json();
            errorMsg = data.error || errorMsg;
          } catch {
            errorMsg = `Upload failed (${uploadRes.status}): ${uploadRes.statusText}`;
          }
          setError(`Error uploading ${variant} image: ${errorMsg}`);
          setLoading(false);
          return;
        }
      }

      setSuccess("✅ Card and images added successfully!");
      setTimeout(() => {
        onCardAdded();
        onClose();
      }, 1500);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[20px] font-semibold text-[#2C2C2C]">Add New Card</h2>
            <button
              onClick={onClose}
              className="text-[#999] hover:text-[#2C2C2C] text-[24px] leading-none"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#FEE] border border-[#FCC] rounded text-[#C33] text-[14px]">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-[#EFE] border border-[#CFC] rounded text-[#3C3] text-[14px]">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card ID (Auto-generated) */}
            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">
                Card ID (Auto-generated)
              </label>
              <input
                type="text"
                value={cardId}
                disabled
                className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] bg-[#F5F5F5] text-[#999] cursor-not-allowed"
              />
              <p className="text-[11px] text-[#999] mt-1">Generated from: {nameEn || "Enter name"}</p>
            </div>

            {/* Name English */}
            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">
                Name (English)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Wake Up"
                className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30"
              />
            </div>

            {/* Name Hindi */}
            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">
                Name (Hindi)
              </label>
              <input
                type="text"
                value={nameHi}
                onChange={(e) => setNameHi(e.target.value)}
                placeholder="e.g. जागो"
                className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">
                Icon
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. star"
                className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30"
              />
            </div>

            {/* Card Type */}
            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-2">
                Card Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cardType"
                    checked={isCharacter}
                    onChange={() => setIsCharacter(true)}
                    className="w-4 h-4 accent-[#7A8F5E]"
                  />
                  <span className="text-[14px] text-[#2C2C2C]">Character (4 variants)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cardType"
                    checked={!isCharacter}
                    onChange={() => setIsCharacter(false)}
                    className="w-4 h-4 accent-[#7A8F5E]"
                  />
                  <span className="text-[14px] text-[#2C2C2C]">Neutral (1 image)</span>
                </label>
              </div>
            </div>

            {/* IMAGE UPLOAD SECTION */}
            <div className="pt-4 border-t border-[#E0E0E0]">
              <h3 className="text-[14px] font-semibold text-[#2C2C2C] mb-4">
                {isCharacter ? "Upload 4 Character Variants" : "Upload Image"}
              </h3>

              {isCharacter ? (
                // Character variants grid
                <div className="grid grid-cols-2 gap-4">
                  {["neutral", "boy", "girl", "brown"].map((variant) => (
                    <div key={variant} className="border-2 border-dashed border-[#D0D0D0] rounded-lg p-4">
                      <label className="block cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          {previews[variant] ? (
                            <img
                              src={previews[variant]}
                              alt={variant}
                              className="w-24 h-24 object-contain border border-[#E0E0E0] rounded"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-[#F5F5F5] border border-[#E0E0E0] rounded flex items-center justify-center">
                              <svg
                                className="w-8 h-8 stroke-[#CCC] fill-none"
                                viewBox="0 0 24 24"
                                strokeLinecap="round"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                          )}
                          <span className="text-[12px] font-semibold text-[#666] capitalize">
                            {variant === "neutral" ? "Child with Glasses" : variant}
                          </span>
                          <span className="text-[10px] text-[#999]">
                            {images[variant] ? "✓ Selected" : "Click to upload"}
                          </span>
                        </div>
                        <input
                          ref={(el) => {
                            if (el) fileInputRefs.current[variant] = el;
                          }}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, variant)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                // Single image for neutral card
                <div className="border-2 border-dashed border-[#D0D0D0] rounded-lg p-6">
                  <label className="block cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                      {previews.single ? (
                        <img
                          src={previews.single}
                          alt="card"
                          className="w-32 h-32 object-contain border border-[#E0E0E0] rounded"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-[#F5F5F5] border border-[#E0E0E0] rounded flex items-center justify-center">
                          <svg
                            className="w-10 h-10 stroke-[#CCC] fill-none"
                            viewBox="0 0 24 24"
                            strokeLinecap="round"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                      <span className="text-[14px] font-semibold text-[#2C2C2C]">
                        {images.single ? "✓ Image selected" : "Click to upload image"}
                      </span>
                      <span className="text-[12px] text-[#999]">PNG, JPG, or GIF (max 5MB)</span>
                    </div>
                    <input
                      ref={(el) => {
                        if (el) fileInputRefs.current["single"] = el;
                      }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, "single")}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[#D0D0D0] rounded text-[14px] text-[#2C2C2C] font-medium hover:bg-[#F5F5F5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#7A8F5E] text-white rounded text-[14px] font-medium hover:bg-[#6A7F4E] disabled:opacity-50 transition-colors"
              >
                {loading ? "Adding..." : "Add Card & Upload Images"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
