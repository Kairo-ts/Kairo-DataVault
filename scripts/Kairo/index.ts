import { system } from "@minecraft/server";
import { AddonPropertyManager, type AddonProperty } from "./addons/AddonPropertyManager";
import { AddonInitializer } from "./addons/router/init/AddonInitializer";
import { AddonManager } from "./addons/AddonManager";
import { SCRIPT_EVENT_IDS } from "./constants/scriptevent";

type ActivateHandler = () => void | Promise<void>;
type DeactivateHandler = () => void | Promise<void>;
type ScriptEventHandler = (message: string) => void | Promise<void>;

type HandlerOptions = {
    priority?: number;
};

type Assignable<T> = T | { run: T; options?: HandlerOptions };
type Stored<T> = { fn: T; priority: number };

export class Kairo {
    private static instance: Kairo;
    private initialized = false;

    private readonly addonManager: AddonManager;
    private readonly addonPropertyManager: AddonPropertyManager;
    private readonly addonInitializer: AddonInitializer;

    private static _initHooks: Stored<ActivateHandler>[] = [];
    private static _deinitHooks: Stored<DeactivateHandler>[] = [];
    private static _seHooks: Stored<ScriptEventHandler>[] = [];

    private constructor() {
        this.addonManager = AddonManager.create(this);
        this.addonPropertyManager = AddonPropertyManager.create(this);
        this.addonInitializer = AddonInitializer.create(this);
    }

    private static getInstance(): Kairo {
        if (!this.instance) {
            this.instance = new Kairo();
        }
        return this.instance;
    }

    public static init(): void {
        const inst = this.getInstance();
        if (inst.initialized) return;

        inst.initialized = true;
        inst.addonInitializer.subscribeClientHooks();
    }

    public getSelfAddonProperty(): AddonProperty {
        return this.addonPropertyManager.getSelfAddonProperty();
    }

    public refreshSessionId(): void {
        this.addonPropertyManager.refreshSessionId();
    }

    public subscribeReceiverHooks(): void {
        this.addonManager.subscribeReceiverHooks();
    }

    public static unsubscribeInitializeHooks(): void {
        this.getInstance().addonInitializer.unsubscribeClientHooks();
        system.sendScriptEvent(SCRIPT_EVENT_IDS.UNSUBSCRIBE_INITIALIZE, "");
    }

    public static set onActivate(val: Assignable<ActivateHandler>) {
        if (typeof val === "function") this._pushSorted(this._initHooks, val);
        else this._pushSorted(this._initHooks, val.run, val.options);
    }
    public static set onDeactivate(val: Assignable<DeactivateHandler>) {
        if (typeof val === "function") this._pushSorted(this._deinitHooks, val);
        else this._pushSorted(this._deinitHooks, val.run, val.options);
    }
    public static set onScriptEvent(val: Assignable<ScriptEventHandler>) {
        if (typeof val === "function") this._pushSorted(this._seHooks, val);
        else this._pushSorted(this._seHooks, val.run, val.options);
    }

    public static addActivate(fn: ActivateHandler, opt?: HandlerOptions) {
        this._pushSorted(this._initHooks, fn, opt);
    }
    public static addDeactivate(fn: DeactivateHandler, opt?: HandlerOptions) {
        this._pushSorted(this._deinitHooks, fn, opt);
    }
    public static addScriptEvent(fn: ScriptEventHandler, opt?: HandlerOptions) {
        this._pushSorted(this._seHooks, fn, opt);
    }

    public _scriptEvent(message: string): void {
        void Kairo._runScriptEvent(message);
    }

    public _activateAddon(): void {
        void Kairo._runActivateHooks();
    }

    public _deactivateAddon(): void {
        void Kairo._runDeactivateHooks();
    }

    private static _pushSorted<T>(arr: Stored<T>[], fn: T, opt?: HandlerOptions) {
        arr.push({ fn, priority: opt?.priority ?? 0 });
        arr.sort((a, b) => b.priority - a.priority);
    }

    private static async _runActivateHooks() {
        for (const { fn } of this._initHooks) {
            try {
                await fn();
            } catch (e) {
                system.run(() =>
                    console.warn(
                        `[Kairo.onActivate] ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`,
                    ),
                );
            }
        }
    }

    private static async _runDeactivateHooks() {
        for (const { fn } of [...this._deinitHooks].reverse()) {
            try {
                await fn();
            } catch (e) {
                system.run(() =>
                    console.warn(
                        `[Kairo.onDeactivate] ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`,
                    ),
                );
            }
        }
    }

    private static async _runScriptEvent(message: string) {
        for (const { fn } of this._seHooks) {
            try {
                await fn(message);
            } catch (e) {
                system.run(() =>
                    console.warn(
                        `[Kairo.onScriptEvent] ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`,
                    ),
                );
            }
        }
    }
}
