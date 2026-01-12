import type { Kairo } from "..";
import type { AddonProperty } from "./AddonPropertyManager";
import { system } from "@minecraft/server";
import { AddonReceiver } from "./router/AddonReceiver";
import type { KairoCommand, KairoResponse } from "../utils/KairoUtils";

export type RegistrationState = "registered" | "unregistered" | "missing_requiredAddons";

export interface AddonData {
    id: string;
    name: string;
    description: [string, string];
    isActive: boolean;
    isEditable: boolean;
    selectedVersion: string;
    activeVersion: string;
    versions: {
        [version: string]: {
            isRegistered: boolean;
            registrationState: RegistrationState;
            canInitActivate?: boolean;
            sessionId?: string;
            tags?: string[];
            dependencies?: {
                module_name: string;
                version: string;
            }[];
            requiredAddons?: {
                [name: string]: string;
            };
        };
    };
}

export class AddonManager {
    private readonly receiver: AddonReceiver;

    private _isActive: boolean = false;

    private constructor(private readonly kairo: Kairo) {
        this.receiver = AddonReceiver.create(this);
    }
    public static create(kairo: Kairo): AddonManager {
        return new AddonManager(kairo);
    }

    public getSelfAddonProperty(): AddonProperty {
        return this.kairo.getSelfAddonProperty();
    }

    public subscribeReceiverHooks(): void {
        system.afterEvents.scriptEventReceive.subscribe(this.receiver.handleScriptEvent);
    }

    public _activateAddon(): void {
        this.kairo._activateAddon();
    }

    public _deactivateAddon(): void {
        this.kairo._deactivateAddon();
    }

    public async _scriptEvent(data: KairoCommand): Promise<void | KairoResponse> {
        return this.kairo._scriptEvent(data);
    }

    public get isActive(): boolean {
        return this._isActive;
    }

    public setActiveState(state: boolean): void {
        this._isActive = state;
    }
}
