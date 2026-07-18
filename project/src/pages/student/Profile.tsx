import { FormEvent, useEffect, useState } from 'react';
import { User, Mail, Phone, Building2, GraduationCap, Upload, FileText, Camera, Save } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input, Label, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { uploadFile } from '../../lib/helpers';

export function StudentProfile() {
  const { profile, user, refreshProfile } = useAuth();
  const { push } = useToast();
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    department: '',
    college: '',
    year: '',
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        department: profile.department || '',
        college: profile.college || '',
        year: profile.year || '',
      });
      setAvatar(profile.avatar_url || null);
      setResumeUrl(profile.resume_url || null);
    }
  }, [profile]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone,
      department: form.department,
      college: form.college,
      year: form.year,
    }).eq('id', profile.id);
    setSaving(false);
    if (error) {
      push(error.message, 'error');
      return;
    }
    await refreshProfile();
    push('Profile updated successfully', 'success');
  };

  const onAvatar = async (file: File) => {
    if (!profile) return;
    setUploadingAvatar(true);
    const uploaded = await uploadFile('avatars', file, profile.id);
    setUploadingAvatar(false);
    if (!uploaded) {
      push('Failed to upload avatar', 'error');
      return;
    }
    await supabase.from('profiles').update({ avatar_url: uploaded.url }).eq('id', profile.id);
    setAvatar(uploaded.url);
    await refreshProfile();
    push('Profile picture updated', 'success');
  };

  const onResume = async (file: File) => {
    if (!profile) return;
    setUploadingResume(true);
    const uploaded = await uploadFile('resumes', file, profile.id);
    setUploadingResume(false);
    if (!uploaded) {
      push('Failed to upload resume', 'error');
      return;
    }
    await supabase.from('profiles').update({ resume_url: uploaded.url }).eq('id', profile.id);
    setResumeUrl(uploaded.url);
    await refreshProfile();
    push('Resume uploaded', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your personal information and documents.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
                {avatar ? (
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  form.full_name?.charAt(0).toUpperCase() || 'S'
                )}
              </div>
              <label className="absolute bottom-1 right-1 cursor-pointer rounded-full bg-blue-600 p-2 text-white shadow-md transition-transform hover:scale-110">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])}
                />
              </label>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-800">{form.full_name || 'Student'}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="mt-1 text-xs text-slate-400">{form.department} • {form.college}</p>
            {uploadingAvatar && <p className="mt-2 text-xs text-blue-600">Uploading…</p>}
          </CardBody>
        </Card>

        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="full_name">Full name</Label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input id="full_name" className="pl-9" value={form.full_name} onChange={set('full_name')} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input id="phone" className="pl-9" value={form.phone} onChange={set('phone')} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input id="department" className="pl-9" value={form.department} onChange={set('department')} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="college">College</Label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input id="college" className="pl-9" value={form.college} onChange={set('college')} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Select id="year" value={form.year} onChange={set('year')}>
                    <option value="">Select year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email">Email (read-only)</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input id="email" className="pl-9 bg-slate-50" value={user?.email || ''} readOnly />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={saving}>
                  <Save size={14} /> Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      {/* Resume upload */}
      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
                <FileText size={20} />
              </div>
              <div>
                {resumeUrl ? (
                  <>
                    <p className="text-sm font-medium text-slate-700">Resume uploaded</p>
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                      View / download resume
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-700">No resume uploaded</p>
                    <p className="text-xs text-slate-400">Upload your latest resume (PDF, DOC, DOCX)</p>
                  </>
                )}
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100">
              <Upload size={14} />
              {uploadingResume ? 'Uploading…' : resumeUrl ? 'Replace resume' : 'Upload resume'}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onResume(e.target.files[0])}
              />
            </label>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
