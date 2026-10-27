import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import {
    FiSearch, FiDownload, FiFilter, FiChevronLeft, FiChevronRight,
    FiCheckCircle, FiXCircle, FiClock, FiCreditCard, FiPackage,
    FiUsers, FiDollarSign, FiCalendar, FiTag, FiFileText, FiTrendingUp,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatInr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_CONFIG = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <FiCheckCircle size={12} />, label: 'Active' },
    expired: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <FiXCircle size={12} />, label: 'Expired' },
    cancelled: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: <FiClock size={12} />, label: 'Cancelled' },
};

const PAY_STATUS = {
    paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Paid' },
    created: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Failed' },
    refunded: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Refunded' },
};

const PLAN_COLORS = {
    basic: { gradient: 'from-gray-500 to-gray-600', badge: 'bg-gray-100 text-gray-600' },
    standard: { gradient: 'from-[#4960B2] to-[#3b4f98]', badge: 'bg-[#f0f4ff] text-[#4960B2]' },
    premium: { gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-50 text-amber-600' },
};

const generateInvoicePDF = (payment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(73, 96, 178);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${payment.invoiceNumber || 'N/A'}`, 20, 35);
    doc.text(`Date: ${formatDate(payment.paidAt || payment.createdAt)}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Status: ${payment.status?.toUpperCase()}`, pageWidth - 20, 35, { align: 'right' });

    doc.setTextColor(30, 30, 45);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Real Estate Platform', 20, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Premium Property Listing Service', 20, 67);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(73, 96, 178);
    doc.text('BILLED TO', 20, 82);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    let y = 90;
    doc.text(payment.seller?.name || 'Seller', 20, y); y += 6;
    if (payment.seller?.companyName) { doc.text(payment.seller.companyName, 20, y); y += 6; }
    if (payment.seller?.email) { doc.text(payment.seller.email, 20, y); y += 6; }
    if (payment.seller?.phone) { doc.text(payment.seller.phone, 20, y); y += 6; }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(73, 96, 178);
    doc.text('PAYMENT DETAILS', pageWidth / 2 + 10, 82);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    y = 90;
    doc.text(`Order ID: ${payment.razorpayOrderId || 'N/A'}`, pageWidth / 2 + 10, y); y += 6;
    doc.text(`Payment ID: ${payment.razorpayPaymentId || 'N/A'}`, pageWidth / 2 + 10, y); y += 6;
    doc.text(`Method: Razorpay`, pageWidth / 2 + 10, y);

    const tableY = Math.max(y + 15, 120);

    autoTable(doc, {
        startY: tableY,
        head: [['Description', 'Plan', 'Billing', 'Amount']],
        body: [
            [
                `${payment.planName || payment.plan} Subscription`,
                (payment.plan || '').charAt(0).toUpperCase() + (payment.plan || '').slice(1),
                payment.billingCycle === 'annual' ? 'Annual' : 'Monthly',
                formatInr(payment.baseAmount),
            ],
            ...(payment.discountAmount > 0 ? [[
                `Coupon Discount${payment.couponCode ? ` (${payment.couponCode})` : ''}`,
                payment.couponDiscountType === 'percentage' ? `${payment.couponDiscountValue}%` : 'Fixed',
                '',
                `- ${formatInr(payment.discountAmount)}`,
            ]] : []),
        ],
        headStyles: { fillColor: [73, 96, 178], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10, textColor: [60, 60, 60] },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        margin: { left: 20, right: 20 },
        theme: 'grid',
        styles: { cellPadding: 6 },
    });

    const finalY = doc.lastAutoTable.finalY + 5;

    autoTable(doc, {
        startY: finalY,
        body: [
            [{ content: 'Subtotal', styles: { fontStyle: 'bold' } }, formatInr(payment.baseAmount)],
            ...(payment.discountAmount > 0 ? [[
                { content: 'Discount', styles: { fontStyle: 'bold', textColor: [16, 185, 129] } },
                { content: `- ${formatInr(payment.discountAmount)}`, styles: { textColor: [16, 185, 129] } },
            ]] : []),
            [
                { content: 'TOTAL PAID', styles: { fontStyle: 'bold', fontSize: 12, textColor: [73, 96, 178] } },
                { content: formatInr(payment.finalAmount), styles: { fontStyle: 'bold', fontSize: 12, textColor: [73, 96, 178] } },
            ],
        ],
        columnStyles: {
            0: { halign: 'right', cellWidth: pageWidth - 100 },
            1: { halign: 'right', cellWidth: 60 },
        },
        margin: { left: 20, right: 20 },
        theme: 'plain',
        styles: { cellPadding: 4, fontSize: 10 },
    });

    const footerY = doc.internal.pageSize.getHeight() - 25;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, footerY + 5, { align: 'center' });

    doc.save(`Invoice_${payment.invoiceNumber || payment._id}.pdf`);
};

const ManageSubscriptions = () => {
    const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' | 'payments'
    const [subscriptions, setSubscriptions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subPagination, setSubPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [payPagination, setPayPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [planCounts, setPlanCounts] = useState({});
    const [stats, setStats] = useState({ totalRevenue: 0, totalTransactions: 0, avgTransactionValue: 0 });
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    const fetchSubscriptions = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (search.trim()) params.search = search.trim();
            if (filterStatus) params.status = filterStatus;
            if (filterPlan) params.plan = filterPlan;

            const res = await axios.get(`${API_URL}/api/payments/admin/subscriptions`, {
                params,
                headers: authHeaders(),
            });
            setSubscriptions(res.data.subscriptions || []);
            setSubPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
            setPlanCounts(res.data.planCounts || {});
        } catch (err) {
            console.error('Failed to load subscriptions:', err);
        } finally {
            setLoading(false);
        }
    }, [authHeaders, search, filterStatus, filterPlan]);

    const fetchPayments = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (search.trim()) params.search = search.trim();
            if (filterStatus) params.status = filterStatus;
            if (filterPlan) params.plan = filterPlan;

            const res = await axios.get(`${API_URL}/api/payments/admin/all`, {
                params,
                headers: authHeaders(),
            });
            setPayments(res.data.payments || []);
            setPayPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
            setStats(res.data.stats || { totalRevenue: 0, totalTransactions: 0, avgTransactionValue: 0 });
        } catch (err) {
            console.error('Failed to load payments:', err);
        } finally {
            setLoading(false);
        }
    }, [authHeaders, search, filterStatus, filterPlan]);

    useEffect(() => {
        if (activeTab === 'subscriptions') fetchSubscriptions();
        else fetchPayments();
    }, [activeTab, fetchSubscriptions, fetchPayments]);

    const handleDownloadInvoice = async (paymentId) => {
        try {
            const res = await axios.get(`${API_URL}/api/payments/invoice/${paymentId}`, {
                headers: authHeaders(),
            });
            generateInvoicePDF(res.data.payment);
        } catch (err) {
            console.error('Invoice download failed:', err);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (activeTab === 'subscriptions') fetchSubscriptions();
        else fetchPayments();
    };

    const totalActive = (planCounts.basic || 0) + (planCounts.standard || 0) + (planCounts.premium || 0);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-[#1e1e2d] flex items-center gap-2">
                    <FiPackage className="text-[#4960B2]" /> Subscription Management
                </h1>
                <p className="text-gray-500 text-sm mt-1">Monitor all seller subscriptions, payments and revenue</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Revenue', value: formatInr(stats.totalRevenue), icon: <FiDollarSign className="text-emerald-600" />, bg: 'bg-emerald-50' },
                    { label: 'Transactions', value: stats.totalTransactions, icon: <FiCreditCard className="text-[#4960B2]" />, bg: 'bg-[#f0f4ff]' },
                    { label: 'Active Subs', value: totalActive, icon: <FiUsers className="text-amber-600" />, bg: 'bg-amber-50' },
                    { label: 'Avg. Value', value: formatInr(Math.round(stats.avgTransactionValue)), icon: <FiTrendingUp className="text-purple-600" />, bg: 'bg-purple-50' },
                ].map((card) => (
                    <div key={card.label} className={`${card.bg} rounded-2xl p-4 border border-gray-100`}>
                        <div className="flex items-center gap-2 mb-1">
                            {card.icon}
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{card.label}</span>
                        </div>
                        <p className="text-xl font-black text-[#1e1e2d]">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Plan distribution mini-badges */}
            <div className="flex flex-wrap gap-2 mb-6">
                {['basic', 'standard', 'premium'].map((plan) => (
                    <span key={plan} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${PLAN_COLORS[plan].badge} border`}>
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${PLAN_COLORS[plan].gradient}`} />
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}: {planCounts[plan] || 0}
                    </span>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
                {[
                    { key: 'subscriptions', label: 'Subscriptions', icon: <FiPackage size={14} /> },
                    { key: 'payments', label: 'Payments', icon: <FiCreditCard size={14} /> },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab.key
                                ? 'bg-white text-[#4960B2] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Search & Filters */}
            <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder={activeTab === 'subscriptions' ? 'Search by seller name or email…' : 'Search by invoice, order or payment ID…'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#4960B2] focus:ring-2 focus:ring-[#4960B2]/20 text-sm"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium"
                >
                    <option value="">All Status</option>
                    {activeTab === 'subscriptions' ? (
                        <>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </>
                    ) : (
                        <>
                            <option value="paid">Paid</option>
                            <option value="created">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </>
                    )}
                </select>
                <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium"
                >
                    <option value="">All Plans</option>
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                </select>
                <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#4960B2] text-white font-bold text-sm hover:bg-[#3a4d91] transition flex items-center gap-1.5"
                >
                    <FiFilter size={14} /> Apply
                </button>
            </form>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-[#4960B2] border-t-transparent rounded-full" />
                </div>
            ) : activeTab === 'subscriptions' ? (
                /* ── SUBSCRIPTIONS TAB ── */
                <>
                    {subscriptions.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                            <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-lg font-bold text-[#1e1e2d] mb-2">No Subscriptions Found</h2>
                            <p className="text-gray-500 text-sm">No matching subscriptions for the current filters.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#fafbff] border-b border-gray-100">
                                            <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Seller</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Billing</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Start</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Expiry</th>
                                            <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Paid</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Coupon</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subscriptions.map((sub) => {
                                            const s = STATUS_CONFIG[sub.status] || STATUS_CONFIG.cancelled;
                                            const pc = PLAN_COLORS[sub.plan] || PLAN_COLORS.basic;
                                            const isExpanding = expandedId === sub._id;
                                            const payment = sub.payment;

                                            return (
                                                <React.Fragment key={sub._id}>
                                                    <tr
                                                        className="border-b border-gray-50 hover:bg-[#fafbff] transition cursor-pointer"
                                                        onClick={() => setExpandedId(isExpanding ? null : sub._id)}
                                                    >
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4960B2] to-[#3b4f98] flex items-center justify-center text-white text-xs font-black shrink-0">
                                                                    {(sub.seller?.name || '?')[0].toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-[#1e1e2d] text-sm truncate">{sub.seller?.name || '—'}</p>
                                                                    <p className="text-xs text-gray-400 truncate">{sub.seller?.email || ''}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${pc.badge}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${pc.gradient}`} />
                                                                {sub.plan?.charAt(0).toUpperCase() + sub.plan?.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-gray-600">{sub.billingCycle === 'annual' ? 'Annual' : 'Monthly'}</td>
                                                        <td className="px-4 py-3.5">
                                                            <span className={`inline-flex items-center gap-1 text-xs font-bold ${s.bg} ${s.text} border ${s.border} px-2.5 py-1 rounded-full`}>
                                                                {s.icon} {s.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-gray-600 text-xs">{formatDate(sub.startDate)}</td>
                                                        <td className="px-4 py-3.5 text-gray-600 text-xs">{formatDate(sub.expiryDate)}</td>
                                                        <td className="px-4 py-3.5 text-right font-bold text-[#1e1e2d]">{formatInr(sub.amountPaid)}</td>
                                                        <td className="px-4 py-3.5">
                                                            {sub.couponCode ? (
                                                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                                    <FiTag size={10} /> {sub.couponCode}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-300">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            {payment && payment.status === 'paid' ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(payment._id); }}
                                                                    className="w-8 h-8 rounded-lg bg-[#f0f4ff] hover:bg-[#4960B2] hover:text-white text-[#4960B2] flex items-center justify-center transition-colors mx-auto"
                                                                    title="Download Invoice"
                                                                >
                                                                    <FiDownload size={14} />
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-gray-300">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {isExpanding && payment && (
                                                        <tr className="bg-[#fafbff]">
                                                            <td colSpan={9} className="px-5 py-4">
                                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                                                                    <div>
                                                                        <p className="font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice #</p>
                                                                        <p className="font-semibold text-[#1e1e2d]">{payment.invoiceNumber || '—'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-400 uppercase tracking-wider mb-1">Subtotal</p>
                                                                        <p className="font-semibold">{formatInr(payment.baseAmount)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-400 uppercase tracking-wider mb-1">Discount</p>
                                                                        <p className="font-semibold text-emerald-600">
                                                                            {payment.discountAmount > 0 ? `−${formatInr(payment.discountAmount)}` : '—'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-400 uppercase tracking-wider mb-1">Razorpay ID</p>
                                                                        <p className="font-mono text-[10px] text-gray-500 truncate">{payment.razorpayPaymentId || '—'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-400 uppercase tracking-wider mb-1">Paid On</p>
                                                                        <p className="font-semibold">{formatDateTime(payment.paidAt)}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {subPagination.pages > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                                    <p className="text-xs text-gray-500">
                                        Page {subPagination.page} of {subPagination.pages} · {subPagination.total} subscriptions
                                    </p>
                                    <div className="flex gap-2">
                                        <button disabled={subPagination.page <= 1} onClick={() => fetchSubscriptions(subPagination.page - 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 text-sm"><FiChevronLeft /></button>
                                        <button disabled={subPagination.page >= subPagination.pages} onClick={() => fetchSubscriptions(subPagination.page + 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 text-sm"><FiChevronRight /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* ── PAYMENTS TAB ── */
                <>
                    {payments.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                            <FiCreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-lg font-bold text-[#1e1e2d] mb-2">No Payments Found</h2>
                            <p className="text-gray-500 text-sm">No matching payments for the current filters.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#fafbff] border-b border-gray-100">
                                            <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Seller</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Base</th>
                                            <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Discount</th>
                                            <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Paid</th>
                                            <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((pay) => {
                                            const ps = PAY_STATUS[pay.status] || PAY_STATUS.created;
                                            const pc = PLAN_COLORS[pay.plan] || PLAN_COLORS.basic;

                                            return (
                                                <tr key={pay._id} className="border-b border-gray-50 hover:bg-[#fafbff] transition">
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4960B2] to-[#3b4f98] flex items-center justify-center text-white text-xs font-black shrink-0">
                                                                {(pay.seller?.name || '?')[0].toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-[#1e1e2d] text-sm truncate">{pay.seller?.name || '—'}</p>
                                                                <p className="text-xs text-gray-400 truncate">{pay.seller?.email || ''}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-mono text-xs text-gray-600">{pay.invoiceNumber || '—'}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${pc.badge}`}>
                                                            {pay.plan?.charAt(0).toUpperCase() + pay.plan?.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${ps.bg} ${ps.text} border ${ps.border} px-2 py-0.5 rounded-full`}>
                                                            {ps.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-xs text-gray-600">{formatDate(pay.paidAt || pay.createdAt)}</td>
                                                    <td className="px-4 py-3.5 text-right text-gray-600">{formatInr(pay.baseAmount)}</td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        {pay.discountAmount > 0 ? (
                                                            <span className="text-emerald-600 font-semibold">−{formatInr(pay.discountAmount)}</span>
                                                        ) : (
                                                            <span className="text-gray-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-black text-[#4960B2]">{formatInr(pay.finalAmount)}</td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        {pay.status === 'paid' ? (
                                                            <button
                                                                onClick={() => handleDownloadInvoice(pay._id)}
                                                                className="w-8 h-8 rounded-lg bg-[#f0f4ff] hover:bg-[#4960B2] hover:text-white text-[#4960B2] flex items-center justify-center transition-colors mx-auto"
                                                                title="Download Invoice"
                                                            >
                                                                <FiDownload size={14} />
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-300">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {payPagination.pages > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                                    <p className="text-xs text-gray-500">
                                        Page {payPagination.page} of {payPagination.pages} · {payPagination.total} payments
                                    </p>
                                    <div className="flex gap-2">
                                        <button disabled={payPagination.page <= 1} onClick={() => fetchPayments(payPagination.page - 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 text-sm"><FiChevronLeft /></button>
                                        <button disabled={payPagination.page >= payPagination.pages} onClick={() => fetchPayments(payPagination.page + 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 text-sm"><FiChevronRight /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ManageSubscriptions;
