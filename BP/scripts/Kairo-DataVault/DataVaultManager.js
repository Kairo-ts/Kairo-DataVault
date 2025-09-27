import { DataVaultReceiver } from "./ScriptEventReceiver";
import { DynamicPropertyStorage } from "./DynamicPropertyStorage";
export class DataVaultManager {
    constructor() {
        this.dataVaultReceiver = DataVaultReceiver.create(this);
        this.dynamicPropertyStorage = DynamicPropertyStorage.create(this);
    }
    static getInstance() {
        if (!DataVaultManager.instance) {
            DataVaultManager.instance = new DataVaultManager();
        }
        return DataVaultManager.instance;
    }
    handleOnScriptEvent(message) {
        this.dataVaultReceiver.handleOnScriptEvent(message);
    }
    saveData(addonId, key, value) {
        this.dynamicPropertyStorage.save(addonId, key, value);
    }
    loadData(addonId, key) {
        return this.dynamicPropertyStorage.load(addonId, key);
    }
}
