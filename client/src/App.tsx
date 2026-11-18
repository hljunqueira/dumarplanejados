import React, { useEffect, Suspense, lazy } from "react";
import { Router, Route } from "wouter";
import HomePage from "@/pages/home-page";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { Toaster } from "@/components/ui/toaster";
import { captureAndStoreUtms } from "@/lib/utm-tracker";

// Code-splitting: Landing page carrega instantaneamente, CRM e páginas secundárias carregam sob demanda
const BudgetPage = lazy(() => import("@/pages/budget-page"));
const AppointmentPage = lazy(() => import("@/pages/appointment-page"));
const ContactPage = lazy(() => import("@/pages/contact-page"));
const CRMPage = lazy(() => import("@/pages/crm-page"));

function PageLoading() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center text-amber-400 font-sans text-xs">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 tracking-wider uppercase text-[10px]">Carregando módulo...</span>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Captura e armazena automaticamente parâmetros do Google Ads (gclid, gad_source, utm_source, referrer)
    captureAndStoreUtms();
  }, []);

  return (
    <ConfirmDialogProvider>
      <div className="noise-overlay" />
      <Suspense fallback={<PageLoading />}>
        <Router>
          <Route path="/" component={HomePage} />
          <Route path="/orcamento" component={BudgetPage} />
          <Route path="/agendamento" component={AppointmentPage} />
          <Route path="/contato" component={ContactPage} />
          <Route path="/crm/:section?" component={CRMPage} />
          <Route path="/crm" component={CRMPage} />
        </Router>
      </Suspense>
      <Toaster />
    </ConfirmDialogProvider>
  );
}

