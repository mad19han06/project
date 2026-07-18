import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Clock, IndianRupee, Layers, ArrowRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select, Label, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../lib/authContext';
import { PROJECT_CATEGORIES, type Project, type Difficulty } from '../../types';
import { formatCurrency, difficultyTone, uploadFile, logActivity, validateDocFile } from '../../lib/helpers';

const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

export function Catalog() {
  const { profile } = useAuth();
  const { push } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState<Project | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reqForm, setReqForm] = useState({ requirements: '', deadline: '' });
  const [reqFile, setReqFile] = useState<File | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setProjects((data as Project[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.technology.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !category || p.category === category;
      const matchesDiff = !difficulty || p.difficulty === difficulty;
      return matchesSearch && matchesCat && matchesDiff;
    });
    if (sort === 'price-low') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'duration') list = [...list].sort((a, b) => a.duration_weeks - b.duration_weeks);
    return list;
  }, [projects, search, category, difficulty, sort]);

  const openRequest = (project: Project) => {
    setSelected(project);
    setReqForm({ requirements: '', deadline: '' });
    setReqFile(null);
    setRequestOpen(true);
  };

  const submitRequest = async () => {
    if (!profile) {
      push('Please sign in to request a project', 'error');
      return;
    }
    if (!selected) return;
    if (!reqForm.requirements.trim()) {
      push('Please describe your requirements', 'error');
      return;
    }
    setSubmitting(true);
    let docUrl = '';
    if (reqFile) {
      const docError = validateDocFile(reqFile);
      if (docError) {
        push(docError, 'error');
        setSubmitting(false);
        return;
      }
      const uploaded = await uploadFile('requirements', reqFile, `requirements/${profile.id}`);
      docUrl = uploaded?.url || '';
    }
    const { data, error } = await supabase
      .from('orders')
      .insert({
        student_id: profile.id,
        project_id: selected.id,
        requirements: reqForm.requirements,
        deadline: reqForm.deadline || null,
        amount: selected.price,
        status: 'Request Submitted',
      })
      .select('id')
      .single();
    if (error) {
      setSubmitting(false);
      push(error.message, 'error');
      return;
    }
    await supabase.from('notifications').insert({
      user_id: profile.id,
      message: `Your request for "${selected.title}" has been submitted.`,
      type: 'order',
    });
    await logActivity('place_order', 'order', data.id, `Project: ${selected.title}, Amount: ${formatCurrency(selected.price)}`);
    if (docUrl) {
      push('Document uploaded with your request', 'success');
    }
    setSubmitting(false);
    setRequestOpen(false);
    push('Project request submitted successfully!', 'success');
    void data;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Project Catalog</h1>
        <p className="mt-1 text-sm text-slate-500">Browse and request academic projects across {PROJECT_CATEGORIES.length} categories.</p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="search"
                placeholder="Search by title, technology, keyword…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-auto">
            <div>
              <Label htmlFor="cat">Category</Label>
              <Select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className="lg:w-44">
                <option value="">All categories</option>
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="diff">Difficulty</Label>
              <Select id="diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="lg:w-36">
                <option value="">All levels</option>
                {difficulties.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="sort">Sort by</Label>
            <Select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="lg:w-40">
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="duration">Shortest duration</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Filter size={14} />
        <span>{filtered.length} project{filtered.length !== 1 ? 's' : ''} found</span>
        {(search || category || difficulty) && (
          <button
            onClick={() => { setSearch(''); setCategory(''); setDifficulty(''); }}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
          >
            Clear filters <X size={12} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <p className="text-slate-500">No projects match your filters. Try adjusting your search.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card key={project.id} className="group flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="relative h-44 overflow-hidden bg-slate-100">
                {project.image_url ? (
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Layers size={48} />
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <Badge tone="blue" className="bg-white/90 backdrop-blur">{project.category}</Badge>
                </div>
              </div>
              <CardBody className="flex flex-1 flex-col">
                <h3 className="line-clamp-2 text-base font-semibold text-slate-800">{project.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{project.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={difficultyTone(project.difficulty)}>{project.difficulty}</Badge>
                  <Badge tone="slate">
                    <Clock size={11} /> {project.duration_weeks} weeks
                  </Badge>
                </div>
                <p className="mt-3 line-clamp-1 text-xs text-slate-400">
                  <span className="font-medium text-slate-500">Tech:</span> {project.technology}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <p className="flex items-center text-lg font-bold text-slate-800">
                    <IndianRupee size={16} className="text-slate-400" />
                    {formatCurrency(project.price).replace('₹', '')}
                  </p>
                  <Button size="sm" onClick={() => openRequest(project)}>
                    Buy Now <ArrowRight size={14} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title={selected ? `Request: ${selected.title}` : ''} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Project</span>
                <span className="font-semibold text-slate-700">{selected.title}</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-semibold text-slate-700">{formatCurrency(selected.price)}</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-700">{selected.duration_weeks} weeks</span>
              </div>
            </div>
            <div>
              <Label htmlFor="requirements">Custom requirements</Label>
              <Textarea
                id="requirements"
                rows={4}
                placeholder="Describe any customizations, scope, or specific features you need…"
                value={reqForm.requirements}
                onChange={(e) => setReqForm((f) => ({ ...f, requirements: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="deadline">Preferred deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={reqForm.deadline}
                  onChange={(e) => setReqForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="doc">Supporting document (optional)</Label>
                <input
                  id="doc"
                  type="file"
                  onChange={(e) => setReqFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
              <Button onClick={submitRequest} loading={submitting}>Submit Request</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
