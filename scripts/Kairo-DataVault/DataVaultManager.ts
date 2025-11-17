import type { KairoCommand } from "../Kairo/utils/KairoUtils";
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

    public saveData(addonId: string, key: string, value: string): void {
        this.dynamicPropertyStorage.save(addonId, key, value);
    }

    public loadData(addonId: string, key: string): void {
        this.dynamicPropertyStorage.load(addonId, key);
    }
}
