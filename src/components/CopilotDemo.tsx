import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, faPaperPlane, faUser, faChartLine, 
  faLightbulb, faArrowRight, faMagic
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const CopilotDemo = () => {
  const navigate = useNavigate();
  const [currentDemo, setCurrentDemo] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const demoConversations = [
    {
      question: "¿Cuánto voy a vender mañana?",
      response: "Basándome en tus datos históricos de los últimos 3 meses, el clima esperado (soleado, 24°C) y que mañana es viernes, estimo ventas de **$28,450** con un margen de error del 8%.\n\n📈 Esto es 12% más que el viernes pasado. Te sugiero preparar inventario extra de tu plato estrella 'Tacos al Pastor'.",
      icon: faChartLine,
      color: 'from-green-400 to-emerald-500'
    },
    {
      question: "¿Qué platos tienen margen negativo?",
      response: "Detecté **3 platos** con margen negativo:\n\n❌ **Ensalada César** (-8% margen) - El costo del queso parmesano subió 25%\n❌ **Sopa del Día** (-3% margen) - Porciones muy grandes\n❌ **Hamburguesa Clásica** (-2% margen) - Proveedor caro\n\nTe sugiero: Ajustar precio de ensalada a $145 o cambiar proveedor de queso. ¿Quieres ver alternativas?",
      icon: faLightbulb,
      color: 'from-orange-400 to-red-500'
    },
    {
      question: "Genera un reporte para mi junta directiva",
      response: "Listo, generé un **Reporte Ejecutivo Q4 2025** con:\n\n📊 Resumen financiero (rentabilidad +15% vs Q3)\n👥 Métricas de personal (rotación bajó a 28%)\n🍽️ Top 5 platos más rentables\n📈 Proyección Q1 2026\n\n[📄 Descargar PDF] [📧 Enviar por email]\n\n¿Quieres que agregue análisis de competencia?",
      icon: faMagic,
      color: 'from-purple-400 to-pink-500'
    }
  ];

  // Typing effect
  useEffect(() => {
    if (!showResponse) return;
    
    const text = demoConversations[currentDemo].response;
    let index = 0;
    setIsTyping(true);
    setDisplayedText('');
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(prev => prev + text[index]);
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 15);
    
    return () => clearInterval(interval);
  }, [showResponse, currentDemo]);

  // Auto cycle demos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowResponse(true);
    }, 1500);
    
    const cycleTimer = setTimeout(() => {
      setShowResponse(false);
      setDisplayedText('');
      setCurrentDemo(prev => (prev + 1) % demoConversations.length);
    }, 12000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(cycleTimer);
    };
  }, [currentDemo]);

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-off-white font-lato-bold">$1</strong>');
      return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return (
    <section className="py-24 bg-gradient-to-b from-soft-black via-purple-intense/20 to-soft-black">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-medium/20 rounded-full px-4 py-2 mb-6">
            <FontAwesomeIcon icon={faRobot} className="text-purple-medium" />
            <span className="text-sm font-lato-medium text-lavender-light">Tu asistente personal</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-headline text-off-white mb-6">
            Pregunta lo que Quieras a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lavender-light to-accent">
              RestroWizard
            </span>
          </h2>
          
          <p className="max-w-2xl mx-auto text-lg font-lato-light text-off-white/70">
            Tu Co-Piloto de IA entiende tu negocio y responde en segundos con datos reales
          </p>
        </div>

        {/* Demo Chat Window */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-purple-intense to-purple-medium p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faRobot} className="text-white" />
              </div>
              <div>
                <h3 className="font-headline text-white">RestroWizard AI</h3>
                <p className="text-xs text-white/70 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  En línea • Analizando datos de "Tu Restaurante"
                </p>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="p-6 min-h-[350px] space-y-6">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-purple-medium/30 rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%]">
                  <p className="text-off-white font-lato-regular">
                    {demoConversations[currentDemo].question}
                  </p>
                </div>
              </div>
              
              {/* AI Response */}
              {showResponse && (
                <div className="flex gap-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${demoConversations[currentDemo].color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <FontAwesomeIcon icon={demoConversations[currentDemo].icon} className="text-white text-sm" />
                  </div>
                  <div className="bg-white/5 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%] border border-white/10">
                    <div className="text-off-white/80 font-lato-light text-sm leading-relaxed">
                      {renderFormattedText(displayedText)}
                      {isTyping && (
                        <span className="inline-block w-2 h-4 bg-lavender-light/50 animate-pulse ml-1"></span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 border border-white/10 flex items-center gap-3">
                  <input 
                    type="text" 
                    placeholder="Escribe tu pregunta..."
                    className="bg-transparent flex-1 text-off-white placeholder:text-off-white/40 outline-none font-lato-regular"
                    readOnly
                  />
                </div>
                <button className="w-12 h-12 bg-gradient-to-r from-purple-medium to-purple-intense rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity">
                  <FontAwesomeIcon icon={faPaperPlane} className="text-white" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Example Questions */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {demoConversations.map((demo, index) => (
              <button
                key={index}
                onClick={() => {
                  setShowResponse(false);
                  setDisplayedText('');
                  setCurrentDemo(index);
                }}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  currentDemo === index
                    ? 'bg-purple-medium text-white'
                    : 'bg-white/5 text-off-white/60 hover:bg-white/10 hover:text-off-white'
                }`}
              >
                {demo.question}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button 
            onClick={() => navigate('/auth')}
            className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-lato-bold text-lg px-8 py-4 rounded-xl shadow-xl shadow-green-500/20 transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
          >
            <FontAwesomeIcon icon={faRobot} />
            Habla con RestroWizard ahora
            <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-off-white/50 font-lato-light">
            Respuestas basadas en tus datos reales • Disponible 24/7
          </p>
        </div>
      </div>
    </section>
  );
};

export default CopilotDemo;
