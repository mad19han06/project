import { FormEvent, useEffect, useState } from 'react';
import { FolderKanban, Plus, Pencil, Trash2, Search, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Label, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, difficultyTone, uploadFile, validateImageFile } from '../../lib/helpers';
import { PROJECT_CATEGORIES, type Project, type Difficulty } from '../../types';

const emptyForm = {
  title: '',
  description: '',
  technology: '',
  category: '',
  duration_weeks: 4,
  price: 0,
  difficulty: 'Beginner' as Difficulty,
  image_url: '',
  is_active: true,
};

export function AdminProjects() {
  const { push } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects((data as Project[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setEditOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description,
      technology: p.technology,
      category: p.category,
      duration_weeks: p.duration_weeks,
      price: p.price,
      difficulty: p.difficulty,
      image_url: p.image_url,
      is_active: p.is_active,
    });
    setImageFile(null);
    setEditOpen(true);
  };

  const handleImageSelect = (file: File | null) => {
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      push(err, 'error');
      return;
    }
    setImageFile(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.image_url;
    setUploading(true);
    const uploaded = await uploadFile('project-images', imageFile, 'catalog');
    setUploading(false);
    if (!uploaded) {
      push('Failed to upload image', 'error');
      return null;
    }
    return uploaded.url;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category) {
      push('Title and category are required', 'error');
      return;
    }
    setSaving(true);
    let imageUrl = form.image_url;
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (!uploadedUrl && imageFile) {
        setSaving(false);
        return;
      }
      imageUrl = uploadedUrl ?? form.image_url;
    }
    const payload = { ...form, image_url: imageUrl };
    if (editing) {
      const { error } = await supabase.from('projects').update(payload).eq('id', editing.id);
      if (error) {
        setSaving(false);
        push(error.message, 'error');
        return;
      }
      push('Project updated', 'success');
    } else {
      const { error } = await supabase.from('projects').insert(payload);
      if (error) {
        setSaving(false);
        push(error.message, 'error');
        return;
      }
      push('Project created', 'success');
    }
    setSaving(false);
    setEditOpen(false);
    load();
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('projects').delete().eq('id', confirmDelete.id);
    if (error) push(error.message, 'error');
    else push('Project deleted', 'success');
    setConfirmDelete(null);
    load();
  };

  const filtered = projects.filter(
    (p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the project catalog available to students.</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Add Project
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Projects ({filtered.length})</CardTitle>
          <div className="relative sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search projects…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects" message="Add your first project to the catalog." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Project</TH>
                  <TH>Category</TH>
                  <TH>Price</TH>
                  <TH>Duration</TH>
                  <TH>Difficulty</TH>
                  <TH>Status</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
                          {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <p className="font-medium text-slate-700">{p.title}</p>
                      </div>
                    </TD>
                    <TD><Badge tone="blue">{p.category}</Badge></TD>
                    <TD className="font-semibold text-slate-700">{formatCurrency(p.price)}</TD>
                    <TD>{p.duration_weeks} weeks</TD>
                    <TD><Badge tone={difficultyTone(p.difficulty)}>{p.difficulty}</Badge></TD>
                    <TD>
                      <Badge tone={p.is_active ? 'green' : 'slate'}>{p.is_active ? 'Active' : 'Hidden'}</Badge>
                    </TD>
                    <TD>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setConfirmDelete(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Edit/Create modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editing ? 'Edit Project' : 'Add Project'} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">Select category</option>
                {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select id="difficulty" value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="technology">Technology</Label>
            <Input id="technology" placeholder="React, Python, MongoDB…" value={form.technology} onChange={(e) => setForm((f) => ({ ...f, technology: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Price (INR)</Label>
              <Input id="price" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
            </div>
            <div>
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input id="duration" type="number" min={1} value={form.duration_weeks} onChange={(e) => setForm((f) => ({ ...f, duration_weeks: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <Label>Project Image</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-full w-full object-cover" />
                  ) : form.image_url ? (
                    <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <ImageIcon size={32} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50">
                  <Upload size={20} className="text-slate-400" />
                  <span className="mt-1.5 text-sm text-slate-600">
                    {imageFile ? imageFile.name : 'Click to upload image'}
                  </span>
                  <span className="mt-0.5 text-xs text-slate-400">PNG, JPEG, WebP — max 10 MB</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
                  />
                </label>
                {imageFile && (
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600"
                  >
                    <X size={12} /> Remove uploaded file
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-400">or paste URL</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <Input
                  placeholder="https://images.pexels.com/…"
                  value={imageFile ? '' : form.image_url}
                  disabled={!!imageFile}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Active (visible to students)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving || uploading}>{editing ? 'Save changes' : 'Create project'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete project?" size="sm">
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <strong>{confirmDelete?.title}</strong>? This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={remove}><Trash2 size={14} /> Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
