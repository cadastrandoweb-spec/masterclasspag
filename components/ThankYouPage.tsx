import React from 'react';
import { CheckCircle2, Mail, Video } from 'lucide-react';
import { MAIN_PRODUCT, WHATSAPP_NUMBER } from '../constants';

export const ThankYouPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-brand-600 px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
              <CheckCircle2 size={48} className="text-brand-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Pagamento Aprovado!
            </h1>
            <p className="text-brand-100 text-lg">
              Sua vaga está garantida com sucesso.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Bem-vindo(a) à {MAIN_PRODUCT.name}
            </h2>
            <p className="text-slate-600">
              Estamos muito felizes em ter você conosco! Seu acesso à plataforma já foi liberado e enviado para o seu e-mail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Mail size={24} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Verifique seu E-mail</h3>
              <p className="text-sm text-slate-600">
                Enviamos os dados de acesso para o e-mail cadastrado na compra. Verifique sua caixa de entrada (e o spam).
              </p>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Video size={24} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Comece Agora</h3>
              <p className="text-sm text-slate-600">
                Acesse a área de membros pelo link que chegou no e-mail e assista ao vídeo de boas-vindas.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
            <h4 className="font-medium text-amber-900 mb-2">Precisa de ajuda?</h4>
            <p className="text-sm text-amber-800 mb-4">
              Se você não receber o e-mail em até 5 minutos, entre em contato com o nosso suporte.
            </p>
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Oi! Comprei o curso e preciso de ajuda com o meu acesso.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Falar com o Suporte
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
