import { system } from "@minecraft/server";
import { AddonInitializeReceive } from "./AddonInitializeReceive";
import { AddonInitializeResponse } from "./AddonInitializeResponse";
export class AddonInitializer {
    constructor(kairo) {
        this.kairo = kairo;
        this.registrationNum = 0;
        this.receive = AddonInitializeReceive.create(this);
        this.response = AddonInitializeResponse.create(this);
    }
    static create(kairo) {
        return new AddonInitializer(kairo);
    }
    subscribeClientHooks() {
        system.afterEvents.scriptEventReceive.subscribe(this.receive.handleScriptEvent);
    }
    unsubscribeClientHooks() {
        system.afterEvents.scriptEventReceive.unsubscribe(this.receive.handleScriptEvent);
    }
    getSelfAddonProperty() {
        return this.kairo.getSelfAddonProperty();
    }
    refreshSessionId() {
        return this.kairo.refreshSessionId();
    }
    sendResponse() {
        const selfAddonProperty = this.getSelfAddonProperty();
        this.response.sendResponse(selfAddonProperty);
    }
    setRegistrationNum(num) {
        this.registrationNum = num;
    }
    getRegistrationNum() {
        return this.registrationNum;
    }
}
