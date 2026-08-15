import React from "react";
import { Shield } from "lucide-react";
import logoDumar from "@/assets/logo1.jpeg";

interface CRMLoginProps {
  handleLogin: (e: React.FormEvent) => void;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
}

export default function CRMLogin({
  handleLogin,
  username,
  setUsername,
  password,
  setPassword
}: CRMLoginProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-black border border-white/10 rounded-xl flex items-center justify-center mb-3">
            <img src={logoDumar} alt="Dumar Logo" className="w-12 h-12 object-contain rounded-lg" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Dumar Planejados</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Usuário</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white transition-colors"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-white hover:bg-neutral-200 text-black font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/10"
          >
            <Shield size={18} />
            Acessar Painel
          </button>
        </form>
      </div>
    </div>
  );
}
