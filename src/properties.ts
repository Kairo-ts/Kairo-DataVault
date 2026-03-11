import type { KairoAddonProperties } from "@kairo-js/router";

export const properties: KairoAddonProperties = {
    id: "kairo-datavault", //# // a-z & 0-9 - _
    metadata: {
        authors: ["shizuku86"],
    },
    header: {
        name: "Kairo DataVault",
        description:
            "It is a dedicated storage module, designed to be immutable and stable across all future versions of Minecraft.",
        version: {
            major: 1,
            minor: 1,
            patch: 0,
            prerelease: "dev.1",
            // build: "abc123",
        },
        min_engine_version: [1, 21, 132],
    },
    dependencies: [
        {
            module_name: "@minecraft/server",
            version: "2.4.0",
        },
        {
            module_name: "@minecraft/server-ui",
            version: "2.0.0",
        },
    ],
    /** 前提アドオン */
    requiredAddons: {
        /**
         * id: version (string) // "kairo": "1.0.0"
         */
        kairo: "1.0.0-dev.1",
    },
    tags: [],
};
