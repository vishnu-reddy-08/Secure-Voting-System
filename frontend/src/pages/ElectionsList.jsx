import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import { useNotification } from '../context/NotificationContext';
import { Vote, Plus, CheckCircle2, Calendar, Award } from 'lucide-react';

const ElectionsList = () => {
  const notify = useNotification();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '2026-09-01T08:00',
    end_time: '2026-12-31T20:00',
    status: 'active'
  });

  const fetchElections = async () => {
    try {
      const res = await api.get('/elections');
      setElections(res.data);
    } catch (err) {
      notify.error(err.message || 'Failed to fetch elections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/elections', formData);
      setShowModal(false);
      fetchElections();
      notify.success('Election created successfully!');
    } catch (err) {
      notify.error(err.message || 'Failed to create election');
    }
  };

  const columns = [
    {
      header: 'Election ID',
      cell: (row) => <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{row.election_id}</strong>
    },
    {
      header: 'Election Title',
      cell: (row) => (
        <div>
          <p style={{ fontWeight: 600 }}>{row.name}</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.description}</span>
        </div>
      )
    },
    {
      header: 'Candidates',
      cell: (row) => <span>{row.candidate_count || 0} enrolled</span>
    },
    {
      header: 'Votes Cast',
      cell: (row) => <strong style={{ color: '#34d399' }}>{row.total_votes || 0}</strong>
    },
    {
      header: 'Status',
      cell: (row) => (
        <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
          {row.status}
        </span>
      )
    }
  ];

  if (loading) return <LoadingState message="Loading elections..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Elections Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Configure active and upcoming ballots, dates, and constituency parameters.
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Create New Election
        </button>
      </div>

      <DataTable columns={columns} data={elections} emptyMessage="No elections created yet." />

      {/* Create Election Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem' }}>Create New Election</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Election Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g. State Assembly Election 2026"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                  rows="3"
                  placeholder="Constituency details and instructions..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Election
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectionsList;
