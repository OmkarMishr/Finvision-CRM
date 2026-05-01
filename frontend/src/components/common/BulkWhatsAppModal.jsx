import { useState } from 'react';
import { X, RefreshCw, MessageSquare, Send } from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';

// Reusable bulk WhatsApp modal — mounted from any leads-table view (admin
// LeadsPanel, staff TelecallerView, staff CounselorView). Caller passes the
// already-selected lead objects in `leads`.
const BulkWhatsAppModal = ({ leads = [], onClose, onSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);
  const [error,   setError]   = useState('');

  const validLeads = leads.filter(l => l.mobile && String(l.mobile).trim());
  const skipped    = leads.length - validLeads.length;

  const handleSend = async () => {
    if (!message.trim()) { setError('Type a message first.'); return; }
    if (validLeads.length === 0) { setError('No leads with valid phone numbers.'); return; }
    setError(''); setSending(true); setResults(null);
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.leads.bulkWhatsapp, {
        leadIds: validLeads.map(l => l._id),
        message: message.trim(),
      });
      setResults(res.data);
      // wa_link provider: open each link in a new tab so the user can hit
      // "Send" in WhatsApp Web. Stagger them slightly to dodge popup blockers
      // and cap at 10 to avoid swarming the browser.
      if (res.data?.provider === 'wa_link') {
        const links = (res.data.results || []).filter(r => r.ok && r.link).slice(0, 10);
        links.forEach((r, i) => setTimeout(() => window.open(r.link, '_blank', 'noopener'), i * 250));
      }
      onSent?.(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1a1a1a]">WhatsApp Messaging</h2>
              <p className="text-xs text-gray-500">
                {validLeads.length} recipient{validLeads.length === 1 ? '' : 's'}
                {skipped > 0 && ` · ${skipped} skipped (no number)`}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={sending}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Message
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={sending || results}
              placeholder="Hi, this is Finvision Academy..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] disabled:bg-gray-50"
            />
            <p className="text-xs text-gray-400 mt-1">
              {message.length} characters · sent as plain text to each recipient
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Recipients
            </label>
            <div className="border border-gray-100 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-50">
              {validLeads.length === 0 ? (
                <p className="text-sm text-gray-400 p-3">No recipients with valid mobile numbers.</p>
              ) : validLeads.map(l => {
                const r = results?.results?.find(x => x.leadId === l._id);
                return (
                  <div key={l._id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-[#1a1a1a]">{l.fullName}</p>
                      <p className="text-xs text-gray-400">{l.mobile}</p>
                    </div>
                    {r
                      ? r.ok
                        ? <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Sent</span>
                        : <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full" title={r.error}>Failed</span>
                      : sending
                        ? <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                        : <span className="text-xs text-gray-400">Pending</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>

          {results && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-[#1a1a1a]">
                {results.sent} of {results.matched} sent
                {results.failed > 0 && ` · ${results.failed} failed`}
              </p>
              {results.provider === 'wa_link' && (
                <p className="text-xs text-gray-500 mt-1">
                  WhatsApp Web links opened in new tabs — click <strong>Send</strong> in each tab
                  to deliver. Configure <code>WHATSAPP_PROVIDER=meta_cloud</code> on the server
                  for direct sending.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white">
            {results ? 'Close' : 'Cancel'}
          </button>
          {!results && (
            <button onClick={handleSend} disabled={sending || !message.trim() || validLeads.length === 0}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center gap-2">
              {sending
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                : <><Send       className="w-4 h-4" /> Send WhatsApp</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkWhatsAppModal;
