import { db } from "./client";
import type { SimulationTargetRole } from "./generated/client";

interface DecisionData {
  order: number;
  prompt: string;
  options: { label: string; description: string }[];
  consequences: string[];
  proceduralReference: string;
  riskLevelByOption: string[];
}

interface CaseData {
  title: string;
  targetRole: SimulationTargetRole;
  narrative: string;
  context: Record<string, unknown>;
  decisions: DecisionData[];
}

const cases: CaseData[] = [
  // ─── Case 1: El Proveedor Fantasma ───────────────────────────────────
  {
    title: "El Proveedor Fantasma",
    targetRole: "DIRECTOR_COMPRAS",
    narrative:
      "Eres el Director de Compras de una empresa manufacturera de autopartes con 200 empleados. Es viernes a las 4:30pm. Tu proveedor principal de acero inoxidable acaba de notificarte que no podrá entregar las 12 toneladas programadas para el lunes. La línea de producción se detiene si no tienes material. Tu asistente menciona que su cuñado tiene una distribuidora que puede entregar mañana sábado, pero a un precio 18% superior al del contrato actual. El CEO está en un vuelo internacional y no contesta. El procedimiento de compras requiere tres cotizaciones para montos superiores a $50,000 USD y la aprobación del Comité de Compras para proveedores nuevos.",
    context: {
      companyName: "Autopartes del Bajío S.A. de C.V.",
      employees: 200,
      material: "acero inoxidable",
      tonnage: 12,
      priceIncrease: "18%",
      threshold: 50000,
      currency: "USD",
    },
    decisions: [
      {
        order: 1,
        prompt:
          "Tu asistente te presenta la opción de su cuñado. ¿Qué haces primero?",
        options: [
          {
            label: "Contactar proveedores aprobados",
            description:
              "Revisas la lista de proveedores aprobados y contactas a los tres alternativos de acero que figuran en el padrón autorizado, solicitando cotización de emergencia para entrega antes del lunes.",
          },
          {
            label: "Aceptar la oferta del cuñado",
            description:
              "Aceptas la oferta del cuñado de tu asistente inmediatamente para asegurar el material y evitar el paro de producción del lunes.",
          },
          {
            label: "Notificar al CEO por email",
            description:
              "Envías un correo electrónico detallado al CEO explicando la situación, las opciones disponibles y solicitando autorización antes de tomar cualquier acción.",
          },
          {
            label: "Convocar reunión de emergencia",
            description:
              "Convocas una reunión de emergencia con los gerentes de producción, finanzas y calidad para evaluar colectivamente las opciones y documentar la decisión.",
          },
        ],
        consequences: [
          "Contactas a los tres proveedores alternativos del padrón. Dos no contestan porque es viernes por la tarde, pero el tercero, Distribuidora Metálica del Norte, confirma que tiene 8 toneladas disponibles y puede entregar el lunes a primera hora con un sobreprecio del 7%. Necesitas resolver el faltante de 4 toneladas restantes.",
          "Realizas la orden directamente con el cuñado de tu asistente. El material llega el sábado, pero el lunes el Controller detecta que el proveedor no está en el padrón autorizado y escala el caso a Auditoría Interna. Se abre una investigación por conflicto de interés y violación al procedimiento de compras.",
          "Envías el correo al CEO pero no recibes respuesta. Pasan las horas y al final del día no tienes ninguna decisión tomada. El gerente de producción te llama furioso porque necesita confirmar el plan de producción del lunes y no hay material asegurado.",
          "Reúnes al equipo de emergencia en 45 minutos. Se analizan las opciones, se documentan los riesgos y se asignan responsabilidades. Se pierde algo de tiempo pero la decisión queda respaldada institucionalmente. El gerente de producción propone ajustar el plan de producción para ganar un día adicional.",
        ],
        proceduralReference:
          "PROC-COMP-001 Sección 4.2: 'Toda compra superior a $50,000 USD requiere mínimo tres cotizaciones comparativas de proveedores del padrón autorizado.' Sección 5.1: 'La incorporación de nuevos proveedores requiere evaluación del Comité de Compras y auditoría documental previa.'",
        riskLevelByOption: ["LOW", "CRITICAL", "MEDIUM", "LOW"],
      },
      {
        order: 2,
        prompt:
          "Ningún proveedor aprobado puede entregar las 12 toneladas completas antes del lunes. Distribuidora Metálica del Norte ofrece 8 toneladas al 7% más, pero faltan 4 toneladas. Tu asistente insiste en que su cuñado puede cubrir las 4 toneladas faltantes mañana sábado. El gerente de producción confirma que con 8 toneladas puede mantener una línea operando, pero la segunda línea quedaría parada con pérdidas de $15,000 por hora. ¿Cómo procedes?",
        options: [
          {
            label: "Ordenar solo las 8 toneladas del proveedor aprobado",
            description:
              "Aseguras las 8 toneladas con Distribuidora Metálica del Norte y aceptas el paro parcial de la segunda línea mientras buscas alternativas legítimas para las 4 toneladas restantes durante la semana.",
          },
          {
            label: "Ordenar 8 del aprobado y 4 del cuñado",
            description:
              "Combinas ambas fuentes: 8 toneladas del proveedor aprobado y 4 del cuñado de tu asistente, documentando la emergencia como justificación para el proveedor no autorizado.",
          },
          {
            label: "Buscar material en inventario de otras plantas",
            description:
              "Contactas a las otras dos plantas del grupo corporativo para verificar si tienen inventario excedente de acero inoxidable que puedan transferir internamente antes del lunes.",
          },
          {
            label: "Negociar con el cliente final un retraso de 48 horas",
            description:
              "Contactas al cliente final para negociar una extensión de 48 horas en la entrega, lo cual te daría tiempo suficiente para conseguir el material completo de proveedores autorizados.",
          },
        ],
        consequences: [
          "Aseguras las 8 toneladas y la línea principal opera sin interrupción. La segunda línea queda parada lunes y martes, generando $240,000 en pérdidas por paro. Sin embargo, el miércoles llega material de un proveedor aprobado alternativo y se recupera la producción. La decisión queda documentada y respaldada procedimentalmente.",
          "El material llega completo y ambas líneas operan el lunes. Sin embargo, la factura de las 4 toneladas del cuñado revela un precio 22% superior al mercado, no el 18% originalmente mencionado. Auditoría Interna abre expediente por fraccionamiento de compra y conflicto de interés. Tu asistente queda involucrado en la investigación.",
          "Contactas a la planta de Querétaro y tienen 3 toneladas disponibles que pueden enviar el domingo. Con 11 de 12 toneladas, el gerente de producción confirma que puede mantener ambas líneas con un ajuste menor al programa. La transferencia se documenta como movimiento inter-compañía sin necesidad de cotización externa.",
          "El cliente acepta un retraso de 24 horas pero advierte que aplicará la penalización contractual del 2% sobre el valor del pedido ($180,000), lo que representa $3,600. Ganas tiempo suficiente para asegurar material de proveedores autorizados. El director comercial cuestiona tu decisión porque impacta la relación con el cliente.",
        ],
        proceduralReference:
          "PROC-COMP-001 Sección 6.3: 'En casos de emergencia operativa documentada, el Director de Compras podrá autorizar adquisiciones de un solo proveedor aprobado, con ratificación posterior del Comité dentro de 72 horas hábiles.' Sección 6.4: 'El fraccionamiento de órdenes para evadir umbrales de aprobación constituye falta grave.'",
        riskLevelByOption: ["MEDIUM", "CRITICAL", "LOW", "MEDIUM"],
      },
      {
        order: 3,
        prompt:
          "El gerente de producción te presiona directamente: 'Cada hora de paro cuesta $15,000. Si la línea 2 se detiene, no cumplo las metas del trimestre y hay 40 empleados que se quedan sin bono. ¿Me vas a decir que por un procedimiento vamos a perder $240,000 y joder a 40 familias?' Tu asistente agrega: 'Nadie se va a enterar, yo manejo la factura discretamente.' ¿Cómo manejas la presión?",
        options: [
          {
            label: "Mantener la posición procedimental",
            description:
              "Explicas al gerente que el procedimiento existe para proteger a la empresa y que una violación podría costar mucho más que $240,000 en multas, sanciones y pérdida de certificaciones.",
          },
          {
            label: "Ceder a la presión y autorizar al cuñado",
            description:
              "Ante la presión del impacto económico y humano, autorizas la compra con el cuñado bajo el argumento de emergencia, confiando en que tu asistente manejará la documentación.",
          },
          {
            label: "Escalar formalmente al Director General suplente",
            description:
              "Contactas al Director General suplente (VP de Operaciones) para que autorice la excepción de emergencia y comparta la responsabilidad de la decisión.",
          },
        ],
        consequences: [
          "El gerente de producción queda frustrado pero respeta tu decisión. Documentas formalmente la justificación y el análisis de riesgo. Cuando el CEO regresa el lunes y revisa el reporte, te felicita por proteger la integridad del proceso y ordena una revisión del plan de contingencia de proveedores para evitar futuras dependencias de un solo proveedor.",
          "La compra se realiza y la producción continúa sin interrupciones. Tres semanas después, un auditor externo de la certificación ISO detecta la factura del proveedor no registrado. Se abre una no conformidad mayor que pone en riesgo la recertificación. El CEO, al enterarse, solicita una investigación completa que involucra a ti y a tu asistente.",
          "El VP de Operaciones responde a las 7pm y autoriza la compra con el proveedor aprobado más la búsqueda de material inter-plantas. Documenta la excepción por correo electrónico y convoca al Comité de Compras para el lunes a primera hora. La responsabilidad queda compartida y el proceso de emergencia queda formalizado.",
        ],
        proceduralReference:
          "PROC-COMP-001 Sección 7.1: 'Ante la ausencia del CEO, la autoridad de aprobación de excepciones recae en el Director General suplente designado.' Código de Ética Sección 3.2: 'Ningún empleado podrá ejercer presión sobre otro para evadir controles internos establecidos.'",
        riskLevelByOption: ["LOW", "CRITICAL", "LOW"],
      },
      {
        order: 4,
        prompt:
          "Mientras revisas la documentación del caso, descubres que el cuñado de tu asistente (Distribuidora Aceros Express) fue rechazado hace 6 meses por la auditoría de proveedores debido a inconsistencias en su documentación fiscal y falta de certificaciones de calidad requeridas. Tu asistente no mencionó este antecedente. Además, encuentras que tu asistente ha recomendado a este mismo proveedor en tres ocasiones anteriores, todas rechazadas. ¿Qué haces con esta información?",
        options: [
          {
            label: "Documentar y reportar a Recursos Humanos",
            description:
              "Preparas un reporte formal con la evidencia del conflicto de interés no declarado y lo entregas a Recursos Humanos y al Comité de Ética para investigación.",
          },
          {
            label: "Confrontar a tu asistente directamente",
            description:
              "Hablas con tu asistente en privado, le presentas la evidencia y le solicitas una explicación antes de tomar cualquier acción formal.",
          },
          {
            label: "Ignorar el hallazgo y enfocarte en resolver la crisis",
            description:
              "Decides que el tema del conflicto de interés puede esperar y te concentras exclusivamente en asegurar el suministro de material para el lunes.",
          },
          {
            label: "Reportar a Auditoría Interna inmediatamente",
            description:
              "Contactas directamente al área de Auditoría Interna para que abran una investigación formal sobre el patrón de comportamiento de tu asistente.",
          },
        ],
        consequences: [
          "Recursos Humanos abre un expediente y programa una entrevista con tu asistente para el martes. La investigación revela que tu asistente tenía un acuerdo de comisión del 3% con la distribuidora de su cuñado. Se procede con una sanción disciplinaria. Tú quedas protegido por haber seguido el canal institucional correcto.",
          "Tu asistente se pone nervioso y admite que no sabía que el proveedor había sido rechazado, pero su explicación es inconsistente. Al día siguiente, tu asistente contacta al cuñado para que destruya evidencia de comunicaciones previas. La situación se complica cuando Auditoría finalmente interviene y descubre el intento de encubrimiento.",
          "La crisis se resuelve sin el proveedor del cuñado, pero tres meses después se repite un patrón similar cuando tu asistente recomienda a otro familiar para un servicio de logística. Al no haber documentado el primer incidente, no hay antecedentes formales y la empresa queda expuesta a un conflicto de interés sistémico.",
          "Auditoría Interna inicia investigación inmediata y solicita acceso a los correos de tu asistente. Encuentran un patrón de intentos de insertar proveedores relacionados en cinco departamentos diferentes. El caso se escala al Consejo de Administración como un hallazgo de control interno significativo. Tu actuación oportuna se reconoce formalmente.",
        ],
        proceduralReference:
          "Código de Ética Sección 5.1: 'Todo empleado debe declarar relaciones familiares o comerciales con proveedores, clientes o competidores.' PROC-AI-003 Sección 2.4: 'Los hallazgos de conflicto de interés deben reportarse a Auditoría Interna dentro de las 24 horas siguientes a su detección.'",
        riskLevelByOption: ["LOW", "HIGH", "HIGH", "LOW"],
      },
      {
        order: 5,
        prompt:
          "Debes tomar la decisión final sobre cómo proceder. Es sábado por la mañana, tienes 8 toneladas confirmadas del proveedor aprobado, 3 toneladas de transferencia inter-planta, y el CEO ya está informado por email. El Comité de Compras se reunirá el lunes. Necesitas cerrar el incidente con un plan integral. ¿Cuál es tu resolución final?",
        options: [
          {
            label: "Plan documentado con lecciones aprendidas",
            description:
              "Ejecutas las compras autorizadas, documentas todo el incidente como caso de estudio, y preparas una propuesta de mejora del procedimiento de emergencia para el Comité de Compras del lunes.",
          },
          {
            label: "Resolución mínima sin documentación adicional",
            description:
              "Confirmas las órdenes de compra ya autorizadas y esperas al lunes para que el Comité de Compras decida los siguientes pasos, sin preparar documentación adicional.",
          },
          {
            label: "Plan integral con cambios sistémicos",
            description:
              "Además de resolver la emergencia, preparas una propuesta de política de proveedores de respaldo, inventario mínimo de seguridad, y protocolo de emergencia con autoridades de aprobación definidas para cada nivel de urgencia.",
          },
        ],
        consequences: [
          "El Comité de Compras recibe tu reporte el lunes y aprueba las acciones tomadas. El caso de estudio se utiliza en la capacitación trimestral de compliance. Se te reconoce por el manejo profesional de la crisis. El CEO solicita que se formalice un procedimiento de emergencia basado en tu documentación.",
          "El Comité de Compras ratifica las compras pero señala la falta de documentación formal del proceso de decisión. Se genera una no conformidad menor en la siguiente auditoría interna por documentación incompleta. Pierdes la oportunidad de demostrar liderazgo y el incidente se repite en formato similar tres meses después.",
          "Tu propuesta integral impresiona al CEO y al Comité. Se aprueba un programa de diversificación de proveedores, se establece un inventario de seguridad de 5 toneladas, y se crea un protocolo de emergencia con tres niveles de escalamiento. Te designan como líder del proyecto de mejora de la cadena de suministro.",
        ],
        proceduralReference:
          "PROC-COMP-001 Sección 8.1: 'Todo incidente de suministro crítico debe documentarse como reporte de incidencia con análisis de causa raíz y acciones correctivas.' ISO 9001:2015 Cláusula 10.2: 'La organización debe reaccionar ante no conformidades y tomar acciones correctivas apropiadas.'",
        riskLevelByOption: ["LOW", "MEDIUM", "LOW"],
      },
    ],
  },

  // ─── Case 2: El Accidente Encubierto ────────────────────────────────
  {
    title: "El Accidente Encubierto",
    targetRole: "GERENTE_PLANTA",
    narrative:
      "Eres el Gerente de Planta de una fábrica de componentes electrónicos con 350 empleados. Son las 2:15pm del jueves. Un operador de la línea de ensamble sufrió una lesión menor en la mano derecha al operar una prensa troqueladora: un corte superficial que requirió tres puntadas en el servicio médico de la planta. El operador, Javier Morales, te pide que no reportes el incidente al sistema de seguridad industrial porque su equipo de 12 personas está a una semana de cumplir 180 días sin accidentes, lo que les otorgaría un bono de $8,000 pesos por persona. El supervisor del turno, Raúl Torres, apoya la petición y argumenta que 'fue solo un rasguño'. Sin embargo, al revisar la máquina notas que la guarda de seguridad estaba desactivada, lo que constituye una violación grave a la norma NOM-004-STPS. La troqueladora ha generado tres reportes de mantenimiento pendientes en los últimos dos meses.",
    context: {
      companyName: "ElectroComp de México S.A.",
      employees: 350,
      operatorName: "Javier Morales",
      supervisorName: "Raúl Torres",
      daysWithoutAccident: 173,
      bonusAmount: 8000,
      teamSize: 12,
      pendingMaintenanceReports: 3,
    },
    decisions: [
      {
        order: 1,
        prompt:
          "Javier te muestra la mano vendada y te dice: 'Jefe, son solo tres puntadas. El doctor dijo que puedo seguir trabajando. Si reporta esto, 12 familias pierden su bono. Por favor, solo fue mala suerte.' Raúl agrega: 'Yo llevo 15 años aquí, estas cosas pasan. No vale la pena arruinar el récord del equipo.' ¿Cuál es tu primera acción?",
        options: [
          {
            label: "Reportar el incidente inmediatamente",
            description:
              "Registras el accidente en el sistema de seguridad industrial de la planta, notificas al área de Seguridad e Higiene y activas el protocolo de investigación de incidentes conforme a la NOM-030-STPS.",
          },
          {
            label: "Evaluar primero la gravedad con el médico",
            description:
              "Antes de tomar cualquier decisión, acudes al servicio médico para obtener un reporte detallado de la lesión y determinar si clínicamente califica como accidente reportable según la clasificación de la STPS.",
          },
          {
            label: "Aceptar no reportar el incidente",
            description:
              "Accedes a la petición de Javier y Raúl, y no registras el incidente en el sistema, clasificándolo internamente como atención médica menor.",
          },
          {
            label: "Consultar con el Director de RRHH",
            description:
              "Contactas al Director de Recursos Humanos para discutir la situación y compartir la responsabilidad de la decisión antes de actuar.",
          },
        ],
        consequences: [
          "Registras el accidente y se activa el protocolo. Javier y su equipo pierden el bono. El equipo queda molesto contigo, pero el área de Seguridad e Higiene valida tu actuación. Se programa una inspección de la troqueladora y se descubre que la guarda estaba deliberadamente desactivada, lo que abre una investigación más profunda.",
          "El médico de planta confirma que la lesión requirió sutura y por lo tanto califica como accidente con incapacidad menor. Te informa que está obligado por la NOM-030-STPS a registrar todo evento que requiera tratamiento médico más allá de primeros auxilios. Ahora tienes la confirmación clínica y el médico espera tu autorización para proceder con el registro.",
          "No registras el incidente. Dos semanas después, Javier desarrolla una infección en la herida que requiere hospitalización. El IMSS investiga y descubre que el accidente original no fue reportado. La empresa recibe una multa de $500,000 pesos y tú enfrentas una responsabilidad personal por encubrimiento de accidente laboral.",
          "El Director de RRHH te dice que la decisión es tuya como Gerente de Planta y que no puede interferir en temas operativos de seguridad. Te recuerda que la empresa tiene una política de tolerancia cero en ocultamiento de accidentes y que como Gerente tienes la obligación legal de reportar. La responsabilidad vuelve a ti.",
        ],
        proceduralReference:
          "NOM-030-STPS-2009 Sección 5.3: 'El patrón debe registrar y notificar todos los accidentes de trabajo que ocurran en el centro de trabajo.' PROC-SEG-001 Sección 3.1: 'Todo evento que requiera tratamiento médico más allá de primeros auxilios debe clasificarse como accidente reportable.'",
        riskLevelByOption: ["LOW", "LOW", "CRITICAL", "MEDIUM"],
      },
      {
        order: 2,
        prompt:
          "Al inspeccionar la troqueladora, confirmas que la guarda de seguridad fue desactivada intencionalmente con un alambre. El supervisor Raúl admite que 'así trabajan desde hace meses porque la guarda se traba y ralentiza la producción.' Descubres que los tres reportes de mantenimiento pendientes fueron precisamente sobre la guarda de seguridad. ¿Cómo manejas este hallazgo?",
        options: [
          {
            label: "Parar la máquina inmediatamente",
            description:
              "Ordenas el paro inmediato de la troqueladora, colocas candado de bloqueo LOTO y notificas a mantenimiento que la máquina no puede operar hasta que la guarda esté reparada y certificada.",
          },
          {
            label: "Permitir operación hasta fin del turno",
            description:
              "Permites que la troqueladora opere hasta el fin del turno con supervisión directa y programas la reparación para el turno nocturno, minimizando el impacto productivo.",
          },
          {
            label: "Escalar a la Comisión de Seguridad e Higiene",
            description:
              "Convocas una reunión extraordinaria de la Comisión de Seguridad e Higiene para evaluar la condición de la máquina y todas las troqueladoras de la planta.",
          },
        ],
        consequences: [
          "La línea se detiene y pierdes 6 horas de producción. Mantenimiento repara la guarda y certifica la máquina. Durante la reparación, descubren que el mecanismo de seguridad tenía un defecto de diseño que causaba el trabamiento. Se corrige la causa raíz y se inspeccionan las otras 8 troqueladoras de la planta, encontrando 2 más con guardas desactivadas.",
          "La troqueladora opera el resto del turno bajo supervisión. A las 5:40pm, otro operador sufre un accidente similar pero más grave: pierde la punta de un dedo. Ahora tienes dos accidentes en un día con una máquina que sabías que tenía la guarda desactivada. Tu responsabilidad legal se multiplica exponencialmente.",
          "La Comisión se reúne en 2 horas y determina el paro inmediato de la máquina. Además, ordena una inspección general de todas las troqueladoras. El proceso es más lento pero genera un acta formal firmada por representantes de trabajadores y empresa, lo que protege legalmente a la planta y genera un plan de acción con responsables y fechas.",
        ],
        proceduralReference:
          "NOM-004-STPS-1999 Sección 7.2: 'Las protecciones y dispositivos de seguridad deben mantenerse en condiciones de funcionamiento seguro.' PROC-MTO-002 Sección 4.5: 'Todo equipo con dispositivos de seguridad desactivados debe sacarse de operación inmediatamente hasta su corrección.'",
        riskLevelByOption: ["LOW", "CRITICAL", "LOW"],
      },
      {
        order: 3,
        prompt:
          "Debes comunicar la situación al equipo de Javier. Los 12 operadores están reunidos esperando saber qué pasará con su bono de 180 días sin accidentes. Javier está presente con la mano vendada. El supervisor Raúl te mira con reproche. La moral del equipo ha sido históricamente baja y este bono era un motivador importante. ¿Cómo manejas la comunicación?",
        options: [
          {
            label: "Transparencia total con empatía",
            description:
              "Explicas la situación completa al equipo: el accidente debe reportarse, el bono se pierde, pero la prioridad es su seguridad. Reconoces su esfuerzo de 173 días y propones buscar una forma de reconocerlo.",
          },
          {
            label: "Comunicar solo lo mínimo necesario",
            description:
              "Informas brevemente que el accidente será reportado conforme a la norma y que el contador de días se reinicia. No entras en detalles ni ofreces alternativas.",
          },
          {
            label: "Culpar al sistema de mantenimiento",
            description:
              "Enfocas la comunicación en que la causa del accidente fue la falta de mantenimiento de la guarda, desviando la responsabilidad del equipo hacia el departamento de mantenimiento.",
          },
          {
            label: "Ofrecer un bono alternativo compensatorio",
            description:
              "Propones al equipo que hablarás con RRHH para crear un reconocimiento alternativo por los 173 días logrados, separado del programa formal de seguridad.",
          },
        ],
        consequences: [
          "El equipo escucha en silencio. Algunos están molestos, pero la mayoría asiente cuando explicas que una guarda desactivada pudo haber causado una amputación. Javier mismo dice: 'El jefe tiene razón, tuve suerte.' Propones una junta semanal de seguridad liderada por el equipo y el clima laboral mejora en las siguientes semanas.",
          "El equipo recibe la noticia fríamente. No hay preguntas porque no abriste espacio para ellas. En las siguientes semanas, la productividad del equipo baja un 15% y se incrementan las faltas injustificadas. Dos operadores con antigüedad solicitan transferencia a otra área. La falta de comunicación genera desconfianza.",
          "El equipo inicialmente acepta la explicación, pero el departamento de mantenimiento responde públicamente que los reportes de la guarda fueron enviados hace dos meses y nunca fueron priorizados por producción. La situación se vuelve un conflicto interdepartamental que escala al Director General y te deja en una posición incómoda por haber desviado la responsabilidad.",
          "El equipo responde positivamente a la propuesta. RRHH acepta crear un reconocimiento por los 173 días y un bono parcial proporcional. El gesto demuestra que la empresa valora el esfuerzo del equipo aunque el objetivo formal no se cumplió. Se genera un precedente positivo donde la seguridad y el reconocimiento no son mutuamente excluyentes.",
        ],
        proceduralReference:
          "PROC-COM-001 Sección 2.3: 'La comunicación de incidentes de seguridad debe ser transparente, oportuna y enfocada en la prevención, no en la culpa.' ISO 45001:2018 Cláusula 7.4: 'La organización debe establecer procesos de comunicación interna y externa pertinentes al sistema de gestión de seguridad y salud.'",
        riskLevelByOption: ["LOW", "HIGH", "HIGH", "LOW"],
      },
      {
        order: 4,
        prompt:
          "La investigación del accidente revela que el supervisor Raúl Torres no solo sabía de la guarda desactivada sino que él mismo instruyó a los operadores a desactivarla para 'cumplir con las metas de producción.' Además, Raúl firmó las inspecciones de seguridad mensuales reportando que todas las guardas estaban operativas. Tienes un supervisor con 15 años de antigüedad que falsificó documentos de seguridad. ¿Qué acción correctiva tomas?",
        options: [
          {
            label: "Iniciar procedimiento disciplinario formal",
            description:
              "Solicitas a RRHH que inicie un procedimiento disciplinario formal contra Raúl por falsificación de documentos de seguridad y poner en riesgo la integridad física de sus subordinados.",
          },
          {
            label: "Reasignar a Raúl sin sanción formal",
            description:
              "Mueves a Raúl a una posición sin personal a cargo y sin acceso a equipos de riesgo, pero sin iniciar un proceso disciplinario formal, considerando sus 15 años de servicio.",
          },
          {
            label: "Dar una amonestación verbal y reentrenamiento",
            description:
              "Aplicas una amonestación verbal documentada y lo inscribes en un programa de reentrenamiento en seguridad industrial, dándole una segunda oportunidad.",
          },
        ],
        consequences: [
          "RRHH conduce la investigación disciplinaria y determina que la falsificación de documentos de seguridad constituye una falta grave. Raúl es suspendido y eventualmente desvinculado. El sindicato protesta inicialmente pero al ver la evidencia de documentos falsificados, acepta la decisión. Se envía un mensaje claro a toda la planta sobre la importancia de la integridad en seguridad.",
          "Raúl acepta la reasignación pero se siente humillado. Comenta con otros supervisores que 'te castigaron por hacer lo que todos hacen.' Una inspección de la STPS tres meses después descubre que los registros de seguridad fueron falsificados y que no hubo acción correctiva adecuada. La multa se duplica por falta de acción correctiva proporcional.",
          "Raúl asiste al reentrenamiento pero su actitud no cambia. Otros supervisores interpretan la amonestación como una señal de que falsificar documentos de seguridad tiene consecuencias menores. En el siguiente trimestre, se descubren dos casos más de guardas desactivadas en otras áreas. La cultura de seguridad de la planta se deteriora.",
        ],
        proceduralReference:
          "Ley Federal del Trabajo Art. 47 Fracción V: 'Son causas de rescisión sin responsabilidad para el patrón: ocasionar el trabajador, intencionalmente, perjuicios materiales en las instalaciones o comprometer la seguridad del establecimiento.' PROC-SEG-001 Sección 9.2: 'La falsificación de registros de seguridad constituye falta grave sujeta a rescisión.'",
        riskLevelByOption: ["LOW", "HIGH", "HIGH"],
      },
      {
        order: 5,
        prompt:
          "El Director General te solicita un informe ejecutivo del incidente con conclusiones y plan de acción. Tienes la oportunidad de transformar este incidente en una mejora sistémica para toda la planta. Además, la auditoría de certificación ISO 45001 está programada para dentro de un mes. ¿Qué enfoque le das a tu informe y plan de acción?",
        options: [
          {
            label: "Informe completo con análisis de causa raíz y plan sistémico",
            description:
              "Preparas un informe con análisis de causa raíz (Ishikawa + 5 por qués), que identifica fallas sistémicas en mantenimiento, supervisión e incentivos, y propones un plan de 90 días con 15 acciones correctivas y preventivas.",
          },
          {
            label: "Informe enfocado solo en el incidente específico",
            description:
              "Documentas el incidente puntual, las acciones tomadas con la máquina y el supervisor, y propones correcciones limitadas a la troqueladora involucrada.",
          },
          {
            label: "Informe integral con rediseño del programa de seguridad",
            description:
              "Además del análisis de causa raíz, propones rediseñar completamente el programa de incentivos de seguridad para que premie el reporte de condiciones inseguras en lugar de solo los días sin accidentes, y estableces un programa de verificación independiente de guardas de seguridad.",
          },
        ],
        consequences: [
          "El Director General aprueba el plan de 90 días y asigna presupuesto para las acciones correctivas. La auditoría ISO 45001 observa el incidente pero valora positivamente la respuesta estructurada y el análisis de causa raíz. Se obtiene la certificación con una observación menor. La planta mejora sus indicadores de seguridad en un 40% en el siguiente semestre.",
          "El informe se percibe como incompleto por el Director General, quien solicita ampliación. La auditoría ISO 45001 identifica que no se investigaron las causas sistémicas del incidente y emite una no conformidad mayor por falta de análisis de riesgo adecuado. La certificación queda condicionada a una auditoría de seguimiento en 3 meses.",
          "Tu propuesta de rediseño impresiona al Director General y al Consejo. Se implementa un nuevo programa donde los equipos reciben bonos por reportar condiciones inseguras, no solo por evitar accidentes. En 6 meses, los reportes de condiciones inseguras se triplican y los accidentes se reducen un 60%. La auditoría ISO 45001 cita el programa como mejor práctica.",
        ],
        proceduralReference:
          "ISO 45001:2018 Cláusula 10.2: 'Cuando ocurra una no conformidad, la organización debe investigar la causa raíz, implementar acciones correctivas y evaluar su eficacia.' NOM-030-STPS-2009 Sección 7.1: 'El diagnóstico de seguridad y salud en el trabajo debe incluir la identificación de las condiciones inseguras y actos inseguros.'",
        riskLevelByOption: ["LOW", "HIGH", "LOW"],
      },
    ],
  },

  // ─── Case 3: La Factura Duplicada ───────────────────────────────────
  {
    title: "La Factura Duplicada",
    targetRole: "DIRECTOR_FINANZAS",
    narrative:
      "Eres el Director de Finanzas de una empresa de servicios de TI con 500 empleados y facturación anual de $120 millones de pesos. Es martes por la mañana. Tu analista de cuentas por pagar detectó que la factura FAC-2024-3847 del proveedor CloudServ Solutions por $485,000 pesos ya fue pagada hace 45 días con número de referencia diferente. Al cruzar datos, la factura original fue FAC-2024-3291 por el mismo monto exacto, mismos conceptos, mismo período de servicio. Cuando investigas, descubres que el VP de Ventas, Alejandro Gutiérrez, autorizó ambas facturas y ahora insiste en que se pague la segunda porque CloudServ 'es un proveedor estratégico y si los hacemos esperar, se van con la competencia.' El CEO confía ciegamente en Alejandro porque trajo las tres cuentas más grandes del último año.",
    context: {
      companyName: "Innovatech Solutions S.A. de C.V.",
      employees: 500,
      revenue: "120M MXN",
      duplicateAmount: 485000,
      originalInvoice: "FAC-2024-3291",
      duplicateInvoice: "FAC-2024-3847",
      vpName: "Alejandro Gutiérrez",
      providerName: "CloudServ Solutions",
    },
    decisions: [
      {
        order: 1,
        prompt:
          "Tu analista te presenta la evidencia de la factura duplicada. Alejandro te llama directamente y te dice: 'Mira, CloudServ es nuestro proveedor más importante de infraestructura cloud. Si no les pagamos, nos cortan el servicio y perdemos a tres clientes que facturan $40 millones al año. Solo procesa el pago y yo hablo con ellos después para que emitan una nota de crédito.' ¿Cuál es tu primera acción?",
        options: [
          {
            label: "Detener el pago y solicitar aclaración formal",
            description:
              "Pones un hold al pago de la segunda factura y solicitas formalmente a CloudServ que aclare por escrito la razón de la factura duplicada antes de procesar cualquier pago.",
          },
          {
            label: "Procesar el pago como solicita Alejandro",
            description:
              "Confías en la palabra del VP de Ventas y procesas el pago de la segunda factura, documentando que fue autorizado por él y esperando la nota de crédito posterior.",
          },
          {
            label: "Escalar al CEO inmediatamente",
            description:
              "Informas directamente al CEO sobre la factura duplicada y la presión del VP de Ventas para procesar el pago, presentando la evidencia documental.",
          },
          {
            label: "Solicitar a Auditoría Interna una revisión",
            description:
              "Antes de tomar cualquier decisión, solicitas a Auditoría Interna que revise el historial de facturación de CloudServ para determinar si hay un patrón de irregularidades.",
          },
        ],
        consequences: [
          "Envías una solicitud formal a CloudServ. Su departamento de facturación responde en 24 horas confirmando que efectivamente se emitió una factura duplicada por error de sistema y emite la nota de crédito correspondiente. Alejandro se molesta porque lo hiciste 'quedar mal' con el proveedor, pero el proceso queda limpio y documentado.",
          "Procesas el pago de $485,000. Tres meses después, durante la auditoría externa anual, los auditores detectan el pago duplicado y la ausencia de nota de crédito. CloudServ nunca emitió la nota de crédito que Alejandro prometió. Los auditores emiten una salvedad en los estados financieros y recomiendan una investigación de fraude.",
          "El CEO escucha tu preocupación pero se muestra reticente a cuestionar a Alejandro. Te dice: 'Alejandro sabe lo que hace, confío en su criterio comercial. Si CloudServ dice que les debemos, págales.' Te deja en una posición difícil porque tienes evidencia de duplicación pero la máxima autoridad te ordena pagar.",
          "Auditoría Interna acepta la revisión y encuentra que en los últimos 12 meses, CloudServ ha facturado 15% más que los servicios contratados según los contratos vigentes. Además, descubren que Alejandro autorizó tres ajustes de precio sin aprobación del Comité de Compras. El patrón sugiere una relación irregular.",
        ],
        proceduralReference:
          "PROC-FIN-003 Sección 3.2: 'Toda factura debe validarse contra orden de compra, contrato vigente y confirmación de recepción del servicio antes de procesarse para pago.' Sección 4.1: 'Pagos duplicados detectados deben ponerse en hold inmediato hasta aclaración escrita del proveedor.'",
        riskLevelByOption: ["LOW", "CRITICAL", "MEDIUM", "LOW"],
      },
      {
        order: 2,
        prompt:
          "La investigación preliminar revela que CloudServ ha facturado $1.2 millones más de lo contratado en los últimos 12 meses, distribuidos en 8 facturas con sobreprecios entre 5% y 20%. Todas fueron autorizadas exclusivamente por Alejandro sin pasar por el proceso de validación técnica. Además, tu analista descubre que Alejandro viajó dos veces a Cancún en vuelos pagados por CloudServ. ¿Cómo procedes con esta información?",
        options: [
          {
            label: "Documentar y reportar al Comité de Auditoría",
            description:
              "Preparas un informe confidencial con toda la evidencia (facturas, autorizaciones, viajes) y lo presentas al Comité de Auditoría del Consejo de Administración para una investigación independiente.",
          },
          {
            label: "Confrontar a Alejandro directamente",
            description:
              "Solicitas una reunión privada con Alejandro para presentarle la evidencia y darle la oportunidad de explicarse antes de escalar.",
          },
          {
            label: "Informar solo al CEO con la evidencia",
            description:
              "Presentas toda la evidencia al CEO en una reunión privada, dado que él tiene la autoridad para decidir cómo manejar la situación con su VP estrella.",
          },
        ],
        consequences: [
          "El Comité de Auditoría contrata una firma externa de investigación forense. En tres semanas, confirman que Alejandro recibió aproximadamente $360,000 en beneficios de CloudServ (viajes, regalos, pagos a una cuenta personal). Se inicia un procedimiento legal y se rescinde el contrato de Alejandro. Tú quedas protegido por haber seguido el canal institucional.",
          "Alejandro reacciona agresivamente. Te acusa de 'no entender el negocio' y te amenaza con ir al CEO para que te despidan. Esa misma noche, accede al sistema de archivos compartidos y elimina correos electrónicos relacionados con CloudServ. Cuando finalmente escalas, parte de la evidencia digital ya no está disponible. La investigación se complica por la destrucción de evidencia.",
          "El CEO recibe la información con sorpresa pero te pide 'discreción absoluta' y que no se escale al Consejo. Decide hablar con Alejandro personalmente. Dos semanas después, Alejandro sigue en su puesto y las facturas de CloudServ siguen llegando. El CEO te dice que 'ya se resolvió internamente.' No tienes evidencia de que se haya tomado acción alguna.",
        ],
        proceduralReference:
          "Código de Ética Sección 6.1: 'Los hallazgos de posible fraude deben reportarse exclusivamente al Comité de Auditoría del Consejo, no a la administración, para garantizar independencia de la investigación.' Ley General de Sociedades Mercantiles Art. 172: 'Los administradores son solidariamente responsables por irregularidades de otros administradores que conozcan y no denuncien.'",
        riskLevelByOption: ["LOW", "HIGH", "HIGH"],
      },
      {
        order: 3,
        prompt:
          "El área legal de la empresa te contacta. El abogado corporativo te informa que si la empresa tiene conocimiento de posibles actos de corrupción y no los reporta, podría enfrentar consecuencias bajo la Ley General de Responsabilidades Administrativas (si tienen contratos gubernamentales) y la Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita. ¿Cómo manejas las implicaciones de compliance?",
        options: [
          {
            label: "Activar el protocolo anticorrupción completo",
            description:
              "Activas el protocolo anticorrupción de la empresa: notificación al Oficial de Cumplimiento, preservación de evidencia digital, restricción de accesos de Alejandro a sistemas financieros, y consulta con asesores legales externos especializados.",
          },
          {
            label: "Limitar la acción a una investigación interna",
            description:
              "Mantienes la investigación como un asunto interno de la empresa sin involucrar al Oficial de Cumplimiento ni a asesores externos, para manejar la situación con discreción.",
          },
          {
            label: "Reportar a la autoridad competente",
            description:
              "Además del protocolo interno, notificas a la Unidad de Inteligencia Financiera (UIF) como medida preventiva, dado que los montos y el patrón podrían calificar como actividad sospechosa.",
          },
        ],
        consequences: [
          "El Oficial de Cumplimiento toma control de la investigación. Se preservan correos, accesos y registros. Los asesores externos confirman que no hay exposición a contratos gubernamentales, lo que limita el riesgo regulatorio. Se implementa un programa de monitoreo de transacciones con proveedores y se fortalecen los controles de autorización dual para pagos superiores a $100,000.",
          "La investigación interna avanza lentamente y sin la rigurosidad necesaria. Cuando eventualmente se descubre la situación externamente (por un exempleado disgustado que filtra información), la empresa no puede demostrar que tomó acciones adecuadas. Las multas y el daño reputacional se multiplican por la apariencia de encubrimiento.",
          "La UIF recibe la notificación y la incorpora a su base de datos. No inicia una investigación inmediata pero queda un registro de que la empresa actuó proactivamente. Si en el futuro surge una investigación relacionada con CloudServ, la notificación temprana demuestra buena fe de la empresa y reduce significativamente la exposición legal.",
        ],
        proceduralReference:
          "Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita Art. 17: 'Las actividades vulnerables deben reportarse ante la UIF.' PROC-COMP-005 Sección 2.1: 'El protocolo anticorrupción debe activarse ante cualquier indicio de beneficios indebidos que excedan $50,000 MXN.'",
        riskLevelByOption: ["LOW", "HIGH", "LOW"],
      },
      {
        order: 4,
        prompt:
          "Durante la investigación, necesitas decidir cómo documentar toda la cadena de eventos. Alejandro ha amenazado con demandar por difamación si se filtra información. Su abogado personal ya envió una carta a la empresa exigiendo 'confidencialidad absoluta.' El Consejo te pide tu recomendación sobre cómo manejar la documentación del caso. ¿Qué recomiendas?",
        options: [
          {
            label: "Documentación completa bajo privilegio legal",
            description:
              "Recomiendas que toda la documentación se maneje bajo el privilegio abogado-cliente a través de los asesores externos, protegiendo la confidencialidad pero preservando toda la evidencia.",
          },
          {
            label: "Documentación mínima para reducir riesgo legal",
            description:
              "Recomiendas documentar solo lo estrictamente necesario para reducir la exposición a una posible demanda de Alejandro, manteniendo registros limitados.",
          },
          {
            label: "Documentación transparente para el expediente corporativo",
            description:
              "Recomiendas documentar todo de manera completa y transparente en el expediente corporativo regular, sin privilegio legal especial, confiando en que la verdad es la mejor defensa.",
          },
        ],
        consequences: [
          "Los asesores externos manejan toda la documentación bajo privilegio legal. La evidencia queda protegida y completa. Cuando Alejandro efectivamente demanda, la empresa tiene una defensa sólida con evidencia bien preservada. El privilegio legal impide que Alejandro acceda a los detalles de la investigación durante el litigio inicial.",
          "La documentación limitada se vuelve en contra de la empresa. Cuando los auditores externos solicitan evidencia de las acciones correctivas, la documentación incompleta genera preguntas adicionales. La percepción es que la empresa intentó minimizar el incidente. El Consejo queda expuesto por no haber exigido una investigación rigurosa.",
          "La documentación completa en el expediente regular es accesible para múltiples personas. Antes de que concluya la investigación, un empleado del área legal filtra información a un medio de comunicación. La historia se publica y genera daño reputacional significativo. Alejandro usa la filtración como base para su demanda por difamación.",
        ],
        proceduralReference:
          "PROC-LEG-001 Sección 5.2: 'Las investigaciones de fraude deben documentarse bajo el privilegio abogado-cliente para proteger la confidencialidad de la investigación.' Ley Federal de Protección de Datos Personales Art. 6: 'Los datos personales solo podrán tratarse conforme a las finalidades establecidas y con el consentimiento del titular.'",
        riskLevelByOption: ["LOW", "HIGH", "MEDIUM"],
      },
      {
        order: 5,
        prompt:
          "La investigación concluye confirmando el fraude de Alejandro. El Consejo de Administración te solicita tu recomendación sobre la resolución integral del caso: la relación con CloudServ, las acciones legales, los controles internos y la comunicación interna. ¿Cuál es tu propuesta de resolución?",
        options: [
          {
            label: "Resolución integral con fortalecimiento de controles",
            description:
              "Recomiendas: rescisión con Alejandro, renegociación o rescisión del contrato con CloudServ, recuperación legal de los sobrepagos, implementación de controles duales de autorización, y auditoría forense de todos los contratos de Alejandro.",
          },
          {
            label: "Resolución enfocada solo en el individuo",
            description:
              "Recomiendas la salida de Alejandro y la recuperación de los sobrepagos, pero mantienes la relación con CloudServ para no afectar la operación y no implementas cambios sistémicos inmediatos.",
          },
          {
            label: "Resolución con enfoque en prevención futura",
            description:
              "Además de la resolución inmediata, propones un programa anticorrupción integral: línea de denuncia anónima, rotación de autorizadores de pago, verificación independiente de precios de mercado, y programa de capacitación ética para toda la dirección.",
          },
        ],
        consequences: [
          "El Consejo aprueba tu propuesta. Se rescinde a Alejandro, se renegocia el contrato con CloudServ (que acepta devolver $800,000 de sobrepagos a cambio de no ser demandados). Los nuevos controles duales de autorización se implementan en 60 días. La auditoría forense revela que no hay otros casos similares en la empresa.",
          "Alejandro sale pero CloudServ mantiene la relación y los precios inflados. Sin cambios sistémicos, 8 meses después otro gerente replica un esquema similar con un proveedor de telecomunicaciones. La falta de controles preventivos permite que el patrón se repita. El Consejo cuestiona por qué no se fortalecieron los controles cuando tuviste la oportunidad.",
          "El Consejo adopta tu propuesta integral. La línea de denuncia anónima genera 12 reportes en el primer trimestre, 3 de los cuales resultan en hallazgos menores que se corrigen rápidamente. La rotación de autorizadores genera resistencia inicial pero reduce significativamente el riesgo de colusión. La empresa obtiene una calificación superior en gobierno corporativo de la calificadora que la evalúa.",
        ],
        proceduralReference:
          "Código de Mejores Prácticas Corporativas del CCE Principio 18: 'El Consejo de Administración debe establecer mecanismos que aseguren la existencia de controles internos eficaces.' PROC-FIN-003 Sección 10.1: 'Tras un hallazgo de fraude confirmado, se debe realizar una evaluación integral de controles y proponer mejoras sistémicas en un plazo no mayor a 90 días.'",
        riskLevelByOption: ["LOW", "HIGH", "LOW"],
      },
    ],
  },

  // ─── Case 4: El Shortcut de Calidad ─────────────────────────────────
  {
    title: "El Shortcut de Calidad",
    targetRole: "DIRECTOR_CALIDAD",
    narrative:
      "Eres el Director de Calidad de una empresa farmacéutica que manufactura dispositivos médicos Clase II (catéteres intravenosos) con certificación ISO 13485 y registro sanitario de COFEPRIS. Es miércoles a las 11am. El lote LT-2024-0892 de 50,000 catéteres acaba de fallar la prueba de integridad de sellado: el 3.2% de las muestras presentó micro-fugas, cuando el límite aceptable es 0.5%. Tu mayor cliente, el Grupo Hospitalario Nacional (GHN), necesita recibir este lote el viernes para abastecer a 15 hospitales. Si no entregas, GHN tiene una cláusula de penalización de $2.8 millones de pesos y amenaza con rescindir el contrato anual de $45 millones. El Director Comercial te pide que 'reinterpretes' los resultados de la prueba argumentando que las micro-fugas detectadas están 'dentro del rango de variabilidad del equipo de medición.'",
    context: {
      companyName: "MedDevice Pharma S.A. de C.V.",
      productType: "Catéteres intravenosos Clase II",
      lotNumber: "LT-2024-0892",
      lotSize: 50000,
      failureRate: "3.2%",
      acceptableRate: "0.5%",
      clientName: "Grupo Hospitalario Nacional",
      penalty: 2800000,
      contractValue: 45000000,
    },
    decisions: [
      {
        order: 1,
        prompt:
          "El Director Comercial entra a tu oficina con el reporte de pruebas y te dice: 'Escucha, el equipo de medición tiene un margen de error del 1.5%. Si ajustamos la tolerancia del instrumento, el lote pasa. Nadie se va a dar cuenta y GHN no se va a ir. Necesito que firmes la liberación antes de las 2pm.' ¿Cuál es tu respuesta inmediata?",
        options: [
          {
            label: "Rechazar la liberación y retener el lote",
            description:
              "Rechazas firmemente la propuesta, colocas el lote en cuarentena con etiqueta roja y activas el procedimiento de producto no conforme conforme a ISO 13485, documentando la no conformidad en el sistema de gestión de calidad.",
          },
          {
            label: "Solicitar una contra-prueba con otro equipo",
            description:
              "Antes de tomar una decisión definitiva, solicitas que se repita la prueba de integridad con un equipo de medición calibrado diferente para confirmar o descartar los resultados originales.",
          },
          {
            label: "Aceptar el ajuste de tolerancia",
            description:
              "Aceptas la propuesta del Director Comercial, ajustas la tolerancia del equipo en los registros y firmas la liberación del lote para cumplir con la entrega al cliente.",
          },
          {
            label: "Solicitar intervención del Director General",
            description:
              "Te niegas a firmar pero en lugar de tomar la decisión solo, escalas inmediatamente al Director General para que entienda las implicaciones de ambos escenarios.",
          },
        ],
        consequences: [
          "El lote queda en cuarentena. El Director Comercial te amenaza con 'ir por tu cabeza' al CEO. Sin embargo, al documentar la no conformidad, el equipo de calidad inicia una investigación que revela que el problema se originó en un cambio no controlado en el proveedor de material de sellado. Se identifica la causa raíz antes de que el problema se extienda a otros lotes.",
          "La contra-prueba con un segundo equipo calibrado confirma el resultado original: 3.1% de micro-fugas, muy por encima del límite aceptable. Ahora tienes doble confirmación documentada y la decisión es clara. El Director Comercial ya no puede argumentar error de medición. Has ganado evidencia adicional y tiempo para comunicar la situación adecuadamente.",
          "Firmas la liberación con el ajuste de tolerancia. Los catéteres llegan a los hospitales de GHN. Dos semanas después, tres hospitales reportan complicaciones en pacientes relacionadas con catéteres defectuosos. COFEPRIS inicia una investigación y descubre la manipulación de los registros de prueba. Se revoca el registro sanitario, se cierra la línea de producción y tú enfrentas cargos penales por poner en riesgo la salud pública.",
          "El Director General escucha ambas partes. Comprende la presión comercial pero también las implicaciones regulatorias y de seguridad del paciente. Decide respaldar la retención del lote y te pide que prepares un plan de comunicación con GHN que incluya alternativas y un cronograma realista de entrega.",
        ],
        proceduralReference:
          "ISO 13485:2016 Cláusula 8.3: 'El producto no conforme debe identificarse y controlarse para prevenir su uso o entrega no intencional.' NOM-241-SSA1-2012 Sección 10.2: 'Los productos que no cumplan con las especificaciones de calidad no deben ser liberados para distribución.' COFEPRIS puede imponer sanciones penales por liberación de producto no conforme.",
        riskLevelByOption: ["LOW", "LOW", "CRITICAL", "LOW"],
      },
      {
        order: 2,
        prompt:
          "Debes comunicar a GHN que el lote no estará disponible el viernes. El Director de Compras de GHN, Dra. Patricia Mendoza, es conocida por ser inflexible y ya canceló contratos con otros proveedores por incumplimientos menores. El Director Comercial te pide que no menciones el problema de calidad y solo digas que hay un 'retraso logístico.' ¿Cómo manejas la comunicación con el cliente?",
        options: [
          {
            label: "Comunicación transparente del problema de calidad",
            description:
              "Contactas a la Dra. Mendoza directamente, le explicas que el lote no pasó la prueba de integridad, que la retención es por seguridad del paciente, y le presentas un plan de contingencia con cronograma de entrega del lote reprocesado o un lote alternativo.",
          },
          {
            label: "Mencionar un retraso sin especificar la causa",
            description:
              "Informas a GHN que habrá un retraso de una semana en la entrega por 'motivos de producción' sin mencionar el fallo de calidad, para no alarmar al cliente ni poner en riesgo la relación.",
          },
          {
            label: "Ofrecer producto alternativo de inventario",
            description:
              "Revisas el inventario de producto terminado y ofreces a GHN un envío parcial de 30,000 catéteres de un lote diferente que sí pasó pruebas, cubriendo las necesidades inmediatas más críticas mientras se resuelve el resto.",
          },
        ],
        consequences: [
          "La Dra. Mendoza escucha con atención. Inicialmente está molesta por el retraso, pero reconoce y valora tu transparencia sobre el tema de seguridad del paciente. Te dice: 'Prefiero un proveedor que retenga un lote defectuoso a uno que me envíe producto malo.' Acepta un plazo de 10 días y solicita un reporte formal de la no conformidad y las acciones correctivas. La relación se fortalece por la confianza generada.",
          "GHN acepta el 'retraso de producción' por ahora. Pero cuando eventualmente se entera del problema de calidad real a través de la auditoría de COFEPRIS (que se hace pública), la Dra. Mendoza se siente engañada. Rescinde el contrato invocando la cláusula de falta de transparencia y demanda los $2.8 millones de penalización más daños adicionales por haber perdido la confianza en tu empresa.",
          "GHN acepta el envío parcial de 30,000 unidades para cubrir los hospitales más urgentes. La Dra. Mendoza aprecia la solución proactiva y te da 12 días adicionales para completar el pedido con el lote restante. Esto te da tiempo para reprocesar o producir un lote nuevo sin la presión extrema de tiempo.",
        ],
        proceduralReference:
          "PROC-CAL-007 Sección 6.1: 'La comunicación con clientes sobre no conformidades de producto debe ser transparente y oportuna, incluyendo el análisis de impacto y el plan de acción correctiva.' ISO 13485:2016 Cláusula 8.2.2: 'La organización debe notificar a las partes interesadas cuando se identifique producto no conforme que ya fue entregado o podría haber sido entregado.'",
        riskLevelByOption: ["LOW", "HIGH", "LOW"],
      },
      {
        order: 3,
        prompt:
          "La investigación de causa raíz revela que el proveedor de material de sellado cambió su formulación hace 3 meses sin notificarte. El cambio no fue detectado por recepción de materiales porque las pruebas de entrada solo verifican dimensiones, no composición química. El Director de Operaciones propone dos opciones de remedio: reprocesar el lote (costo: $180,000, tiempo: 5 días) o destruir y producir nuevo (costo: $420,000, tiempo: 8 días). ¿Cómo evalúas el riesgo y decides?",
        options: [
          {
            label: "Reprocesar el lote con controles adicionales",
            description:
              "Autorizas el reproceso del lote con re-sellado completo usando material correcto, pruebas de integridad al 100% de las unidades (no solo muestreo), y verificación de biocompatibilidad del reproceso.",
          },
          {
            label: "Destruir y producir lote nuevo",
            description:
              "Ordenas la destrucción del lote completo y la producción de uno nuevo con material de sellado verificado, eliminando cualquier riesgo residual del material comprometido.",
          },
          {
            label: "Análisis de riesgo detallado antes de decidir",
            description:
              "Convocas al equipo de calidad, producción y regulatorio para realizar un análisis de riesgo formal (FMEA de producto) que determine si el reproceso es viable sin comprometer la seguridad o si la destrucción es la única opción aceptable.",
          },
        ],
        consequences: [
          "El reproceso se ejecuta en 5 días. La prueba al 100% revela que el 98.7% de las unidades se sellan correctamente con el nuevo material. Se descartan las 650 unidades que no pasan la prueba individual. El lote reducido de 49,350 unidades se libera con documentación completa. GHN recibe el producto en 7 días con toda la trazabilidad del reproceso.",
          "El lote se destruye con acta notarial. La producción del nuevo lote toma 8 días con materia prima verificada. El costo total es significativamente mayor pero el riesgo es cero. GHN aprecia la decisión radical y la Dra. Mendoza comenta: 'Esto demuestra que su compromiso con la calidad es real, no solo palabras en un certificado.'",
          "El FMEA de producto determina que el reproceso es viable siempre que se realice prueba al 100% y verificación de biocompatibilidad. Sin embargo, el análisis identifica un riesgo adicional: si el material de sellado incorrecto interactuó químicamente con el catéter, podría haber liberado compuestos tóxicos. Se ordena una prueba de extractables que toma 3 días adicionales. La decisión informada protege tanto a los pacientes como a la empresa.",
        ],
        proceduralReference:
          "ISO 13485:2016 Cláusula 8.3.4: 'Cuando se reprocesa producto, la organización debe evaluar cualquier efecto adverso del reproceso sobre el producto y documentar el reproceso.' PROC-CAL-009 Sección 3.1: 'El reproceso de dispositivos médicos requiere validación previa, análisis de riesgo y pruebas de liberación al 100% de las unidades.'",
        riskLevelByOption: ["MEDIUM", "LOW", "LOW"],
      },
      {
        order: 4,
        prompt:
          "Mientras resuelves la crisis del lote, debes decidir qué hacer con el proveedor de material de sellado que cambió la formulación sin notificarte. El proveedor, SealTech Industrial, es el único fabricante en México de este material específico. Importar de EE.UU. duplicaría el costo y agregaría 6 semanas al lead time. SealTech argumenta que el cambio 'mejoró' su producto y que no estaba obligado contractualmente a notificarte. ¿Qué alternativa seleccionas?",
        options: [
          {
            label: "Exigir reversión y auditar a SealTech",
            description:
              "Exiges formalmente que SealTech revierta a la formulación original, estableces un acuerdo de control de cambios obligatorio, y programas una auditoría de calidad a sus instalaciones para verificar sus controles de proceso.",
          },
          {
            label: "Buscar proveedor alternativo internacional",
            description:
              "Inicias inmediatamente la calificación de un proveedor alternativo de EE.UU. o Europa para reducir la dependencia de SealTech, aceptando el costo y tiempo adicional como inversión en seguridad de suministro.",
          },
          {
            label: "Renegociar contrato con cláusulas de control de cambios",
            description:
              "Mantienes a SealTech pero renegociaciones el contrato incluyendo cláusulas estrictas de notificación de cambios, penalizaciones por cambios no notificados, y derecho de auditoría.",
          },
          {
            label: "Dual sourcing: calificar alternativo sin romper con SealTech",
            description:
              "Mantienes la relación con SealTech mientras calificas en paralelo un proveedor alternativo, creando una estrategia de doble fuente que te proteja sin dejar la planta sin suministro.",
          },
        ],
        consequences: [
          "SealTech acepta revertir la formulación en 2 semanas. La auditoría revela que tienen controles de cambio débiles y que este no fue el primer cambio no notificado a clientes. Estableces un acuerdo de calidad actualizado con cláusulas de notificación y apruebas el material reformulado tras pruebas completas. Sin embargo, sigues dependiendo de un solo proveedor.",
          "Inicias el proceso de calificación de MedSeal Corp. de Minnesota. El proceso toma 4 meses incluyendo pruebas de biocompatibilidad y validación de proceso. Durante ese tiempo, dependes completamente de SealTech. El costo del material importado es 85% más alto, lo que impacta tus márgenes. Pero al final tienes un proveedor alternativo calificado.",
          "SealTech acepta las nuevas cláusulas contractuales después de una negociación tensa. Sin embargo, las cláusulas no cambian la cultura interna de SealTech. Seis meses después, realizan otro cambio menor sin notificarte, aunque esta vez lo detectas en recepción de materiales. La relación se deteriora progresivamente.",
          "Mantienes a SealTech con contrato renegociado mientras calificas a MedSeal Corp. en paralelo. En 6 meses tienes dos proveedores calificados y puedes distribuir volúmenes. SealTech, al saber que ya no es exclusivo, mejora significativamente su servicio y controles de cambio. La competencia entre proveedores beneficia tu operación.",
        ],
        proceduralReference:
          "ISO 13485:2016 Cláusula 7.4: 'La organización debe establecer criterios para la evaluación, selección, seguimiento y reevaluación de proveedores.' PROC-CAL-011 Sección 4.3: 'Los proveedores de materiales críticos para dispositivos médicos deben notificar cualquier cambio en formulación, proceso o sitio de manufactura con un mínimo de 90 días de anticipación.'",
        riskLevelByOption: ["MEDIUM", "MEDIUM", "MEDIUM", "LOW"],
      },
      {
        order: 5,
        prompt:
          "El incidente está por cerrarse. El Director General te solicita tu recomendación sobre cómo fortalecer el sistema de calidad para evitar que algo así se repita. La certificación ISO 13485 se renueva en 4 meses y COFEPRIS realizará una inspección de seguimiento en 6 meses. ¿Cuál es tu propuesta de resolución integral?",
        options: [
          {
            label: "Fortalecimiento del sistema de control de proveedores",
            description:
              "Propones implementar pruebas de identidad química en recepción de materiales, auditorías semestrales a proveedores críticos, y un sistema de alerta temprana para cambios en la cadena de suministro.",
          },
          {
            label: "Rediseño integral del sistema de gestión de calidad",
            description:
              "Propones una revisión completa del sistema de calidad: desde la selección de proveedores hasta la liberación de producto, incluyendo digitalización de registros, implementación de análisis estadístico en tiempo real, y un programa de cultura de calidad para todo el personal.",
          },
          {
            label: "Acciones correctivas mínimas para cerrar la no conformidad",
            description:
              "Propones las acciones correctivas específicas para este incidente (pruebas en recepción, control de cambios con SealTech) sin cambios sistémicos mayores al sistema de calidad.",
          },
        ],
        consequences: [
          "Se implementan las pruebas de identidad química en 60 días. Las auditorías semestrales revelan oportunidades de mejora en dos proveedores adicionales antes de que causen problemas. La auditoría de ISO 13485 cita el fortalecimiento como evidencia de mejora continua y se renueva la certificación sin no conformidades. COFEPRIS queda satisfecha con las acciones tomadas.",
          "La revisión integral transforma el departamento de calidad. La digitalización reduce el tiempo de liberación de lotes en un 40%. El análisis estadístico en tiempo real detecta una tendencia de variación en otro producto antes de que llegue a falla. La empresa se posiciona como referente de calidad en la industria y GHN aumenta su contrato en un 25% al siguiente año.",
          "Las acciones correctivas mínimas cierran la no conformidad pero no abordan las causas sistémicas. La auditoría de ISO 13485 identifica debilidades en el sistema de evaluación de proveedores y emite una no conformidad menor. COFEPRIS observa que las acciones fueron reactivas y solicita un plan de fortalecimiento más robusto, retrasando la resolución del expediente regulatorio.",
        ],
        proceduralReference:
          "ISO 13485:2016 Cláusula 10.1: 'La organización debe planificar e implementar procesos de seguimiento, medición, análisis y mejora para demostrar conformidad del producto y mejorar continuamente la eficacia del sistema de gestión de calidad.' NOM-241-SSA1-2012 Sección 15: 'Los establecimientos deben contar con un sistema de gestión de calidad que asegure la calidad, seguridad y eficacia de los dispositivos médicos.'",
        riskLevelByOption: ["LOW", "LOW", "MEDIUM"],
      },
    ],
  },

  // ─── Case 5: La Cadena Rota ─────────────────────────────────────────
  {
    title: "La Cadena Rota",
    targetRole: "DIRECTOR_LOGISTICA",
    narrative:
      "Eres el Director de Logística de una empresa importadora y distribuidora de equipos industriales con operaciones en 5 estados de México. Es lunes a las 8am. Tu agente aduanal te informa que un contenedor con $3.2 millones de pesos en equipos de automatización industrial está detenido en la aduana de Manzanillo desde hace 72 horas. La razón: una discrepancia entre la clasificación arancelaria declarada (fracción 8479.89.99) y la que el verificador aduanal considera correcta (fracción 8537.10.01), lo que implica un diferencial de arancel de $480,000 pesos. Tu cliente final, Cervecería Modelo, necesita los equipos instalados antes del 15 del mes para no retrasar su expansión de planta. El agente aduanal te dice en privado: 'Conozco al verificador. Con $50,000 pesos podemos destrabar esto hoy mismo y la mercancía sale mañana. Es lo que todos hacen.' La penalización por incumplimiento con Cervecería Modelo es de $1.5 millones de pesos.",
    context: {
      companyName: "ImportTech Industrial S.A. de C.V.",
      cargoValue: 3200000,
      port: "Manzanillo",
      tariffDifference: 480000,
      clientName: "Cervecería Modelo",
      installationDeadline: "15 del mes",
      bribeAmount: 50000,
      penalty: 1500000,
      declaredFraction: "8479.89.99",
      suggestedFraction: "8537.10.01",
    },
    decisions: [
      {
        order: 1,
        prompt:
          "Tu agente aduanal espera tu respuesta sobre el pago al verificador. Mientras tanto, recibes un mensaje de Cervecería Modelo preguntando por el estatus de la entrega. Tu equipo comercial te presiona: 'Si perdemos a Modelo, perdemos el 20% de la facturación del año.' ¿Cuál es tu decisión inmediata?",
        options: [
          {
            label: "Rechazar el soborno y solicitar revisión formal",
            description:
              "Rechazas categóricamente la propuesta de pago ilícito y solicitas formalmente al agente aduanal que presente un recurso de revisión de clasificación arancelaria ante la autoridad aduanera, aportando la ficha técnica del fabricante como evidencia.",
          },
          {
            label: "Aceptar el pago para destrabar la mercancía",
            description:
              "Autorizas el pago de $50,000 al verificador para liberar el contenedor rápidamente, considerándolo un costo menor frente a la penalización de $1.5 millones y la pérdida potencial del cliente.",
          },
          {
            label: "Consultar con un segundo agente aduanal",
            description:
              "Sin responder a la propuesta del soborno, contactas a un segundo agente aduanal certificado para obtener una opinión independiente sobre la clasificación arancelaria correcta y las opciones legales de desaduanamiento.",
          },
          {
            label: "Contactar directamente al SAT",
            description:
              "Contactas a la Administración General de Aduanas del SAT para reportar la situación y solicitar orientación sobre el proceso correcto de resolución de discrepancias arancelarias.",
          },
        ],
        consequences: [
          "Tu agente aduanal presenta el recurso formal con la ficha técnica del fabricante. El proceso toma entre 5 y 10 días hábiles. Cervecería Modelo se pone nerviosa con el plazo. Sin embargo, durante el proceso formal, un dictaminador del SAT revisa la documentación técnica y confirma que tu clasificación original era correcta, evitándote los $480,000 de arancel adicional.",
          "El verificador acepta el pago y la mercancía se libera al día siguiente. Dos meses después, la Unidad de Inteligencia Financiera (UIF) detecta el movimiento irregular. El SAT inicia una auditoría profunda a tu empresa y al agente aduanal. Se descubren las comunicaciones y se abre un procedimiento penal por cohecho a servidor público. La multa puede alcanzar hasta $5 millones de pesos más la inhabilitación para importar.",
          "El segundo agente aduanal revisa la documentación y opina que la clasificación original (8479.89.99) es defendible pero que la fracción alternativa también tiene argumentos. Sugiere presentar una consulta de clasificación arancelaria formal que se resuelve en 7-10 días, o pagar el diferencial bajo protesta y solicitar devolución posterior si se resuelve a tu favor.",
          "El SAT responde a tu solicitud en 48 horas con una cita para consulta de clasificación. El proceso es más lento pero queda documentado institucionalmente. El verificador, al enterarse de que contactaste al SAT directamente, se abstiene de insistir en el soborno. La mercancía permanece detenida pero el proceso es transparente y legal.",
        ],
        proceduralReference:
          "Ley Aduanera Art. 47: 'Los importadores tienen derecho a solicitar la revisión de la clasificación arancelaria determinada por la autoridad.' Código Penal Federal Art. 222: 'Se impondrán de tres a ocho años de prisión y multa por cohecho a servidor público.' PROC-LOG-002 Sección 3.4: 'Queda estrictamente prohibido realizar pagos extraoficiales a autoridades aduaneras o sus representantes.'",
        riskLevelByOption: ["LOW", "CRITICAL", "LOW", "LOW"],
      },
      {
        order: 2,
        prompt:
          "Mientras el proceso aduanal se resuelve, necesitas manejar la situación con Cervecería Modelo. El gerente de proyecto de Modelo, Ing. Roberto Sánchez, te llama exigiendo una fecha firme de entrega. Su línea de producción nueva está programada para arrancar el día 15 y cualquier retraso les cuesta $800,000 diarios en producción perdida. Ofrece ayuda: 'Nosotros tenemos contactos en la aduana de Lázaro Cárdenas. Podemos redirigir otro contenedor que tenemos ahí y prestarte los equipos mientras sale tu carga.' ¿Cómo respondes?",
        options: [
          {
            label: "Agradecer pero manejar la situación independientemente",
            description:
              "Agradeces la oferta del Ing. Sánchez pero le explicas que estás manejando la situación por los canales legales y le presentas un cronograma realista con tres escenarios: optimista (7 días), base (12 días) y pesimista (20 días).",
          },
          {
            label: "Aceptar el préstamo de equipos de Modelo",
            description:
              "Aceptas el préstamo temporal de equipos de Modelo para iniciar la instalación mientras tu contenedor se libera, formalizando el acuerdo con un contrato de préstamo de uso documentado.",
          },
          {
            label: "Buscar equipos equivalentes en inventario nacional",
            description:
              "Contactas a tus otros clientes y a la casa matriz del fabricante para localizar equipos equivalentes en inventario dentro de México que puedan enviarse a Modelo como solución interina.",
          },
          {
            label: "Negociar extensión de plazo con compensación",
            description:
              "Propones a Modelo una extensión de 10 días con una compensación: un descuento del 8% sobre el valor total del pedido y servicio de instalación prioritario 24/7 una vez que lleguen los equipos.",
          },
        ],
        consequences: [
          "El Ing. Sánchez aprecia la transparencia y los tres escenarios. Solicita el escenario optimista como meta y el base como compromiso. Ajusta su cronograma de arranque y notifica a su dirección. La relación profesional se mantiene basada en confianza y comunicación clara. Sin embargo, la presión del tiempo sigue siendo real.",
          "Modelo tiene equipos compatibles en su centro de distribución. Se formaliza un contrato de préstamo de uso por 30 días. La instalación avanza con los equipos prestados y cuando tu contenedor se libera, se sustituyen. La solución creativa impresiona al Ing. Sánchez, quien recomienda tu empresa para otros proyectos del grupo. Sin embargo, asumes riesgo de responsabilidad sobre equipos que no son tuyos.",
          "Localizas equipos equivalentes en el almacén de tu representado en Guadalajara: 60% de lo que necesita Modelo. Los envías en 48 horas. El Ing. Sánchez puede iniciar la instalación parcial mientras espera el resto. La solución demuestra capacidad de respuesta y conocimiento de la red de distribución.",
          "Modelo acepta la extensión con el descuento del 8% ($256,000 sobre $3.2M). El costo para tu empresa es significativo pero menor que la penalización de $1.5M. El Ing. Sánchez ajusta su cronograma y la relación continúa. Tu Director Comercial cuestiona si no cediste demasiado en el descuento.",
        ],
        proceduralReference:
          "PROC-COM-003 Sección 4.1: 'Ante retrasos por causas ajenas a la empresa, se debe comunicar al cliente con transparencia, presentar escenarios y proponer soluciones alternativas.' Código de Comercio Art. 83: 'El comodato (préstamo de uso) debe formalizarse por escrito especificando condiciones, responsabilidades y plazo de devolución.'",
        riskLevelByOption: ["LOW", "MEDIUM", "LOW", "MEDIUM"],
      },
      {
        order: 3,
        prompt:
          "Tu agente aduanal original te llama para decirte que renunció a representarte porque no aceptaste su 'sugerencia' de pago. Te quedas sin agente aduanal en Manzanillo con mercancía detenida. El nuevo agente que contactaste necesita 48 horas para revisar el expediente y asumir la representación legal. Mientras tanto, la autoridad aduanera te notifica que si no presentas recurso en 5 días hábiles, la clasificación del verificador se convierte en definitiva y deberás pagar los $480,000 de diferencial arancelario. ¿Cómo manejas la urgencia?",
        options: [
          {
            label: "Contratar abogado especialista en comercio exterior",
            description:
              "Contratas inmediatamente un despacho de abogados especializado en comercio exterior que pueda asumir la representación legal en paralelo al nuevo agente aduanal y presentar el recurso dentro del plazo.",
          },
          {
            label: "Pagar el diferencial bajo protesta",
            description:
              "Pagas los $480,000 de diferencial arancelario bajo protesta formal, lo que libera la mercancía inmediatamente, y posteriormente presentas un recurso de revocación para recuperar el monto si la clasificación original se confirma como correcta.",
          },
          {
            label: "Solicitar extensión del plazo al SAT",
            description:
              "Presentas una solicitud formal de extensión del plazo de 5 días argumentando que tu agente aduanal renunció y necesitas tiempo para designar nueva representación legal.",
          },
        ],
        consequences: [
          "El despacho de abogados especializado tiene experiencia en clasificaciones arancelarias disputadas. Presentan el recurso con argumentación técnica sólida y jurisprudencia a favor en casos similares. El costo del despacho es de $120,000 pero la probabilidad de ganar el recurso es del 75%. Si ganan, evitas los $480,000 del diferencial. El recurso se presenta dentro del plazo.",
          "Pagas los $480,000 bajo protesta y la mercancía se libera en 24 horas. El contenedor sale de Manzanillo el miércoles y llega a la planta de Modelo el viernes. La instalación puede comenzar a tiempo. Presentas el recurso de revocación y 4 meses después el SAT resuelve a tu favor y te devuelve los $480,000. El costo financiero del dinero inmovilizado es menor que la penalización.",
          "El SAT rechaza la solicitud de extensión argumentando que el plazo de 5 días está establecido por ley y no es prorrogable. Has perdido 48 horas valiosas y ahora solo te quedan 3 días para encontrar representación y presentar el recurso. La situación se vuelve más crítica y tus opciones se reducen.",
        ],
        proceduralReference:
          "Ley Aduanera Art. 203: 'Contra las resoluciones definitivas dictadas en materia aduanera procede el recurso de revocación, que debe presentarse dentro de los 45 días siguientes a la notificación.' Art. 144: 'El pago bajo protesta no implica consentimiento de la resolución y preserva el derecho de impugnación.' PROC-LOG-002 Sección 5.2: 'Ante cambios de agente aduanal, se debe garantizar continuidad de la representación legal sin interrupción.'",
        riskLevelByOption: ["LOW", "LOW", "HIGH"],
      },
      {
        order: 4,
        prompt:
          "El incidente te obliga a revisar toda tu operación de comercio exterior. Descubres que en los últimos dos años, tu agente aduanal anterior manejó 47 importaciones y no tienes certeza de que todas las clasificaciones arancelarias fueron correctas. Si alguna fue intencionalmente mal clasificada para pagar menos aranceles, tu empresa podría enfrentar créditos fiscales retroactivos con recargos y multas. ¿Cómo documentas y resuelves este riesgo histórico?",
        options: [
          {
            label: "Auditoría voluntaria de comercio exterior",
            description:
              "Contratas una firma especializada para realizar una auditoría voluntaria de las 47 importaciones, identificar discrepancias y presentar rectificaciones voluntarias ante el SAT antes de que inicien una auditoría de oficio.",
          },
          {
            label: "Revisión interna selectiva",
            description:
              "Realizas una revisión interna de las importaciones de mayor monto (top 10) para identificar posibles discrepancias en las clasificaciones más significativas, sin involucrar consultores externos.",
          },
          {
            label: "No realizar revisión histórica",
            description:
              "Decides no revisar las importaciones pasadas argumentando que fueron responsabilidad del agente aduanal y que la empresa actuó de buena fe basándose en su clasificación profesional.",
          },
        ],
        consequences: [
          "La auditoría voluntaria identifica 5 importaciones con clasificación arancelaria incorrecta, con un diferencial total de $320,000. Presentas la rectificación voluntaria al SAT, lo que reduce las multas al mínimo legal (20% del diferencial en lugar de 100-150%). Pagas $384,000 en total (diferencial + multa reducida). El SAT valora la acción voluntaria y no inicia auditoría de oficio. La empresa queda limpia.",
          "La revisión interna encuentra 2 de las 5 discrepancias que existían. Las 3 restantes, que suman $210,000, no son detectadas. Cuando el SAT realiza una auditoría de oficio 8 meses después (motivada por la renuncia del agente aduanal), descubre las 3 discrepancias no reportadas y aplica multas del 150% por las que no se corrigieron voluntariamente. El costo total se multiplica.",
          "Un año después, el SAT selecciona a tu empresa para una revisión de gabinete basándose en el perfil de riesgo generado por la disputa en Manzanillo. Descubren las 5 clasificaciones incorrectas y aplican créditos fiscales retroactivos con multas del 150% y recargos acumulados. El monto total asciende a $1.2 millones. Además, inician un procedimiento contra tu empresa por posible defraudación fiscal.",
        ],
        proceduralReference:
          "Código Fiscal de la Federación Art. 73: 'Las multas se reducen al 20% cuando el contribuyente autocorrige antes de cualquier requerimiento de la autoridad.' Ley Aduanera Art. 184 Fracción III: 'Es infracción clasificar incorrectamente las mercancías en el pedimento, con multas del 70% al 100% del impuesto omitido.' PROC-LOG-002 Sección 7.1: 'La empresa debe realizar auditorías periódicas de clasificación arancelaria como parte de su programa de cumplimiento de comercio exterior.'",
        riskLevelByOption: ["LOW", "MEDIUM", "CRITICAL"],
      },
      {
        order: 5,
        prompt:
          "El Director General te solicita una propuesta de resolución integral que incluya: la situación inmediata del contenedor, la relación con Cervecería Modelo, la selección de nuevo agente aduanal, y los controles preventivos para futuras importaciones. Además, el Consejo de Administración quiere entender cómo evitar dependencia de un solo agente aduanal y cómo proteger a la empresa de riesgos de compliance en comercio exterior. ¿Cuál es tu propuesta?",
        options: [
          {
            label: "Programa integral de compliance en comercio exterior",
            description:
              "Propones: selección de dos agentes aduanales certificados, programa de auditoría trimestral de clasificaciones, póliza de seguro de responsabilidad aduanera, capacitación del equipo interno en comercio exterior, y un sistema de pre-clasificación con dictámenes técnicos del fabricante para cada producto.",
          },
          {
            label: "Mejoras operativas enfocadas en la crisis",
            description:
              "Propones resolver la situación inmediata con un nuevo agente aduanal confiable, implementar una verificación dual de clasificaciones para importaciones mayores a $500,000, y crear un archivo documental de fichas técnicas para soporte de clasificación.",
          },
          {
            label: "Internalizar parcialmente la función aduanal",
            description:
              "Propones contratar un especialista interno en comercio exterior que supervise y valide el trabajo de los agentes aduanales, implemente un programa de cumplimiento normativo completo, y represente a la empresa como interlocutor técnico ante las autoridades aduaneras.",
          },
        ],
        consequences: [
          "El Consejo aprueba el programa integral con un presupuesto anual de $800,000. En el primer año, el programa detecta y corrige 3 clasificaciones arancelarias antes de que se conviertan en problemas. La empresa obtiene el estatus de Operador Económico Autorizado (OEA) del SAT, lo que le da beneficios de despacho acelerado y menos revisiones. Cervecería Modelo renueva el contrato y la empresa gana reputación de empresa confiable en comercio exterior.",
          "Las mejoras operativas resuelven el problema inmediato pero no abordan los riesgos sistémicos. La verificación dual funciona bien para importaciones grandes pero las menores siguen sin control. Un año después, surge un problema similar con una importación de $200,000 que no pasó por la verificación dual. La falta de un enfoque integral deja brechas de riesgo.",
          "El especialista interno transforma la función de comercio exterior. Su conocimiento técnico permite negociar mejores condiciones con agentes aduanales, pre-clasificar productos con certeza, y representar a la empresa ante el SAT con autoridad. En 18 meses, el costo de errores en comercio exterior se reduce en un 90% y los tiempos de despacho mejoran un 30%. La inversión en el especialista ($600,000 anuales) se paga sola con los ahorros generados.",
        ],
        proceduralReference:
          "Ley Aduanera Art. 100-A: 'Las empresas podrán obtener la certificación de Operador Económico Autorizado que otorga beneficios de facilitación aduanera.' PROC-LOG-002 Sección 8.1: 'La empresa debe mantener un programa de cumplimiento de comercio exterior que incluya auditorías periódicas, capacitación y controles preventivos.' Reglas Generales de Comercio Exterior Regla 7.1.1: 'Los requisitos para OEA incluyen un sistema de control interno de comercio exterior documentado y verificable.'",
        riskLevelByOption: ["LOW", "MEDIUM", "LOW"],
      },
    ],
  },
];

export async function seedSimulations(
  orgId: string,
  processId: string,
): Promise<void> {
  // Idempotency check
  const existing = await db.simulationTemplate.findFirst({
    where: { organizationId: orgId, title: "El Proveedor Fantasma" },
  });
  if (existing) {
    console.log("Simulation templates already seeded, skipping.");
    return;
  }

  console.log("Seeding 5 Harvard-style simulation templates...");

  for (const caseData of cases) {
    const template = await db.simulationTemplate.create({
      data: {
        organizationId: orgId,
        processDefinitionId: processId,
        title: caseData.title,
        narrative: caseData.narrative,
        targetRole: caseData.targetRole,
        status: "PUBLISHED",
        version: 1,
        riskIds: [],
        createdBy: "seed",
      },
    });

    const scenario = await db.simulationScenario.create({
      data: {
        templateId: template.id,
        context: caseData.context,
      },
    });

    for (const decision of caseData.decisions) {
      await db.decision.create({
        data: {
          scenarioId: scenario.id,
          order: decision.order,
          prompt: decision.prompt,
          options: decision.options,
          consequences: decision.consequences,
          proceduralReference: decision.proceduralReference,
          riskLevelByOption: decision.riskLevelByOption,
        },
      });
    }

    console.log(`  Created template: ${caseData.title}`);
  }

  console.log("Done seeding simulation templates.");
}
