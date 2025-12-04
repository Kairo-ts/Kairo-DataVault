import { KairoUtils, type KairoCommand } from "../Kairo/utils/KairoUtils";
import { properties } from "../properties";
import { SCRIPT_EVENT_COMMAND_IDS } from "./constants";
import { DataVaultReceiver } from "./DataVaultReceiver";
import { DynamicPropertyStorage } from "./DynamicPropertyStorage";

export class DataVaultManager {
    private readonly dataVaultReceiver: DataVaultReceiver;
    private readonly dynamicPropertyStorage: DynamicPropertyStorage;
    private static instance: DataVaultManager;
    private constructor() {
        this.dataVaultReceiver = DataVaultReceiver.create(this);
        this.dynamicPropertyStorage = DynamicPropertyStorage.create(this);
    }

    public static getInstance(): DataVaultManager {
        if (!DataVaultManager.instance) {
            DataVaultManager.instance = new DataVaultManager();
        }
        return DataVaultManager.instance;
    }

    public handleScriptEvent(data: KairoCommand): void {
        this.dataVaultReceiver.handleScriptEvent(data);
    }

    public saveData(addonId: string, key: string, value: string, type: string): void {
        const parseValue = type === "string" ? value : JSON.parse(value);

        this.dynamicPropertyStorage.save(addonId, key, parseValue, type);
    }

    public loadData(addonId: string, key: string): void {
        const dataLoaded = this.dynamicPropertyStorage.load(addonId, key);
        const value =
            dataLoaded.type === "string" ? dataLoaded.value : JSON.stringify(dataLoaded.value);

        KairoUtils.sendKairoCommand(addonId, {
            commandId: SCRIPT_EVENT_COMMAND_IDS.DATA_LOADED,
            addonId: properties.id,
            key,
            value,
            type: dataLoaded.type,
        });
    }
}
