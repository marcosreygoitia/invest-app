export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { type, data } = req.body;

  if (type !== "payment") return res.status(200).end();

  const ACCESS_TOKEN = "APP_USR-5151362978174446-040901-415d2c0c39450b1fa73adfcb384c1ac3-3324730120";
  const SUPABASE_URL = "https://wdazqkgmnexoqupdrqpr.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYXpxa2dtbmV4b3F1cGRycXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY5Nzc0OCwiZXhwIjoyMDkxMjczNzQ4fQ.zzwuXlSOW3ovqjtkAJb4Y8CrK6HJRWEu4RF0P8-v180";

  try {
    // Get payment details from MercadoPago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
    });
    const payment = await mpRes.json();

    if (payment.status !== "approved") return res.status(200).end();

    const userId = payment.external_reference;
    const amount = payment.transaction_amount;
    const date = new Date().toISOString().slice(0, 10);

    // Get current portfolio
    const portRes = await fetch(`${SUPABASE_URL}/rest/v1/portfolios?id=eq.${userId}`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    const portfolios = await portRes.json();
    const portfolio = portfolios[0];

    if (!portfolio) return res.status(404).end();

    const newInvested = (portfolio.invested || 0) + amount;
    const newCapital = (portfolio.capital || 0) + amount;

    // Update portfolio
    await fetch(`${SUPABASE_URL}/rest/v1/portfolios?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ invested: newInvested, capital: newCapital })
    });

    // Record transaction
    await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: userId,
        type: "deposit",
        amount,
        description: "Bank transfer via MercadoPago",
        date
      })
    });

    res.status(200).json({ success: true });
  } catch(e) {
    console.error("Webhook error:", e);
    res.status(500).end();
  }
}