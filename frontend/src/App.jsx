import { useCallback, useEffect, useState } from 'react';
import {
  getApplications, getStats, getApplication, createApplication,
  updateApplication, changeStatus, deleteApplication
} from './api.js';
import './styles.css';

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected', 'Accepted', 'Declined'];
const TYPES = ['Full-time', 'Internship', 'Contract'];
const NEXT = {
  Applied: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Accepted', 'Declined'],
  Rejected: [], Accepted: [], Declined: []
};
const FINAL = ['Rejected', 'Accepted', 'Declined'];
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const blankForm = () => ({
  companyName: '', jobRole: '', jobType: 'Full-time', appliedDate: today(),
  expectedSalary: '', notes: ''
});
const dateText = value => value ? new Date(value).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
}) : '—';
const dateTimeText = value => value ? new Date(value).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '—';
const salaryText = value => value == null || value === '' ? 'Not specified' :
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

function StatusBadge({ status }) {
  return <span className={`badge b-${String(status || '').toLowerCase()}`}><i />{status}</span>;
}

function ApplicationForm({ initial, onSave, onCancel, busy, error }) {
  const [form, setForm] = useState(() => initial ? {
    companyName: initial.companyName || '', jobRole: initial.jobRole || '',
    jobType: initial.jobType || 'Full-time', appliedDate: initial.appliedDate?.slice(0, 10) || today(),
    expectedSalary: initial.expectedSalary ?? '', notes: initial.notes || ''
  } : blankForm());
  const [localError, setLocalError] = useState('');

  const update = e => setForm(old => ({ ...old, [e.target.name]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    setLocalError('');
    if (!form.companyName.trim() || !form.jobRole.trim() || !form.appliedDate) {
      setLocalError('Company, job role, and applied date are required.'); return;
    }
    if (form.appliedDate > today()) {
      setLocalError('Applied date cannot be in the future.'); return;
    }
    if (form.expectedSalary !== '' && (!Number.isFinite(Number(form.expectedSalary)) || Number(form.expectedSalary) < 0)) {
      setLocalError('Expected salary must be a non-negative number.'); return;
    }
    const payload = {
      companyName: form.companyName.trim(), jobRole: form.jobRole.trim(), jobType: form.jobType,
      expectedSalary: form.expectedSalary === '' ? null : Number(form.expectedSalary),
      notes: form.notes.trim()
    };
    // Applied date is immutable after creation; never send it in an edit request.
    if (!initial) payload.appliedDate = form.appliedDate;
    await onSave(payload);
  }

  return <form className="form" onSubmit={submit}>
    {(localError || error) && <div className="alert" role="alert">{localError || error}</div>}
    <div className="form-grid">
      <label className="field"><span>Company name *</span><input name="companyName" value={form.companyName} onChange={update} required /></label>
      <label className="field"><span>Job role *</span><input name="jobRole" value={form.jobRole} onChange={update} required /></label>
      <label className="field"><span>Job type *</span><select name="jobType" value={form.jobType} onChange={update}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
      <label className="field"><span>{initial ? 'Applied date (locked)' : 'Applied date *'}</span>
        <input type={initial ? 'text' : 'date'} name="appliedDate" value={initial ? dateText(form.appliedDate) : form.appliedDate} max={today()} disabled={Boolean(initial)} onChange={update} required={!initial} />
      </label>
      <label className="field"><span>Expected salary (₹)</span><input type="number" min="0" name="expectedSalary" value={form.expectedSalary} onChange={update} placeholder="Optional" /></label>
      <label className="field"><span>Notes</span><textarea name="notes" rows="3" value={form.notes} onChange={update} placeholder="Optional notes" /></label>
    </div>
    <footer className="form-foot"><span>* Required fields</span><div>
      <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
      <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add application'}</button>
    </div></footer>
  </form>;
}

function Dialog({ title, onClose, children }) {
  return <div className="veil" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal"><header className="modal-head"><div><small>JOBTRACK</small><h2>{title}</h2></div>
      <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">×</button>
    </header>{children}</section>
  </div>;
}

function Details({ application, onClose, onEdit, onStatus, onDelete, busy }) {
  const [item, setItem] = useState(application);
  const [loadingDetails, setLoadingDetails] = useState(false);
  useEffect(() => setItem(application), [application]);
  async function refresh() {
    setLoadingDetails(true);
    try { setItem(await getApplication(application._id)); }
    catch (e) { window.alert(e.message); }
    finally { setLoadingDetails(false); }
  }
  const history = [...(item.statusHistory || [])].sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));
  return <Dialog title="Application details" onClose={onClose}>
    <div className="details">
      <div className="detail-hero"><div className="company-logo big">{item.companyName?.[0]?.toUpperCase()}</div>
        <div className="detail-name"><small>{item.applicationId}</small><h3>{item.jobRole}</h3><p>{item.companyName}</p></div><StatusBadge status={item.status} />
      </div>
      <div className="detail-grid">
        <div><span>Applied date</span><b>{dateText(item.appliedDate)}</b></div>
        <div><span>Follow-up date</span><b>{dateText(item.followUpDate)}</b></div>
        <div><span>Job type</span><b>{item.jobType}</b></div>
        <div><span>Expected salary</span><b>{salaryText(item.expectedSalary)}</b></div>
      </div>
      {item.isOverdue && <div className="alert overdue">Follow-up overdue — application is still Applied.</div>}
      <div className="history-head"><div><small>APPLICATION ACTIVITY</small><h3>Status history</h3></div>
        <button className="btn ghost" type="button" onClick={refresh} disabled={loadingDetails}>{loadingDetails ? 'Refreshing…' : 'Refresh'}</button></div>
      {history.length ? <div className="timeline">{history.map((h, i) => <div className="timeline-item" key={`${h.status}-${h.changedAt}-${i}`}>
        <i className={i === history.length - 1 ? 'current' : ''} /><div><b>{h.status}</b><span>{dateTimeText(h.changedAt)}</span></div>{i === history.length - 1 && <small>Current</small>}
      </div>)}</div> : <p className="muted">No status history available.</p>}
      {item.notes && <div className="notes"><b>Notes</b><p>{item.notes}</p></div>}
      <footer className="detail-foot">
        <button type="button" className="btn danger-ghost" disabled={busy || !(item.status === 'Applied' || FINAL.includes(item.status))} onClick={() => onDelete(item)}>Delete</button>
        <div>{NEXT[item.status]?.length > 0 && <select disabled={busy} value="" onChange={e => e.target.value && onStatus(item, e.target.value)}>
          <option value="">Move to status…</option>{NEXT[item.status].map(s => <option key={s}>{s}</option>)}
        </select>}
          <button type="button" className="btn primary" disabled={busy} onClick={() => onEdit(item)}>Edit</button>
        </div>
      </footer>
    </div>
  </Dialog>;
}

export default function App() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [status, setStatus] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [list, counts] = await Promise.all([getApplications({ status, search }), getStats()]);
      setApplications(list); setStats(counts);
      if (selected) {
        const latest = list.find(a => a._id === selected._id);
        if (latest) setSelected(latest);
      }
    } catch (e) { setError(e.message || 'Could not load applications.'); }
    finally { setLoading(false); }
  }, [status, search]);
  useEffect(() => { load(); }, [load]);
  function notify(message) { setToast(message); window.setTimeout(() => setToast(''), 3000); }

  async function save(payload) {
    setBusy(true); setError('');
    try {
      if (dialog.mode === 'edit') await updateApplication(dialog.application._id, payload);
      else await createApplication(payload);
      setDialog(null); notify(dialog.mode === 'edit' ? 'Application updated.' : 'Application added.'); await load();
    } catch (e) { setError(e.message || 'Could not save application.'); }
    finally { setBusy(false); }
  }
  async function moveStatus(application, nextStatus) {
    setBusy(true);
    try {
      const updated = await changeStatus(application._id, nextStatus);
      setSelected(updated); notify(`Status changed to ${nextStatus}.`); await load();
    } catch (e) { notify(e.message || 'Could not change status.'); }
    finally { setBusy(false); }
  }
  async function remove(application) {
    if (!(application.status === 'Applied' || FINAL.includes(application.status))) {
      notify('Applications can only be deleted while Applied or after reaching a final status.'); return;
    }
    if (!window.confirm(`Delete ${application.applicationId} — ${application.companyName} / ${application.jobRole}?`)) return;
    setBusy(true);
    try { await deleteApplication(application._id); setSelected(null); setDialog(null); notify('Application deleted.'); await load(); }
    catch (e) { notify(e.message || 'Could not delete application.'); }
    finally { setBusy(false); }
  }
  function edit(application) {
    setSelected(null); setError(''); setDialog({ mode: 'edit', application });
  }
  const total = Object.values(stats).reduce((sum, count) => sum + Number(count || 0), 0);

  return <div className="shell">
    <aside className="sidebar"><div className="brand"><div>▣</div>jobtrack<span>.</span></div><small className="side-label">WORKSPACE</small>
      <div className="nav active">▦　Overview</div><div className="side-user"><div>JT</div><section><b>Job seeker</b><small>Personal workspace</small></section></div>
    </aside>
    <main><header className="topbar"><span>Workspace　›　<b>Overview</b></span><span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></header>
      <div className="content"><div className="page-title"><div><small>YOUR CAREER, ORGANIZED</small><h1>Application overview<span>.</span></h1><p>Keep every opportunity moving forward.</p></div>
        <button className="btn primary add" type="button" onClick={() => { setError(''); setDialog({ mode: 'create' }); }}>＋ Add application</button></div>
      <div className="stats">{[
        ['Total applications', total, 'Across all stages'], ['Applied', stats.Applied || 0, 'Waiting for response'],
        ['Interview', stats.Interview || 0, 'Interview process'], ['Offer', stats.Offer || 0, 'Potential offers']
      ].map((s, i) => <div className={`stat ${i === 0 ? 'purple' : ''}`} key={s[0]}><div className="stat-icon">▣</div><small>{s[0]}</small><strong>{s[1]}</strong><span>{s[2]}</span></div>)}</div>
      <section className="panel"><header className="panel-title"><div><h2>Your applications</h2><p>Track and manage your job search pipeline.</p></div><span>{applications.length} shown</span></header>
        <div className="toolbar"><div className="search"><input aria-label="Search company" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearch(searchInput.trim())} placeholder="Search by company…" />
          {searchInput && <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }}>Clear</button>}<button className="search-btn" type="button" onClick={() => setSearch(searchInput.trim())}>Search</button></div>
          <label className="filter">Status <select value={status} onChange={e => setStatus(e.target.value)}><option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
        </div>
        {error && !dialog && <div className="alert" role="alert">{error} <button type="button" onClick={load}>Retry</button></div>}
        {loading ? <div className="empty">Loading applications…</div> : !applications.length ? <div className="empty"><h3>{search || status !== 'All' ? 'No matching applications' : 'Your next opportunity starts here'}</h3><p>{search || status !== 'All' ? 'Try another search or status filter.' : 'Add your first application to get started.'}</p>
          {!search && status === 'All' && <button className="btn primary" type="button" onClick={() => setDialog({ mode: 'create' })}>＋ Add application</button>}</div> :
          <div className="table-scroll"><table><thead><tr><th>APPLICATION</th><th>JOB TYPE</th><th>APPLIED DATE</th><th>STATUS</th><th>FOLLOW-UP</th><th>ACTION</th></tr></thead><tbody>
            {applications.map(a => <tr key={a._id} onClick={() => setSelected(a)}><td><div className="company-cell"><div className="company-logo">{a.companyName?.[0]?.toUpperCase()}</div><div><b>{a.companyName}</b><span>{a.jobRole}</span><small>{a.applicationId}</small></div></div></td>
              <td><span className="type">{a.jobType}</span></td><td>{dateText(a.appliedDate)}</td><td><StatusBadge status={a.status} /></td>
              <td>{a.isOverdue ? <span className="overdue-badge">Follow-up Overdue</span> : dateText(a.followUpDate)}</td>
              <td><button type="button" className="open-row" onClick={e => { e.stopPropagation(); setSelected(a); }}>View</button></td></tr>)}
          </tbody></table></div>}
        <footer className="panel-foot"><span>Showing {applications.length} of {total} applications</span><button type="button" onClick={load}>↻ Refresh list</button></footer>
      </section><footer className="page-foot">JOBTRACK. &nbsp; Build momentum, one application at a time.<span>Data stored in MongoDB</span></footer>
      </div>
    </main>
    {dialog && <Dialog title={dialog.mode === 'edit' ? 'Edit application' : 'Add a new application'} onClose={() => { setDialog(null); setError(''); }}>
      <ApplicationForm key={`${dialog.mode}-${dialog.application?._id || 'new'}`} initial={dialog.application || null} onSave={save} onCancel={() => { setDialog(null); setError(''); }} busy={busy} error={error} />
    </Dialog>}
    {selected && <Details application={selected} onClose={() => setSelected(null)} onEdit={edit} onStatus={moveStatus} onDelete={remove} busy={busy} />}
    {toast && <div className="toast">{toast}</div>}
  </div>;
}
