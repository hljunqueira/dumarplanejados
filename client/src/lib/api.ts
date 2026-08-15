// Helper central de URL da API Dumar

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  // No ambiente de produção na VPS, direciona as chamadas para o subdomínio dedicado api.dumarplanejados.com.br
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return `https://api.dumarplanejados.com.br${cleanPath}`;
  }
  
  return cleanPath;
};
