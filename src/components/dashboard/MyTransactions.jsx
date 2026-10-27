import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { FiDownload, FiFileText, FiClock, FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight, FiTag, FiCreditCard, FiCalendar } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatInr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_STYLES = {
    paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <FiCheckCircle />, label: 'Paid' },
    created: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <FiClock />, label: 'Pending' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <FiXCircle />, label: 'Failed' },
    refunded: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <FiCreditCard />, label: 'Refunded' },
};

const PLAN_COLORS = {
    basic: 'from-gray-500 to-gray-600',
    standard: 'from-[#4960B2] to-[#3b4f98]',
    premium: 'from-amber-500 to-orange-500',
};

const generateInvoicePDF = (payment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
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
    doc.setFontSize(10);
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

    // Line items table
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
        headStyles: {
            fillColor: [73, 96, 178],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
        },
        bodyStyles: { fontSize: 10, textColor: [60, 60, 60] },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        margin: { left: 20, right: 20 },
        theme: 'grid',
        styles: { cellPadding: 6 },
    });

    // Total section
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
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [expandedId, setExpandedId] = useState(null);

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    const fetchTransactions = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/payments/my-transactions`, {
                params: { page, limit: 10 },
                headers: authHeaders(),
            });
            setTransactions(res.data.transactions || []);
            setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            console.error('Failed to load transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-[#4960B2] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-[#1e1e2d] flex items-center gap-2">
                    <FiCreditCard className="text-[#4960B2]" /> Transaction History
                </h1>
                <p className="text-gray-500 text-sm mt-1">View all your payment transactions and download invoices</p>
            </div>

            {transactions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-[#1e1e2d] mb-2">No Transactions Yet</h2>
                    <p className="text-gray-500 text-sm">Your payment history will appear here after your first subscription.</p>
                </div>
            ) : (
                <>
                    {/* Summary Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {[
                            {
                                label: 'Total Payments',
                                value: pagination.total,
                                icon: <FiCreditCard className="text-[#4960B2]" />,
                                bg: 'bg-[#f0f4ff]',
                            },
                            {
                                label: 'Total Spent',
                                value: formatInr(transactions.reduce((acc, t) => acc + (t.finalAmount || 0), 0)),
                                icon: <HiSparkles className="text-amber-500" />,
                                bg: 'bg-amber-50',
                            },
                            {
                                label: 'Last Payment',
                                value: formatDate(transactions[0]?.paidAt),
                                icon: <FiCalendar className="text-emerald-600" />,
                                bg: 'bg-emerald-50',
                            },
                        ].map((card) => (
                            <div key={card.label} className={`${card.bg} rounded-2xl p-5 border border-gray-100`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {card.icon}
                                    <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">{card.label}</span>
                                </div>
                                <p className="text-xl font-black text-[#1e1e2d]">{card.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Transaction List */}
                    <div className="space-y-3">
                        {transactions.map((txn) => {
                            const s = STATUS_STYLES[txn.status] || STATUS_STYLES.created;
                            const isExpanded = expandedId === txn._id;

                            return (
                                <div
                                    key={txn._id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {/* Main row */}
                                    <div
                                        className="flex items-center gap-4 p-5 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : txn._id)}
                                    >
                                        {/* Plan badge */}
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${PLAN_COLORS[txn.plan] || PLAN_COLORS.basic} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                                            {(txn.plan || '?')[0].toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[#1e1e2d] text-sm truncate">
                                                {txn.planName || txn.plan}
                                                <span className="text-gray-400 font-normal ml-2">
                                                    · {txn.billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {formatDateTime(txn.paidAt || txn.createdAt)}
                                                {txn.invoiceNumber && <span className="ml-2">· {txn.invoiceNumber}</span>}
                                            </p>
                                        </div>

                                        {/* Coupon */}
                                        {txn.couponCode && (
                                            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                                                <FiTag size={10} /> {txn.couponCode}
                                            </span>
                                        )}

                                        {/* Amount */}
                                        <span className="font-black text-[#1e1e2d] text-sm whitespace-nowrap">
                                            {formatInr(txn.finalAmount)}
                                        </span>

                                        {/* Status */}
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${s.bg} ${s.text} border ${s.border} px-2.5 py-1 rounded-full`}>
                                            {s.icon} {s.label}
                                        </span>

                                        {/* Download */}
                                        {txn.status === 'paid' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(txn._id); }}
                                                className="w-9 h-9 rounded-xl bg-[#f0f4ff] hover:bg-[#4960B2] hover:text-white text-[#4960B2] flex items-center justify-center transition-colors shrink-0"
                                                title="Download Invoice"
                                            >
                                                <FiDownload size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-50 bg-[#fafbff] px-5 py-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Subtotal</p>
                                                    <p className="font-semibold text-[#1e1e2d]">{formatInr(txn.baseAmount)}</p>
                                                </div>
                                                {txn.discountAmount > 0 && (
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Discount</p>
                                                        <p className="font-semibold text-emerald-600">
                                                            −{formatInr(txn.discountAmount)}
                                                            {txn.couponDiscountType === 'percentage' && (
                                                                <span className="text-gray-400 ml-1">({txn.couponDiscountValue}%)</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Paid</p>
                                                    <p className="font-black text-[#4960B2]">{formatInr(txn.finalAmount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Razorpay ID</p>
                                                    <p className="font-mono text-xs text-gray-500 truncate">{txn.razorpayPaymentId || '—'}</p>
                                                </div>
                                                {txn.subscription && (
                                                    <>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sub. Start</p>
                                                            <p className="font-semibold">{formatDate(txn.subscription.startDate)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sub. Expiry</p>
                                                            <p className="font-semibold">{formatDate(txn.subscription.expiryDate)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sub. Status</p>
                                                            <p className={`font-bold ${txn.subscription.status === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                {txn.subscription.status?.charAt(0).toUpperCase() + txn.subscription.status?.slice(1)}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.pages} · {pagination.total} transactions
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={pagination.page <= 1}
                                    onClick={() => fetchTransactions(pagination.page - 1)}
                                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition"
                                >
                                    <FiChevronLeft size={16} />
                                </button>
                                <button
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => fetchTransactions(pagination.page + 1)}
                                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition"
                                >
                                    <FiChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MyTransactions;
