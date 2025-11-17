import { ConsoleManager } from "../Kairo/utils/ConsoleManager";
import type { KairoCommand } from "../Kairo/utils/KairoUtils";
import { SCRIPT_EVENT_COMMAND_IDS } from "./constants";
import type { DataVaultManager } from "./DataVaultManager";

export class DataVaultReceiver {
    private constructor(private readonly dataVaultManager: DataVaultManager) {}
    public static create(dataVaultManager: DataVaultManager): DataVaultReceiver {
        return new DataVaultReceiver(dataVaultManager);
    }

    private static readonly VALID_COMMANDS = new Set([
        SCRIPT_EVENT_COMMAND_IDS.SAVE_DATA,
        SCRIPT_EVENT_COMMAND_IDS.LOAD_DATA,
    ]);

    public handleScriptEvent(data: KairoCommand): void {
        if (!DataVaultReceiver.VALID_COMMANDS.has(data.commandId)) {
            return;
        }

        if (!data.addonId) {
            ConsoleManager.error(`Addon ID missing: ${data}`);
            return;
        }

        if (!data.key) {
            ConsoleManager.error(`Key missing: ${data}`);
            return;
        }

        switch (data.commandId) {
            case SCRIPT_EVENT_COMMAND_IDS.SAVE_DATA:
                this.dataVaultManager.saveData(data.addonId, data.key, data.value);
                break;

            case SCRIPT_EVENT_COMMAND_IDS.LOAD_DATA:
                this.dataVaultManager.loadData(data.addonId, data.key);
                break;
        }
    }
}
