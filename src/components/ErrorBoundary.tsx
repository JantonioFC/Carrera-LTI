import { AlertTriangle, RefreshCw } from "lucide-react";
import React from "react";
import { logger } from "../utils/logger";

interface ErrorBoundaryProps {
	children: React.ReactNode;
	/** Nombre de la sección (para mostrar en el mensaje de error) */
	section?: string;
	/** Fallback UI personalizado */
	fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		const section = this.props.section ? ` — ${this.props.section}` : "";
		logger.error(`ErrorBoundary${section}`, error.message, error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center animate-fade-in">
					<div className="p-4 bg-red-500/10 rounded-2xl mb-6 border border-red-500/20">
						<AlertTriangle size={40} className="text-red-400" />
					</div>
					<h2 className="text-xl font-bold text-white mb-2">
						Algo salió mal
						{this.props.section ? ` en ${this.props.section}` : ""}
					</h2>
					<p className="text-slate-400 text-sm max-w-md mb-6">
						Ocurrió un error inesperado. Podés intentar recargar esta sección o
						la página completa.
					</p>
					{this.state.error && (
						<pre className="text-xs text-red-400/70 bg-navy-900/80 border border-navy-700/50 rounded-lg px-4 py-3 mb-6 max-w-lg overflow-x-auto text-left">
							{this.state.error.message}
						</pre>
					)}
					<div className="flex gap-3">
						<button
							onClick={this.handleReset}
							className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium rounded-lg border border-navy-600/50 transition-colors"
						>
							<RefreshCw size={14} />
							Reintentar
						</button>
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
						>
							Recargar página
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
