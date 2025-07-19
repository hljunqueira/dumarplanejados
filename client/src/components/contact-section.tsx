import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Instagram, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.city) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Create WhatsApp message
    const whatsappMessage = `Olá! Meu nome é ${formData.name}, sou de ${formData.city}. ${
      formData.message 
        ? `Gostaria de saber mais sobre: ${formData.message}` 
        : 'Gostaria de um orçamento para móveis planejados.'
    } Meu telefone: ${formData.phone}`;
    
    const whatsappUrl = `https://wa.me/554898486827?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "Redirecionando para WhatsApp",
      description: "Você será redirecionado para o WhatsApp com sua mensagem pré-preenchida."
    });
  };

  return (
    <section id="contato" className="py-20 dumar-light">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Quer um ambiente sob medida?<br />
              <span className="dumar-accent">Fale conosco agora mesmo.</span>
            </h2>
            <p className="text-xl dumar-accent">
              Atendemos Balneário Arroio do Silva e região — consulte disponibilidade no WhatsApp
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Envie sua mensagem</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium dumar-primary">
                      Nome completo *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Seu nome completo"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium dumar-primary">
                      Telefone/WhatsApp *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(48) 99999-9999"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium dumar-primary">
                      Cidade *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Sua cidade"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium dumar-primary">
                      Mensagem
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Conte-nos sobre seu projeto..."
                      className="mt-2"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-black text-white py-4 text-lg font-bold hover:bg-gray-700"
                  >
                    Enviar via WhatsApp
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* WhatsApp Card */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Phone className="h-8 w-8 text-green-600 mr-4" />
                    <div>
                      <h4 className="text-xl font-bold text-green-800">WhatsApp Direto</h4>
                      <p className="text-green-600">Resposta rápida garantida</p>
                    </div>
                  </div>
                  <p className="text-green-700 mb-4">
                    Para atendimento imediato, fale diretamente conosco pelo WhatsApp.
                  </p>
                  <Button 
                    className="bg-green-600 text-white hover:bg-green-700"
                    asChild
                  >
                    <a href="https://wa.me/554898486827?text=Olá! Gostaria de saber mais sobre móveis planejados.">
                      (48) 98848-6827
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h4 className="text-xl font-bold mb-4">Informações de Contato</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 dumar-accent mr-4" />
                      <div>
                        <p className="font-medium">Localização</p>
                        <p className="dumar-accent">Balneário Arroio do Silva e região</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 dumar-accent mr-4" />
                      <div>
                        <p className="font-medium">Horário de Atendimento</p>
                        <p className="dumar-accent">Segunda a Sexta: 8h às 18h</p>
                        <p className="dumar-accent">Sábado: 8h às 12h</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Instagram className="h-5 w-5 dumar-accent mr-4" />
                      <div>
                        <p className="font-medium">Instagram</p>
                        <a 
                          href="https://www.instagram.com/dumar_moveis_planejados/" 
                          className="dumar-accent hover:text-black transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          @dumar_moveis_planejados
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card className="bg-black text-white">
                <CardContent className="p-6">
                  <h4 className="text-xl font-bold mb-2">Pronto para começar?</h4>
                  <p className="mb-4">
                    Transforme seu ambiente com a qualidade e experiência da Dumar. 
                    Entre em contato hoje mesmo!
                  </p>
                  <Button 
                    variant="secondary"
                    className="bg-white text-black hover:bg-gray-100"
                    asChild
                  >
                    <a href="#portfolio">
                      Ver Mais Projetos
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
