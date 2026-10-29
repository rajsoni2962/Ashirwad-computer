import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, deviceType, issueDescription, locality, brand } = body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid full name.' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    if (!deviceType || typeof deviceType !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please select a device type.' },
        { status: 400 }
      );
    }

    if (!issueDescription || typeof issueDescription !== 'string' || issueDescription.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'Please briefly describe the problem or service needed.' },
        { status: 400 }
      );
    }

    const inquiryId = `AT-REQ-${Date.now().toString().slice(-6)}`;
    const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Format message for WhatsApp
    const whatsappText = encodeURIComponent(
      `*New Service Inquiry — Ashirwad Technologies*\n` +
      `--------------------------------\n` +
      `*Ref No:* ${inquiryId}\n` +
      `*Customer:* ${name.trim()}\n` +
      `*Phone:* +91 ${cleanPhone.slice(-10)}\n` +
      `*Device:* ${deviceType} ${brand ? `(${brand})` : ''}\n` +
      `*Locality:* ${locality || 'Ahmedabad'}\n` +
      `*Issue Details:* ${issueDescription.trim()}\n` +
      `*Requested At:* ${formattedDate}\n` +
      `--------------------------------\n` +
      `Please provide estimated repair cost & turnaround time.`
    );

    const whatsappUrl = `https://wa.me/919662278994?text=${whatsappText}`;

    // Log inquiry for records
    console.log(`[CUSTOMER_SERVICE_INQUIRY] ID=${inquiryId} Name=${name.trim()} Device=${deviceType} Phone=${cleanPhone.slice(-10)}`);

    return NextResponse.json({
      success: true,
      message: 'Your repair & service inquiry has been registered. Our technician in Ahmedabad will reach out promptly.',
      data: {
        inquiryId,
        whatsappUrl,
        customerName: name.trim(),
        phone: cleanPhone.slice(-10),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to process service inquiry. Please call or WhatsApp us directly.' },
      { status: 500 }
    );
  }
}
