"use client";

import { useState, useRef, useEffect } from "react";
import { type ParsedCard, isCharacterCard } from "@/lib/card-data";

interface Category {
  id: string;
  name: string;
  isFree: boolean;
}

interface EditCardFormProps {
  card: ParsedCard;
  onClose: () => void;
  onCardUpdated: () => void;
}

export function EditCardForm({ card, onClose, onCardUpdated }: EditCardFormProps) {
  const [nameEn, setNameEn] = useState(card.translations?.en || "");
  const [nameHi, setNameHi] = useState(card.translations?.hi || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState(card.categoryId || "");
  const [icon, setIcon] = useState(card.icon || "star");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isCharacter = isCharacterCard(card);

  // Load admin-defined categories from the database
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          const cats: Category[] = data.categories || [];
          setCategories(cats);
          // Keep the card's current category selected if it still exists,
          // otherwise default to the first available category.
          if (!cats.some((c) => c.id === card.categoryId) && cats.length > 0) {
            setCategory(cats[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    })();
  }, [card.categoryId]);

  // Image upload state
  const [images, setImages] = useState<Record<string, File | null>>({
    neutral: null,
    boy: null,
    girl: null,
    brown: null,
    single: null,
  });

  const [previews, setPreviews] = useState<Record<string, string>>({
    neutral: "",
    boy: "",
    girl: "",
    brown: "",
    single: "",
  });

  const [currentImages, setCurrentImages] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load current images
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/cards/${card.id}/images`);
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, string> = {};
          (data.images || []).forEach((img: { variant: string; url: string }) => {
            map[img.variant] = img.url;
          });
          setCurrentImages(map);
          // Initialize previews with current images
          setPreviews(map);
        }
      } catch (err) {
        console.error("Failed to load images:", err);
      }
    })();
  }, [card.id]);

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

    setLoading(true);

    try {
      // Step 1: Update card metadata
      const cardPayload = {
        icon,
        categoryId: category,
        translations: {
          en: nameEn,
          hi: nameHi || nameEn,
        },
      };

      const cardRes = await fetch(`/api/admin/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardPayload),
      });

      if (!cardRes.ok) {
        const data = await cardRes.json();
        setError(data.error || "Failed to update card");
        setLoading(false);
        return;
      }

      // Step 2: Upload any new images
      const imagesToUpload = isCharacter
        ? {
            neutral: images.neutral,
            boy: images.boy,
            girl: images.girl,
            brown: images.brown,
          }
        : { neutral: images.single };

      for (const [variant, file] of Object.entries(imagesToUpload)) {
        if (!file) continue; // Skip if no new image

        const formData = new FormData();
        formData.append("file", file);
        formData.append("variant", variant);

        // Use the schema-consistent endpoint (binding R2, columns r2_key/url).
        const uploadRes = await fetch(`/api/admin/cards/${card.id}/images`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          setError(`Failed to upload ${variant} image: ${data.error}`);
          setLoading(false);
          return;
        }
      }

      setSuccess("✅ Card updated successfully!");
      setTimeout(() => {
        onCardUpdated();
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
            <h2 className="text-[20px] font-semibold text-[#2C2C2C]">Edit Card</h2>
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
            {/* Card ID (Read-only) */}
            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">
                Card ID
              </label>
              <input
                type="text"
                value={card.id}
                disabled
                className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] bg-[#F5F5F5] text-[#999] cursor-not-allowed"
              />
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
                className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30"
              />
            </div>

            {/* Category (admin-defined, loaded from DB) */}
            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30"
              >
                {categories.length === 0 ? (
                  <option value={category}>{category || "No categories"}</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} — {cat.isFree ? "Free" : "Paid"}
                    </option>
                  ))
                )}
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
                className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30"
              />
            </div>

            {/* Card Type (Read-only) */}
            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-2">
                Card Type
              </label>
              <div className="p-3 bg-[#F5F5F5] rounded border border-[#E0E0E0]">
                <span className="text-[14px] text-[#2C2C2C]">
                  {isCharacter ? "Character (4 variants)" : "Neutral (1 image)"}
                </span>
              </div>
            </div>

            {/* IMAGE UPLOAD SECTION */}
            <div className="pt-4 border-t border-[#E0E0E0]">
              <h3 className="text-[14px] font-semibold text-[#2C2C2C] mb-3">
                {isCharacter ? "Edit Character Variants" : "Edit Image"}
              </h3>
              <p className="text-[12px] text-[#666] mb-4">
                Current images shown below. Click to replace or leave blank to keep existing.
              </p>

              {isCharacter ? (
                // Character variants grid
                <div className="grid grid-cols-2 gap-4">
                  {["neutral", "boy", "girl", "brown"].map((variant) => (
                    <div key={variant} className="border-2 border-dashed border-[#D0D0D0] rounded-lg p-4">
                      <label className="block cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          {previews[variant] ? (
                            <div className="relative">
                              <img
                                src={previews[variant]}
                                alt={variant}
                                className="w-24 h-24 object-contain border border-[#E0E0E0] rounded"
                              />
                              {images[variant] && (
                                <div className="absolute top-1 right-1 bg-[#7A8F5E] text-white text-[10px] px-2 py-1 rounded">
                                  NEW
                                </div>
                              )}
                            </div>
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
                            {images[variant] ? "✓ New image" : currentImages[variant] ? "✓ Current" : "Click to add"}
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
                        <div className="relative">
                          <img
                            src={previews.single}
                            alt="card"
                            className="w-32 h-32 object-contain border border-[#E0E0E0] rounded"
                          />
                          {images.single && (
                            <div className="absolute top-1 right-1 bg-[#7A8F5E] text-white text-[10px] px-2 py-1 rounded">
                              NEW
                            </div>
                          )}
                        </div>
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
                        {images.single ? "✓ New image selected" : currentImages.neutral ? "✓ Current image" : "Click to upload image"}
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
                {loading ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
