import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';

function fmt(dt) {
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TemplateCard({
  template, onEdit, onDelete, onPreview, onDuplicate, onSetDefault,
}) {
  const navigate = useNavigate();
  return (
    <div className="template-card">
      <div className="template-card-name">
        {template.name}
        {template.is_default && <Badge variant="success">Default</Badge>}
        {template.pdf_filename && <Badge variant="info">PDF</Badge>}
      </div>
      <div className="template-card-subject" title={template.subject}>{template.subject}</div>
      <div className="template-card-meta">
        <span>Updated {fmt(template.updated_at)}</span>
      </div>
      <div className="template-card-actions">
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onPreview(template)}>Preview</button>
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onEdit(template)}>Edit</button>
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onDuplicate(template)}>Duplicate</button>
        {!template.is_default && (
          <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onSetDefault(template)}>Set Default</button>
        )}
        <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => navigate(`/campaigns/new?template=${template.id}`)}>Use</button>
        <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => onDelete(template)}>Delete</button>
      </div>
    </div>
  );
}
