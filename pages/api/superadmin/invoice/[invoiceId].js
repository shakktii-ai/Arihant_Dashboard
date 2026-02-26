import dbConnect from "../../../../lib/db";
import Invoice from "../../../../models/Invoice";
import { verifyTokenFromReq } from "../../../../lib/verifyToken";
import PDFDocument from "pdfkit";

function formatCurrency(amount) {
  return `Rs. ${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;
}


export default async function handler(req, res) {
  await dbConnect();

  const user = verifyTokenFromReq(req);
  if (!user) return res.status(401).json({ success: false });

  const { invoiceId } = req.query;
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    return res.status(404).json({ success: false });
  }

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${invoice.invoiceNumber}.pdf`
  );

  doc.pipe(res);

  /* ================= HEADER ================= */

  doc
    .font("Times-Bold")
    .fontSize(15)
    .text("INVOICE", { align: "left" });

  doc
    .font("Times-Roman")
    .fontSize(11)
    .text(`Invoice No: ${invoice.invoiceNumber}`)
    .text(`Invoice Date: ${new Date(invoice.issuedAt).toLocaleDateString("en-IN")}`);

  doc.moveUp(3);

  doc
    .font("Times-Bold")
    .fontSize(12)
    .text("Shakktii AI Technologies Pvt Ltd", { align: "right" });

  doc
    .font("Times-Roman")
    .fontSize(10)
    .text("Pune, Maharashtra - 411001", { align: "right" })
    .text("GSTIN: 27ABCDE1234F1Z5", { align: "right" })
    .text("Email: billing@yourcompany.com", { align: "right" });

  doc.moveDown(3);

  /* ================= BILL TO ================= */

  const leftX = 50;
  const rightX = 330;

  doc.font("Times-Bold").fontSize(12).text("Bill To:", leftX);
  doc.moveDown(0.5);

  doc
    .font("Times-Roman")
    .fontSize(11)
    .text(invoice.companyName, leftX)
    .text(invoice.billingAddress, leftX);

  doc.moveUp(4);

  doc.font("Times-Bold").text("Order:", rightX);
  doc.moveDown(0.5);

  doc
    .font("Times-Roman")
    .text(`Payment Status: ${invoice.paymentStatus}`, rightX)
    .text("Status: Paid", rightX);

  doc.moveDown(3);

  /* ================= TABLE ================= */

  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 300;
  const col3 = 360;
  const col4 = 430;

  // Header
  doc.font("Times-Bold").fontSize(11);
  doc.text("Product", col1, tableTop);
  doc.text("Qty", col2, tableTop);
  doc.text("Rate", col3, tableTop);
  doc.text("Total", col4, tableTop);

  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let y = tableTop + 25;

  // Rows
  doc.font("Times-Roman").fontSize(11);

  invoice.items.forEach((item) => {
    doc.text(item.description, col1, y);
    doc.text(String(item.quantity), col2, y);
    doc.text(formatCurrency(item.unitPrice), col3, y);
    doc.text(formatCurrency(item.total), col4, y);
    y += 22;
  });

  doc.moveTo(50, y).lineTo(550, y).stroke();

  y += 25;

  /* ================= TOTALS ================= */

  doc.font("Times-Roman").fontSize(11);

  doc.text(`Subtotal:`, 400, y);
  doc.text(formatCurrency(invoice.subTotal), 480, y, { align: "right" });

  y += 18;

  doc.text(`GST (${invoice.gstRate}%):`, 400, y);
  doc.text(formatCurrency(invoice.gstAmount), 480, y, { align: "right" });

  y += 18;

  doc.font("Times-Bold").fontSize(12);
  doc.text(`Grand Total:`, 400, y);
  doc.text(formatCurrency(invoice.grandTotal), 480, y, { align: "right" });

  y += 40;

  /* ================= DECLARATION ================= */

  doc
    .font("Times-Italic")
    .fontSize(10)
    .text(
      "We declare that this invoice shows the actual price and that all particulars are true and correct.",
      50,
      y,
      { width: 500 }
    );

  y += 70;

  doc
    .font("Times-Roman")
    .fontSize(11)
    .text("For Shakktii AI Technologies Pvt Ltd", 350, y);

  doc.text("Authorized Signatory", 350, y + 25);

  doc.end();
}
