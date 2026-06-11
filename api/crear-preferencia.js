export default async function handler(req, res) {
  // Configuración de CORS (Excelente para conectar tu frontend de GitHub Pages)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No se recibieron artículos válidos.' });
    }

    // Mapeo seguro de los artículos
    const preferenceBody = {
      items: items.map(item => {
        const price = Number(item.unit_price);
        // Pequeña validación: si el precio no es válido o es menor a 0, le asignamos 0 por seguridad
        const safePrice = isNaN(price) || price < 0 ? 0 : parseFloat(price.toFixed(2));

        return {
          title: String(item.title || 'Producto Aromesence'),
          unit_price: safePrice,
          quantity: Number(item.quantity) || 1,
          currency_id: 'MXN'
        };
      }),
      // Modificado para que tu frontend en main.js pueda leer si fue éxito o fallo mediante parámetros de la URL
      back_urls: {
        success: 'https://ghuser06.github.io/aromesence-web/?status=success',
        failure: 'https://ghuser06.github.io/aromesence-web/?status=failure',
        pending: 'https://ghuser06.github.io/aromesence-web/?status=pending'
      },
      auto_return: 'approved'
    };

    // Petición nativa a la API de Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` // ¡Asegúrate de que se llame igual en Vercel!
      },
      body: JSON.stringify(preferenceBody)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      return res.status(mpResponse.status).json({
        error: 'Error al crear la preferencia en Mercado Pago',
        details: mpData
      });
    }

    // Retornas los puntos de inicio necesarios para los Bricks o el Checkout Pro
    return res.status(200).json({
      id: mpData.id,
      init_point: mpData.init_point
    });

  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}