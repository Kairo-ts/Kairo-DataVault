import { ConsoleManager } from "../Kairo/utils/ConsoleManager";
import type { KairoCommand, KairoResponse } from "../Kairo/utils/KairoUtils";
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

    public async handleScriptEvent(command: KairoCommand): Promise<void | KairoResponse> {
        if (!DataVaultReceiver.VALID_COMMANDS.has(command.commandType)) {
            return;
        }

        if (!command.sourceAddonId) {
            ConsoleManager.error(`Addon ID missing: ${command}`);
            return;
        }

        if (!command.data.key) {
            ConsoleManager.error(`Key missing: ${command}`);
            return;
        }

        switch (command.commandType) {
            case SCRIPT_EVENT_COMMAND_IDS.SAVE_DATA:
                return this.dataVaultManager.saveData(
                    command.sourceAddonId,
                    command.data.key,
                    command.data.value,
                    command.data.type,
                );
            case SCRIPT_EVENT_COMMAND_IDS.LOAD_DATA:
                return this.dataVaultManager.loadData(command.sourceAddonId, command.data.key);
            default:
                return;
        }
    }
}
