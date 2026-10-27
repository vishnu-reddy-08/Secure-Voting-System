import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import ConfirmationModal from '../components/ConfirmationModal';
import { useNotification } from '../context/NotificationContext';
import {
  UserPlus, Search, CheckCircle2, XCircle,
  RotateCcw, Trash2, Fingerprint, ShieldCheck
} from 'lucide-react';

const VotersList = () => {
  const notify = useNotification();
  const [voters,       setVoters]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [deleteModal,  setDeleteModal]  = useState({ open: false, voter: null });
  const [deleting,     setDeleting]     = useState(false);

  const fetchVoters = async () => {
    try {
      const res = await api.get('/admin/voters');
      setVoters(res.data);
    } catch (err) {
      notify.error(err.message || 'Failed to load voters list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVoters(); }, []);

  const handleResetVote = async (voter) => {
    try {
      await api.post(`/admin/voters/${voter.voter_id}/reset-vote`);
      notify.success(`Vote status reset for ${voter.name}`);
      fetchVoters();
    } catch (err) {
      notify.error(err.message || 'Failed to reset vote status');
    }
  };

  const handleToggleStatus = async (voter) => {
    try {
      if (voter.status === 'active') {
        await api.post(`/admin/voters/${voter.voter_id}/deactivate`);
        notify.warning(`Voter ${voter.name} deactivated`);
      } else {
        await api.post(`/admin/voters/${voter.voter_id}/activate`);
        notify.success(`Voter ${voter.name} activated`);
      }
      fetchVoters();
    } catch (err) {
      notify.error(err.message || 'Failed to update voter status');
    }
  };

  const confirmDelete = (voter) => {
    setDeleteModal({ open: true, voter });
  };

  const handleDelete = async () => {
    const voter = deleteModal.voter;
    setDeleting(true);
    try {
      await api.delete(`/admin/voters/${voter.voter_id}`);
      notify.success(`Voter ${voter.name} deleted successfully`);
      fetchVoters();
    } catch (err) {
      notify.error(err.message || 'Failed to delete voter');
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, voter: null });
    }
  };

  const filteredVoters = voters.filter(v => {
    const q = search.toLowerCase();
    return (
      v.name?.toLowerCase().includes(q) ||
      v.voter_id?.toLowerCase().includes(q) ||
      v.mobile?.includes(q)
    );
  });

  const columns = [
    {
      header: 'Voter ID',
      cell: (row) => (
        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
          {row.voter_id}
        </strong>
      ),
    },
    {
      header: 'Full Name',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {row.registered_face_image ? (
            <img
              src={row.registered_face_image.startsWith('data:') ? row.registered_face_image : `data:image/jpeg;base64,${row.registered_face_image}`}
              alt={row.name}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--accent-cyan)' }}
            />
          ) : (
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
              {row.name ? row.name[0].toUpperCase() : 'V'}
            </div>
          )}
          <div>
            <p style={{ fontWeight: 600 }}>{row.name}</p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Age: {row.age}</span>
          </div>
        </div>
      ),
    },
    { header: 'Mobile', accessor: 'mobile' },
    {
      header: 'Aadhaar (Masked)',
      cell: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          XXXX-XXXX-{row.aadhaar_last4}
        </span>
      ),
    },
    {
      header: 'Biometrics',
      cell: (row) =>
        row.biometric_enrolled ? (
          <span className="badge badge-success"><Fingerprint size={12} /> Enrolled</span>
        ) : (
          <span className="badge badge-warning">Pending</span>
        ),
    },
    {
      header: 'Voted',
      cell: (row) =>
        row.voted ? (
          <span className="badge badge-cyan"><CheckCircle2 size={12} /> Voted</span>
        ) : (
          <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
            Not Voted
          </span>
        ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {row.voted && (
            <button
              onClick={() => handleResetVote(row)}
              title="Reset vote for repeat testing"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
          <button
            onClick={() => handleToggleStatus(row)}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => confirmDelete(row)}
            className="btn btn-danger"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            title="Delete Voter"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingState message="Loading voter rolls..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Registered Voters Roll
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage voter records, masked Aadhaar compliance, and biometric enrollment status.
          </p>
        </div>
        <Link to="/admin/voters/create" className="btn btn-primary">
          <UserPlus size={18} /> Register New Voter
        </Link>
      </div>

      {/* Search */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search by voter name, voter ID, or mobile number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.95rem', width: '100%', outline: 'none' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredVoters} emptyMessage="No matching voters found." />

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={deleteModal.open}
        title="Delete Voter"
        message={`Are you sure you want to permanently delete voter "${deleteModal.voter?.name}" (${deleteModal.voter?.voter_id})? This will also remove their enrolled biometrics. This action cannot be undone.`}
        confirmText="Delete Voter"
        isSubmitting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, voter: null })}
      />
    </div>
  );
};

export default VotersList;
