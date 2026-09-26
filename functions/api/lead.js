const CRM_WEBHOOK_URL = "https://wh.upviewcrm.com/api/webhooks/inbound/lead/freire-educacao/lp-imersao-luis";
const ATTRIBUTION_URL = "https://xtiagbrqakritwkpplyz.supabase.co/functions/v1/capture-lp-attribution";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });

export async function onRequestPost(context) {
  let data;
  try {
    data = await context.request.json();
  } catch {
    return json({ ok: false, error: "Payload inválido" }, 400);
  }

  const nome = String(data?.nome || "").trim();
  const telefone = String(data?.telefone || "").trim();

  if (!nome || !telefone) {
    return json({ ok: false, error: "Nome e WhatsApp são obrigatórios" }, 400);
  }

  const payload = {
    nome,
    telefone,
    utm_source: String(data?.utm_source || ""),
    utm_medium: String(data?.utm_medium || ""),
    utm_campaign: String(data?.utm_campaign || ""),
    utm_content: String(data?.utm_content || ""),
    utm_term: String(data?.utm_term || ""),
    utm_id: String(data?.utm_id || "")
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const upstream = await fetch(CRM_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!upstream.ok) {
      return json({
        ok: false,
        status: upstream.status,
        error: "O CRM não confirmou o recebimento do lead"
      }, 502);
    }

    const attributionPayload = {
      event_id: crypto.randomUUID(),
      page_key: "1mes1dia",
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      utm_content: payload.utm_content,
      utm_term: payload.utm_term,
      utm_id: payload.utm_id,
      crm_status: upstream.status
    };

    context.waitUntil(
      fetch(ATTRIBUTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(attributionPayload)
      }).catch(() => {})
    );

    return json({ ok: true, status: upstream.status });
  } catch (err) {
    return json({
      ok: false,
      error: err?.name === "AbortError"
        ? "Tempo limite ao enviar o lead"
        : "Não foi possível enviar o lead ao CRM"
    }, 502);
  } finally {
    clearTimeout(timer);
  }
}

export function onRequest(context) {
  if (context.request.method !== "POST") {
    return json({ ok: false, error: "Método não permitido" }, 405);
  }
  return onRequestPost(context);
}
