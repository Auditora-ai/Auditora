export const INDUSTRIES = [
	{ value: "manufactura", label: "Manufactura" },
	{ value: "alimentos_bebidas", label: "Alimentos y Bebidas" },
	{ value: "automotriz", label: "Automotriz y Autopartes" },
	{ value: "tecnologia", label: "Tecnología e Informática" },
	{ value: "salud", label: "Salud y Farmacéutica" },
	{ value: "finanzas", label: "Servicios Financieros y Banca" },
	{ value: "seguros", label: "Seguros" },
	{ value: "retail", label: "Retail y Comercio" },
	{ value: "logistica", label: "Logística y Transporte" },
	{ value: "construccion", label: "Construcción e Inmobiliaria" },
	{ value: "energia", label: "Energía y Minería" },
	{ value: "telecomunicaciones", label: "Telecomunicaciones" },
	{ value: "educacion", label: "Educación" },
	{ value: "gobierno", label: "Gobierno y Sector Público" },
	{ value: "agricultura", label: "Agricultura y Agroindustria" },
	{ value: "servicios_profesionales", label: "Servicios Profesionales" },
	{ value: "turismo", label: "Turismo y Hotelería" },
	{ value: "quimica", label: "Química y Petroquímica" },
	{ value: "textil", label: "Textil y Confección" },
	{ value: "otro", label: "Otra industria" },
] as const;

export type IndustryValue = (typeof INDUSTRIES)[number]["value"];

export const COMPANY_SIZES = [
	{ value: "1-10", label: "1–10 empleados" },
	{ value: "11-50", label: "11–50 empleados" },
	{ value: "51-200", label: "51–200 empleados" },
	{ value: "201-500", label: "201–500 empleados" },
	{ value: "500+", label: "Más de 500 empleados" },
] as const;

export type CompanySizeValue = (typeof COMPANY_SIZES)[number]["value"];

export const COUNTRIES = [
	{ value: "MX", label: "México" },
	{ value: "CO", label: "Colombia" },
	{ value: "AR", label: "Argentina" },
	{ value: "CL", label: "Chile" },
	{ value: "PE", label: "Perú" },
	{ value: "EC", label: "Ecuador" },
	{ value: "PA", label: "Panamá" },
	{ value: "CR", label: "Costa Rica" },
	{ value: "DO", label: "República Dominicana" },
	{ value: "GT", label: "Guatemala" },
	{ value: "UY", label: "Uruguay" },
	{ value: "BO", label: "Bolivia" },
	{ value: "PY", label: "Paraguay" },
	{ value: "VE", label: "Venezuela" },
	{ value: "ES", label: "España" },
	{ value: "US", label: "Estados Unidos" },
	{ value: "OTHER", label: "Otro país" },
] as const;

export type CountryValue = (typeof COUNTRIES)[number]["value"];
