import { Phone, Calendar, Truck, CheckSquare, Ruler, Palette, Wrench, Star } from "lucide-react";

export default function ProcessSection() {
  const steps = [
    {
      icon: Phone,
      title: "1. Contato Inicial",
      description: "Entre em contato conosco via WhatsApp ou telefone para agendar uma visita técnica gratuita.",
      color: "from-blue-400 to-blue-600"
    },
    {
      icon: Calendar,
      title: "2. Visita Técnica",
      description: "Nossa equipe visita seu espaço para análise técnica e discussão do projeto personalizado.",
      color: "from-green-400 to-green-600"
    },
    {
      icon: Palette,
      title: "3. Projeto e Orçamento",
      description: "Desenvolvemos o projeto detalhado e apresentamos o orçamento personalizado.",
      color: "from-purple-400 to-purple-600"
    },
    {
      icon: Ruler,
      title: "4. Aprovação e Produção",
      description: "Após sua aprovação, iniciamos a produção com tecnologia de ponta e precisão milimétrica.",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: Wrench,
      title: "5. Instalação",
      description: "Nossa equipe especializada realiza a instalação com cuidado e atenção aos detalhes.",
      color: "from-red-400 to-red-600"
    },
    {
      icon: CheckSquare,
      title: "6. Garantia e Suporte",
      description: "Oferecemos garantia total e suporte contínuo para sua satisfação completa.",
      color: "from-emerald-400 to-emerald-600"
    }
  ];

  return (
    <section className="py-20 sm:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium mb-6">
            <Star className="w-4 h-4 mr-2" />
            Como Trabalhamos
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            Nosso <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">Processo</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Processo transparente e profissional, desde o primeiro contato até a entrega final do seu projeto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="group relative">
              {/* Linha conectora */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-gray-300 z-0"></div>
              )}
              
              <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed text-center">
                  {step.description}
                </p>
                
                {/* Número do passo */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Pronto para começar seu projeto?
            </h3>
            <p className="text-gray-600 mb-6">
              Entre em contato agora mesmo e receba uma visita técnica gratuita para seu projeto sob medida.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://wa.me/554898486827?text=Olá! Gostaria de agendar uma visita técnica gratuita para meu projeto de móveis planejados."
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Phone className="h-5 w-5 mr-2" />
                Agendar Visita Técnica
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 