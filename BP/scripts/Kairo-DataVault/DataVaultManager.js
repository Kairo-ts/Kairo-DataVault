import { KairoUtils } from "../Kairo/utils/KairoUtils";
import { properties } from "../properties";
import { SCRIPT_EVENT_COMMAND_IDS } from "./constants";
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
    handleScriptEvent(data) {
        this.dataVaultReceiver.handleScriptEvent(data);
    }
    saveData(addonId, key, value, type) {
        const parseValue = type === "string" ? value : JSON.parse(value);
        this.dynamicPropertyStorage.save(addonId, key, parseValue, type);
    }
    loadData(addonId, key) {
        const dataLoaded = this.dynamicPropertyStorage.load(addonId, key);
        const value = dataLoaded.type === "string" ? dataLoaded.value : JSON.stringify(dataLoaded.value);
        KairoUtils.sendKairoCommand(addonId, {
            commandId: SCRIPT_EVENT_COMMAND_IDS.DATA_LOADED,
            addonId: properties.id,
            key,
            value,
            type: dataLoaded.type,
        });
    }
}
