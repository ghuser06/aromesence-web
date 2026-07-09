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

    // Precios autoritativos desde Supabase (tabla `perfumes`) — única fuente de verdad.
    // La clave publishable solo permite lectura pública (RLS); se puede sobreescribir por env vars.
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ivsitbxbixqvllkcjbui.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_VkfErErpRg7sEeaKlFDuTw_wzd0GZhq';

    const supabaseResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/perfumes?select=marca,nombre,precio,stock`,
      { headers: { apikey: SUPABASE_KEY } }
    );

    if (!supabaseResponse.ok) {
      console.error('Error al consultar precios en Supabase:', supabaseResponse.status);
      return res.status(502).json({ error: 'No se pudo verificar el catálogo de precios.' });
    }

    const perfumes = await supabaseResponse.json();
    const catalogoPreciosServidor = {};
    for (const p of perfumes) {
      catalogoPreciosServidor[`${p.marca} - ${p.nombre}`] = Number(p.precio);
    }

    // Validación segura de artículos contra catálogo del servidor
    const validatedItems = [];
    for (const item of items) {
      const title = String(item.title || '').trim();
      const catalogPrice = catalogoPreciosServidor[title];

      if (catalogPrice === undefined || !Number.isFinite(catalogPrice)) {
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