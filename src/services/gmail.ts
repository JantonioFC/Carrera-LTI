/**
 * GmailService: Handles Google Identity Services (GSI) and Gmail API (GAPI)
 * for client-side inbox monitoring.
 *
 * Type declarations for Google APIs loaded via <script> tag. Issue #64
 */

interface GoogleOAuthTokenResponse {
	error?: string;
}

interface GoogleOAuthTokenClient {
	callback: ((resp: GoogleOAuthTokenResponse) => void) | string;
	requestAccessToken(opts: { prompt: string }): void;
}

interface GapiMessageHeader {
	name: string;
	value: string;
}

interface GapiMessageDetail {
	result: {
		snippet: string;
		payload: { headers: GapiMessageHeader[] };
	};
}

interface GapiMessageListResult {
	result: { messages: Array<{ id: string; threadId: string }> };
}

interface GapiToken {
	access_token: string;
}

interface GapiClient {
	init(config: { apiKey: string; discoveryDocs: string[] }): Promise<void>;
	getToken(): GapiToken | null;
	setToken(token: string): void;
	gmail: {
		users: {
			messages: {
				list(params: {
					userId: string;
					q: string;
					maxResults: number;
				}): Promise<GapiMessageListResult>;
				get(params: { userId: string; id: string }): Promise<GapiMessageDetail>;
			};
		};
	};
}

interface Gapi {
	load(
		lib: string,
		callbacks: { callback: () => void; onerror: (e: unknown) => void },
	): void;
	client: GapiClient;
}

interface GoogleAccounts {
	oauth2: {
		initTokenClient(config: {
			client_id: string;
			scope: string;
			callback: string;
		}): GoogleOAuthTokenClient;
		revoke(token: string, done?: () => void): void;
	};
}

declare global {
	interface Window {
		gapi: Gapi;
		google: { accounts: GoogleAccounts };
	}
}

export interface GmailMessage {
	id: string;
	threadId: string;
	snippet: string;
	subject?: string;
	from?: string;
	date?: string;
}

export class GmailService {
	private static instance: GmailService;
	private tokenClient: GoogleOAuthTokenClient | null = null;
	private gapiInitialized = false;
	private gisInitialized = false;

	private constructor() {}

	public static getInstance(): GmailService {
		if (!GmailService.instance) {
			GmailService.instance = new GmailService();
		}
		return GmailService.instance;
	}

	/**
	 * Initializes GAPI and GSI. Needs Client ID and API Key.
	 */
	public async initialize(clientId: string, apiKey: string): Promise<void> {
		if (!clientId || !apiKey) return;

		try {
			// 1. Initialize GAPI
			if (!this.gapiInitialized) {
				await new Promise((resolve, reject) => {
					window.gapi.load("client", {
						callback: resolve,
						onerror: reject,
					});
				});

				await window.gapi.client.init({
					apiKey: apiKey,
					discoveryDocs: [
						"https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
					],
				});
				this.gapiInitialized = true;
			}

			// 2. Initialize GSI
			if (!this.gisInitialized) {
				this.tokenClient = (
					window as any
				).google.accounts.oauth2.initTokenClient({
					client_id: clientId,
					scope: "https://www.googleapis.com/auth/gmail.readonly",
					callback: "", // defined at request time
				});
				this.gisInitialized = true;
			}
		} catch (error) {
			console.error("GmailService initialization failed:", error);
			throw error;
		}
	}

	/**
	 * Requests an access token from the user.
	 */
	public async authenticate(): Promise<void> {
		if (!this.tokenClient) throw new Error("Google GIS client not initialized");

		return new Promise((resolve, reject) => {
			try {
				this.tokenClient.callback = async (resp: GoogleOAuthTokenResponse) => {
					if (resp.error !== undefined) {
						reject(resp);
					}
					resolve();
				};

				// Request access token
				if (window.gapi.client.getToken() === null) {
					this.tokenClient.requestAccessToken({ prompt: "consent" });
				} else {
					this.tokenClient.requestAccessToken({ prompt: "" });
				}
			} catch (err) {
				reject(err);
			}
		});
	}

	/**
	 * Fetches unread messages from the inbox.
	 */
	public async fetchUnreadMessages(maxResults = 5): Promise<GmailMessage[]> {
		if (!this.gapiInitialized) throw new Error("GAPI not initialized");

		try {
			const response = await window.gapi.client.gmail.users.messages.list({
				userId: "me",
				q: "is:unread label:inbox",
				maxResults: maxResults,
			});

			const messages = response.result.messages || [];
			const detailedMessages = await Promise.all(
				messages.map(async (m: { id: string; threadId: string }) => {
					const detail = await window.gapi.client.gmail.users.messages.get({
						userId: "me",
						id: m.id,
					});

					const headers = detail.result.payload.headers;
					const subject = headers.find(
						(h: GapiMessageHeader) => h.name === "Subject",
					)?.value;
					const from = headers.find(
						(h: GapiMessageHeader) => h.name === "From",
					)?.value;
					const date = headers.find(
						(h: GapiMessageHeader) => h.name === "Date",
					)?.value;

					return {
						id: m.id,
						threadId: m.threadId,
						snippet: detail.result.snippet,
						subject: subject || "(Sin asunto)",
						from: from || "Desconocido",
						date: date || "",
					};
				}),
			);

			return detailedMessages;
		} catch (error) {
			console.error("Error fetching unread messages:", error);
			throw error;
		}
	}

	public isAuthenticated(): boolean {
		return window.gapi?.client?.getToken() !== null;
	}

	public signOut(): void {
		const token = window.gapi?.client?.getToken();
		if (token !== null) {
			window.google.accounts.oauth2.revoke(token.access_token);
			window.gapi.client.setToken("");
		}
	}
}

export const gmailService = GmailService.getInstance();
