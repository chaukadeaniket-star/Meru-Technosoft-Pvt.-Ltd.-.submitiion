import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  CheckCircle2,
  Clock3,
  Download,
  LayoutDashboard,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const sources = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'];
const statuses = ['New', 'Contacted', 'Qualified', 'Lost'];
const blank = { name: '', email: '', phone: '', company: '', source: 'Website', status: 'New' };
const statusIcons = {
  All: Users,
  New: Clock3,
  Contacted: UserCheck,
  Qualified: CheckCircle2,
  Lost: XCircle
};

export default function App() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [connection, setConnection] = useState('checking');
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastLoaded, setLastLoaded] = useState(null);

  const load = async () => {
    setLoading(true);
    setPageError('');
    setConnection('checking');
    try {
      const { data } = await axios.get(`${API}/leads`);
      setLeads(data);
      setConnection('connected');
      setLastLoaded(new Date());
    } catch {
      setConnection('disconnected');
      setPageError('Could not reach the API. Check the backend connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!modal) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape' && !saving) setModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal, saving]);

  const counts = useMemo(() => leads.reduce((result, lead) => {
    result.total += 1;
    if (result[lead.status] !== undefined) result[lead.status] += 1;
    return result;
  }, { total: 0, New: 0, Contacted: 0, Qualified: 0, Lost: 0 }), [leads]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads
      .filter(lead => (filter === 'All' || lead.status === filter) &&
        (!query || [lead.name, lead.company, lead.email]
          .some(value => (value || '').toLowerCase().includes(query))))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        const difference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return sort === 'oldest' ? -difference : difference;
      });
  }, [leads, search, filter, sort]);

  const clearFilters = () => {
    setSearch('');
    setFilter('All');
  };

  const openNew = () => {
    setEditing(null);
    setForm(blank);
    setFormError('');
    setModal(true);
  };

  const openEdit = lead => {
    setEditing(lead._id);
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      status: lead.status
    });
    setFormError('');
    setModal(true);
  };

  const update = event => {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  };

  const save = async event => {
    event.preventDefault();
    setFormError('');
    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim()
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.company) {
      setFormError('Please complete all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      if (editing) await axios.put(`${API}/leads/${editing}`, payload);
      else await axios.post(`${API}/leads`, payload);
      setModal(false);
      setNotice(editing ? 'Lead updated successfully.' : 'Lead added successfully.');
      await load();
    } catch (error) {
      setFormError(error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message || 'Unable to save lead. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async lead => {
    if (!window.confirm(`Delete ${lead.name}? This action cannot be undone.`)) return;
    setDeletingId(lead._id);
    setPageError('');
    try {
      await axios.delete(`${API}/leads/${lead._id}`);
      setNotice('Lead deleted.');
      await load();
    } catch {
      setPageError('Could not delete the lead. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const exportCsv = () => {
    const escapeCell = value => {
      const safeValue = String(value ?? '').replace(/^\s*[=+\-@]/, "'$&");
      return `"${safeValue.replace(/"/g, '""')}"`;
    };
    const columns = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Added'];
    const rows = visible.map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.company,
      lead.source,
      lead.status,
      formatDate(lead.createdAt)
    ]);
    const csv = [columns, ...rows].map(row => row.map(escapeCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meru-leads.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const initials = name => name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase();
  const hasFilters = Boolean(search.trim()) || filter !== 'All';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div><b>meru</b><span>TECHNOSOFT</span></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="nav-item active"><LayoutDashboard size={18} /> Lead Manager</div>
        <div className="sidebar-bottom">
          <div className="avatar">SW</div>
          <div><b>Shared workspace</b><small>No account required</small></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <b>Lead Manager</b></div>
          <div className={`connection-state ${connection}`} role="status">
            <span className="connection-dot" />
            {connection === 'checking' ? 'Connecting to API' :
              connection === 'connected' ? 'API connected' : 'API unavailable'}
          </div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">SALES OVERVIEW</div>
              <h1>Lead Manager</h1>
              <p>Manage your prospects and keep every opportunity moving.</p>
            </div>
            <button className="primary" onClick={openNew}>
              <Plus size={18} /> Add new lead
            </button>
          </div>

          {notice && <div className="notice" role="status">{notice}</div>}
          {pageError && leads.length > 0 && (
            <div className="alert-banner" role="alert">
              <AlertTriangle size={18} />
              <span>{pageError}</span>
              <button className="text-button" onClick={load}>Try again</button>
            </div>
          )}

          <div className="stats" aria-label="Lead counts by status">
            {[
              { label: 'Total leads', key: 'All', value: counts.total, tone: 'blue' },
              { label: 'New', key: 'New', value: counts.New, tone: 'violet' },
              { label: 'Contacted', key: 'Contacted', value: counts.Contacted, tone: 'amber' },
              { label: 'Qualified', key: 'Qualified', value: counts.Qualified, tone: 'green' },
              { label: 'Lost', key: 'Lost', value: counts.Lost, tone: 'red' }
            ].map(item => (
              <Stat
                key={item.key}
                icon={statusIcons[item.key]}
                label={item.label}
                value={item.value}
                tone={item.tone}
                active={filter === item.key}
                onClick={() => setFilter(current => current === item.key ? 'All' : item.key)}
              />
            ))}
          </div>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>{filter === 'All' ? 'All leads' : `${filter} leads`} <span className="result-count">{visible.length}</span></h2>
                <p>Search, filter and manage your sales pipeline</p>
              </div>
              <button className={`icon-button ${loading ? 'spinning' : ''}`} onClick={load} title="Refresh leads" aria-label="Refresh leads" disabled={loading}>
                <RefreshCw size={17} />
              </button>
            </div>

            <div className="toolbar">
              <div className="search-box">
                <Search size={17} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Search leads"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search name, company or email..."
                />
                {search && (
                  <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                    <X size={15} />
                  </button>
                )}
              </div>
              <div className="toolbar-actions">
                <label className="filter-wrap">
                  <span>Status</span>
                  <select value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filter by status">
                    <option>All</option>
                    {statuses.map(status => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label className="sort-wrap">
                  <ArrowDownWideNarrow size={16} aria-hidden="true" />
                  <select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort leads">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </label>
                <button className="secondary export-button" onClick={exportCsv} disabled={!visible.length} title="Export visible leads as CSV">
                  <Download size={15} /> Export
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">CONTACT</th>
                    <th scope="col">COMPANY</th>
                    <th scope="col">PHONE</th>
                    <th scope="col">SOURCE</th>
                    <th scope="col">STATUS</th>
                    <th scope="col">ADDED</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(lead => (
                    <tr key={lead._id}>
                      <td>
                        <div className="person">
                          <div className="person-avatar">{initials(lead.name)}</div>
                          <div><b>{lead.name}</b><small>{lead.email}</small></div>
                        </div>
                      </td>
                      <td className="company">{lead.company}</td>
                      <td>{lead.phone}</td>
                      <td>{lead.source}</td>
                      <td><span className={`badge ${lead.status.toLowerCase()}`}>{lead.status}</span></td>
                      <td className="date">{formatDate(lead.createdAt)}</td>
                      <td>
                        <div className="actions">
                          <button title={`Edit ${lead.name}`} aria-label={`Edit ${lead.name}`} onClick={() => openEdit(lead)}>
                            <Pencil size={15} />
                          </button>
                          <button title={`Delete ${lead.name}`} aria-label={`Delete ${lead.name}`} disabled={deletingId === lead._id} onClick={() => remove(lead)}>
                            {deletingId === lead._id ? <LoaderCircle className="spinning" size={15} /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!visible.length && (
                <EmptyState
                  loading={loading}
                  error={Boolean(pageError)}
                  errorMessage={pageError}
                  filtered={hasFilters}
                  onRetry={load}
                  onClear={clearFilters}
                  onAdd={openNew}
                />
              )}
            </div>

            <div className="table-foot">
              <span>Showing <b>{visible.length}</b> of <b>{leads.length}</b> leads</span>
              <span>{lastLoaded ? `Refreshed ${lastLoaded.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Not refreshed yet'}</span>
            </div>
          </section>

          <footer>© {new Date().getFullYear()} Meru Technosoft · Lead Manager <span>Built for better relationships.</span></footer>
        </section>
      </main>

      {modal && (
        <div className="overlay" onMouseDown={event => event.target === event.currentTarget && !saving && setModal(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
            <div className="modal-head">
              <div>
                <div className="eyebrow">{editing ? 'UPDATE RECORD' : 'NEW OPPORTUNITY'}</div>
                <h2 id="lead-modal-title">{editing ? 'Edit lead' : 'Add a new lead'}</h2>
                <p>Fields marked required help keep your pipeline complete.</p>
              </div>
              <button className="icon-button" onClick={() => !saving && setModal(false)} aria-label="Close dialog" disabled={saving}>
                <X />
              </button>
            </div>
            {formError && <div className="form-error" role="alert"><AlertTriangle size={16} />{formError}</div>}
            <form onSubmit={save}>
              <div className="form-grid">
                <Field label="Full name" name="name" value={form.name} onChange={update} placeholder="e.g. Priya Sharma" maxLength="100" autoFocus />
                <Field label="Email address" name="email" type="email" value={form.email} onChange={update} placeholder="priya@company.com" maxLength="150" />
                <Field label="Phone number" name="phone" value={form.phone} onChange={update} placeholder="+91 98765 43210" maxLength="30" />
                <Field label="Company" name="company" value={form.company} onChange={update} placeholder="Company name" maxLength="120" />
                <label htmlFor="source">Lead source <span className="required-mark">Required</span>
                  <select id="source" name="source" value={form.source} onChange={update}>
                    {sources.map(source => <option key={source}>{source}</option>)}
                  </select>
                </label>
                <label htmlFor="status">Status <span className="required-mark">Required</span>
                  <select id="status" name="status" value={form.status} onChange={update}>
                    {statuses.map(status => <option key={status}>{status}</option>)}
                  </select>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setModal(false)} disabled={saving}>Cancel</button>
                <button className="primary" disabled={saving}>
                  {saving ? <><LoaderCircle className="spinning" size={16} /> Saving...</> : editing ? 'Save changes' : 'Create lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone, active, onClick }) {
  return (
    <button className={`stat-card ${active ? 'selected' : ''}`} onClick={onClick} aria-pressed={active}>
      <div className={`stat-icon ${tone}`}><Icon /></div>
      <div><span>{label}</span><strong>{value}</strong></div>
    </button>
  );
}

function Field({ label, name, ...props }) {
  return (
    <label htmlFor={name}>
      {label} <span className="required-mark">Required</span>
      <input id={name} name={name} required {...props} />
    </label>
  );
}

function EmptyState({ loading, error, errorMessage, filtered, onRetry, onClear, onAdd }) {
  if (loading) {
    return <div className="empty-state" role="status"><LoaderCircle className="spinning" size={24} /><b>Loading your leads...</b><span>This should only take a moment.</span></div>;
  }
  if (error) {
    return <div className="empty-state error-state" role="alert"><AlertTriangle size={25} /><b>We couldn't load your leads</b><span>{errorMessage}</span><button className="secondary" onClick={onRetry}>Try again</button></div>;
  }
  if (filtered) {
    return <div className="empty-state"><Search size={25} /><b>No matching leads</b><span>Try a different search or status filter.</span><button className="text-button" onClick={onClear}>Clear filters</button></div>;
  }
  return <div className="empty-state"><Users size={25} /><b>Your pipeline is ready</b><span>Add a lead to start tracking your sales opportunities.</span><button className="text-button" onClick={onAdd}>Add your first lead</button></div>;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}
