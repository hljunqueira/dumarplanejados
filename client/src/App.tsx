import React, { useEffect } from "react";
import { Router, Route } from "wouter";
import HomePage from "@/pages/home-page";
import BudgetPage from "@/pages/budget-page";
import AppointmentPage from "@/pages/appointment-page";
import ContactPage from "@/pages/contact-page";
import CRMPage from "@/pages/crm-page";

import { captureAndStoreUtms } from "@/lib/utm-tracker";

export default function App() {
  useEffect(() => {
    // Captura e armazena automaticamente parâmetros do Google Ads (gclid, gad_source, utm_source, referrer)
    captureAndStoreUtms();
  }, []);

  return (
    <>
      <div className="noise-overlay" />
      <Router>
        <Route path="/" component={HomePage} />
        <Route path="/orcamento" component={BudgetPage} />
        <Route path="/agendamento" component={AppointmentPage} />
        <Route path="/contato" component={ContactPage} />
        <Route path="/crm/:section?" component={CRMPage} />
        <Route path="/crm" component={CRMPage} />
      </Router>
    </>
  );
}
