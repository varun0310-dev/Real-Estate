import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatInr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const generateInvoicePDF = (payment) => {
    if (!payment) return;
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
    doc.text(`Status: ${(payment.status || 'PAID').toUpperCase()}`, pageWidth - 20, 35, { align: 'right' });

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
                `${payment.planName || payment.plan || 'Standard'} Subscription`,
                (payment.plan || 'Standard').charAt(0).toUpperCase() + (payment.plan || 'Standard').slice(1),
                payment.billingCycle === 'annual' ? 'Annual' : 'Monthly',
                formatInr(payment.baseAmount || payment.finalAmount),
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
            [{ content: 'Subtotal', styles: { fontStyle: 'bold' } }, formatInr(payment.baseAmount || payment.finalAmount)],
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

export default generateInvoicePDF;

