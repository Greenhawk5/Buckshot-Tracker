import React, { useEffect, useState } from 'react';
import {
  fetchOwnerUsers,
  fetchOwnerUserDetails,
  updateOwnerUserMetadata,
  restrictOwnerUser,
  unrestrictOwnerUser,
  OwnerUserRecord,
} from '../../../services/owner.api';
import { TacticalSwitch } from '../components/TacticalSwitch';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<OwnerUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected user for details modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Edit fields
  const [editAlias, setEditAlias] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editVip, setEditVip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOwnerUsers({ search, filter, page, limit: 15 });
      setUsers(res.users);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load user registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, filter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    // Reload immediately
    setTimeout(() => {
      fetchOwnerUsers({ search: '', filter, page: 1, limit: 15 })
        .then((res) => {
          setUsers(res.users);
          setTotal(res.total);
          setTotalPages(res.totalPages);
        })
        .catch(() => {});
    }, 10);
  };

  const handleOpenUser = async (user: OwnerUserRecord) => {
    setSelectedUser(null);
    setSaveSuccess(null);
    try {
      const details = await fetchOwnerUserDetails(user.telegramId);
      setSelectedUser(details);
      setEditAlias(details.user.displayAlias || '');
      setEditNotes(details.user.ownerNotes || '');
      setEditVip(Boolean(details.user.isVip));
    } catch (err: any) {
      alert(err?.message || 'Failed to load user details');
    }
  };

  const handleSaveMetadata = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setSaveSuccess(null);
    try {
      await updateOwnerUserMetadata({
        telegramUserId: selectedUser.user.telegramId,
        displayAlias: editAlias,
        ownerNotes: editNotes,
        isVip: editVip,
      });
      // Refresh current details
      const refreshed = await fetchOwnerUserDetails(selectedUser.user.telegramId);
      setSelectedUser(refreshed);
      loadUsers();
      setSaveSuccess('User metadata saved successfully.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedUser) return;
    const isCurrentlyBlocked = selectedUser.user.isBlocked;
    const confirmMsg = isCurrentlyBlocked
      ? 'Unrestrict application access for this user?'
      : 'Restrict this user from creating sessions and recording actions?';
    if (!window.confirm(confirmMsg)) return;

    try {
      if (isCurrentlyBlocked) {
        await unrestrictOwnerUser(selectedUser.user.telegramId);
      } else {
        await restrictOwnerUser(selectedUser.user.telegramId, 'Restricted via Owner Command Center');
      }
      const refreshed = await fetchOwnerUserDetails(selectedUser.user.telegramId);
      setSelectedUser(refreshed);
      loadUsers();
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle restriction');
    }
  };

  return (
    <div className="owner-view users-view">
      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="user-search-bar">
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by ID, name, username, alias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="btn-secondary search-btn">
          Search
        </button>
      </form>

      <div className="view-toolbar">
        <div className="period-chips" role="radiogroup" aria-label="User registry filter">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'vip', label: '⭐ VIPs' },
            { id: 'blocked', label: '⛔ Restricted' },
            { id: 'recent', label: 'Active (7d)' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`period-chip ${filter === f.id ? 'active' : ''}`}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="total-badge font-mono">{total} users</span>
      </div>

      {loading && (
        <div className="owner-loading" role="status">
          <span className="loading-pulse-dot" /> Loading users...
        </div>
      )}
      {error && <div className="owner-error" role="alert">{error}</div>}

      {/* Users List */}
      {!loading && (
        <div className="users-list">
          {users.length === 0 && <div className="empty-sub">No matching users found.</div>}
          {users.map((u) => {
            const displayName = u.displayAlias || u.firstName || u.username || `User ${u.telegramId}`;
            const initials = (u.firstName ? u.firstName.slice(0, 2) : u.telegramId.slice(-2)).toUpperCase();

            return (
              <div key={u.telegramId} className="user-row-card" onClick={() => handleOpenUser(u)}>
                <div className="user-avatar-initials font-mono">{initials}</div>
                <div className="user-card-info">
                  <div className="user-card-name-row">
                    <span className="user-card-name" dir="auto">
                      {displayName}
                    </span>
                    {u.isVip && <span className="badge-vip">VIP</span>}
                    {u.isBlocked && <span className="badge-blocked">RESTRICTED</span>}
                  </div>
                  <div className="user-card-meta">
                    <span className="user-card-tgid font-mono">ID: {u.telegramId}</span>
                    {u.username && <span className="user-card-handle font-mono">@{u.username}</span>}
                    <span className="user-card-seen font-mono">
                      Seen: {new Date(u.lastSeenAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="user-card-arrow" aria-hidden="true">›</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            type="button"
            className="btn-secondary page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="page-indicator font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      {/* User Details Drawer Modal */}
      {selectedUser && (
        <div className="user-drawer-overlay" onClick={() => setSelectedUser(null)}>
          <div className="user-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-header-info">
                <h3 className="drawer-title" dir="auto">
                  {selectedUser.user.displayAlias || selectedUser.user.firstName || selectedUser.user.telegramId}
                </h3>
                <span className="drawer-subtitle font-mono">ID: {selectedUser.user.telegramId}</span>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user profile"
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              {saveSuccess && <div className="status-success-banner">{saveSuccess}</div>}

              {/* Profile summary */}
              <div className="drawer-section">
                <h4 className="drawer-section-heading">Identity Profile</h4>
                <div className="drawer-grid">
                  <div className="info-item">
                    <span className="item-label">Numeric ID</span>
                    <span className="item-val font-mono">{selectedUser.user.telegramId}</span>
                  </div>
                  <div className="info-item">
                    <span className="item-label">Username</span>
                    <span className="item-val font-mono">
                      {selectedUser.user.username ? `@${selectedUser.user.username}` : 'None'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="item-label">First Seen</span>
                    <span className="item-val font-mono">
                      {new Date(selectedUser.user.firstSeenAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="item-label">Last Seen</span>
                    <span className="item-val font-mono">
                      {new Date(selectedUser.user.lastSeenAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="drawer-section">
                <h4 className="drawer-section-heading">Activity Stats</h4>
                <div className="drawer-stats-row">
                  <div className="stat-box">
                    <span className="stat-box-num font-mono">{selectedUser.stats.totalSessions}</span>
                    <span className="stat-box-lbl">Sessions</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-num font-mono">{selectedUser.stats.completedSessions}</span>
                    <span className="stat-box-lbl">Completed</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-num font-mono">{selectedUser.stats.totalEvents}</span>
                    <span className="stat-box-lbl">Actions</span>
                  </div>
                </div>
              </div>

              {/* Owner Private Metadata & Notes */}
              <div className="drawer-section">
                <h4 className="drawer-section-heading">Private Owner Notes & Controls</h4>
                <div className="edit-form">
                  <div className="form-group">
                    <label className="form-label">Private Display Alias</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editAlias}
                      onChange={(e) => setEditAlias(e.target.value)}
                      placeholder="Custom name seen only by Owner"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Owner Private Notes</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Private notes about playstyle, feedback, etc."
                    />
                  </div>

                  <div className="vip-toggle-row">
                    <TacticalSwitch
                      checked={editVip}
                      onChange={setEditVip}
                      label="Mark as VIP Playtester"
                    />
                  </div>

                  <div className="drawer-action-row">
                    <button
                      type="button"
                      className="btn-primary btn-save-meta"
                      onClick={handleSaveMetadata}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Private Notes'}
                    </button>
                    <button
                      type="button"
                      className={selectedUser.user.isBlocked ? 'btn-unrestrict' : 'btn-restrict'}
                      onClick={handleToggleBlock}
                    >
                      {selectedUser.user.isBlocked ? 'Unrestrict User' : 'Restrict App Access'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="drawer-section">
                <h4 className="drawer-section-heading">Recent Activity Timeline</h4>
                <div className="timeline-list">
                  {selectedUser.recentEvents.length === 0 && (
                    <div className="empty-sub">No recent activity events.</div>
                  )}
                  {selectedUser.recentEvents.slice(0, 10).map((ev: any) => (
                    <div key={ev.eventId} className="timeline-item">
                      <span className="timeline-dot" />
                      <div className="timeline-info">
                        <span className="timeline-type font-mono">{ev.eventType}</span>
                        <span className="timeline-date font-mono">{new Date(ev.occurredAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
