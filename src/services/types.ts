import type { AppData } from "../utils/firebase";

export interface IAuthService {
	init(onUser: (uid: string | null) => void): void;
	signInAnonymously(): Promise<string | null>;
	getUserId(): string | null;
}

export interface ISyncService {
	syncToCloud(userId: string, data: AppData): Promise<boolean>;
	getFromCloud(userId: string): Promise<AppData | null>;
}

export interface IAppServices {
	auth: IAuthService;
	sync: ISyncService;
}
