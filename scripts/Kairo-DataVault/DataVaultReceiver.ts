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
        const key = splitMessage[1];
        if (key === undefined) {
            ConsoleManager.error(`Key is undefined in message: ${message}`);
            return;
        }
        const value = splitMessage.slice(2).join("");

        switch (command) {
            case SCRIPT_EVENT_COMMAND_IDS.SAVE_DATA:
                this.dataVaultManager.saveData(key, value);
                break;
            case SCRIPT_EVENT_COMMAND_IDS.LOAD_DATA:
                this.dataVaultManager.loadData(key);
                break;
        }
    }
}