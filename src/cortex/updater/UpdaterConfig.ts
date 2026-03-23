export type UpdateChannel = 'stable' | 'beta';

export interface UpdateCheckResult {
  available: boolean;
  version?: string;
}

export interface ElectronUpdaterClient {
  setChannel(channel: UpdateChannel): Promise<void>;
  getChannel(): UpdateChannel;
  checkForUpdates(): Promise<UpdateCheckResult>;
}

interface UpdaterConfigOptions {
  client: ElectronUpdaterClient;
}

/**
 * Gestiona la configuración del canal de actualización (stable / beta).
 *
 * Por defecto: canal estable (latest.yml en GitHub Releases).
 * Beta: opt-in explícito en configuración → beta.yml.
 *
 * El cliente real en producción wrappea electron-updater.
 * En tests se inyecta un mock para no depender de Electron.
 */
export class UpdaterConfig {
  private readonly client: ElectronUpdaterClient;
  private currentChannel: UpdateChannel;

  constructor({ client }: UpdaterConfigOptions) {
    this.client = client;
    this.currentChannel = client.getChannel();
  }

  getChannel(): UpdateChannel {
    return this.currentChannel;
  }

  /** Cambia el canal. No-op si ya está en ese canal. */
  async setChannel(channel: UpdateChannel): Promise<void> {
    if (this.currentChannel === channel) return;
    await this.client.setChannel(channel);
    this.currentChannel = channel;
  }

  async checkForUpdates(): Promise<UpdateCheckResult> {
    return this.client.checkForUpdates();
  }
}
