import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Code, Palette, Database, Globe, Smartphone } from "lucide-react";

export default function DevPage() {
  const [devMode, setDevMode] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header de Desenvolvimento */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Dev Mode</h1>
                <p className="text-sm text-gray-400">Henrique - Desenvolvimento</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={devMode ? "default" : "secondary"}>
                {devMode ? "ATIVO" : "INATIVO"}
              </Badge>
              <Button 
                onClick={() => setDevMode(!devMode)}
                variant={devMode ? "destructive" : "default"}
                size="sm"
              >
                {devMode ? "Desativar" : "Ativar"} Dev Mode
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card de Status */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Status do Sistema</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Informações do ambiente de desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Build Status:</span>
                <Badge variant="default" className="bg-green-500">✓ Sucesso</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Deploy:</span>
                <Badge variant="default" className="bg-blue-500">GitHub Pages</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Versão:</span>
                <Badge variant="outline">v1.0.0</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card de Ferramentas */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Ferramentas</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Tecnologias utilizadas no projeto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">React 18 + TypeScript</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Vite + Tailwind CSS</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-300">Radix UI Components</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-300">GitHub Pages Deploy</span>
              </div>
            </CardContent>
          </Card>

          {/* Card de Links */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Links Úteis</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Acesso rápido para desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/" target="_blank">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Ver Site Principal
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://github.com/hljunqueira/dumarplanejados" target="_blank">
                  <Code className="h-4 w-4 mr-2" />
                  Repositório GitHub
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://hljunqueira.github.io/dumarplanejados/" target="_blank">
                  <Globe className="h-4 w-4 mr-2" />
                  Site em Produção
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Card de Testes */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Área de Testes</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Teste novos componentes aqui
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Teste de Input:</label>
                <Input placeholder="Digite algo para testar..." className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Botões de Teste:</label>
                <div className="flex space-x-2">
                  <Button size="sm" variant="default">Primário</Button>
                  <Button size="sm" variant="secondary">Secundário</Button>
                  <Button size="sm" variant="outline">Outline</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Logs */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Logs de Desenvolvimento</CardTitle>
              <CardDescription className="text-gray-300">
                Últimas atividades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Build realizado com sucesso</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Deploy para GitHub Pages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-300">Página de dev criada</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Configurações */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Configurações</CardTitle>
              <CardDescription className="text-gray-300">
                Ajustes do ambiente de desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Modo Debug:</span>
                <Button size="sm" variant="outline">Ativar</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Hot Reload:</span>
                <Button size="sm" variant="outline">Ativar</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Console Logs:</span>
                <Button size="sm" variant="outline">Ativar</Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Área de Notas */}
        <Card className="mt-8 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Notas de Desenvolvimento</CardTitle>
            <CardDescription className="text-gray-300">
              Área para anotações e lembretes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea 
              className="w-full h-32 bg-white/10 border border-white/20 rounded-md p-3 text-white placeholder-gray-400 resize-none"
              placeholder="Digite suas notas de desenvolvimento aqui..."
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 