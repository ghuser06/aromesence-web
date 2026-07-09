export default async function handler(req, res) {
  // Configuración de CORS — restringido al dominio de producción
  const allowedOrigins = [
    'https://ghuser06.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
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

    // Catálogo de precios autoritativo en el servidor — previene manipulación de precios
    const catalogoPreciosServidor = {
      'Bharara - Bharara King': 1850,
      'Versace - Eros': 1650,
      'Jean Paul Gaultier - Le Beau EDT': 1750,
      'Jean Paul Gaultier - Le Beau Le Parfum': 2100,
      'Jean Paul Gaultier - Le Beau Paradise Garden': 2200,
      'Jean Paul Gaultier - Le Male Elixir': 2350,
      'Jean Paul Gaultier - Scandal Pour Homme': 1950,
      'Jean Paul Gaultier - Scandal Le Parfum': 2150,
      'Paco Rabanne - Invictus': 1550,
      'Paco Rabanne - Invictus Victory Elixir': 2400,
      'Paco Rabanne - 1 Million': 1600,
      'Versace - Pour Homme': 1150,
      'Versace - Dylan Blue': 1350,
      'Dolce & Gabbana - K': 1550,
      'Montblanc - Explorer': 1200,
      'Montblanc - Starwalker': 1050,
      'Montblanc - Legend Spirit': 1100,
      'Carolina Herrera - 212 VIP Black': 1700,
      'Carolina Herrera - CH Men': 1450,
      'Carolina Herrera - Bad Boy': 1550,
      'Moschino - Toy Boy': 1300,
      'Halloween - Man': 650,
      'Halloween - Man Hero': 750,
      'Tommy Hilfiger - Tommy': 850,
      'Hugo Boss - Hugo Man': 1050,
      'Nautica - Voyage': 450,
      'Nautica - Voyage N-83': 500,
      'Nautica - Voyage Sport': 500,
      'Nautica - Classic': 450,
      'Perry Ellis - 360° Red': 550,
      'Calvin Klein - CK Be': 650,
      'Coach - For Men': 1100,
      'Lacoste - L.12.12 Blanc': 950,
      'Paris Hilton - For Men': 550,
    };

    // Validación segura de artículos contra catálogo del servidor
    const validatedItems = [];
    for (const item of items) {
      const title = String(item.title || '').trim();
      const catalogPrice = catalogoPreciosServidor[title];

      if (catalogPrice === undefined) {
        return res.status(400).json({ error: `Producto no reconocido: "${title}"` });
      }

      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

      validatedItems.push({
        title,
        unit_price: catalogPrice, // Siempre usa el precio del servidor
        quantity,
        currency_id: 'MXN'
      });
    }

    const preferenceBody = {
      items: validatedItems,
      // URLs de retorno para que el frontend pueda leer el resultado del pago
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