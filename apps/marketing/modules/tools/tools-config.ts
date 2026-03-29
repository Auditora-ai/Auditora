export interface ToolConfig {
  slug: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  inputLabel: string;
  inputLabelEs: string;
  inputPlaceholder: string;
  inputPlaceholderEs: string;
  inputType: "textarea" | "file";
  icon: string; // lucide icon name
  apiEndpoint: string;
  outputType:
    | "bpmn"
    | "sipoc"
    | "raci"
    | "audit"
    | "complexity"
    | "narrative"
    | "calculator";
  seoKeywords: string[];
}

export const TOOLS: ToolConfig[] = [
  {
    slug: "bpmn-generator",
    name: "Free BPMN Diagram Generator",
    nameEs: "Generador de Diagramas BPMN Gratis",
    description:
      "Transform any process description into a BPMN 2.0 diagram in seconds. Powered by AI.",
    descriptionEs:
      "Transforma cualquier descripcion de proceso en un diagrama BPMN 2.0 en segundos. Impulsado por IA.",
    inputLabel: "Describe your process",
    inputLabelEs: "Describe tu proceso",
    inputPlaceholder:
      "Example: When a purchase request arrives, the department head reviews the budget. If approved, procurement creates a PO in SAP and sends it to the supplier...",
    inputPlaceholderEs:
      "Ejemplo: Cuando llega una solicitud de compra, el jefe de area revisa el presupuesto. Si se aprueba, compras crea una OC en SAP y la envia al proveedor...",
    inputType: "textarea",
    icon: "GitBranch",
    apiEndpoint: "bpmn-generator",
    outputType: "bpmn",
    seoKeywords: [
      "BPMN generator free",
      "text to BPMN",
      "AI BPMN diagram",
      "BPMN diagram maker online",
    ],
  },
  {
    slug: "sipoc-generator",
    name: "Free SIPOC Generator",
    nameEs: "Generador SIPOC con IA",
    description:
      "Generate a complete SIPOC diagram from a process description. AI identifies Suppliers, Inputs, Process steps, Outputs, and Customers automatically.",
    descriptionEs:
      "Genera un diagrama SIPOC completo a partir de una descripcion de proceso. La IA identifica Proveedores, Entradas, Pasos del Proceso, Salidas y Clientes automaticamente.",
    inputLabel: "Describe your process",
    inputLabelEs: "Describe tu proceso",
    inputPlaceholder:
      "Example: The customer onboarding process starts when sales closes a deal. The implementation team receives the signed contract and...",
    inputPlaceholderEs:
      "Ejemplo: El proceso de onboarding del cliente comienza cuando ventas cierra un trato. El equipo de implementacion recibe el contrato firmado y...",
    inputType: "textarea",
    icon: "Table",
    apiEndpoint: "sipoc-generator",
    outputType: "sipoc",
    seoKeywords: [
      "SIPOC generator free",
      "SIPOC maker online",
      "SIPOC template AI",
      "SIPOC diagram generator",
    ],
  },
  {
    slug: "raci-generator",
    name: "Free RACI Matrix Generator",
    nameEs: "Generador de Matriz RACI Gratis",
    description:
      "Generate a complete RACI matrix from a process description. AI extracts roles and activities, then assigns Responsible, Accountable, Consulted, and Informed.",
    descriptionEs:
      "Genera una matriz RACI completa a partir de una descripcion de proceso. La IA extrae roles y actividades, luego asigna Responsable, Aprobador, Consultado e Informado.",
    inputLabel: "Describe your process with roles",
    inputLabelEs: "Describe tu proceso con roles",
    inputPlaceholder:
      "Example: The procurement process involves the requester, department head, procurement team, and finance. The requester fills out a purchase request form...",
    inputPlaceholderEs:
      "Ejemplo: El proceso de compras involucra al solicitante, jefe de area, equipo de compras y finanzas. El solicitante llena un formato de solicitud de compra...",
    inputType: "textarea",
    icon: "Grid3X3",
    apiEndpoint: "raci-generator",
    outputType: "raci",
    seoKeywords: [
      "RACI generator free",
      "RACI chart maker",
      "RACI matrix online",
      "AI RACI generator",
    ],
  },
  {
    slug: "process-audit",
    name: "Process Health Check",
    nameEs: "Auditoria de Procesos con IA",
    description:
      "Get an instant complexity score and health check for any process. AI analyzes roles, decisions, exceptions, and system integrations.",
    descriptionEs:
      "Obtiene un score de complejidad y auditoria de salud para cualquier proceso. La IA analiza roles, decisiones, excepciones e integraciones de sistemas.",
    inputLabel: "Describe your process",
    inputLabelEs: "Describe tu proceso",
    inputPlaceholder:
      "Example: Our invoice processing involves receiving invoices via email, matching them to POs, getting three levels of approval...",
    inputPlaceholderEs:
      "Ejemplo: Nuestro procesamiento de facturas involucra recibir facturas por email, emparejarlas con OCs, obtener tres niveles de aprobacion...",
    inputType: "textarea",
    icon: "ShieldCheck",
    apiEndpoint: "process-audit",
    outputType: "audit",
    seoKeywords: [
      "process audit tool",
      "process health check",
      "BPM audit",
      "process complexity score",
    ],
  },
  {
    slug: "meeting-to-process",
    name: "Meeting Notes to Process Map",
    nameEs: "De Minutas a Mapa de Proceso",
    description:
      "Paste your meeting notes or transcript, get a BPMN process map instantly. Perfect for post-meeting documentation.",
    descriptionEs:
      "Pega tus minutas de reunion o transcripcion, obtiene un mapa de proceso BPMN al instante. Perfecto para documentacion post-reunion.",
    inputLabel: "Paste your meeting notes or transcript",
    inputLabelEs: "Pega tus minutas de reunion o transcripcion",
    inputPlaceholder:
      "Paste your meeting notes here. For example:\n\nJuan: So when someone needs to buy something, they fill out the request form first.\nMaria: Right, and then it goes to the department head for budget review...",
    inputPlaceholderEs:
      "Pega tus minutas de reunion aqui. Por ejemplo:\n\nJuan: Entonces cuando alguien necesita comprar algo, primero llena el formato de solicitud.\nMaria: Correcto, y luego va al jefe de area para revision de presupuesto...",
    inputType: "textarea",
    icon: "FileText",
    apiEndpoint: "meeting-to-process",
    outputType: "bpmn",
    seoKeywords: [
      "meeting notes to process map",
      "transcript to BPMN",
      "meeting to diagram",
      "process documentation from meetings",
    ],
  },
  {
    slug: "process-complexity",
    name: "Process Complexity Score",
    nameEs: "Score de Complejidad de Proceso",
    description:
      "Get an instant 1-10 complexity score with breakdown: roles, decisions, exceptions, integrations, and steps.",
    descriptionEs:
      "Obtiene un score de complejidad 1-10 con desglose: roles, decisiones, excepciones, integraciones y pasos.",
    inputLabel: "Describe your process",
    inputLabelEs: "Describe tu proceso",
    inputPlaceholder:
      "Example: The employee onboarding process starts when HR receives an approved offer letter...",
    inputPlaceholderEs:
      "Ejemplo: El proceso de onboarding de empleados comienza cuando RRHH recibe una carta oferta aprobada...",
    inputType: "textarea",
    icon: "Gauge",
    apiEndpoint: "process-complexity",
    outputType: "complexity",
    seoKeywords: [
      "process complexity score",
      "process complexity assessment",
      "business process complexity",
    ],
  },
  {
    slug: "bpmn-to-text",
    name: "BPMN to Plain Language",
    nameEs: "BPMN a Lenguaje Claro",
    description:
      "Upload a BPMN file and get a plain-language narrative anyone can understand. Perfect for stakeholders who can't read BPMN diagrams.",
    descriptionEs:
      "Sube un archivo BPMN y obtiene una narrativa en lenguaje claro que cualquiera puede entender. Perfecto para stakeholders que no leen diagramas BPMN.",
    inputLabel: "Paste BPMN XML or upload a .bpmn file",
    inputLabelEs: "Pega XML BPMN o sube un archivo .bpmn",
    inputPlaceholder: "Paste your BPMN 2.0 XML here...",
    inputPlaceholderEs: "Pega tu XML BPMN 2.0 aqui...",
    inputType: "textarea",
    icon: "BookOpen",
    apiEndpoint: "bpmn-to-text",
    outputType: "narrative",
    seoKeywords: [
      "BPMN to text",
      "understand BPMN diagram",
      "BPMN explanation",
      "BPMN plain language",
    ],
  },
  {
    slug: "roi-calculator",
    name: "Process Documentation ROI Calculator",
    nameEs: "Calculadora de Ahorro en Documentacion",
    description:
      "Calculate how much time and money Auditora.ai saves on process documentation. No AI required — instant results.",
    descriptionEs:
      "Calcula cuanto tiempo y dinero Auditora.ai ahorra en documentacion de procesos. Sin IA — resultados instantaneos.",
    inputLabel: "",
    inputLabelEs: "",
    inputPlaceholder: "",
    inputPlaceholderEs: "",
    inputType: "textarea",
    icon: "Calculator",
    apiEndpoint: "",
    outputType: "calculator",
    seoKeywords: [
      "process documentation time calculator",
      "BPM ROI calculator",
      "process mapping time savings",
    ],
  },
];

export function getToolBySlug(slug: string): ToolConfig | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
