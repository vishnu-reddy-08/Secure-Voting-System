import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import { useNotification } from '../context/NotificationContext';
import { ShieldAlert, RefreshCw, Filter } from 'lucide-react';

const AuditLogs = () => {
  const notify = useNotification();
  const [logs,          setLogs]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filterResult,  setFilterResult]  = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = '/admin/audit-logs?limit=100';
      if (filterResult) url += `&result=${filterResult}`;
      const res = await api.get(url);
      setLogs(res.data);
    } catch (err) {
      notify.error(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterResult]);

  const columns = [
    {
      header: 'Timestamp',
      cell: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.created_at}</span>
    },
    {
      header: 'Security Action',
      cell: (row) => <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{row.action}</strong>
    },
    {
      header: 'Result',
      cell: (row) => {
        let badgeClass = 'badge-secondary';
        if (row.result === 'SUCCESS') badgeClass = 'badge-success';
        else if (row.result === 'REJECTED') badgeClass = 'badge-warning';
        else if (row.result === 'FAILURE') badgeClass = 'badge-danger';
        return <span className={`badge ${badgeClass}`}>{row.result}</span>;
      }
    },
    {
      header: 'Actor',
      cell: (row) => <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>{row.actor}</span>
    },
    {
      header: 'Details',
      cell: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {JSON.stringify(row.details || {})}
        </span>
      )
    },
    {
      header: 'Req ID',
      cell: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.request_id}</span>
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Tamper-Evident Audit Trail
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Structured compliance logging of all biometric verifications, voting authorizations, and security events.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="form-select"
            style={{ width: '160px', padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
          >
            <option value="" style={{ background: '#0f172a' }}>All Results</option>
            <option value="SUCCESS" style={{ background: '#0f172a' }}>SUCCESS</option>
            <option value="REJECTED" style={{ background: '#0f172a' }}>REJECTED</option>
            <option value="FAILURE" style={{ background: '#0f172a' }}>FAILURE</option>
          </select>

          <button onClick={fetchLogs} className="btn btn-secondary" style={{ padding: '0.5rem 0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Querying audit records..." />
      ) : (
        <DataTable columns={columns} data={logs} emptyMessage="No audit records match the current criteria." />
      )}
    </div>
  );
};

export default AuditLogs;
