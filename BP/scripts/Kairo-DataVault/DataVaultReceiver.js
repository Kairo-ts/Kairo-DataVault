import { ConsoleManager } from "../Kairo/utils/ConsoleManager";
import { SCRIPT_EVENT_COMMAND_IDS } from "./constants";
export class DataVaultReceiver {
    constructor(dataVaultManager) {
        this.dataVaultManager = dataVaultManager;
    }
    static create(dataVaultManager) {
        return new DataVaultReceiver(dataVaultManager);
    }
    handleScriptEvent(message) {
        const splitMessage = message.split(" ");
        const command = splitMessage[0];
        if (!command)
            return;
        if (!DataVaultReceiver.VALID_COMMANDS.has(command)) {
            return;
        }
        const addonId = splitMessage[1];
        if (!addonId) {
            ConsoleManager.error(`Addon ID missing: ${message}`);
            return;
        }
        const key = splitMessage[2];
        if (!key) {
            ConsoleManager.error(`Key missing: ${message}`);
            return;
        }
        const value = splitMessage.slice(3).join(" ");
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
DataVaultReceiver.VALID_COMMANDS = new Set([
    SCRIPT_EVENT_COMMAND_IDS.SAVE_DATA,
    SCRIPT_EVENT_COMMAND_IDS.LOAD_DATA,
]);
