import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import TemplateCard from '../components/templates/TemplateCard';
import TemplateFormModal from '../components/templates/TemplateFormModal';
import TemplatePreviewModal from '../components/templates/TemplatePreviewModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import { toast } from '../utils/toastEmitter';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await client.get('/api/templates');
      setTemplates(r.data.data);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = t => { setEditing(t); setFormOpen(true); };

  const openPreview = async t => {
    try {
      const r = await client.get(`/api/templates/${t.id}`);
      setPreviewData(r.data.data);
      setPreviewing(t);
    } catch {
      toast.error('Failed to load template');
    }
  };

  const handleDelete = async () => {
    try {
      await client.delete(`/api/templates/${deleteTarget.id}`);
      toast.success('Template deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleDuplicate = async t => {
    try {
      await client.post(`/api/templates/${t.id}/duplicate`);
      toast.success(`Duplicated "${t.name}"`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Duplicate failed');
    }
  };

  const handleSetDefault = async t => {
    try {
      await client.put(`/api/templates/${t.id}/set-default`);
      toast.success(`"${t.name}" set as default`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to set default');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Email Templates</div>
          <div className="page-subtitle">Create and manage your email templates</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreate}>+ Create Template</button>
        </div>
      </div>
      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spinner size="lg" /></div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-text">No templates yet</div>
            <div className="empty-state-sub">Create your first email template to start sending campaigns.</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>Create Template</button>
          </div>
        ) : (
          <div className="templates-grid">
            {templates.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onPreview={openPreview}
                onDuplicate={handleDuplicate}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </div>

      <TemplateFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        template={editing}
      />
      <TemplatePreviewModal
        isOpen={!!previewing}
        onClose={() => { setPreviewing(null); setPreviewData(null); }}
        template={previewData}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        message={`Delete "${deleteTarget?.name}"? Campaigns using this template may be affected.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
