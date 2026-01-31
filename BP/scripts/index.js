// scripts/Kairo/utils/KairoUtils.ts
import { system } from "@minecraft/server";

// scripts/Kairo/constants/scriptevent.ts
var SCRIPT_EVENT_ID_PREFIX = {
  KAIRO: "kairo"
};
var SCRIPT_EVENT_IDS = {
  BEHAVIOR_REGISTRATION_REQUEST: "kairo:registrationRequest",
  BEHAVIOR_REGISTRATION_RESPONSE: "kairo:registrationResponse",
  BEHAVIOR_INITIALIZE_REQUEST: "kairo:initializeRequest",
  BEHAVIOR_INITIALIZATION_COMPLETE_RESPONSE: "kairo:initializationCompleteResponse",
  UNSUBSCRIBE_INITIALIZE: "kairo:unsubscribeInitialize",
  REQUEST_RESEED_SESSION_ID: "kairo:reseedSessionId",
  SHOW_ADDON_LIST: "kairo:showAddonList"
};
var SCRIPT_EVENT_COMMAND_TYPES = {
  KAIRO_ACK: "kairo_ack",
  KAIRO_RESPONSE: "kairo_response",
  SAVE_DATA: "save_data",
  LOAD_DATA: "load_data",
  DATA_LOADED: "data_loaded",
  GET_PLAYER_KAIRO_DATA: "getPlayerKairoData",
  GET_PLAYERS_KAIRO_DATA: "getPlayersKairoData"
};
var SCRIPT_EVENT_MESSAGES = {
  NONE: "",
  ACTIVATE_REQUEST: "activate request",
  DEACTIVATE_REQUEST: "deactivate request"
};

// scripts/Kairo/constants/system.ts
var KAIRO_COMMAND_TARGET_ADDON_IDS = {
  BROADCAST: "_kBroadcast",
  KAIRO: "kairo",
  KAIRO_DATAVAULT: "kairo-datavault"
};

// scripts/properties.ts
var properties = {
  id: "kairo-datavault",
  // a-z & 0-9 - _
  metadata: {
    /** 製作者の名前 */
    authors: ["shizuku86"]
  },
  header: {
    name: "Kairo-DataVault",
    description: "It is a dedicated storage module, designed to be immutable and stable across all future versions of Minecraft",
    version: {
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: "dev.1"
      // build: "abc123",
    },
    min_engine_version: [1, 21, 100],
    uuid: "f2d7b2e4-44d9-4b46-bda8-727fb8f848f3"
  },
  resourcepack: {
    name: "Use BP Name",
    description: "Use BP Description",
    uuid: "c839e027-0630-4390-927e-765905300091",
    module_uuid: "5c39cd64-6cb6-4171-82be-136765cb538d"
  },
  modules: [
    {
      type: "script",
      language: "javascript",
      entry: "scripts/index.js",
      version: "header.version",
      uuid: "2b2dac89-9772-4a56-8661-e422915aa4e1"
    }
  ],
  dependencies: [
    {
      module_name: "@minecraft/server",
      version: "2.1.0"
    },
    {
      module_name: "@minecraft/server-ui",
      version: "2.0.0"
    }
  ],
  /** 前提アドオン */
  requiredAddons: {
    /**
     * id: version (string) // "kairo": "1.0.0"
     */
    kairo: "1.0.0-dev.1"
  },
  tags: [
    // "stable",
  ]
};

// scripts/Kairo/utils/KairoUtils.ts
var _KairoUtils = class _KairoUtils {
  static async sendKairoCommand(targetAddonId, commandType, data = {}, timeoutTicks = 20) {
    return this.sendInternal(targetAddonId, commandType, data, timeoutTicks, false);
  }
  static async sendKairoCommandAndWaitResponse(targetAddonId, commandType, data = {}, timeoutTicks = 20) {
    return this.sendInternal(targetAddonId, commandType, data, timeoutTicks, true);
  }
  static buildKairoResponse(data = {}, success = true, errorMessage) {
    return {
      sourceAddonId: properties.id,
      commandId: this.generateRandomId(16),
      commandType: SCRIPT_EVENT_COMMAND_TYPES.KAIRO_RESPONSE,
      data,
      success,
      ...errorMessage !== void 0 ? { errorMessage } : {}
    };
  }
  static generateRandomId(length = 8) {
    return Array.from(
      { length },
      () => this.charset[Math.floor(Math.random() * this.charset.length)]
    ).join("");
  }
  static async getPlayerKairoData(playerId) {
    const kairoResponse = await _KairoUtils.sendKairoCommandAndWaitResponse(
      KAIRO_COMMAND_TARGET_ADDON_IDS.KAIRO,
      SCRIPT_EVENT_COMMAND_TYPES.GET_PLAYER_KAIRO_DATA,
      {
        playerId
      }
    );
    return kairoResponse.data.playerKairoData;
  }
  static async getPlayersKairoData() {
    const kairoResponse = await _KairoUtils.sendKairoCommandAndWaitResponse(
      KAIRO_COMMAND_TARGET_ADDON_IDS.KAIRO,
      SCRIPT_EVENT_COMMAND_TYPES.GET_PLAYERS_KAIRO_DATA
    );
    return kairoResponse.data.playersKairoData;
  }
  static async saveToDataVault(key, value) {
    const type = value === null ? "null" : typeof value;
    if (type === "object" && !this.isVector3(value)) {
      throw new Error(
        `Invalid value type for saveToDataVault: expected Vector3 for object, got ${JSON.stringify(value)}`
      );
    }
    return _KairoUtils.sendKairoCommand(
      KAIRO_COMMAND_TARGET_ADDON_IDS.KAIRO_DATAVAULT,
      SCRIPT_EVENT_COMMAND_TYPES.SAVE_DATA,
      {
        type,
        key,
        value: JSON.stringify(value)
      }
    );
  }
  static async loadFromDataVault(key) {
    const kairoResponse = await _KairoUtils.sendKairoCommandAndWaitResponse(
      KAIRO_COMMAND_TARGET_ADDON_IDS.KAIRO_DATAVAULT,
      SCRIPT_EVENT_COMMAND_TYPES.LOAD_DATA,
      {
        key
      }
    );
    return kairoResponse.data.dataLoaded;
  }
  static resolvePendingRequest(commandId, response) {
    const pending = this.pendingRequests.get(commandId);
    if (!pending) return;
    this.pendingRequests.delete(commandId);
    if (pending.expectResponse && response === void 0) {
      pending.reject(
        new Error(`Kairo response expected but none received (commandId=${commandId})`)
      );
      return;
    }
    pending.resolve(response);
  }
  static rejectPendingRequest(commandId, error) {
    const pending = this.pendingRequests.get(commandId);
    if (!pending) return;
    this.pendingRequests.delete(commandId);
    pending.reject(error ?? new Error("Kairo request rejected"));
  }
  static async sendInternal(targetAddonId, commandType, data, timeoutTicks, expectResponse) {
    const kairoCommand = {
      sourceAddonId: properties.id,
      commandId: this.generateRandomId(16),
      commandType,
      data
    };
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(kairoCommand.commandId, {
        expectResponse,
        resolve,
        reject,
        timeoutTick: system.currentTick + timeoutTicks
      });
      system.sendScriptEvent(
        `${SCRIPT_EVENT_ID_PREFIX.KAIRO}:${targetAddonId}`,
        JSON.stringify(kairoCommand)
      );
    });
  }
  static onTick() {
    if (this.lastTick === system.currentTick) return;
    this.lastTick = system.currentTick;
    for (const [requestId, pending] of this.pendingRequests) {
      if (system.currentTick >= pending.timeoutTick) {
        this.pendingRequests.delete(requestId);
        pending.reject(new Error("Kairo command timeout"));
      }
    }
  }
  static isRawMessage(value) {
    if (value === null || typeof value !== "object") return false;
    const v = value;
    if (v.rawtext !== void 0) {
      if (!Array.isArray(v.rawtext)) return false;
      for (const item of v.rawtext) {
        if (!this.isRawMessage(item)) return false;
      }
    }
    if (v.score !== void 0) {
      const s = v.score;
      if (s === null || typeof s !== "object") return false;
      if (s.name !== void 0 && typeof s.name !== "string") return false;
      if (s.objective !== void 0 && typeof s.objective !== "string") return false;
    }
    if (v.text !== void 0 && typeof v.text !== "string") {
      return false;
    }
    if (v.translate !== void 0 && typeof v.translate !== "string") {
      return false;
    }
    if (v.with !== void 0) {
      const w = v.with;
      if (Array.isArray(w)) {
        if (!w.every((item) => typeof item === "string")) return false;
      } else if (!this.isRawMessage(w)) {
        return false;
      }
    }
    return true;
  }
  static isVector3(value) {
    return typeof value === "object" && value !== null && typeof value.x === "number" && typeof value.y === "number" && typeof value.z === "number" && Object.keys(value).length === 3;
  }
};
_KairoUtils.pendingRequests = /* @__PURE__ */ new Map();
_KairoUtils.charset = [
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
];
var KairoUtils = _KairoUtils;

// scripts/Kairo/utils/ConsoleManager.ts
var ConsoleManager = class {
  static log(message) {
    console.log(`[${properties.header.name}][Log] ${message}`);
  }
  static warn(message) {
    console.warn(`[${properties.header.name}][Warning] ${message}`);
  }
  static error(message) {
    console.error(`[${properties.header.name}][Error] ${message}`);
  }
};

// scripts/Kairo-DataVault/constants.ts
var SCRIPT_EVENT_COMMAND_IDS = {
  SAVE_DATA: "save_data",
  LOAD_DATA: "load_data",
  DATA_LOADED: "data_loaded"
};

// scripts/Kairo-DataVault/DataVaultReceiver.ts
var _DataVaultReceiver = class _DataVaultReceiver {
  constructor(dataVaultManager) {
    this.dataVaultManager = dataVaultManager;
  }
  static create(dataVaultManager) {
    return new _DataVaultReceiver(dataVaultManager);
  }
  async handleScriptEvent(command) {
    if (!_DataVaultReceiver.VALID_COMMANDS.has(command.commandType)) {
      return;
    }
    if (!command.sourceAddonId) {
      ConsoleManager.error(`Addon ID missing: ${command}`);
      return;
    }
    if (!command.data.key) {
      ConsoleManager.error(`Key missing: ${command}`);
      return;
    }
    switch (command.commandType) {
      case SCRIPT_EVENT_COMMAND_IDS.SAVE_DATA:
        return this.dataVaultManager.saveData(
          command.sourceAddonId,
          command.data.key,
          command.data.value,
          command.data.type
        );
      case SCRIPT_EVENT_COMMAND_IDS.LOAD_DATA:
        return this.dataVaultManager.loadData(command.sourceAddonId, command.data.key);
      default:
        return;
    }
  }
};
_DataVaultReceiver.VALID_COMMANDS = /* @__PURE__ */ new Set([
  SCRIPT_EVENT_COMMAND_IDS.SAVE_DATA,
  SCRIPT_EVENT_COMMAND_IDS.LOAD_DATA
]);
var DataVaultReceiver = _DataVaultReceiver;

// scripts/Kairo-DataVault/DynamicPropertyStorage.ts
import { system as system2, world } from "@minecraft/server";
var DynamicPropertyStorage = class _DynamicPropertyStorage {
  constructor(dataVaultManager) {
    this.dataVaultManager = dataVaultManager;
    this.CHUNK_SIZE = 3e4;
  }
  static create(dataVaultManager) {
    return new _DynamicPropertyStorage(dataVaultManager);
  }
  save(addonId, key, data, type) {
    const prefix = this.makePrefix(addonId, key);
    if (type === "null") {
      this.delete(addonId, key);
      world.setDynamicProperty(this.typeKey(prefix), "null");
      return;
    }
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
        world.setDynamicProperty(this.chunkKey(prefix, i), void 0);
      }
    }
    world.setDynamicProperty(this.countKey(prefix), totalChunks);
    world.setDynamicProperty(this.lenKey(prefix), data.length);
    world.setDynamicProperty(this.typeKey(prefix), type);
  }
  load(addonId, key) {
    const prefix = this.makePrefix(addonId, key);
    const count = this.getCount(prefix);
    if (!count || count <= 0) {
      return { value: null, type: "null" };
    }
    const type = world.getDynamicProperty(this.typeKey(prefix));
    if (type === "string") {
      let result = "";
      for (let i = 0; i < count; i++) {
        result += world.getDynamicProperty(this.chunkKey(prefix, i)) || "";
      }
      return { value: result, type };
    }
    const raw = world.getDynamicProperty(this.chunkKey(prefix, 0));
    if (raw === void 0) {
      return { value: null, type: "null" };
    }
    switch (type) {
      case "number":
        return { value: raw, type };
      case "boolean":
        return { value: raw, type };
      case "null":
        return { value: null, type };
      case "object":
        return { value: raw, type };
      default:
        throw new Error(`Unknown stored type "${type}" for key "${key}"`);
    }
  }
  listKeysByAddon() {
    const ids = world.getDynamicPropertyIds();
    if (!ids || ids.length === 0) {
      ConsoleManager.log("No dynamic properties found.");
      return;
    }
    const grouped = /* @__PURE__ */ new Map();
    for (const id of ids) {
      const match = id.match(/^dp\/([^/]+)\/([^_/]+)/);
      if (!match) continue;
      const addonId = match[1];
      const key = match[2];
      if (!addonId || !key) continue;
      let set = grouped.get(addonId);
      if (!set) {
        set = /* @__PURE__ */ new Set();
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
        world.setDynamicProperty(this.chunkKey(prefix, i), void 0);
      }
    }
    world.setDynamicProperty(this.countKey(prefix), void 0);
    world.setDynamicProperty(this.lenKey(prefix), void 0);
  }
  clear() {
    system2.run(() => {
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
  typeKey(prefix) {
    return `${prefix}_type`;
  }
  makePrefix(addonId, key) {
    const a = this.sanitize(addonId);
    const k = this.sanitize(key);
    return `dp/${a}/${k}`;
  }
  sanitize(s) {
    return (s ?? "").trim().replace(/\s+/g, "_").replace(/[^A-Za-z0-9_\-.:]/g, "-").slice(0, 100);
  }
};

// scripts/Kairo-DataVault/DataVaultManager.ts
var DataVaultManager = class _DataVaultManager {
  constructor() {
    this.dataVaultReceiver = DataVaultReceiver.create(this);
    this.dynamicPropertyStorage = DynamicPropertyStorage.create(this);
  }
  static getInstance() {
    if (!_DataVaultManager.instance) {
      _DataVaultManager.instance = new _DataVaultManager();
    }
    return _DataVaultManager.instance;
  }
  async handleScriptEvent(data) {
    return this.dataVaultReceiver.handleScriptEvent(data);
  }
  async saveData(addonId, key, value, type) {
    const parseValue = type === "string" ? value : JSON.parse(value);
    this.dynamicPropertyStorage.save(addonId, key, parseValue, type);
  }
  async loadData(addonId, key) {
    const dataLoaded = this.dynamicPropertyStorage.load(addonId, key);
    const value = dataLoaded.type === "string" ? dataLoaded.value : JSON.stringify(dataLoaded.value);
    return KairoUtils.buildKairoResponse({ dataLoaded });
  }
};

// scripts/Kairo/index.ts
import { system as system7 } from "@minecraft/server";

// scripts/Kairo/addons/AddonPropertyManager.ts
var AddonPropertyManager = class _AddonPropertyManager {
  constructor(kairo) {
    this.kairo = kairo;
    this.self = {
      id: properties.id,
      name: properties.header.name,
      description: properties.header.description,
      sessionId: KairoUtils.generateRandomId(8),
      version: properties.header.version,
      dependencies: properties.dependencies,
      requiredAddons: properties.requiredAddons,
      tags: properties.tags
    };
  }
  static create(kairo) {
    return new _AddonPropertyManager(kairo);
  }
  getSelfAddonProperty() {
    return this.self;
  }
  refreshSessionId() {
    this.self.sessionId = KairoUtils.generateRandomId(8);
  }
};

// scripts/Kairo/addons/router/init/AddonInitializer.ts
import { system as system4 } from "@minecraft/server";

// scripts/Kairo/utils/ScoreboardManager.ts
import { world as world2 } from "@minecraft/server";
var ScoreboardManager = class {
  static ensureObjective(objectiveId) {
    return world2.scoreboard.getObjective(objectiveId) ?? world2.scoreboard.addObjective(objectiveId);
  }
};

// scripts/Kairo/constants/scoreboard.ts
var SCOREBOARD_NAMES = {
  ADDON_COUNTER: "AddonCounter"
};

// scripts/Kairo/addons/router/init/AddonInitializeReceive.ts
var AddonInitializeReceive = class _AddonInitializeReceive {
  constructor(addonInitializer) {
    this.addonInitializer = addonInitializer;
    this.handleScriptEvent = (ev) => {
      const { id, message } = ev;
      const registrationNum = this.addonInitializer.getRegistrationNum();
      const isOwnMessage = message === registrationNum.toString();
      switch (id) {
        case SCRIPT_EVENT_IDS.BEHAVIOR_REGISTRATION_REQUEST:
          this.handleRegistrationRequest();
          break;
        case SCRIPT_EVENT_IDS.REQUEST_RESEED_SESSION_ID:
          if (isOwnMessage) {
            this.handleRequestReseedId();
          }
          break;
        case SCRIPT_EVENT_IDS.BEHAVIOR_INITIALIZE_REQUEST:
          if (isOwnMessage) {
            this.subscribeReceiverHooks();
            this.addonInitializer.sendInitializationCompleteResponse();
          }
          break;
        case SCRIPT_EVENT_IDS.UNSUBSCRIBE_INITIALIZE:
          this.addonInitializer.unsubscribeClientHooks();
          break;
      }
    };
  }
  static create(addonInitializer) {
    return new _AddonInitializeReceive(addonInitializer);
  }
  handleRegistrationRequest() {
    const addonCounter = ScoreboardManager.ensureObjective(SCOREBOARD_NAMES.ADDON_COUNTER);
    addonCounter.addScore(SCOREBOARD_NAMES.ADDON_COUNTER, 1);
    this.addonInitializer.setRegistrationNum(
      addonCounter.getScore(SCOREBOARD_NAMES.ADDON_COUNTER) ?? 0
    );
    this.addonInitializer.sendResponse();
  }
  handleRequestReseedId() {
    this.addonInitializer.refreshSessionId();
    this.addonInitializer.sendResponse();
  }
  subscribeReceiverHooks() {
    this.addonInitializer.subscribeReceiverHooks();
  }
};

// scripts/Kairo/addons/router/init/AddonInitializeResponse.ts
import { system as system3, world as world3 } from "@minecraft/server";
var AddonInitializeResponse = class _AddonInitializeResponse {
  constructor(addonInitializer) {
    this.addonInitializer = addonInitializer;
  }
  static create(addonInitializer) {
    return new _AddonInitializeResponse(addonInitializer);
  }
  /**
   * scoreboard を使って登録用の識別番号も送信しておく
   * Also send the registration ID using the scoreboard
   */
  sendResponse(addonProperty) {
    system3.sendScriptEvent(
      SCRIPT_EVENT_IDS.BEHAVIOR_REGISTRATION_RESPONSE,
      JSON.stringify([
        addonProperty,
        world3.scoreboard.getObjective(SCOREBOARD_NAMES.ADDON_COUNTER)?.getScore(SCOREBOARD_NAMES.ADDON_COUNTER) ?? 0
      ])
    );
  }
  sendInitializationCompleteResponse() {
    system3.sendScriptEvent(
      SCRIPT_EVENT_IDS.BEHAVIOR_INITIALIZATION_COMPLETE_RESPONSE,
      SCRIPT_EVENT_MESSAGES.NONE
    );
  }
};

// scripts/Kairo/addons/router/init/AddonInitializer.ts
var AddonInitializer = class _AddonInitializer {
  constructor(kairo) {
    this.kairo = kairo;
    this.registrationNum = 0;
    this.receive = AddonInitializeReceive.create(this);
    this.response = AddonInitializeResponse.create(this);
  }
  static create(kairo) {
    return new _AddonInitializer(kairo);
  }
  subscribeClientHooks() {
    system4.afterEvents.scriptEventReceive.subscribe(this.receive.handleScriptEvent);
  }
  unsubscribeClientHooks() {
    system4.afterEvents.scriptEventReceive.unsubscribe(this.receive.handleScriptEvent);
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
  subscribeReceiverHooks() {
    this.kairo.subscribeReceiverHooks();
  }
  sendInitializationCompleteResponse() {
    this.response.sendInitializationCompleteResponse();
  }
};

// scripts/Kairo/addons/AddonManager.ts
import { system as system6 } from "@minecraft/server";

// scripts/Kairo/addons/router/AddonReceiver.ts
import { system as system5 } from "@minecraft/server";
var AddonReceiver = class _AddonReceiver {
  constructor(addonManager) {
    this.addonManager = addonManager;
    this.handleScriptEvent = async (ev) => {
      const { id, message } = ev;
      const addonProperty = this.addonManager.getSelfAddonProperty();
      if (id !== `${SCRIPT_EVENT_ID_PREFIX.KAIRO}:${addonProperty.sessionId}`) return;
      if (this.addonManager.isActive === false) {
        if (message !== SCRIPT_EVENT_MESSAGES.ACTIVATE_REQUEST) return;
      }
      switch (message) {
        case SCRIPT_EVENT_MESSAGES.ACTIVATE_REQUEST:
          this.addonManager._activateAddon();
          break;
        case SCRIPT_EVENT_MESSAGES.DEACTIVATE_REQUEST:
          this.addonManager._deactivateAddon();
          break;
        default:
          let data;
          try {
            data = JSON.parse(message);
          } catch (e) {
            ConsoleManager.warn(`[ScriptEventReceiver] Invalid JSON: ${message}`);
            return;
          }
          if (typeof data.sourceAddonId !== "string") return;
          if (typeof data.commandType !== "string") return;
          if (data.ackFor && typeof data.ackFor === "string") {
            KairoUtils.resolvePendingRequest(data.ackFor, data.response);
            return;
          }
          if (typeof data.commandId !== "string") return;
          if (!data || typeof data !== "object") return;
          const command = data;
          const response = await this.addonManager._scriptEvent(command);
          system5.sendScriptEvent(
            `${SCRIPT_EVENT_ID_PREFIX.KAIRO}:${command.sourceAddonId}`,
            JSON.stringify({
              sourceAddonId: properties.id,
              commandType: SCRIPT_EVENT_COMMAND_TYPES.KAIRO_ACK,
              ackFor: command.commandId,
              response
            })
          );
          break;
      }
    };
  }
  static create(addonManager) {
    return new _AddonReceiver(addonManager);
  }
};

// scripts/Kairo/addons/AddonManager.ts
var AddonManager = class _AddonManager {
  constructor(kairo) {
    this.kairo = kairo;
    this._isActive = false;
    this.receiver = AddonReceiver.create(this);
  }
  static create(kairo) {
    return new _AddonManager(kairo);
  }
  getSelfAddonProperty() {
    return this.kairo.getSelfAddonProperty();
  }
  subscribeReceiverHooks() {
    system6.afterEvents.scriptEventReceive.subscribe(this.receiver.handleScriptEvent);
  }
  _activateAddon() {
    this.kairo._activateAddon();
  }
  _deactivateAddon() {
    this.kairo._deactivateAddon();
  }
  async _scriptEvent(data) {
    return this.kairo._scriptEvent(data);
  }
  get isActive() {
    return this._isActive;
  }
  setActiveState(state) {
    this._isActive = state;
  }
};

// scripts/Kairo/index.ts
var _Kairo = class _Kairo {
  constructor() {
    this.initialized = false;
    this.addonManager = AddonManager.create(this);
    this.addonPropertyManager = AddonPropertyManager.create(this);
    this.addonInitializer = AddonInitializer.create(this);
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new _Kairo();
    }
    return this.instance;
  }
  static init() {
    const inst = this.getInstance();
    if (inst.initialized) return;
    inst.initialized = true;
    inst.addonInitializer.subscribeClientHooks();
  }
  getSelfAddonProperty() {
    return this.addonPropertyManager.getSelfAddonProperty();
  }
  refreshSessionId() {
    this.addonPropertyManager.refreshSessionId();
  }
  subscribeReceiverHooks() {
    this.addonManager.subscribeReceiverHooks();
  }
  static unsubscribeInitializeHooks() {
    this.getInstance().addonInitializer.unsubscribeClientHooks();
    system7.sendScriptEvent(SCRIPT_EVENT_IDS.UNSUBSCRIBE_INITIALIZE, "");
  }
  static set onActivate(val) {
    if (typeof val === "function") this._pushSorted(this._initHooks, val);
    else this._pushSorted(this._initHooks, val.run, val.options);
  }
  static set onDeactivate(val) {
    if (typeof val === "function") this._pushSorted(this._deinitHooks, val);
    else this._pushSorted(this._deinitHooks, val.run, val.options);
  }
  static set onScriptEvent(val) {
    if (this._commandHandler) {
      throw new Error("CommandHandler already registered");
    }
    this._commandHandler = val;
  }
  static set onTick(fn) {
    this.addTick(fn);
  }
  static addActivate(fn, opt) {
    this._pushSorted(this._initHooks, fn, opt);
  }
  static addDeactivate(fn, opt) {
    this._pushSorted(this._deinitHooks, fn, opt);
  }
  static addScriptEvent(fn, opt) {
    this._pushSorted(this._seHooks, fn, opt);
  }
  static addTick(fn, opt) {
    this._pushSorted(this._tickHooks, fn, opt);
  }
  async _scriptEvent(data) {
    return _Kairo._runScriptEvent(data);
  }
  _activateAddon() {
    void _Kairo._runActivateHooks();
  }
  _deactivateAddon() {
    void _Kairo._runDeactivateHooks();
  }
  static _pushSorted(arr, fn, opt) {
    arr.push({ fn, priority: opt?.priority ?? 0 });
    arr.sort((a, b) => b.priority - a.priority);
  }
  static async _runActivateHooks() {
    for (const { fn } of this._initHooks) {
      try {
        await fn();
      } catch (e) {
        system7.run(
          () => console.warn(
            `[Kairo.onActivate] ${e instanceof Error ? e.stack ?? e.message : String(e)}`
          )
        );
      }
    }
    this._enableTick();
    this.getInstance().addonManager.setActiveState(true);
  }
  static async _runDeactivateHooks() {
    for (const { fn } of [...this._deinitHooks].reverse()) {
      try {
        await fn();
      } catch (e) {
        system7.run(
          () => console.warn(
            `[Kairo.onDeactivate] ${e instanceof Error ? e.stack ?? e.message : String(e)}`
          )
        );
      }
    }
    this._disableTick();
    this.getInstance().addonManager.setActiveState(false);
  }
  static async _runScriptEvent(data) {
    let response = void 0;
    if (this._commandHandler) {
      try {
        response = await this._commandHandler(data);
      } catch (e) {
        system7.run(
          () => console.warn(
            `[Kairo.CommandHandler] ${e instanceof Error ? e.stack ?? e.message : String(e)}`
          )
        );
      }
    }
    for (const { fn } of this._seHooks) {
      try {
        await fn(data);
      } catch (e) {
        system7.run(
          () => console.warn(
            `[Kairo.onScriptEvent] ${e instanceof Error ? e.stack ?? e.message : String(e)}`
          )
        );
      }
    }
    return response;
  }
  static async _runTick() {
    if (!this._tickEnabled) return;
    for (const { fn } of this._tickHooks) {
      try {
        await fn();
      } catch (e) {
        system7.run(
          () => console.warn(
            `[Kairo.onTick] ${e instanceof Error ? e.stack ?? e.message : String(e)}`
          )
        );
      }
    }
  }
  static _enableTick() {
    if (this._tickIntervalId !== void 0) return;
    this._tickEnabled = true;
    this.addTick(
      () => {
        KairoUtils.onTick();
      },
      { priority: Number.MAX_SAFE_INTEGER }
    );
    this._tickIntervalId = system7.runInterval(() => {
      void this._runTick();
    }, 1);
  }
  static _disableTick() {
    if (this._tickIntervalId === void 0) return;
    system7.clearRun(this._tickIntervalId);
    this._tickIntervalId = void 0;
    this._tickEnabled = false;
  }
};
_Kairo._initHooks = [];
_Kairo._deinitHooks = [];
_Kairo._seHooks = [];
_Kairo._tickHooks = [];
_Kairo._tickEnabled = false;
var Kairo = _Kairo;

// scripts/index.ts
async function main() {
  Kairo.init();
}
Kairo.onActivate = () => {
};
Kairo.onDeactivate = () => {
};
Kairo.onScriptEvent = async (command) => {
  return DataVaultManager.getInstance().handleScriptEvent(command);
};
Kairo.onTick = () => {
};
main();
