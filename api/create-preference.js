export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { amount, userEmail, userId } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  const ACCESS_TOKEN = "APP_USR-5151362978174446-040901-415d2c0c39450b1fa73adfcb384c1ac3-3324730120";

  const preference = {
    items: [{
      title: "Depósito - Invest App",
      quantity: 1,
      currency_id: "ARS",
      unit_price: parseFloat(amount),
    }],
    payer: { email: userEmail },
    external_reference: userId,
    back_urls: {
      success: "https://invest-app-dusky.vercel.app?deposit=success",
      failure: "https://invest-app-dusky.vercel.app?deposit=failure",
      pending: "https://invest-app-dusky.vercel.app?deposit=pending",
    },
    auto_return: "approved",
    notification_url: "https://invest-app-dusky.vercel.app/api/mp-webhook",
  };

  try {
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await r.json();

    if (data.id) {
      res.status(200).json({ 
        preferenceId: data.id,
        initPoint: data.sandbox_init_point 
      });
    } else {
      res.status(500).json({ error: data });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}