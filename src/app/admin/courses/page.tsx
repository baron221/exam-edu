'use client';

import React, { useEffect, useState } from 'react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newCategory, setNewCategory] = useState('Computer Science');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/admin/courses').then(r => r.json()).then(data => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify({ title: newTitle, slug: newSlug, category: newCategory }),
    });
    if (res.ok) {
      const data = await res.json();
      setCourses([data, ...courses]);
      setNewTitle('');
      setNewSlug('');
    } else {
      alert('Failed to create course');
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Warning: Deleting a course will delete all its exams and results! Carbon date this?')) return;
    const res = await fetch('/api/admin/courses', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  if (loading) return <div style={{ color: '#6366f1', fontWeight: 700 }}>Loading curriculum…</div>;

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0 }}>Courses</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Manage departments and course categories.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 40 }}>
        
        {/* Course List */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {courses.length === 0 ? (
              <div style={{ padding: 40, border: '2px dashed #e2e8f0', borderRadius: 20, textAlign: 'center', color: '#94a3b8' }}>No courses yet.</div>
            ) : (
              courses.map(course => (
                <div key={course.id} style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{course.category}</div>
                    <button onClick={() => handleDelete(course.id)} style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444' }}>🗑️</button>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>{course.title}</h3>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>/{course.slug}</div>
                  <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                    {course._count?.exams || 0} active exams
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Sidebar */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #e2e8f0', padding: 28, position: 'sticky', top: 100 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 20px 0' }}>Add Department</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Portal Name</label>
              <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Computer Science" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Web Slug</label>
              <input required value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="cs-department" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff' }}>
                <option value="Computer Science">Computer Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="General">General</option>
              </select>
            </div>
            <button type="submit" disabled={creating} style={{ padding: '12px', borderRadius: 12, background: '#6366f1', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: 10 }}>
              {creating ? 'Creating…' : 'Add Course'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
