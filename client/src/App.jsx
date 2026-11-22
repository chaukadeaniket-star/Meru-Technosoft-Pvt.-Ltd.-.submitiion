import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Search, Users, UserCheck, Clock3, XCircle, Pencil, Trash2, X, LayoutDashboard, Download, RefreshCw } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const sources = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'];
const statuses = ['New', 'Contacted', 'Qualified', 'Lost'];
const blank = { name: '', email: '', phone: '', company: '', source: 'Website', status: 'New' };

export default function App() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setBusy(true); setError('');
    try { const { data } = await axios.get(`${API}/leads`); setLeads(data); }
    catch { setError('Could not connect to the API. Check that the backend and MongoDB are running.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (notice) { const t = setTimeout(() => setNotice(''), 3000); return () => clearTimeout(t); } }, [notice]);

  const visible = useMemo(() => leads.filter(l => {
    const q = search.toLowerCase();
    return (filter === 'All' || l.status === filter) &&
      (!q || [l.name, l.company, l.email].some(v => (v || '').toLowerCase().includes(q)));
  }), [leads, search, filter]);

  const counts = useMemo(() => ({
    total: leads.length, New: leads.filter(x => x.status === 'New').length,
    Contacted: leads.filter(x => x.status === 'Contacted').length,
    Qualified: leads.filter(x => x.status === 'Qualified').length,
    Lost: leads.filter(x => x.status === 'Lost').length
  }), [leads]);

  const openNew = () => { setEditing(null); setForm(blank); setError(''); setModal(true); };
  const openEdit = l => { setEditing(l._id); setForm({ name:l.name, email:l.email, phone:l.phone, company:l.company, source:l.source, status:l.status }); setError(''); setModal(true); };
  const update = e => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async e => {
    e.preventDefault(); setError('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.company.trim()) return setError('Please complete all required fields.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Please enter a valid email address.');
    setBusy(true);
    try {
      if (editing) await axios.put(`${API}/leads/${editing}`, form);
      else await axios.post(`${API}/leads`, form);
      setModal(false); setNotice(editing ? 'Lead updated successfully.' : 'Lead added successfully.'); await load();
    } catch (e) { setError(e.response?.data?.errors?.[0]?.msg || e.response?.data?.message || 'Unable to save lead.'); }
    finally { setBusy(false); }
  };

  const remove = async id => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;
    try { await axios.delete(`${API}/leads/${id}`); setNotice('Lead deleted.'); await load(); }
    catch { setError('Could not delete the lead. Please try again.'); }
  };

  const initials = name => name.split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">M</div><div><b>meru</b><span>TECHNOSOFT</span></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <div className="nav-item active"><LayoutDashboard size={18}/> Lead Manager</div>
      <div className="sidebar-bottom"><div className="avatar">AC</div><div><b>Admin User</b><small>Sales workspace</small></div><span className="online-dot"/></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Lead Manager</b></div><div className="top-right"><span className="live-dot"/> All changes synced</div></header>
      <section className="content">
        <div className="page-heading"><div><div className="eyebrow">SALES OVERVIEW</div><h1>Lead Manager</h1><p>Manage your prospects and keep every opportunity moving.</p></div><button className="primary" onClick={openNew}><Plus size={18}/> Add new lead</button></div>
        {notice && <div className="notice">{notice}</div>}
        {error && !modal && <div className="alert">{error}</div>}
        <div className="stats">
          <Stat icon={<Users/>} label="Total leads" value={counts.total} tone="blue"/>
          <Stat icon={<Clock3/>} label="New" value={counts.New} tone="violet"/>
          <Stat icon={<UserCheck/>} label="Contacted" value={counts.Contacted} tone="amber"/>
          <Stat icon={<UserCheck/>} label="Qualified" value={counts.Qualified} tone="green"/>
          <Stat icon={<XCircle/>} label="Lost" value={counts.Lost} tone="red"/>
        </div>
        <section className="panel">
          <div className="panel-head"><div><h2>All leads</h2><p>A complete view of your sales pipeline</p></div><button className="icon-button" onClick={load} title="Refresh"><RefreshCw size={17}/></button></div>
          <div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, company or email..."/></div><div className="filter-wrap"><span>Status:</span><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></div></div>
          <div className="table-wrap"><table><thead><tr><th>CONTACT</th><th>COMPANY</th><th>PHONE</th><th>SOURCE</th><th>STATUS</th><th>ADDED</th><th></th></tr></thead>
            <tbody>{visible.map(l=><tr key={l._id}><td><div className="person"><div className="person-avatar">{initials(l.name)}</div><div><b>{l.name}</b><small>{l.email}</small></div></div></td><td className="company">{l.company}</td><td>{l.phone}</td><td>{l.source}</td><td><span className={`badge ${l.status.toLowerCase()}`}>{l.status}</span></td><td className="date">{new Date(l.createdAt).toLocaleDateString()}</td><td><div className="actions"><button title="Edit" onClick={()=>openEdit(l)}><Pencil size={15}/></button><button title="Delete" onClick={()=>remove(l._id)}><Trash2 size={15}/></button></div></td></tr>)}
            {!visible.length && <tr><td colSpan="7"><div className="empty"><div className="empty-icon"><Users/></div><b>{busy ? 'Loading leads...' : 'No leads found'}</b><span>{search || filter !== 'All' ? 'Try changing your search or filter.' : 'Add your first lead to get started.'}</span>{!search && filter === 'All' && <button className="text-button" onClick={openNew}>Add a lead</button>}</div></td></tr>}</tbody>
          </table></div>
          <div className="table-foot"><span>Showing <b>{visible.length}</b> of <b>{leads.length}</b> leads</span><span>Updated just now</span></div>
        </section>
        <footer>© {new Date().getFullYear()} Meru Technosoft · Lead Manager <span>Built for better relationships.</span></footer>
      </section>
    </main>
    {modal && <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&setModal(false)}><div className="modal"><div className="modal-head"><div><div className="eyebrow">{editing?'UPDATE RECORD':'NEW OPPORTUNITY'}</div><h2>{editing?'Edit lead':'Add a new lead'}</h2><p>Enter the contact details below.</p></div><button className="icon-button" onClick={()=>setModal(false)}><X/></button></div>
      {error && <div className="alert">{error}</div>}
      <form onSubmit={save}><div className="form-grid">
        <Field label="Full name" name="name" value={form.name} onChange={update} placeholder="e.g. Priya Sharma"/>
        <Field label="Email address" name="email" type="email" value={form.email} onChange={update} placeholder="priya@company.com"/>
        <Field label="Phone number" name="phone" value={form.phone} onChange={update} placeholder="+91 98765 43210"/>
        <Field label="Company" name="company" value={form.company} onChange={update} placeholder="Company name"/>
        <label>Lead source<select name="source" value={form.source} onChange={update}>{sources.map(s=><option key={s}>{s}</option>)}</select></label>
        <label>Status<select name="status" value={form.status} onChange={update}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
      </div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary" disabled={busy}>{busy?'Saving...':editing?'Save changes':'Create lead'}</button></div></form>
    </div></div>}
  </div>;
}
function Stat({icon,label,value,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function Field({label,...props}) { return <label>{label}<input required {...props}/></label>; }
