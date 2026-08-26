"use client";

import { useState } from "react";
import { addSocialLinkAction, updateSocialLinkAction, deleteSocialLinkAction } from "@/actions/social-links";
import { SocialLink } from "@/types";
import { Plus, Trash2, Edit2, Check, X, Link as LinkIcon } from "lucide-react";
import { DynamicIcon } from "@/components/ui/SocialLinks/DynamicIcon";

const ICON_OPTIONS = [
  "Telegram", "X", "Instagram", "Youtube", "Coffeete", "Github", "Linkedin", "Discord", "Dribbble", "Behance", "Medium", "WhatsApp", "Facebook", "Gitlab"
];

function IconPreview({ name }: { name: string }) {
  return <DynamicIcon name={name} className="h-5 w-5" />;
}

export function SocialLinksManager({ initialLinks }: { initialLinks: SocialLink[] }) {
  const [links, setLinks] = useState<SocialLink[]>(initialLinks);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      await addSocialLinkAction(formData);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      await updateSocialLinkAction(id, formData);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این لینک اطمینان دارید؟")) return;
    setLoading(true);
    try {
      await deleteSocialLinkAction(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <p className="text-sm text-slate-500">لینک‌های شبکه‌های اجتماعی خود را برای نمایش در فوتر مدیریت کنید.</p>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            افزودن لینک جدید
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-bold mb-4 text-slate-700">افزودن لینک</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">نام پلتفرم</label>
              <input name="platform" required className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="مثال: Telegram" />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">آدرس لینک (URL)</label>
              <input name="url" type="url" required className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" dir="ltr" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">آیکون</label>
              <select name="icon_name" className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                {ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ترتیب</label>
              <input name="sort_order" type="number" defaultValue="0" className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" name="is_active" value="true" defaultChecked id="new_is_active" className="rounded text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="new_is_active" className="text-sm text-slate-700">فعال</label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">ذخیره</button>
            <button type="button" onClick={() => setIsAdding(false)} disabled={loading} className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50">انصراف</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">آیکون</th>
              <th className="pb-3 font-medium">پلتفرم</th>
              <th className="pb-3 font-medium">لینک</th>
              <th className="pb-3 font-medium text-center">وضعیت</th>
              <th className="pb-3 font-medium text-center">ترتیب</th>
              <th className="pb-3 font-medium text-left">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {links.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">هیچ لینکی یافت نشد.</td>
              </tr>
            ) : (
              links.map(link => (
                <tr key={link.id} className="group">
                  {editingId === link.id ? (
                    <td colSpan={6} className="py-4">
                      <form onSubmit={(e) => handleEditSubmit(e, link.id)} className="bg-slate-50 p-4 rounded-lg flex flex-wrap gap-4 items-end">
                        <div className="w-full sm:w-auto flex-1 min-w-[150px]">
                          <label className="block text-xs font-medium text-slate-600 mb-1">پلتفرم</label>
                          <input name="platform" defaultValue={link.platform} required className="w-full text-sm border-slate-300 rounded-md" />
                        </div>
                        <div className="w-full sm:w-auto flex-1 min-w-[200px]">
                          <label className="block text-xs font-medium text-slate-600 mb-1">URL</label>
                          <input name="url" type="url" defaultValue={link.url} required className="w-full text-sm border-slate-300 rounded-md" dir="ltr" />
                        </div>
                        <div className="w-full sm:w-auto min-w-[120px]">
                          <label className="block text-xs font-medium text-slate-600 mb-1">آیکون</label>
                          <select name="icon_name" defaultValue={link.icon_name || ""} className="w-full text-sm border-slate-300 rounded-md">
                            {ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-slate-600 mb-1">ترتیب</label>
                          <input name="sort_order" type="number" defaultValue={link.sort_order} className="w-full text-sm border-slate-300 rounded-md" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <input type="checkbox" name="is_active" value="true" defaultChecked={link.is_active} id={`edit_is_active_${link.id}`} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <label htmlFor={`edit_is_active_${link.id}`} className="text-sm text-slate-700">فعال</label>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <button type="submit" disabled={loading} className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 disabled:opacity-50"><Check className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setEditingId(null)} disabled={loading} className="bg-slate-200 text-slate-700 p-2 rounded-md hover:bg-slate-300"><X className="w-4 h-4" /></button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="py-4 align-middle">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <IconPreview name={link.icon_name || "Globe"} />
                        </div>
                      </td>
                      <td className="py-4 align-middle font-medium text-slate-800">{link.platform}</td>
                      <td className="py-4 align-middle text-slate-500 text-sm max-w-[200px] truncate" dir="ltr">
                        <a href={link.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          {link.url}
                        </a>
                      </td>
                      <td className="py-4 align-middle text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          link.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
                        }`}>
                          {link.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="py-4 align-middle text-center text-slate-600 text-sm">
                        {link.sort_order}
                      </td>
                      <td className="py-4 align-middle text-left">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingId(link.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="ویرایش"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(link.id)}
                            disabled={loading}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}