// Helper Inteligente de Rastreamento de UTM e Google Ads
export function captureAndStoreUtms() {
  if (typeof window === "undefined") return;

  try {
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get("gclid") || params.get("gad_source") || params.get("gbraid") || params.get("wbraid");
    let rawSource = params.get("utm_source");
    let rawCampaign = params.get("utm_campaign") || params.get("utm_medium") || "Google Ads Search";

    const referrer = document.referrer.toLowerCase();

    // Se detectado gclid, gad_source ou utm_source relacionado ao Google Ads
    if (gclid || (rawSource && /google|gads|cpc|adwords|search/i.test(rawSource)) || referrer.includes("google.")) {
      rawSource = "Google Ads";
      if (!rawCampaign || rawCampaign === "Site Direto") {
        rawCampaign = "Pesquisa Google Ads";
      }
    } else if (rawSource && /insta|ig|facebook|fb/i.test(rawSource)) {
      rawSource = "Instagram Ads";
    } else if (!rawSource) {
      const existing = sessionStorage.getItem("utm_source") || localStorage.getItem("crm_utm_source");
      if (existing) {
        rawSource = existing;
      } else {
        rawSource = "Google Ads";
      }
    }

    // Normalizar para os padrões do Kanban
    let normalizedSource = rawSource;
    if (/google/i.test(rawSource)) normalizedSource = "Google Ads";
    else if (/insta|facebook/i.test(rawSource)) normalizedSource = "Instagram Ads";

    sessionStorage.setItem("utm_source", normalizedSource);
    localStorage.setItem("crm_utm_source", normalizedSource);

    if (rawCampaign) {
      sessionStorage.setItem("utm_campaign", rawCampaign);
      localStorage.setItem("crm_utm_campaign", rawCampaign);
    }
  } catch (e) {
    console.error("Erro ao capturar UTMs:", e);
  }
}

export function getStoredUtm(): { utmSource: string; utmCampaign: string } {
  let utmSource = "Google Ads";
  let utmCampaign = "Pesquisa Google Ads";

  try {
    utmSource = 
      sessionStorage.getItem("utm_source") || 
      localStorage.getItem("crm_utm_source") || 
      "Google Ads";

    utmCampaign = 
      sessionStorage.getItem("utm_campaign") || 
      localStorage.getItem("crm_utm_campaign") || 
      "Pesquisa Google Ads";
  } catch (e) {
    console.error("Erro ao obter UTMs salvas:", e);
  }

  return { utmSource, utmCampaign };
}

// Disparador de Conversão do Google Ads e Google Tag Manager
export function trackGoogleAdsConversion(actionName: string = "whatsapp_click") {
  if (typeof window === "undefined") return;

  try {
    const { utmSource, utmCampaign } = getStoredUtm();

    // 1. Google Ads Tag Direta (AW-17444188651)
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-17444188651",
        value: 1.0,
        currency: "BRL",
        event_callback: () => {
          console.log("Google Ads Conversion AW-17444188651 disparada com sucesso:", actionName);
        }
      });

      // Evento de Lead padrão do GA4/Google Ads
      (window as any).gtag("event", "generate_lead", {
        event_category: "Engagement",
        event_label: actionName,
        source: utmSource,
        campaign: utmCampaign
      });
    }

    // 2. Google Tag Manager DataLayer (GTM-WLSCGMKX)
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "conversion_lead_dumar",
        conversion_action: actionName,
        google_ads_id: "AW-17444188651",
        utm_source: utmSource,
        utm_campaign: utmCampaign,
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("Erro ao disparar conversão Google Ads:", err);
  }
}
