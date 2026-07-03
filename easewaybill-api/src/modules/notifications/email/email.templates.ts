// ── Base layout ───────────────────────────────────────────────────
function layout(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #16a34a; padding: 32px 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 4px; }
    .body { padding: 40px; }
    .body h2 { font-size: 20px; color: #111; margin-bottom: 16px; }
    .body p { font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 12px; }
    .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; margin: 24px 0; }
    .info-box table { width: 100%; border-collapse: collapse; }
    .info-box td { padding: 6px 0; font-size: 14px; }
    .info-box td:first-child { color: #666; width: 160px; }
    .info-box td:last-child { font-weight: 600; color: #111; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-yellow { background: #fef9c3; color: #ca8a04; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-blue { background: #dbeafe; color: #2563eb; }
    .cta { text-align: center; margin: 32px 0; }
    .cta a { background: #16a34a; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; line-height: 1.6; }
    .footer a { color: #6b7280; text-decoration: none; }
    .amount { font-size: 28px; font-weight: 700; color: #16a34a; text-align: center; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>EaseWaybill</h1>
      <p>Safe delivery. Secured payments.</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>
        This email was sent by EaseWaybill.<br />
        &copy; ${new Date().getFullYear()} EaseWaybill. All rights reserved.<br />
        <a href="#">Unsubscribe</a> &middot; <a href="#">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ── Templates ─────────────────────────────────────────────────────

export function orderConfirmedTemplate(data: {
  buyerName: string;
  trackingCode: string;
  sellerName: string;
  itemDescription: string;
  totalAmount: string;
  pickupAddress: string;
  deliveryAddress: string;
}): { subject: string; html: string } {
  const subject = `Order ${data.trackingCode} confirmed — complete your payment`;
  const html = layout(
    `
    <h2>You've confirmed an order</h2>
    <p>Hi <strong>${data.buyerName}</strong>,</p>
    <p>You've confirmed the order details. Please complete your payment to allow the seller to ship your goods.</p>
    <div class="info-box">
      <table>
        <tr><td>Order ID</td><td>${data.trackingCode}</td></tr>
        <tr><td>Seller</td><td>${data.sellerName}</td></tr>
        <tr><td>Item</td><td>${data.itemDescription}</td></tr>
        <tr><td>Delivery from</td><td>${data.pickupAddress}</td></tr>
        <tr><td>Delivery to</td><td>${data.deliveryAddress}</td></tr>
        <tr><td>Status</td><td><span class="badge badge-yellow">Awaiting Payment</span></td></tr>
      </table>
    </div>
    <div class="amount">₦${data.totalAmount}</div>
    <p>Your payment is protected by EaseWaybill escrow. Funds are only released to the seller after you confirm you are satisfied with your delivery.</p>
    <hr class="divider" />
    <p style="font-size: 13px; color: #888;">Track your order at any time using your order ID: <strong>${data.trackingCode}</strong></p>
    `,
    subject,
  );
  return { subject, html };
}

export function paymentReceivedTemplate(data: {
  sellerName: string;
  trackingCode: string;
  buyerName: string;
  itemDescription: string;
  amount: string;
  sellerPayout: string;
}): { subject: string; html: string } {
  const subject = `Payment received for order ${data.trackingCode} — ship now`;
  const html = layout(
    `
    <h2>Payment confirmed — time to ship!</h2>
    <p>Hi <strong>${data.sellerName}</strong>,</p>
    <p>Great news! The buyer has completed payment for order <strong>${data.trackingCode}</strong>. The funds are now secured in escrow.</p>
    <div class="info-box">
      <table>
        <tr><td>Order ID</td><td>${data.trackingCode}</td></tr>
        <tr><td>Buyer</td><td>${data.buyerName}</td></tr>
        <tr><td>Item</td><td>${data.itemDescription}</td></tr>
        <tr><td>Total paid</td><td>₦${data.amount}</td></tr>
        <tr><td>Your payout</td><td><strong>₦${data.sellerPayout}</strong></td></tr>
        <tr><td>Status</td><td><span class="badge badge-green">Escrow Funded</span></td></tr>
      </table>
    </div>
    <p>Please ship the goods as soon as possible. Once the buyer confirms delivery, the funds will be released to your bank account.</p>
    <hr class="divider" />
    <p style="font-size: 13px; color: #888;">Funds are held securely by EaseWaybill until the buyer confirms satisfaction.</p>
    `,
    subject,
  );
  return { subject, html };
}

export function paymentSuccessTemplate(data: {
  buyerName: string;
  trackingCode: string;
  amount: string;
  itemDescription: string;
  deliveryAddress: string;
}): { subject: string; html: string } {
  const subject = `Payment of ₦${data.amount} secured in escrow — order ${data.trackingCode}`;
  const html = layout(
    `
    <h2>Your payment is secured</h2>
    <p>Hi <strong>${data.buyerName}</strong>,</p>
    <p>Your payment has been received and is safely held in escrow. The seller will now ship your order.</p>
    <div class="info-box">
      <table>
        <tr><td>Order ID</td><td>${data.trackingCode}</td></tr>
        <tr><td>Item</td><td>${data.itemDescription}</td></tr>
        <tr><td>Amount secured</td><td><strong>₦${data.amount}</strong></td></tr>
        <tr><td>Delivery to</td><td>${data.deliveryAddress}</td></tr>
        <tr><td>Status</td><td><span class="badge badge-green">Payment Secured</span></td></tr>
      </table>
    </div>
    <p>Your funds will only be released to the seller after <strong>you confirm</strong> that you have received your order and are satisfied. If there is an issue, you can raise a dispute.</p>
    <hr class="divider" />
    <p style="font-size: 13px; color: #888;">Keep your order ID safe: <strong>${data.trackingCode}</strong></p>
    `,
    subject,
  );
  return { subject, html };
}

export function deliveryConfirmedTemplate(data: {
  buyerName: string;
  trackingCode: string;
  itemDescription: string;
  amount: string;
}): { subject: string; html: string } {
  const subject = `Order ${data.trackingCode} delivered — please confirm satisfaction`;
  const html = layout(
    `
    <h2>Your order has arrived!</h2>
    <p>Hi <strong>${data.buyerName}</strong>,</p>
    <p>Your order <strong>${data.trackingCode}</strong> has been delivered. Please confirm that you are satisfied with your delivery to release payment to the seller.</p>
    <div class="info-box">
      <table>
        <tr><td>Order ID</td><td>${data.trackingCode}</td></tr>
        <tr><td>Item</td><td>${data.itemDescription}</td></tr>
        <tr><td>Amount held</td><td>₦${data.amount}</td></tr>
        <tr><td>Status</td><td><span class="badge badge-blue">Delivered</span></td></tr>
      </table>
    </div>
    <p>If you are satisfied with your order, please mark it as complete. If there is an issue with the item, you can raise a dispute within 48 hours.</p>
    <p style="font-size: 13px; color: #e67e22;"><strong>Important:</strong> If you take no action within 48 hours, funds will be automatically released to the seller.</p>
    <hr class="divider" />
    <p style="font-size: 13px; color: #888;">Track order: <strong>${data.trackingCode}</strong></p>
    `,
    subject,
  );
  return { subject, html };
}

export function disputeRaisedTemplate(data: {
  recipientName: string;
  trackingCode: string;
  reason: string;
  description: string;
  isSeller: boolean;
}): { subject: string; html: string } {
  const subject = `Dispute raised on order ${data.trackingCode}`;
  const html = layout(
    `
    <h2>A dispute has been raised</h2>
    <p>Hi <strong>${data.recipientName}</strong>,</p>
    <p>${
      data.isSeller
        ? `A buyer has raised a dispute on your order <strong>${data.trackingCode}</strong>.`
        : `Your dispute for order <strong>${data.trackingCode}</strong> has been received.`
    }</p>
    <div class="info-box">
      <table>
        <tr><td>Order ID</td><td>${data.trackingCode}</td></tr>
        <tr><td>Reason</td><td>${data.reason.replace(/_/g, ' ')}</td></tr>
        <tr><td>Description</td><td>${data.description}</td></tr>
        <tr><td>Status</td><td><span class="badge badge-red">Under Review</span></td></tr>
      </table>
    </div>
    <p>Our team will review this dispute and reach out to both parties. Funds will remain in escrow until the dispute is resolved.</p>
    <hr class="divider" />
    <p style="font-size: 13px; color: #888;">Expected resolution time: 2-5 business days.</p>
    `,
    subject,
  );
  return { subject, html };
}

export function escrowReleasedTemplate(data: {
  sellerName: string;
  trackingCode: string;
  amount: string;
  buyerName: string;
}): { subject: string; html: string } {
  const subject = `₦${data.amount} released to your account — order ${data.trackingCode}`;
  const html = layout(
    `
    <h2>Funds released to your account</h2>
    <p>Hi <strong>${data.sellerName}</strong>,</p>
    <p>Great news! The buyer has confirmed satisfaction and your funds have been released.</p>
    <div class="info-box">
      <table>
        <tr><td>Order ID</td><td>${data.trackingCode}</td></tr>
        <tr><td>Buyer</td><td>${data.buyerName}</td></tr>
        <tr><td>Amount released</td><td><strong>₦${data.amount}</strong></td></tr>
        <tr><td>Status</td><td><span class="badge badge-green">Completed</span></td></tr>
      </table>
    </div>
    <div class="amount">₦${data.amount}</div>
    <p>The funds have been transferred to your registered bank account. Please allow 1-3 business days for it to reflect.</p>
    <hr class="divider" />
    <p style="font-size: 13px; color: #888;">Thank you for using EaseWaybill!</p>
    `,
    subject,
  );
  return { subject, html };
}
