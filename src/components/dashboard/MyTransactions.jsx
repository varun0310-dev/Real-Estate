import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import {
    FiDownload, FiFileText, FiClock, FiCheckCircle, FiXCircle,
    FiChevronLeft, FiChevronRight, FiTag, FiCreditCard, FiCalendar,
    FiSearch, FiFilter, FiUser, FiDollarSign, FiTrendingUp,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatInr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_STYLES = {
    paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <FiCheckCircle size={12} />, label: 'Paid' },
    created: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <FiClock size={12} />, label: 'Pending' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <FiXCircle size={12} />, label: 'Failed' },
    refunded: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <FiCreditCard size={12} />, label: 'Refunded' },
};

const PLAN_COLORS = {
    basic: { gradient: 'from-gray-500 to-gray-600', badge: 'bg-gray-100 text-gray-700' },
    standard: { gradient: 'from-[#4960B2] to-[#3b4f98]', badge: 'bg-blue-50 text-[#4960B2]' },
    premium: { gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-50 text-amber-700' },
};

const generateInvoicePDF = (payment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header banner
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

    // Company info
    doc.setTextColor(30, 30, 45);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Real Estate Platform', 20, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Premium Property Listing Service', 20, 67);

    // Billing info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(73, 96, 178);
    doc.text('BILLED TO', 20, 82);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const sellerName = payment.seller?.name || 'Seller';
    const sellerEmail = payment.seller?.email || '';
    const sellerPhone = payment.seller?.phone || '';
    const sellerCompany = payment.seller?.companyName || '';
    let y = 90;
    doc.text(sellerName, 20, y); y += 6;
    if (sellerCompany) { doc.text(sellerCompany, 20, y); y += 6; }
    if (sellerEmail) { doc.text(sellerEmail, 20, y); y += 6; }
    if (sellerPhone) { doc.text(sellerPhone, 20, y); y += 6; }

    // Payment details
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

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 25;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, footerY + 5, { align: 'center' });

    doc.save(`Invoice_${payment.invoiceNumber || payment._id}.pdf`);
};

const MyTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [expandedId, setExpandedId] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPlan, setFilterPlan] = useState('');

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    const fetchTransactions = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 12 };
            if (search.trim()) params.search = search.trim();
            if (filterStatus) params.status = filterStatus;
            if (filterPlan) params.plan = filterPlan;

            const res = await axios.get(`${API_URL}/api/payments/my-transactions`, {
                params,
                headers: authHeaders(),
            });
            setTransactions(res.data.transactions || []);
            setIsSuperadmin(!!res.data.isSuperadmin);
            setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            console.error('Failed to load transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [authHeaders, search, filterStatus, filterPlan]);

    useEffect(() => {
        fetchTransactions(1);
    }, [fetchTransactions]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchTransactions(1);
    };

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

    const totalRevenue = transactions
        .filter((t) => t.status === 'paid')
        .reduce((sum, t) => sum + (t.finalAmount || 0), 0);

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-[#1e1e2d] flex items-center gap-2">
                    <FiCreditCard className="text-[#4960B2]" />
                    {isSuperadmin ? 'All Seller Transactions' : 'Transaction History'}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    {isSuperadmin
                        ? 'Monitor and manage all seller subscription transactions, payments, and invoices'
                        : 'View all your payment transactions and download invoices'}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#f0f4ff] rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                        <FiCreditCard className="text-[#4960B2]" />
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                            Total Payments
                        </span>
                    </div>
                    <p className="text-xl font-black text-[#1e1e2d]">{pagination.total}</p>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                        <FiDollarSign className="text-emerald-600" />
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                            {isSuperadmin ? 'Page Revenue' : 'Total Spent'}
                        </span>
                    </div>
                    <p className="text-xl font-black text-emerald-700">{formatInr(totalRevenue)}</p>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 mb-1">
                        <HiSparkles className="text-amber-500" />
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                            Paid Status
                        </span>
                    </div>
                    <p className="text-xl font-black text-amber-700">
                        {transactions.filter((t) => t.status === 'paid').length} Paid
                    </p>
                </div>

                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                        <FiCalendar className="text-purple-600" />
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                            Latest Date
                        </span>
                    </div>
                    <p className="text-sm font-black text-purple-900 truncate">
                        {transactions[0]?.paidAt ? formatDate(transactions[0].paidAt) : '—'}
                    </p>
                </div>
            </div>

            {/* Search and Filters (Visible for all, extra search options for Superadmin) */}
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[220px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                        type="text"
                        placeholder={
                            isSuperadmin
                                ? 'Search by seller name, email, invoice #, or payment ID…'
                                : 'Search by invoice # or payment ID…'
                        }
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#4960B2] focus:ring-2 focus:ring-[#4960B2]/20 text-sm"
                    />
                </div>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium"
                >
                    <option value="">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="created">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                </select>

                <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium"
                >
                    <option value="">All Packages</option>
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                </select>

                <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#4960B2] text-white font-bold text-sm hover:bg-[#3a4d91] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                    <FiFilter size={14} /> Filter
                </button>
            </form>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-[#4960B2] border-t-transparent rounded-full" />
                </div>
            ) : transactions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-[#1e1e2d] mb-2">No Transactions Found</h2>
                    <p className="text-gray-500 text-sm">
                        {isSuperadmin
                            ? 'No payment transactions matched your filters.'
                            : 'Your payment history will appear here after your first subscription.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-[#fafbff] border-b border-gray-100">
                                    {isSuperadmin && (
                                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Seller</th>
                                    )}
                                    <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice #</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Package</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Billing</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Base</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Discount</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Paid</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.map((txn) => {
                                    const s = STATUS_STYLES[txn.status] || STATUS_STYLES.created;
                                    const pc = PLAN_COLORS[txn.plan] || PLAN_COLORS.basic;
                                    const isExpanded = expandedId === txn._id;

                                    return (
                                        <React.Fragment key={txn._id}>
                                            <tr
                                                onClick={() => setExpandedId(isExpanded ? null : txn._id)}
                                                className="hover:bg-blue-50/25 transition cursor-pointer"
                                            >
                                                {/* Seller column (Superadmin only) */}
                                                {isSuperadmin && (
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4960B2] to-[#3b4f98] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                                {(txn.seller?.name || 'S').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-gray-900 text-xs truncate">
                                                                    {txn.seller?.name || 'Unknown Seller'}
                                                                </p>
                                                                <p className="text-[11px] text-gray-400 truncate">
                                                                    {txn.seller?.companyName || txn.seller?.email || '—'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}

                                                {/* Invoice # */}
                                                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-800">
                                                    {txn.invoiceNumber ? (
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[#0D1C44]">
                                                            {txn.invoiceNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">Pending</span>
                                                    )}
                                                </td>

                                                {/* Plan */}
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${pc.badge}`}>
                                                        {txn.planName || txn.plan?.charAt(0).toUpperCase() + txn.plan?.slice(1)}
                                                    </span>
                                                </td>

                                                {/* Billing */}
                                                <td className="px-4 py-3.5 text-xs text-gray-600 capitalize">
                                                    {txn.billingCycle || 'Monthly'}
                                                </td>

                                                {/* Date */}
                                                <td className="px-4 py-3.5 text-xs text-gray-600">
                                                    {formatDate(txn.paidAt || txn.createdAt)}
                                                </td>

                                                {/* Base */}
                                                <td className="px-4 py-3.5 text-right text-xs text-gray-600 font-medium">
                                                    {formatInr(txn.baseAmount)}
                                                </td>

                                                {/* Discount */}
                                                <td className="px-4 py-3.5 text-right text-xs">
                                                    {txn.discountAmount > 0 ? (
                                                        <span className="text-emerald-600 font-semibold">
                                                            −{formatInr(txn.discountAmount)}
                                                            {txn.couponCode && (
                                                                <span className="block text-[10px] text-gray-400">
                                                                    ({txn.couponCode})
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>

                                                {/* Final Amount */}
                                                <td className="px-4 py-3.5 text-right font-black text-sm text-[#4960B2]">
                                                    {formatInr(txn.finalAmount)}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${s.bg} ${s.text} border ${s.border} px-2.5 py-1 rounded-full`}>
                                                        {s.icon} {s.label}
                                                    </span>
                                                </td>

                                                {/* Invoice Download */}
                                                <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                    {txn.status === 'paid' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadInvoice(txn._id)}
                                                            className="w-8 h-8 rounded-lg bg-[#f0f4ff] hover:bg-[#4960B2] hover:text-white text-[#4960B2] flex items-center justify-center transition-colors mx-auto cursor-pointer shadow-sm"
                                                            title="Download PDF Invoice"
                                                        >
                                                            <FiDownload size={14} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-300">—</span>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* Expanded details row */}
                                            {isExpanded && (
                                                <tr className="bg-[#fcfdff]">
                                                    <td colSpan={isSuperadmin ? 10 : 9} className="px-5 py-4 border-b border-gray-100">
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs bg-white p-4 rounded-xl border border-gray-100 shadow-inner">
                                                            <div>
                                                                <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Order ID</p>
                                                                <p className="font-mono text-gray-700 truncate">{txn.razorpayOrderId || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Payment ID</p>
                                                                <p className="font-mono text-gray-700 truncate">{txn.razorpayPaymentId || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Paid Exact Time</p>
                                                                <p className="font-medium text-gray-700">{formatDateTime(txn.paidAt || txn.createdAt)}</p>
                                                            </div>
                                                            {isSuperadmin && txn.seller?.email && (
                                                                <div>
                                                                    <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Seller Email</p>
                                                                    <p className="font-medium text-gray-700 truncate">{txn.seller.email}</p>
                                                                </div>
                                                            )}
                                                            {isSuperadmin && txn.seller?.phone && (
                                                                <div>
                                                                    <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Seller Phone</p>
                                                                    <p className="font-medium text-gray-700">{txn.seller.phone}</p>
                                                                </div>
                                                            )}
                                                            {txn.couponCode && (
                                                                <div>
                                                                    <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Coupon Redeemed</p>
                                                                    <p className="font-bold text-emerald-600">{txn.couponCode}</p>
                                                                </div>
                                                            )}
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
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                                Page {pagination.page} of {pagination.pages} · {pagination.total} transactions
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={pagination.page <= 1}
                                    onClick={() => fetchTransactions(pagination.page - 1)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-bold hover:bg-gray-50 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
                                >
                                    <FiChevronLeft size={13} /> Prev
                                </button>
                                <button
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => fetchTransactions(pagination.page + 1)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-bold hover:bg-gray-50 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
                                >
                                    Next <FiChevronRight size={13} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyTransactions;
