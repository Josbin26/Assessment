import { useCallback, useEffect, useState } from 'react';
import {
  BriefcaseBusiness,
  Plus,
  Search,
  CalendarDays,
  Clock3,
  Pencil,
  Trash2,
  X,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Building2,
  CircleDollarSign,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard
} from 'lucide-react';

import {
  getApplications,
  getStats,
  getApplication,
  createApplication,
  updateApplication,
  changeStatus,
  deleteApplication
} from './api.js';

const STATUSES = [
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
  'Accepted',
  'Declined'
];

const TYPES = ['Full-time', 'Internship', 'Contract'];

const NEXT = {
  Applied: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Accepted', 'Declined'],
  Rejected: [],
  Accepted: [],
  Declined: []
};

const EMPTY = () => ({
  companyName: '',
  jobRole: '',
  jobType: 'Full-time',
  appliedDate: new Date().toLocaleDateString('en-CA'),
  expectedSalary: '',
  notes: ''
});

const fmt = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      })
    : '—';

const dt = (date) =>
  date
    ? new Date(date).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—';

const money = (amount) =>
  amount == null || amount === ''
    ? 'Not specified'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);

function Badge({ status }) {
  return (
    <span className={`badge b-${status.toLowerCase()}`}>
      <i />
      {status}
    </span>
  );