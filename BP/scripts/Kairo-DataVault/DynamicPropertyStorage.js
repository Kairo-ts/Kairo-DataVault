import { system, world } from "@minecraft/server";
import { ConsoleManager } from "../Kairo/utils/ConsoleManager";
/**
 * DynamicProperty を用いた大きな文字列の分割保存。
 * - save(addonId, key, data): data はすでに stringify 済みの文字列を想定
 * - load(addonId, key): 連結した文字列を返す（存在しなければ ""）
 * - delete(addonId, key): 指定データのみ削除
 * - clear(): すべての DynamicProperty を削除
 */
export class DynamicPropertyStorage {
    constructor(dataVaultManager) {
        this.dataVaultManager = dataVaultManager;
        this.CHUNK_SIZE = 30000;
    }
    static create(dataVaultManager) {
        return new DynamicPropertyStorage(dataVaultManager);
    }
    save(addonId, key, data) {
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
                world.setDynamicProperty(this.chunkKey(prefix, i), undefined);
            }
        }
        world.setDynamicProperty(this.countKey(prefix), totalChunks);
        world.setDynamicProperty(this.lenKey(prefix), data.length);
    }
    load(addonId, key) {
        const prefix = this.makePrefix(addonId, key);
        const count = this.getCount(prefix);
        if (!count || count <= 0)
            return "";
        let result = "";
        for (let i = 0; i < count; i++) {
            result += world.getDynamicProperty(this.chunkKey(prefix, i)) || "";
        }
        return result;
    }
    listKeysByAddon() {
        const ids = world.getDynamicPropertyIds();
        if (!ids || ids.length === 0) {
            ConsoleManager.log("No dynamic properties found.");
            return;
        }
        const grouped = new Map();
        for (const id of ids) {
            const match = id.match(/^dp\/([^/]+)\/([^_/]+)/);
            if (!match)
                continue;
            const addonId = match[1];
            const key = match[2];
            if (!addonId || !key)
                continue;
            let set = grouped.get(addonId);
            if (!set) {
                set = new Set();
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
    delete(addonId, key) {
        const prefix = this.makePrefix(addonId, key);
        const count = this.getCount(prefix);
        if (count && count > 0) {
            for (let i = 0; i < count; i++) {
                world.setDynamicProperty(this.chunkKey(prefix, i), undefined);
            }
        }
        world.setDynamicProperty(this.countKey(prefix), undefined);
        world.setDynamicProperty(this.lenKey(prefix), undefined);
    }
    clear() {
        system.run(() => {
            world.clearDynamicProperties();
        });
    }
    getCount(prefix) {
        return world.getDynamicProperty(this.countKey(prefix)) || 0;
    }
    chunkKey(prefix, index) {
        return `${prefix}_chunk_${index}`;
    }
    countKey(prefix) {
        return `${prefix}_count`;
    }
    lenKey(prefix) {
        return `${prefix}_len`;
    }
    makePrefix(addonId, key) {
        const a = this.sanitize(addonId);
        const k = this.sanitize(key);
        return `dp/${a}/${k}`;
    }
    sanitize(s) {
        return (s ?? "")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^A-Za-z0-9_\-.:]/g, "-")
            .slice(0, 100);
    }
}
