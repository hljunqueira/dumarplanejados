import { Router, Route } from "wouter";
import HomePage from "@/pages/home-page";
import BudgetPage from "@/pages/budget-page";
import AppointmentPage from "@/pages/appointment-page";
import ContactPage from "@/pages/contact-page";



export default function App() {
  return (
    <Router>
      <Route path="/" component={HomePage} />
      <Route path="/orcamento" component={BudgetPage} />
      <Route path="/agendamento" component={AppointmentPage} />
      <Route path="/contato" component={ContactPage} />
    </Router>
  );
}
