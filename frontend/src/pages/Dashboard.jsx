import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardCard from '../components/DashboardCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { 
  Users, 
  CheckCircle2, 
  Vote, 
  UserCheck, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  ExternalLink,
  Flame,
  Rocket,
  Trees,
  Ban,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const symbolIcons = {
  Torch: Flame,
  Rocket: Rocket,
  Tree: Trees,
  Prohibition: Ban,
  default: Award
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000); // 6s poll
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingState message="Loading election analytics..." />;
  if (error) return <ErrorState title="Dashboard Error" message={error} onRetry={fetchStats} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Election Command Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {stats.active_election ? stats.active_election.name : "Active Election Monitor"}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/voters/create" className="btn btn-primary">
            <Users size={18} /> Register New Voter
          </Link>
          <a href="/vote" target="_blank" rel="noopener noreferrer" className="btn btn-success">
            <Vote size={18} /> VOTING BALLOT <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        <DashboardCard
          title="Total Registered"
          value={stats.total_voters}
          subtitle="Voters in database"
          icon={Users}
          color="cyan"
        />
        <DashboardCard
          title="Biometrics Enrolled"
          value={stats.verified_voters}
          subtitle="Face + Iris enrolled"
          icon={UserCheck}
          color="indigo"
        />
        <DashboardCard
          title="Ballots Cast"
          value={stats.votes_cast}
          subtitle={`${stats.remaining_voters} remaining`}
          icon={Vote}
          color="emerald"
        />
        <DashboardCard
          title="Voter Turnout"
          value={`${stats.turnout_percentage}%`}
          subtitle="Of eligible voters"
          icon={TrendingUp}
          color="cyan"
        />
        <DashboardCard
          title="Duplicate Attempts"
          value={stats.duplicate_attempts}
          subtitle="Blocked server-side"
          icon={ShieldAlert}
          color="rose"
        />
      </div>

      {/* Aggregate Candidate Results & Turnout Progress */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Turnout Progress Bar Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Voter Participation</h3>
            <span className="badge badge-cyan">{stats.turnout_percentage}% Turnout</span>
          </div>

          <div style={{
            width: '100%',
            height: '14px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: `${Math.min(100, stats.turnout_percentage)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #06b6d4, #10b981)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Votes Cast: <strong>{stats.votes_cast}</strong></span>
            <span>Eligible Voters: <strong>{stats.eligible_voters}</strong></span>
          </div>

          <div style={{ marginTop: '1.75rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
              Academic Vote Secrecy Guarantee
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              The system cryptographically unlinks voter identity from the cast ballot. Individual candidate choices cannot be traced back to voter profiles.
            </p>
          </div>
        </div>

        {/* Candidate Vote Share Distribution */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Candidate Vote Tally</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aggregate Anonymous Tally</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {stats.candidate_results && stats.candidate_results.length > 0 ? (
              stats.candidate_results.map((c) => {
                const IconComponent = symbolIcons[c.symbol] || symbolIcons.default;
                return (
                  <div key={c.candidate_id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          padding: '0.35rem',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--accent-cyan)'
                        }}>
                          <IconComponent size={14} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            ({c.party})
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{c.votes}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({c.percentage}%)</span>
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${c.percentage}%`,
                        height: '100%',
                        background: c.candidate_id === 'CAND-NOTA' ? 'var(--accent-rose)' : 'var(--accent-cyan)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No candidate data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
