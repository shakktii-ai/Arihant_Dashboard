export async function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const timestamp = Date.now();
  return `INV-${year}-${timestamp}`;
}
