import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";
import { TOTAL_CREDITS } from "../../data/lti";

interface AnalyticsChartsProps {
	pieData: Array<{ name: string; value: number; color: string }>;
	barData: Array<{ name: string; Promedio: number }>;
	totalApproved: number;
}

export function AnalyticsCharts({
	pieData,
	barData,
	totalApproved,
}: AnalyticsChartsProps) {
	return (
		<div className="@container">
			<div className="grid grid-cols-1 @lg:grid-cols-3 gap-6">
				<div className="card p-5 col-span-1 border-t-2 border-lti-coral">
					<h2 className="text-white font-semibold text-sm mb-4">
						Progreso de la Carrera
					</h2>
					<div className="h-48 relative">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={pieData}
									cx="50%"
									cy="50%"
									innerRadius={50}
									outerRadius={70}
									paddingAngle={5}
									dataKey="value"
									stroke="none"
								>
									{pieData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<RechartsTooltip
									contentStyle={{
										backgroundColor: "#1e293b",
										borderColor: "#334155",
										borderRadius: "0.5rem",
										color: "#f8fafc",
										fontSize: "12px",
									}}
									itemStyle={{ color: "#e2e8f0" }}
								/>
							</PieChart>
						</ResponsiveContainer>
						<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
							<span className="text-3xl font-bold text-white tracking-tight">
								{Math.round((totalApproved / TOTAL_CREDITS) * 100)}%
							</span>
							<span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
								Completado
							</span>
						</div>
					</div>
					<div className="flex justify-center gap-4 mt-2">
						{pieData.map((d) => (
							<div key={d.name} className="flex items-center gap-1.5">
								<div
									className="w-2.5 h-2.5 rounded-full"
									style={{ backgroundColor: d.color }}
								></div>
								<span className="text-xs text-slate-400 font-medium">
									{d.name}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className="card p-5 col-span-1 lg:col-span-2 border-t-2 border-lti-blue">
					<h2 className="text-white font-semibold text-sm mb-4">
						Promedio por Semestre
					</h2>
					<div className="h-52">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={barData}
								margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#334155"
									opacity={0.5}
								/>
								<XAxis
									dataKey="name"
									axisLine={false}
									tickLine={false}
									tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
									dy={10}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fill: "#64748b", fontSize: 12 }}
									domain={[0, 5]}
									ticks={[1, 2, 3, 4, 5]}
									width={40}
								/>
								<RechartsTooltip
									cursor={{ fill: "#1e293b", opacity: 0.4 }}
									contentStyle={{
										backgroundColor: "#0f172a",
										borderColor: "#334155",
										borderRadius: "0.5rem",
										color: "#f8fafc",
										fontSize: "12px",
										boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
									}}
									itemStyle={{ color: "#e2e8f0", fontWeight: 600 }}
								/>
								<Bar
									dataKey="Promedio"
									fill="url(#colorUv)"
									radius={[6, 6, 0, 0]}
									barSize={36}
								>
									{barData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.Promedio > 0 ? "#3b82f6" : "#334155"}
										/>
									))}
								</Bar>
								<defs>
									<linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
										<stop offset="95%" stopColor="#2563eb" stopOpacity={0.7} />
									</linearGradient>
								</defs>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
}
