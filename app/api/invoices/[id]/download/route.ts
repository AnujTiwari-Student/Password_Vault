import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/db';
import { jsPDF } from 'jspdf';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const invoiceId = params.id;

    const payment = await prisma.logs.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (payment.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (!payment.meta || typeof payment.meta !== 'object') {
      return NextResponse.json(
        { error: "Invalid invoice data" },
        { status: 400 }
      );
    }

    const meta = payment.meta as {
      planId?: string;
      billingCycle?: string;
      amount?: number;
      currency?: string;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
    };

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    let y = 40;
    
    doc.text(`Invoice #: ${invoiceId}`, 20, y);
    y += 7;
    doc.text(`Date: ${new Date(payment.ts).toLocaleDateString('en-IN')}`, 20, y);
    y += 7;
    doc.text(`Customer: ${payment.user.name || 'N/A'}`, 20, y);
    y += 7;
    doc.text(`Email: ${payment.user.email}`, 20, y);
    y += 15;
    
    doc.setFontSize(14);
    doc.text('Payment Details', 20, y);
    y += 10;
    
    doc.setFontSize(12);
    doc.text(`Plan: ${meta.planId || 'N/A'}`, 20, y);
    y += 7;
    doc.text(`Billing Cycle: ${meta.billingCycle || 'N/A'}`, 20, y);
    y += 7;
    doc.text(`Amount: ₹${meta.amount || 0}`, 20, y);
    y += 7;
    doc.text(`Currency: ${meta.currency || 'INR'}`, 20, y);
    y += 7;
    doc.text(`Payment ID: ${meta.razorpayPaymentId || 'N/A'}`, 20, y);
    y += 7;
    doc.text(`Order ID: ${meta.razorpayOrderId || 'N/A'}`, 20, y);
    y += 15;
    
    doc.setFontSize(16);
    doc.text(`Total: ₹${meta.amount || 0}`, 190, y, { align: 'right' });
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}