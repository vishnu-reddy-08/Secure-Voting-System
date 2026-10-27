import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import { useNotification } from '../context/NotificationContext';
import { Award, Plus, Trash2, Flame, Rocket, Trees, Ban } from 'lucide-react';

const symbolIcons = {
  Torch: Flame,
  Rocket: Rocket,
  Tree: Trees,
  Prohibition: Ban,
  default: Award
};

const CandidatesList = () => {
  const notify = useNotification();
  const [candidates, setCandidates] = useState([]);
  const [elections,  setElections]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [formData, setFormData] = useState({
    election_id: 'ELECTION-2026-DEMO',
    name: '',
    party: '',
    symbol: 'Torch',
    ballot_order: 1
  });

  const fetchData = async () => {
    try {
      const [candRes, elRes] = await Promise.all([
        api.get('/candidates'),
        api.get('/elections')
      ]);
      setCandidates(candRes.data);
      setElections(elRes.data);
      if (elRes.data.length > 0) {
        setFormData(prev => ({ ...prev, election_id: elRes.data[0].election_id }));
      }
    } catch (err) {
      notify.error(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/candidates', formData);
      setShowModal(false);
      setFormData({
        election_id: elections[0]?.election_id || 'ELECTION-2026-DEMO',
        name: '',
        party: '',
        symbol: 'Torch',
        ballot_order: candidates.length + 1
      });
      fetchData();
      notify.success('Candidate added successfully!');
    } catch (err) {
      notify.error(err.message || 'Failed to create candidate');
    }
  };

  const handleDelete = async (candidateId) => {
    try {
      await api.delete(`/candidates/${candidateId}`);
      fetchData();
      notify.success(`Candidate ${candidateId} deleted`);
    } catch (err) {
      notify.error(err.message || 'Failed to delete candidate');
    }
  };

  const columns = [
    {
      header: 'Order',
      cell: (row) => <strong style={{ color: 'var(--accent-cyan)' }}>#{row.ballot_order}</strong>
    },
    {
      header: 'Symbol',
      cell: (row) => {
        const Icon = symbolIcons[row.symbol] || symbolIcons.default;
        return (
          <div style={{
            display: 'inline-flex',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--accent-cyan)'
          }}>
            <Icon size={20} />
          </div>
        );
      }
    },
    {
      header: 'Candidate Name',
      accessor: 'name'
    },
    {
      header: 'Political Party',
      accessor: 'party'
    },
    {
      header: 'Election',
      accessor: 'election_id'
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => handleDelete(row.candidate_id)}
          className="btn btn-danger"
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
          disabled={row.candidate_id === 'CAND-NOTA'}
        >
          <Trash2 size={12} /> Delete
        </button>
      )
    }
  ];

  if (loading) return <LoadingState message="Loading candidates..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Candidate Roster
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage nominees, political affiliations, and ballot appearance symbols.
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Add Candidate
        </button>
      </div>

      <DataTable columns={columns} data={candidates} emptyMessage="No candidates found." />

      {/* Add Candidate Modal */}
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
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem' }}>Add New Candidate</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Election *</label>
                <select
                  value={formData.election_id}
                  onChange={(e) => setFormData({ ...formData, election_id: e.target.value })}
                  className="form-select"
                >
                  {elections.map(el => (
                    <option key={el.election_id} value={el.election_id} style={{ background: '#0f172a' }}>
                      {el.name} ({el.election_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Candidate Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Meera Nair"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Party Affiliation *</label>
                <input
                  type="text"
                  required
                  value={formData.party}
                  onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Democratic Alliance"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Ballot Symbol</label>
                  <select
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="form-select"
                  >
                    <option value="Torch" style={{ background: '#0f172a' }}>Torch (Flame)</option>
                    <option value="Rocket" style={{ background: '#0f172a' }}>Rocket (Space)</option>
                    <option value="Tree" style={{ background: '#0f172a' }}>Tree (Ecology)</option>
                    <option value="Prohibition" style={{ background: '#0f172a' }}>Prohibition Circle</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Ballot Order #</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.ballot_order}
                    onChange={(e) => setFormData({ ...formData, ballot_order: parseInt(e.target.value, 10) || 1 })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatesList;
