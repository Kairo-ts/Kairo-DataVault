import { DataVaultReceiver } from "./DataVaultReceiver";
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
    handleScriptEvent(message) {
        this.dataVaultReceiver.handleScriptEvent(message);
    }
    saveData(addonId, key, value) {
        this.dynamicPropertyStorage.save(addonId, key, value);
    }
    loadData(addonId, key) {
        this.dynamicPropertyStorage.load(addonId, key);
    }
}
