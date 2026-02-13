import { useEffect, useState, useMemo } from 'react';
import {CreditCard,AlertTriangle,CheckCircle2,Clock,IndianRupee,Percent,TicketPercent,Download,Wallet,Calendar,RefreshCw} from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';

const PAYMENT_MODES = ['Cash', 'Online', 'UPI', 'Bank Transfer'];

const StudentFees = ({ studentData }) => {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [history, setHistory] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [paymentMode, setPaymentMode] = useState('Online');
  const [paying, setPaying] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const totalPaid = useMemo(
    () =>
      history
        .filter((p) => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    [history]
  );

  const effectivePendingAmount = useMemo(() => {
    if (!pending) return 0;
    const base = pending.pendingAmount || 0;
    if (couponInfo?.discountType === 'PERCENT') {
      return Math.max(
        0,
        base - (base * (couponInfo.discountValue || 0)) / 100
      );
    }
    if (couponInfo?.discountType === 'FLAT') {
      return Math.max(0, base - (couponInfo.discountValue || 0));
    }
    return base;
  }, [pending, couponInfo]);

  const loadFeesData = async () => {
    if (!studentData?._id) return;
    try {
      setLoading(true);
      const [pendingRes, historyRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.fees.pending(studentData._id)),
        axiosInstance.get(API_ENDPOINTS.fees.history(studentData._id))
      ]);
      setPending(pendingRes.data.data || null);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      console.error('Fees load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeesData();
  }, [studentData?._id]);

 const handleValidateCoupon = async () => {
  if (!couponCode.trim()) {
    setCouponError('Please enter a coupon code');
    return;
  }
  
  try {
    setValidatingCoupon(true);
    setCouponError(null);
    setCouponInfo(null);
    
    const res = await axiosInstance.post(API_ENDPOINTS.fees.validateCoupon, {
      code: couponCode.trim().toUpperCase(),
      studentId: studentData._id,
      courseId: studentData.courseId || pending?.courseId
    });
    
    if (res.data.success) {
      setCouponInfo(res.data.coupon);
    } else {
      setCouponError(res.data.message || 'Invalid coupon');
    }
  } catch (err) {
    console.error('Coupon validate error:', err);
    setCouponError(
      err.response?.data?.message || 
      'Invalid or expired coupon'
    );
  } finally {
    setValidatingCoupon(false);
  }
}

  const handleMakePayment = async () => {
    if (!pending || effectivePendingAmount <= 0) return;
    try {
      setPaying(true);
      const res = await axiosInstance.post(API_ENDPOINTS.fees.collect, {
        studentId: studentData._id,
        amount: effectivePendingAmount,
        baseAmount: pending.pendingAmount,
        couponCode: couponInfo?.code || null,
        paymentMode,
        feeHead: pending.feeHead || 'Course Fee'
      });

      if (res.data.success) {
        await loadFeesData();
        setCouponInfo(null);
        setCouponCode('');
        alert('Payment recorded successfully!');
      } else {
        alert(res.data.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadReceipt = async (payment) => {
    try {
      setSelectedPayment(payment._id);
      setReceiptLoading(true);
      const res = await axiosInstance.get(
        API_ENDPOINTS.fees.receipt(payment._id),
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${payment.receiptNo || payment._id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Receipt download error:', err);
      alert('Failed to download receipt');
    } finally {
      setReceiptLoading(false);
      setSelectedPayment(null);
    }
  };

  if (!studentData?._id) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-2xl">
        <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 text-sm">
          Fees panel will be available once your admission is confirmed.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center bg-gray-50 rounded-2xl">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-gray-600 text-sm">Loading fees data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-indigo-700 font-medium">Total Course Fee</p>
            <p className="text-lg font-bold text-indigo-900">
              ₹{pending?.totalFee?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-emerald-700 font-medium">Total Paid</p>
            <p className="text-lg font-bold text-emerald-900">
              ₹{totalPaid.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-rose-700 font-medium">Pending Amount</p>
            <p className="text-lg font-bold text-rose-900">
              ₹{(pending?.pendingAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Pending fee alert + payment box */}
      {pending?.pendingAmount > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending fee alert */}
          <div className="lg:col-span-2 bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex gap-4">
            <div className="mt-1">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                Pending fee alert
              </p>
              <p className="text-xs text-amber-800 mb-2">
                You have pending fees for your course. Please clear dues before the due date to avoid any access restrictions.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-amber-900">
                <div>
                  <span className="font-semibold">Due Amount: </span>
                  ₹{pending.pendingAmount.toLocaleString()}
                </div>
                {pending.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="font-semibold">Due Date:</span>
                    <span>
                      {new Date(pending.dueDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
                {pending.feeHead && (
                  <div>
                    <span className="font-semibold">Head: </span>
                    {pending.feeHead}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Make payment box */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Make a payment
              </h3>
            </div>

            {/* Payment mode */}
            <div className="space-y-1">
              <p className="text-xs text-gray-600 font-medium">Payment mode</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      paymentMode === mode
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="space-y-1">
              <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                <TicketPercent className="w-4 h-4 text-emerald-600" />
                Coupon / Offer code
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  disabled={!couponCode.trim() || validatingCoupon}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {validatingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>
              {couponInfo && (
                <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>
                    Applied <strong>{couponInfo.code}</strong> –{' '}
                    {couponInfo.discountType === 'PERCENT'
                      ? `${couponInfo.discountValue}% off`
                      : `₹${couponInfo.discountValue} off`}
                  </span>
                </div>
              )}
              {couponError && (
                <div className="text-[11px] text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>

            {/* Amount summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Pending amount</span>
                <span className="font-semibold">
                  ₹{(pending.pendingAmount || 0).toLocaleString()}
                </span>
              </div>
              {couponInfo && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-semibold text-emerald-700">
                    -
                    {couponInfo.discountType === 'PERCENT'
                      ? `${couponInfo.discountValue}%`
                      : `₹${couponInfo.discountValue.toLocaleString()}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-dashed border-gray-300 pt-1 mt-1">
                <span className="text-gray-900 font-semibold">Amount to pay</span>
                <span className="text-indigo-700 font-bold">
                  ₹{effectivePendingAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMakePayment}
              disabled={effectivePendingAmount <= 0 || paying}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {paying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{effectivePendingAmount.toLocaleString()}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              No pending fees
            </p>
            <p className="text-xs text-emerald-800">
              Your course fees are clear. Thank you for staying up to date with your payments.
            </p>
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">
              Payment history
            </h3>
          </div>
          <p className="text-[11px] text-gray-500">
            Showing last {history.length} transactions
          </p>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-gray-500">
            No payment records found yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Receipt</th>
                  <th className="px-3 py-2 text-left font-medium">Mode</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-center font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p._id} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      {new Date(p.date || p.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-3 py-2">
                      {p.receiptNo || '-'}
                    </td>
                    <td className="px-3 py-2">
                      {p.paymentMode}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ₹{(p.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {p.status === 'SUCCESS' ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(p)}
                          disabled={receiptLoading && selectedPayment === p._id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-300 text-[11px] text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Download className="w-3 h-3" />
                          {receiptLoading && selectedPayment === p._id
                            ? 'Downloading...'
                            : 'Receipt'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFees;
