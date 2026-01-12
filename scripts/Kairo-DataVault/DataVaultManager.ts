import { KairoUtils, type KairoCommand, type KairoResponse } from "../Kairo/utils/KairoUtils";
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

    public async handleScriptEvent(data: KairoCommand): Promise<void | KairoResponse> {
        return this.dataVaultReceiver.handleScriptEvent(data);
    }

    public async saveData(
        addonId: string,
        key: string,
        value: string,
        type: string,
    ): Promise<void> {
        const parseValue = type === "string" ? value : JSON.parse(value);

        this.dynamicPropertyStorage.save(addonId, key, parseValue, type);
    }

    public async loadData(addonId: string, key: string): Promise<KairoResponse> {
        const dataLoaded = this.dynamicPropertyStorage.load(addonId, key);
        const value =
            dataLoaded.type === "string" ? dataLoaded.value : JSON.stringify(dataLoaded.value);

        return KairoUtils.buildKairoResponse({ dataLoaded });
    }
}
