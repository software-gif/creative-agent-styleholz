"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Creative = {
  id: string;
  angle: string;
  sub_angle: string;
  hook_text: string;
  format: string;
  variant: number;
  status: string;
  image_url: string | null;
  storage_path: string | null;
  created_at: string;
};

const ANGLE_COLORS: Record<string, string> = {
  "Problem/Pain": "text-red-500",
  Benefit: "text-green-500",
  Proof: "text-blue-500",
  Curiosity: "text-purple-500",
  Education: "text-sky-500",
  Story: "text-pink-500",
  Offer: "text-amber-500",
};

const ANGLE_EMOJI: Record<string, string> = {
  "Problem/Pain": "🔥",
  Benefit: "✨",
  Proof: "✅",
  Curiosity: "🔮",
  Education: "📚",
  Story: "💜",
  Offer: "🏷️",
};

export default function Board() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Creative | null>(null);

  useEffect(() => {
    loadCreatives();

    const channel = supabase
      .channel("creatives-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "creatives" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setCreatives((prev) => [payload.new as Creative, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setCreatives((prev) =>
              prev.map((c) =>
                c.id === (payload.new as Creative).id
                  ? (payload.new as Creative)
                  : c
              )
            );
          } else if (payload.eventType === "DELETE") {
            setCreatives((prev) =>
              prev.filter((c) => c.id !== (payload.old as Creative).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadCreatives() {
    const { data, error } = await supabase
      .from("creatives")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCreatives(data);
    }
    setLoading(false);
  }

  function getImageUrl(creative: Creative): string | null {
    if (creative.image_url) return creative.image_url;
    if (creative.storage_path) {
      const { data } = supabase.storage
        .from("creatives")
        .getPublicUrl(creative.storage_path);
      return data.publicUrl;
    }
    return null;
  }

  const angles = [...new Set(creatives.map((c) => c.angle))];
  const filtered =
    filter === "all" ? creatives : creatives.filter((c) => c.angle === filter);
  const doneCount = creatives.filter((c) => c.status === "done").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">
            Creative Board
          </h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            {doneCount} Creatives
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:border-amber-700"
          >
            <option value="all">Alle Angles</option>
            {angles.map((a) => (
              <option key={a} value={a}>
                {ANGLE_EMOJI[a] || ""} {a} (
                {creatives.filter((c) => c.angle === a).length})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Grid */}
      <main className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Laden...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-lg font-medium">Noch keine Creatives</p>
            <p className="text-sm mt-1">
              Generiere Ads per Claude Code — sie erscheinen hier automatisch.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
            {filtered.map((creative) => {
              const imageUrl = getImageUrl(creative);
              return (
                <div
                  key={creative.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div
                    className="relative aspect-[4/5] bg-gray-100 cursor-pointer"
                    onClick={() => imageUrl && setSelectedImage(creative)}
                  >
                    {creative.status === "generating" ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={creative.sub_angle}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
                        Kein Bild
                      </div>
                    )}
                    <span className="absolute top-2 right-2 bg-white/90 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      {creative.format}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="p-3">
                    <div
                      className={`text-[11px] font-semibold uppercase tracking-wide ${ANGLE_COLORS[creative.angle] || "text-gray-500"}`}
                    >
                      {ANGLE_EMOJI[creative.angle]} {creative.angle}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mt-0.5 leading-tight">
                      {creative.sub_angle}
                    </div>
                    {creative.hook_text && (
                      <div className="text-xs text-gray-400 mt-1 italic line-clamp-2">
                        {creative.hook_text}
                      </div>
                    )}
                    {imageUrl && (
                      <a
                        href={imageUrl}
                        download
                        className="mt-2 block text-center text-xs font-semibold bg-gray-900 text-white py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Fullscreen Overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
          <img
            src={getImageUrl(selectedImage)!}
            alt={selectedImage.sub_angle}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-8 text-center text-white">
            <p className="font-semibold">{selectedImage.sub_angle}</p>
            <p className="text-sm text-white/60">
              {selectedImage.angle} — {selectedImage.format}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
