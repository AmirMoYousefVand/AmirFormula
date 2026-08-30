"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, Upload, Trash2, Image as ImageIcon, Film, FileIcon, Search, Grid3X3, Loader2 } from "lucide-react";
import { uploadImageToSupabase } from "@/lib/supabase/storage";
import { listStorageFilesAction, deleteStorageFileAction } from "@/actions/storage";

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  url: string;
}

interface MediaGalleryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  accept?: string;
}

function getFileType(name: string): "image" | "video" | "file" {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "avi", "mkv", "ogg"].includes(ext)) return "video";
  return "file";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "";
  }
}

export default function MediaGallery({ onSelect, onClose, accept = "*" }: MediaGalleryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video" | "file">("all");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const result = await listStorageFilesAction();
    setFiles(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      await uploadImageToSupabase("covers", file);
    }
    setUploading(false);
    await fetchFiles();
  }

  async function handleDelete(name: string) {
    setDeleting(name);
    await deleteStorageFileAction(name);
    setFiles((prev) => prev.filter((f) => f.name !== name));
    if (selectedFile === name) setSelectedFile(null);
    setDeleting(null);
  }

  const filtered = files.filter((f) => {
    const type = getFileType(f.name);
    if (filter !== "all" && type !== filter) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mx-4 flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-silver/30 px-5 py-4">
          <h2 className="text-lg font-bold text-navy">گالری مدیا</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-body transition-colors hover:bg-silver/20 hover:text-navy"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: search + filter + upload */}
        <div className="flex flex-wrap items-center gap-3 border-b border-silver/20 px-5 py-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-silver" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="w-full rounded-lg border border-silver/40 bg-silver/5 py-2 pe-3 ps-9 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-1 rounded-lg bg-silver/15 p-1">
            {(["all", "image", "video", "file"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-white text-navy shadow-sm"
                    : "text-body hover:text-navy"
                }`}
              >
                {f === "all" ? "همه" : f === "image" ? "عکس" : f === "video" ? "ویدیو" : "فایل"}
              </button>
            ))}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept={accept}
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? "در حال آپلود..." : "آپلود"}
          </button>
        </div>

        {/* Drop zone overlay */}
        <div
          ref={dropRef}
          className="relative flex-1 overflow-y-auto"
          onDrop={(e) => {
            e.preventDefault();
            handleUpload(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-body">
              <ImageIcon size={48} className="text-silver/40" />
              <p className="text-sm">
                {files.length === 0 ? "هنوز فایلی آپلود نشده" : "نتیجه‌ای یافت نشد"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((file) => {
                const type = getFileType(file.name);
                const isSelected = selectedFile === file.name;
                return (
                  <div
                    key={file.id || file.name}
                    className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-silver/50"
                    }`}
                    onClick={() => setSelectedFile(file.name)}
                    onDoubleClick={() => onSelect(file.url)}
                  >
                    <div className="aspect-square bg-silver/10">
                      {type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : type === "video" ? (
                        <div className="flex h-full w-full items-center justify-center bg-navy/5">
                          <Film size={32} className="text-navy/30" />
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-navy/5">
                          <FileIcon size={32} className="text-navy/30" />
                        </div>
                      )}
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`آیا از حذف "${file.name}" مطمئن هستید؟`)) {
                          handleDelete(file.name);
                        }
                      }}
                      disabled={deleting === file.name}
                      className="absolute top-2 end-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                    >
                      {deleting === file.name ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>

                    {/* File info */}
                    <div className="absolute bottom-0 inset-x-0 px-2 pb-2 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-xs font-medium text-white">{file.name}</p>
                      <p className="text-[10px] text-white/60">{formatDate(file.created_at)}</p>
                    </div>

                    {/* Type badge */}
                    {type !== "image" && (
                      <div className="absolute top-2 start-2 rounded-md bg-navy/80 px-2 py-0.5 text-[10px] font-bold text-white">
                        {type === "video" ? "VIDEO" : file.name.split(".").pop()?.toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-silver/30 px-5 py-3">
          <p className="text-xs text-body">{filtered.length} فایل</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-silver/40 px-4 py-2 text-sm font-medium text-body transition-colors hover:bg-silver/10"
            >
              انصراف
            </button>
            <button
              onClick={() => {
                if (selectedFile) {
                  const file = files.find((f) => f.name === selectedFile);
                  if (file) onSelect(file.url);
                }
              }}
              disabled={!selectedFile}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-40"
            >
              انتخاب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
