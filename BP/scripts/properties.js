/**
 * scripts/properties から manifest.jsonを自動生成する
 * propertiesは、アドオン間通信においても、識別などに利用する
 */
/**
 * 文末に # が記述されている箇所を適宜修正して使用します。
 * Modify and use where # is written at the end of the sentence as appropriate
 */
export const properties = {
    id: "kairo-datavault", // a-z & 0-9 - _
    metadata: {
        /** 製作者の名前 */
        authors: ["shizuku86"],
    },
    header: {
        name: "Kairo-DataVault",
        description: "It is a dedicated storage module, designed to be immutable and stable across all future versions of Minecraft",
        version: {
            major: 1,
            minor: 0,
            patch: 0,
            prerelease: "dev.1",
            // build: "abc123",
        },
        min_engine_version: [1, 21, 100],
        uuid: "f2d7b2e4-44d9-4b46-bda8-727fb8f848f3",
    },
    resourcepack: {
        name: "Use BP Name",
        description: "Use BP Description",
        uuid: "c839e027-0630-4390-927e-765905300091",
        module_uuid: "5c39cd64-6cb6-4171-82be-136765cb538d",
    },
    modules: [
        {
            type: "script",
            language: "javascript",
            entry: "scripts/index.js",
            version: "header.version",
            uuid: "2b2dac89-9772-4a56-8661-e422915aa4e1",
        },
    ],
    dependencies: [
        {
            module_name: "@minecraft/server",
            version: "2.1.0",
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
    tags: [
    // "stable",
    ],
};
/**
 * "official" を非公式に付与することは許可されていません。
 * 公認のアドオンには "approved" を付与します。
 * It is not allowed to assign "official" unofficially.
 * For approved addons, assign "approved".
 *
 */
export const supportedTags = ["official", "approved", "stable", "experimental"];
