import { lazy, Suspense, useEffect, useState } from "react";
import type { AetherNoteId } from "../../store/aetherStore";

const ForceGraph2D = lazy(() => import("react-force-graph-2d"));

interface GraphData {
	nodes: { id: AetherNoteId; name: string; val: number }[];
	links: { source: AetherNoteId; target: AetherNoteId }[];
}

interface AetherGraphViewProps {
	graphData: GraphData;
	onNodeClick: (id: AetherNoteId) => void;
}

export function AetherGraphView({
	graphData,
	onNodeClick,
}: AetherGraphViewProps) {
	const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

	useEffect(() => {
		const update = () => {
			const container = document.getElementById("aether-graph-container");
			if (container) {
				setDimensions({
					width: container.clientWidth,
					height: container.clientHeight,
				});
			}
		};
		window.addEventListener("resize", update);
		const timer = setTimeout(update, 100);
		return () => {
			window.removeEventListener("resize", update);
			clearTimeout(timer);
		};
	}, []);

	return (
		<div className="flex-1 bg-[#090b10]">
			<Suspense
				fallback={
					<div className="h-full flex items-center justify-center text-slate-500">
						Iniciando motor gráfico...
					</div>
				}
			>
				<ForceGraph2D
					width={dimensions.width}
					height={dimensions.height}
					graphData={graphData}
					nodeAutoColorBy="id"
					nodeLabel="name"
					nodeRelSize={6}
					linkColor={() => "rgba(255,255,255,0.2)"}
					backgroundColor="#0d1117"
					onNodeClick={(node) => onNodeClick(node.id as AetherNoteId)}
					nodeCanvasObject={(node, ctx, globalScale) => {
						const label = node.name as string;
						const fontSize = 12 / globalScale;
						ctx.font = `${fontSize}px Sans-Serif`;
						const textWidth = ctx.measureText(label).width;
						const bckgDimensions = [textWidth, fontSize].map(
							(n) => n + fontSize * 0.2,
						);
						ctx.fillStyle = "rgba(13, 17, 23, 0.8)";
						ctx.fillRect(
							node.x! - bckgDimensions[0] / 2,
							node.y! - bckgDimensions[1] / 2,
							bckgDimensions[0],
							bckgDimensions[1],
						);
						ctx.textAlign = "center";
						ctx.textBaseline = "middle";
						ctx.fillStyle = node.color as string;
						ctx.fillText(label, node.x!, node.y!);
					}}
				/>
			</Suspense>
			<div className="absolute bottom-6 right-6 bg-navy-900/90 border border-navy-700/50 p-4 rounded-xl backdrop-blur-sm max-w-xs shadow-2xl">
				<h4 className="text-sm font-semibold text-white mb-2">
					Red de Conocimiento
				</h4>
				<p className="text-xs text-slate-400">
					Total de Nodos: {graphData.nodes.length}
				</p>
				<p className="text-xs text-slate-400">
					Conexiones: {graphData.links.length}
				</p>
				<p className="text-[10px] text-slate-400 mt-3 italic">
					Tip: Haz click en un nodo para viajar térmicamente a esa nota.
				</p>
			</div>
		</div>
	);
}
