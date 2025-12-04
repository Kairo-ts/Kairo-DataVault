import { system, world, type Vector3 } from "@minecraft/server";
import type { DataVaultManager } from "./DataVaultManager";
import { ConsoleManager } from "../Kairo/utils/ConsoleManager";

/**
 * DynamicProperty を用いた大きな文字列の分割保存。
 * - save(addonId, key, data): data はすでに stringify 済みの文字列を想定
 * - load(addonId, key): 連結した文字列を返す（存在しなければ ""）
 * - delete(addonId, key): 指定データのみ削除
 * - clear(): すべての DynamicProperty を削除
 */

export class DynamicPropertyStorage {
    private readonly CHUNK_SIZE = 30000;

    private constructor(private readonly dataVaultManager: DataVaultManager) {}

    public static create(dataVaultManager: DataVaultManager): DynamicPropertyStorage {
        return new DynamicPropertyStorage(dataVaultManager);
    }

    public save(addonId: string, key: string, data: string, type: string): void {
        const prefix = this.makePrefix(addonId, key);
        const totalChunks = Math.ceil((data?.length ?? 0) / this.CHUNK_SIZE);

        const prevCount = this.getCount(prefix);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.CHUNK_SIZE;
            const end = (i + 1) * this.CHUNK_SIZE;
            const chunk = data.slice(start, end);
            world.setDynamicProperty(this.chunkKey(prefix, i), chunk);
        }

        if (prevCount > totalChunks) {
            for (let i = totalChunks; i < prevCount; i++) {
                world.setDynamicProperty(this.chunkKey(prefix, i), undefined as any);
            }
        }

        world.setDynamicProperty(this.countKey(prefix), totalChunks);
        world.setDynamicProperty(this.lenKey(prefix), data.length);
        world.setDynamicProperty(this.typeKey(prefix), type);
    }

    public load(
        addonId: string,
        key: string,
    ): {
        value: boolean | number | string | null | Vector3;
        type: string;
    } {
        const prefix = this.makePrefix(addonId, key);
        const count = this.getCount(prefix);

        if (!count || count <= 0) {
            return { value: null, type: "null" };
        }

        const type = world.getDynamicProperty(this.typeKey(prefix)) as string;
        if (type === "string") {
            let result = "";
            for (let i = 0; i < count; i++) {
                result += (world.getDynamicProperty(this.chunkKey(prefix, i)) as string) || "";
            }
            return { value: result, type };
        }

        const raw = world.getDynamicProperty(this.chunkKey(prefix, 0));

        switch (type) {
            case "number":
                return { value: raw as number, type };

            case "boolean":
                return { value: raw as boolean, type };

            case "null":
                return { value: null, type };

            case "object":
                // Vector3
                return { value: raw as Vector3, type };

            default:
                throw new Error(`Unknown stored type "${type}" for key "${key}"`);
        }
    }

    public listKeysByAddon(): void {
        const ids = world.getDynamicPropertyIds();
        if (!ids || ids.length === 0) {
            ConsoleManager.log("No dynamic properties found.");
            return;
        }

        const grouped = new Map<string, Set<string>>();
        for (const id of ids) {
            const match = id.match(/^dp\/([^/]+)\/([^_/]+)/);
            if (!match) continue;

            const addonId = match[1];
            const key = match[2];
            if (!addonId || !key) continue;

            let set = grouped.get(addonId);
            if (!set) {
                set = new Set<string>();
                grouped.set(addonId, set);
            }
            set.add(key);
        }

        if (grouped.size === 0) {
            ConsoleManager.log("No namespaced keys (dp/<addonId>/<key>) found.");
            return;
        }

        ConsoleManager.log("Stored keys by addon:");
        const sortedEntries = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
        for (const [addonId, keySet] of sortedEntries) {
            ConsoleManager.log(addonId);
            const keys = Array.from(keySet).sort((a, b) => a.localeCompare(b));
            for (const key of keys) {
                ConsoleManager.log(`  - ${key}`);
            }
        }
    }

    public delete(addonId: string, key: string): void {
        const prefix = this.makePrefix(addonId, key);
        const count = this.getCount(prefix);

        if (count && count > 0) {
            for (let i = 0; i < count; i++) {
                world.setDynamicProperty(this.chunkKey(prefix, i), undefined as any);
            }
        }
        world.setDynamicProperty(this.countKey(prefix), undefined as any);
        world.setDynamicProperty(this.lenKey(prefix), undefined as any);
    }

    public clear(): void {
        system.run(() => {
            world.clearDynamicProperties();
        });
    }

    private getCount(prefix: string): number {
        return (world.getDynamicProperty(this.countKey(prefix)) as number) || 0;
    }

    private chunkKey(prefix: string, index: number): string {
        return `${prefix}_chunk_${index}`;
    }

    private countKey(prefix: string): string {
        return `${prefix}_count`;
    }

    private lenKey(prefix: string): string {
        return `${prefix}_len`;
    }

    private typeKey(prefix: string): string {
        return `${prefix}_type`;
    }

    private makePrefix(addonId: string, key: string): string {
        const a = this.sanitize(addonId);
        const k = this.sanitize(key);
        return `dp/${a}/${k}`;
    }

    private sanitize(s: string): string {
        return (s ?? "")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^A-Za-z0-9_\-.:]/g, "-")
            .slice(0, 100);
    }
}
