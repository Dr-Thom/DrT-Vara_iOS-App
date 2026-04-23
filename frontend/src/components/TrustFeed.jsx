import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import { TrendingUp, DollarSign } from 'lucide-react';

/**
 * Public trust elements: total paid out counter + recent withdrawals feed.
 * Used on the landing page and dashboard for social proof.
 */
const TrustFeed = ({ showFeed = true, compact = false }) => {
  const [totalPaid, setTotalPaid] = useState(0);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    axios.get(`${API_CONFIG.BACKEND_URL}/api/stats/total-paid-out`)
      .then((r) => setTotalPaid(r.data?.total_paid_out || 0))
      .catch(() => { /* silent */ });

    if (showFeed) {
      axios.get(`${API_CONFIG.BACKEND_URL}/api/stats/recent-withdrawals?limit=5`)
        .then((r) => setFeed(r.data?.recent_withdrawals || []))
        .catch(() => { /* silent */ });
    }
  }, [showFeed]);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200" data-testid="trust-counter-compact">
        <DollarSign className="w-4 h-4 text-green-600" />
        <span className="text-sm font-semibold text-green-700">
          ${totalPaid.toLocaleString()} paid out to users
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm" data-testid="trust-feed">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Paid Out</div>
          <div className="text-4xl font-bold text-green-600" data-testid="trust-total-paid">
            ${totalPaid.toLocaleString()} <span className="text-lg font-semibold text-gray-500">USD</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-full border border-green-200">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-semibold">Live counter</span>
        </div>
      </div>

      {showFeed && feed.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Recent withdrawals</div>
          <ul className="divide-y divide-gray-100">
            {feed.map((w, i) => (
              <li key={i} className="flex justify-between items-center py-2 text-sm" data-testid="trust-feed-item">
                <div>
                  <div className="font-medium text-gray-900">{w.masked_email}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    via {w.method} · {w.created_at ? new Date(w.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
                <div className="text-base font-bold text-green-600">+${w.amount.toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Earnings depend on task availability. Minimum withdrawal: $5 USD.
      </p>
    </div>
  );
};

export default TrustFeed;
