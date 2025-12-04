import { ConsoleManager } from "../Kairo/utils/ConsoleManager";
import { SCRIPT_EVENT_COMMAND_IDS } from "./constants";
export class DataVaultReceiver {
    constructor(dataVaultManager) {
        this.dataVaultManager = dataVaultManager;
    }
    static create(dataVaultManager) {
        return new DataVaultReceiver(dataVaultManager);
    }
    handleScriptEvent(data) {
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
                this.dataVaultManager.saveData(data.addonId, data.key, data.value, data.type);
                break;
            case SCRIPT_EVENT_COMMAND_IDS.LOAD_DATA:
                this.dataVaultManager.loadData(data.addonId, data.key);
                break;
        }
    }
}
DataVaultReceiver.VALID_COMMANDS = new Set([
    SCRIPT_EVENT_COMMAND_IDS.SAVE_DATA,
    SCRIPT_EVENT_COMMAND_IDS.LOAD_DATA,
]);
