import { system } from "@minecraft/server";
import { AddonInitializeReceive } from "./AddonInitializeReceive";
import { AddonInitializeResponse } from "./AddonInitializeResponse";
import type { Kairo } from "../../..";
import type { AddonProperty } from "../../AddonPropertyManager";

export class AddonInitializer {
    private registrationNum: number = 0;

    private readonly receive: AddonInitializeReceive;
    private readonly response: AddonInitializeResponse;

    private constructor(private readonly kairo: Kairo) {
        this.receive = AddonInitializeReceive.create(this);
        this.response = AddonInitializeResponse.create(this);
    }

    public static create(kairo: Kairo): AddonInitializer {
        return new AddonInitializer(kairo);
    }

    public subscribeClientHooks() {
        system.afterEvents.scriptEventReceive.subscribe(this.receive.handleScriptEvent);
    }

    public unsubscribeClientHooks() {
        system.afterEvents.scriptEventReceive.unsubscribe(this.receive.handleScriptEvent);
    }

    public getSelfAddonProperty(): AddonProperty {
        return this.kairo.getSelfAddonProperty();
    }

    public refreshSessionId(): void {
        return this.kairo.refreshSessionId();
    }

    public sendResponse(): void {
        const selfAddonProperty = this.getSelfAddonProperty();
        this.response.sendResponse(selfAddonProperty);
    }

    public setRegistrationNum(num: number): void {
        this.registrationNum = num;
    }

    public getRegistrationNum(): number {
        return this.registrationNum;
    }

    public subscribeReceiverHooks(): void {
        this.kairo.subscribeReceiverHooks();
    }

    public sendInitializationCompleteResponse(): void {
        this.response.sendInitializationCompleteResponse();
    }
}
