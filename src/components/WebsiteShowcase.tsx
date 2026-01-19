import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGlobe, faShoppingCart, faCalendarCheck, faQrcode,
  faPalette, faMobile, faRocket, faArrowRight, faCheck,
  faStore, faChartLine, faUsers, faStar
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const WebsiteShowcase = () => {
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState(0);

  const templates = [
    { name: 'Moderno', color: 'from-purple-500 to-pink-500', style: 'Elegante y minimalista' },
    { name: 'Clásico', color: 'from-amber-500 to-orange-500', style: 'Tradicional y cálido' },
    { name: 'Bold', color: 'from-cyan-500 to-blue-500', style: 'Vibrante y audaz' },
  ];

  const features = [
    {
      icon: faGlobe,
      title: 'Tu Dominio Propio',
      description: 'turestaurante.restrowizard.app o conecta tu dominio personalizado',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      icon: faCalendarCheck,
      title: 'Reservas Online 24/7',
      description: 'Tus clientes reservan mesa desde el móvil. Sin llamadas, sin esperas.',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    {
      icon: faShoppingCart,
      title: 'Delivery Integrado',
      description: 'Carrito de compras, zonas de entrega, pagos y notificaciones automáticas.',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30'
    },
    {
      icon: faQrcode,
      title: 'Menú Digital con QR',
      description: 'Actualiza precios en tiempo real. Tus clientes siempre ven lo último.',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    {
      icon: faPalette,
      title: '100% Personalizable',
      description: 'Colores, fuentes, imágenes, secciones. Tu marca, tu estilo.',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/30'
    },
    {
      icon: faMobile,
      title: 'Mobile-First',
      description: 'Diseño responsivo que se ve perfecto en cualquier dispositivo.',
      color: 'from-indigo-500 to-violet-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30'
    },
  ];

  const stats = [
    { value: '+47%', label: 'Más reservas', icon: faCalendarCheck },
    { value: '+32%', label: 'Más pedidos', icon: faShoppingCart },
    { value: '-100%', label: 'Comisiones apps', icon: faChartLine },
    { value: '4.9★', label: 'Satisfacción', icon: faStar },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-off-white via-lavender-light/20 to-off-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-gradient-to-bl from-purple-medium/5 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-green-500/5 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full px-5 py-2.5 mb-6 border border-green-500/30">
            <FontAwesomeIcon icon={faRocket} className="text-green-500" />
            <span className="text-sm font-lato-bold text-green-600">Nuevo: Sitio Web para tu Restaurante</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-headline text-purple-intense mb-6">
            Tu Restaurante Merece{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
              Presencia Digital Profesional
            </span>
          </h2>
          
          <p className="max-w-3xl mx-auto text-lg text-soft-black/80 font-lato-regular">
            Deja de pagar comisiones a apps de delivery. Crea tu sitio web en minutos con{' '}
            <strong className="font-lato-bold">reservas, delivery y menú digital integrados</strong>.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-medium to-purple-intense rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FontAwesomeIcon icon={stat.icon} className="text-white" />
              </div>
              <p className="text-3xl font-headline text-purple-intense mb-1">{stat.value}</p>
              <p className="text-sm text-soft-black/60 font-lato-light">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Features List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`${feature.bgColor} ${feature.borderColor} border rounded-2xl p-5 group hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <FontAwesomeIcon icon={feature.icon} className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="font-headline text-lg text-purple-intense mb-1">{feature.title}</h3>
                    <p className="text-soft-black/70 font-lato-light text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Website Preview */}
          <div className="relative">
            {/* Browser Frame */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Browser Chrome */}
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 bg-white rounded-lg px-4 py-1.5 text-soft-black/60 text-sm font-mono shadow-inner">
                  restrowizard.app/tu-restaurante
                </div>
              </div>
              
              {/* Website Content */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-white">
                {/* Template Selector */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTemplate(index)}
                      className={`px-3 py-1.5 rounded-full text-xs font-lato-medium transition-all ${
                        activeTemplate === index
                          ? `bg-gradient-to-r ${template.color} text-white shadow-lg`
                          : 'bg-white/80 text-soft-black/70 hover:bg-white'
                      }`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>

                {/* Mock Website */}
                <div className="p-6">
                  {/* Hero Section */}
                  <div className={`bg-gradient-to-r ${templates[activeTemplate].color} rounded-2xl p-8 mb-4 text-white`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-headline mb-2">La Trattoria</h3>
                        <p className="text-white/80 text-sm mb-4">Cocina italiana auténtica</p>
                        <div className="flex gap-2">
                          <span className="bg-white/20 px-3 py-1 rounded-full text-xs">Reservar</span>
                          <span className="bg-white/20 px-3 py-1 rounded-full text-xs">Pedir</span>
                        </div>
                      </div>
                      <div className="w-20 h-20 bg-white/20 rounded-xl"></div>
                    </div>
                  </div>
                  
                  {/* Menu Preview */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <div className="w-full h-12 bg-gray-100 rounded-lg mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-green-200 rounded w-1/2"></div>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <div className="w-full h-12 bg-gray-100 rounded-lg mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-green-200 rounded w-1/2"></div>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <div className="w-full h-12 bg-gray-100 rounded-lg mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-green-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheck} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-lato-bold text-soft-black">¡Reserva confirmada!</p>
                  <p className="text-xs text-soft-black/60">Mesa para 4 • 8:00 PM</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 animate-float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faShoppingCart} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-lato-bold text-soft-black">Nuevo pedido #247</p>
                  <p className="text-xs text-soft-black/60">$450 • Delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button 
            onClick={() => navigate('/auth')}
            className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-lato-bold text-lg px-10 py-5 rounded-2xl shadow-2xl shadow-green-500/30 transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
          >
            <FontAwesomeIcon icon={faGlobe} />
            <span>Crear Mi Sitio Web Gratis</span>
            <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-soft-black/50 font-lato-light">
            Activo en 10 minutos • Sin conocimientos técnicos • 100% personalizable
          </p>
        </div>
      </div>
    </section>
  );
};

export default WebsiteShowcase;
