export interface MaturityLevel {
  id: number;
  name: string;
  color: string;
}

export interface MaturityPillar {
  id: string;
  name: string;
  icon: string;
}

export interface QuestionOption {
  value: number;
  text: string;
}

export interface MaturityQuestion {
  pillarId: string;
  attribute: string;
  text: string;
  options: QuestionOption[];
}

export const maturityModel = {
  levels: [
    { id: 1, name: "INICIAL", color: "hsl(0 84% 60%)" },
    { id: 2, name: "BÁSICO", color: "hsl(25 95% 53%)" },
    { id: 3, name: "INTERMEDIO", color: "hsl(48 96% 53%)" },
    { id: 4, name: "AVANZADO", color: "hsl(84 81% 44%)" },
    { id: 5, name: "EXPERTO", color: "hsl(var(--secondary))" }
  ] as MaturityLevel[],
  
  pillars: [
    { id: "p1", name: "Rentabilidad y Finanzas", icon: "📊" },
    { id: "p2", name: "Operaciones y Cadena de Suministro", icon: "⚙️" },
    { id: "p3", name: "Talento y Cultura", icon: "👥" },
    { id: "p4", name: "Experiencia del Cliente y Tecnología", icon: "📱" }
  ] as MaturityPillar[],
  
  questions: [
    // Pilar 1: Rentabilidad y Finanzas
    {
      pillarId: "p1",
      attribute: "Control de Costos y Gastos",
      text: "¿Cómo describes tu control sobre los costos del restaurante?",
      options: [
        { value: 1, text: "Reactivo. Pagamos las facturas, pero no analizamos los gastos en detalle." },
        { value: 2, text: "Manual. Usamos hojas de cálculo para seguir los costos principales a fin de mes." },
        { value: 3, text: "Controlado. Tenemos presupuestos y usamos alguna herramienta para monitorear costos." },
        { value: 4, text: "Predictivo. Analizamos datos para anticipar y optimizar nuestras compras futuras." },
        { value: 5, text: "Automatizado. La IA optimiza toda nuestra estructura de costos en tiempo real." }
      ]
    },
    {
      pillarId: "p1",
      attribute: "Ingeniería de Menú",
      text: "¿Con qué criterio defines los precios de tu menú?",
      options: [
        { value: 1, text: "Intuición o copiando a la competencia. Desconozco la rentabilidad de cada plato." },
        { value: 2, text: "Calculamos el costo básico de los platos para tener una idea del margen." },
        { value: 3, text: "Diseñamos el menú estratégicamente para destacar los platos más rentables." },
        { value: 4, text: "Usamos precios dinámicos que ajustamos sutilmente según la demanda o el día." },
        { value: 5, text: "Un sistema de IA sugiere cambios de precios y menú para maximizar el beneficio." }
      ]
    },
    // Pilar 2: Operaciones y Cadena de Suministro
    {
      pillarId: "p2",
      attribute: "Eficiencia en Cocina y Salón",
      text: "¿Cómo es el flujo de trabajo entre la cocina y el salón?",
      options: [
        { value: 1, text: "Caótico. Dependemos de una o dos personas clave y hay errores frecuentes." },
        { value: 2, text: "Estandarizado. Hemos definido algunos procesos para reducir errores y demoras." },
        { value: 3, text: "Optimizado con tecnología. Usamos KDS o POS móviles para agilizar la comunicación." },
        { value: 4, text: "Basado en datos. Analizamos métricas para eliminar cuellos de botella constantemente." },
        { value: 5, text: "De alto rendimiento. Los procesos y la tecnología están tan integrados que la eficiencia es máxima." }
      ]
    },
    {
      pillarId: "p2",
      attribute: "Gestión de Inventario",
      text: "¿Cómo gestionas tu inventario y las compras a proveedores?",
      options: [
        { value: 1, text: "Compramos sobre la marcha cuando algo falta. El desperdicio es alto." },
        { value: 2, text: "Hacemos un conteo manual periódico y negociamos precios básicos con proveedores." },
        { value: 3, text: "Usamos un software para gestionar el inventario y tenemos proveedores certificados." },
        { value: 4, text: "El sistema predice la demanda y nos sugiere qué y cuándo comprar para minimizar el stock." },
        { value: 5, text: "Nuestra cadena de suministro es inteligente y está conectada con proveedores para una optimización total." }
      ]
    },
    // Pilar 3: Talento y Cultura
    {
      pillarId: "p3",
      attribute: "Atracción y Retención de Talento",
      text: "Respecto a tu equipo, ¿cuál de estas situaciones te suena más familiar?",
      options: [
        { value: 1, text: "La rotación es muy alta. Contratamos constantemente y vemos al personal como reemplazable." },
        { value: 2, text: "Tenemos un proceso de selección básico, pero nos cuesta retener al buen personal." },
        { value: 3, text: "Creamos una buena cultura de trabajo y ofrecemos algunos beneficios para retener al equipo." },
        { value: 4, text: "Somos un 'lugar deseado' para trabajar. Nuestra rotación es baja gracias a planes de carrera claros." },
        { value: 5, text: "Atraemos a los mejores del sector. Nuestro equipo es nuestra mayor ventaja competitiva." }
      ]
    },
    {
      pillarId: "p3",
      attribute: "Desarrollo y Planes de Carrera",
      text: "¿Qué oportunidades de crecimiento ofreces a tus empleados?",
      options: [
        { value: 1, text: "Ninguna. El crecimiento no es una prioridad y por eso se van." },
        { value: 2, text: "Ofrecemos capacitaciones básicas sobre sus funciones actuales." },
        { value: 3, text: "Tenemos planes de desarrollo y promovemos el crecimiento interno." },
        { value: 4, text: "El desarrollo es estratégico. Formamos a nuestros propios líderes con mentoría." },
        { value: 5, text: "Somos una 'escuela de talento', reconocida por formar a los mejores profesionales." }
      ]
    },
    // Pilar 4: Experiencia del Cliente y Tecnología
    {
      pillarId: "p4",
      attribute: "Experiencia Omnicanal",
      text: "¿Cómo gestionas la experiencia de tus clientes (en el local y en delivery)?",
      options: [
        { value: 1, text: "Nos centramos solo en el local. El delivery es un canal aparte y no lo controlamos." },
        { value: 2, text: "Leemos reseñas online y tratamos de mejorar la atención básica en todos los canales." },
        { value: 3, text: "Buscamos unificar la experiencia y tenemos programas de lealtad para fidelizar." },
        { value: 4, text: "Usamos datos (CRM) para ofrecer una experiencia personalizada y memorable." },
        { value: 5, text: "La experiencia es hiper-personalizada con IA, creando una comunidad de embajadores de la marca." }
      ]
    },
    {
      pillarId: "p4",
      attribute: "Infraestructura Tecnológica",
      text: "Sobre la tecnología en tu restaurante, ¿cuál es tu situación?",
      options: [
        { value: 1, text: "Básica (caja registradora, hojas de cálculo). La tecnología es un gasto." },
        { value: 2, text: "Adoptamos herramientas aisladas (reservas, delivery) pero no se comunican entre sí." },
        { value: 3, text: "Buscamos integrar nuestros sistemas (POS, inventario) y tenemos web propia con pedidos." },
        { value: 4, text: "Nuestro stack tecnológico está totalmente integrado y es una ventaja competitiva." },
        { value: 5, text: "Usamos IA y automatización en todas las áreas. La tecnología genera nuevos ingresos." }
      ]
    }
  ] as MaturityQuestion[]
};

export const getLevelFromScore = (score: number): MaturityLevel => {
  const roundedScore = Math.round(score);
  return maturityModel.levels.find(l => l.id === roundedScore) || maturityModel.levels[0];
};

export const getLevelDescription = (levelName: string): string => {
  const descriptions = {
    "INICIAL": "Tu negocio opera en modo supervivencia. Hay grandes oportunidades de mejora en todas las áreas para empezar a tomar el control.",
    "BÁSICO": "Has empezado a implementar controles básicos. El siguiente paso es usar datos y herramientas para optimizar tus procesos.",
    "INTERMEDIO": "Tienes un buen control sobre tu negocio, pero existen oportunidades claras para optimizar procesos y tecnología que disparen tu rentabilidad.",
    "AVANZADO": "Gestionas tu restaurante de forma estratégica y basada en datos. La clave ahora es innovar y consolidar tu liderazgo.",
    "EXPERTO": "Eres un referente en la industria. Tu operación es un modelo de eficiencia, innovación y rentabilidad."
  };
  return descriptions[levelName as keyof typeof descriptions] || "";
};