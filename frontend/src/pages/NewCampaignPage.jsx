import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';
import CampaignWizard from '../components/campaigns/CampaignWizard';
import Spinner from '../components/ui/Spinner';
import { toast } from '../utils/toastEmitter';

export default function NewCampaignPage() {
  const [searchParams] = useSearchParams();
  const preTemplate = searchParams.get('template');
  const [gmailAccounts, setGmailAccounts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/api/gmail-accounts'),
      client.get('/api/templates'),
    ])
      .then(([g, t]) => {
        setGmailAccounts(g.data.data);
        setTemplates(t.data.data);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">New Campaign</div>
          <div className="page-subtitle">Send emails to a list of recipients</div>
        </div>
      </div>
      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spinner size="lg" /></div>
        ) : (
          <CampaignWizard
            gmailAccounts={gmailAccounts}
            templates={templates}
            preSelectedTemplateId={preTemplate}
          />
        )}
      </div>
    </div>
  );
}
