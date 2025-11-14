import { ConsoleManager } from "../Kairo/utils/ConsoleManager";
import { SCRIPT_EVENT_COMMAND_IDS } from "./constants";
import type { DataVaultManager } from "./DataVaultManager";

export class DataVaultReceiver {
    private constructor(private readonly dataVaultManager: DataVaultManager) {}
    public static create(dataVaultManager: DataVaultManager): DataVaultReceiver {
        return new DataVaultReceiver(dataVaultManager);
    }

    public handleScriptEvent(message: string): void {
        const splitMessage = message.split(" ");
        const command = splitMessage[0];
        const addonId = splitMessage[1];
        if (addonId === undefined) {
            ConsoleManager.error(`Addon ID is undefined in message: ${message}`);
            return;
        }
        const key = splitMessage[2];
        if (key === undefined) {
            ConsoleManager.error(`Key is undefined in message: ${message}`);
            return;
        }
        const value = splitMessage.slice(3).join("");

        switch (command) {
            case SCRIPT_EVENT_COMMAND_IDS.SAVE_DATA:
                this.dataVaultManager.saveData(addonId, key, value);
                break;
            case SCRIPT_EVENT_COMMAND_IDS.LOAD_DATA:
                this.dataVaultManager.loadData(addonId, key);
                break;
        }
    }
}
