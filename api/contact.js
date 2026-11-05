const RECIPIENTS = ['sale@lando-import.ru', 'info@lando-import.ru'];

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function text(value) {
  return String(value ?? '').trim();
}

async function deliverTo(email, payload) {
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  const success = data.success === true || data.success === 'true';
  if (!response.ok || !success) {
    throw new Error(data.message || `FormSubmit ${response.status}`);
  }
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const body = readBody(req);
  if (text(body.company_url)) return res.status(200).json({ ok: true });

  const name = text(body.name);
  const phone = text(body.phone);
  const email = text(body.email);
  const route = text(body.route);
  const source = text(body.source) || 'Форма сайта';
  const page = text(body.page);

  if (!name || !phone) return res.status(400).json({ ok: false, error: 'required' });

  const payload = {
    Форма: source,
    Имя: name,
    Телефон: phone,
    _subject: text(body._subject) || `Ландо Импорт: ${source}`,
    _template: 'table',
    _captcha: 'false'
  };
  if (email) {
    payload.Email = email;
    payload._replyto = email;
  }
  if (route) payload.Маршрут = route;
  if (page) payload.Страница = page;

  const results = await Promise.allSettled(RECIPIENTS.map(recipient => deliverTo(recipient, payload)));
  if (!results.some(result => result.status === 'fulfilled')) {
    return res.status(502).json({ ok: false });
  }
  return res.status(200).json({ ok: true });
};
