const rows = [
	{ activity: "Recepcion de pedido", failure: "Datos incompletos del cliente", s: 7, o: 6, d: 4, rpn: 168 },
	{ activity: "Verificacion crediticia", failure: "Sin verificacion automatica", s: 9, o: 3, d: 8, rpn: 216 },
	{ activity: "Preparacion de envio", failure: "Error en picking de productos", s: 6, o: 5, d: 5, rpn: 150 },
	{ activity: "Facturacion", failure: "Discrepancia precio/contrato", s: 8, o: 4, d: 3, rpn: 96 },
	{ activity: "Entrega al cliente", failure: "Retraso por ruta no optimizada", s: 5, o: 7, d: 6, rpn: 210 },
];

function getRpnColor(rpn: number) {
	if (rpn >= 200) return "text-red-400 font-bold";
	if (rpn >= 150) return "text-amber-400 font-semibold";
	return "text-[#94A3B8]";
}

export function FmeaTableMock() {
	return (
		<div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
			<table className="w-full text-xs sm:text-sm">
				<thead>
					<tr className="bg-[#3B8FE8]/10 text-[#3B8FE8]">
						<th className="px-3 py-2.5 text-left font-semibold">Actividad</th>
						<th className="px-3 py-2.5 text-left font-semibold">Modo de Falla</th>
						<th className="px-3 py-2.5 text-center font-semibold">S</th>
						<th className="px-3 py-2.5 text-center font-semibold">O</th>
						<th className="px-3 py-2.5 text-center font-semibold">D</th>
						<th className="px-3 py-2.5 text-center font-semibold">RPN</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr
							key={row.activity}
							className={i % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"}
						>
							<td className="px-3 py-2.5 text-[#0A1428] font-medium">{row.activity}</td>
							<td className="px-3 py-2.5 text-[#64748B]">{row.failure}</td>
							<td className="px-3 py-2.5 text-center text-[#0A1428]">{row.s}</td>
							<td className="px-3 py-2.5 text-center text-[#0A1428]">{row.o}</td>
							<td className="px-3 py-2.5 text-center text-[#0A1428]">{row.d}</td>
							<td className={`px-3 py-2.5 text-center ${getRpnColor(row.rpn)}`}>{row.rpn}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
