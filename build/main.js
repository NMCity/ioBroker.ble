"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var global_1 = require("./lib/global");
var iobroker_objects_1 = require("./lib/iobroker-objects");
var utils_1 = require("./lib/utils");
// Load all registered plugins
var plugins_1 = require("./plugins");
var enabledPlugins;
var services = [];
// /** MAC addresses of known devices */
// let knownDevices: string[] = [];
/** How frequent the RSSI of devices should be updated */
var rssiUpdateInterval = 0;
// noble-Treiber-Instanz
var noble;
// Adapter-Objekt erstellen
var adapter = utils_1.default.adapter({
    name: "ble",
    // is called when databases are connected and adapter received configuration.
    // start here!
    ready: function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, enabledPluginNames;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Adapter-Instanz global machen
                    adapter = global_1.Global.extend(adapter);
                    global_1.Global.adapter = adapter;
                    // Workaround für fehlende InstanceObjects nach update
                    return [4 /*yield*/, global_1.Global.ensureInstanceObjects()];
                case 1:
                    // Workaround für fehlende InstanceObjects nach update
                    _b.sent();
                    // Plugins laden
                    global_1.Global.log("loaded plugins: " + plugins_1.default.map(function (p) { return p.name; }).join(", "));
                    enabledPluginNames = (adapter.config.plugins || "")
                        .split(",")
                        .map(function (p) { return p.trim().toLowerCase(); })
                        .concat("_default");
                    enabledPlugins = plugins_1.default.filter(function (p) { return enabledPluginNames.indexOf(p.name.toLowerCase()) > -1; });
                    global_1.Global.log("enabled plugins: " + enabledPlugins.map(function (p) { return p.name; }).join(", "));
                    // Bring the monitored service names into the correct form
                    if (adapter.config.services === "*") {
                        services = [];
                        global_1.Global.log("monitoring all services");
                    }
                    else {
                        services =
                            (_a = adapter.config.services.split(",")) // get manually defined services
                            .concat.apply(_a, enabledPlugins.map(function (p) { return p.advertisedServices; })).reduce(function (acc, s) { return acc.concat(s); }, []) // flatten the arrays
                                .map(function (s) { return fixServiceName(s); }) // cleanup the names
                                .filter(function (s) { return s != null && s !== ""; })
                                .reduce(function (acc, s) {
                                if (acc.indexOf(s) === -1)
                                    acc.push(s);
                                return acc;
                            }, []);
                        global_1.Global.log("monitored services: " + services.join(", "));
                    }
                    // Limit RSSI updates
                    if (adapter.config.rssiThrottle != null) {
                        rssiUpdateInterval = Math.max(0, Math.min(10000, adapter.config.rssiThrottle));
                    }
                    adapter.subscribeStates("*");
                    adapter.subscribeObjects("*");
                    // load noble driver with the correct device selected
                    process.env.NOBLE_HCI_DEVICE_ID = adapter.config.hciDevice || 0;
                    noble = require("noble");
                    // prepare scanning for beacons
                    noble.on("stateChange", function (state) {
                        switch (state) {
                            case "poweredOn":
                                startScanning();
                                break;
                            case "poweredOff":
                                stopScanning();
                                break;
                        }
                        adapter.setState("info.driverState", state, true);
                    });
                    if (noble.state === "poweredOn")
                        startScanning();
                    adapter.setState("info.driverState", noble.state, true);
                    return [2 /*return*/];
            }
        });
    }); },
    // is called when adapter shuts down - callback has to be called under any circumstances!
    unload: function (callback) {
        try {
            stopScanning();
            noble.removeAllListeners("stateChange");
            callback();
        }
        catch (e) {
            callback();
        }
    },
    // is called if a subscribed object changes
    objectChange: function (id, obj) { },
    // is called if a subscribed state changes
    stateChange: function (id, state) { },
    message: function (obj) { return __awaiter(_this, void 0, void 0, function () {
        // responds to the adapter that sent the original message
        function respond(response) {
            if (obj.callback)
                adapter.sendTo(obj.from, obj.command, response, obj.callback);
        }
        // make required parameters easier
        function requireParams(params) {
            if (!(params && params.length))
                return true;
            for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
                var param = params_1[_i];
                if (!(obj.message && obj.message.hasOwnProperty(param))) {
                    respond(predefinedResponses.MISSING_PARAMETER(param));
                    return false;
                }
            }
            return true;
        }
        var predefinedResponses;
        return __generator(this, function (_a) {
            predefinedResponses = {
                ACK: { error: null },
                OK: { error: null, result: "ok" },
                ERROR_UNKNOWN_COMMAND: { error: "Unknown command!" },
                MISSING_PARAMETER: function (paramName) {
                    return { error: 'missing parameter "' + paramName + '"!' };
                },
                COMMAND_RUNNING: { error: "command running" },
            };
            // handle the message
            if (obj) {
                switch (obj.command) {
                    case "getHCIPorts":
                        child_process_1.exec("hciconfig | grep hci", function (error, stdout, stderr) {
                            // hci1:   Type: BR/EDR  Bus: USB
                            // hci0:   Type: BR/EDR  Bus: UART
                            if (error != null) {
                                global_1.Global.log(JSON.stringify(error));
                                respond({ error: error });
                                return;
                            }
                            // parse index and bus type
                            var ports = [];
                            var regex = /^hci(\d+)\:.+Bus\:\s(\w+)$/gm;
                            var result;
                            while (true) {
                                result = regex.exec(stdout);
                                if (!(result && result.length))
                                    break;
                                var port = { index: +result[1], bus: result[2] };
                                global_1.Global.log(JSON.stringify(port));
                                ports.push(port);
                            }
                            respond({ error: null, result: ports });
                        });
                        return [2 /*return*/];
                    default:
                        respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                        return [2 /*return*/];
                }
            }
            return [2 /*return*/];
        });
    }); },
});
// =========================
function fixServiceName(name) {
    if (name == null)
        return "";
    name = name.trim();
    // No whitespace
    for (var _i = 0, _a = ["\r", "\n", "\t", " "]; _i < _a.length; _i++) {
        var char = _a[_i];
        name = name.replace(char, "");
    }
    // No leading 0x
    name = name.replace(/^0x/, "");
    // lowerCase
    return name.toLowerCase();
}
function onDiscover(peripheral) {
    return __awaiter(this, void 0, void 0, function () {
        var deviceId, plugin, _i, enabledPlugins_1, p, rssiState, context, objects, values, _a, _b, stateId, iobStateId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (peripheral == null)
                        return [2 /*return*/];
                    global_1.Global.log("discovered peripheral " + peripheral.address, "debug");
                    global_1.Global.log("  has advertisement: " + (peripheral.advertisement != null), "debug");
                    if (peripheral.advertisement != null) {
                        global_1.Global.log("  has serviceData: " + (peripheral.advertisement.serviceData != null), "debug");
                        if (peripheral.advertisement.serviceData != null) {
                            global_1.Global.log("  serviceData = " + JSON.stringify(peripheral.advertisement.serviceData), "debug");
                        }
                    }
                    // don't create devices for peripherals without advertised data
                    if (peripheral.advertisement == null)
                        return [2 /*return*/];
                    // create devices if we selected to allow empty devices
                    // or the peripheral transmits serviceData
                    if (!(adapter.config.allowEmptyDevices ||
                        (peripheral.advertisement.serviceData != null && peripheral.advertisement.serviceData.length > 0))) {
                        return [2 /*return*/];
                    }
                    deviceId = peripheral.address;
                    for (_i = 0, enabledPlugins_1 = enabledPlugins; _i < enabledPlugins_1.length; _i++) {
                        p = enabledPlugins_1[_i];
                        if (p.isHandling(peripheral)) {
                            global_1.Global.log("plugin " + p.name + " is handling " + deviceId, "debug");
                            plugin = p;
                            break;
                        }
                    }
                    if (!plugin) {
                        global_1.Global.log("no handling plugin found for peripheral " + peripheral.id, "warn");
                        return [2 /*return*/];
                    }
                    // Always ensure the rssi state exists and gets a value
                    return [4 /*yield*/, iobroker_objects_1.extendState(deviceId + ".rssi", {
                            id: "rssi",
                            common: {
                                role: "value.rssi",
                                name: "signal strength (RSSI)",
                                desc: "Signal strength of the device",
                                type: "number",
                                read: true,
                                write: false,
                            },
                            native: {},
                        })];
                case 1:
                    // Always ensure the rssi state exists and gets a value
                    _c.sent();
                    return [4 /*yield*/, adapter.$getState(deviceId + ".rssi")];
                case 2:
                    rssiState = _c.sent();
                    if (!(rssiState == null ||
                        (rssiState.val !== peripheral.rssi && // only save changes
                            rssiState.lc + rssiUpdateInterval < Date.now())) // and dont update too frequently
                    ) return [3 /*break*/, 4]; // and dont update too frequently
                    global_1.Global.log("updating rssi state for " + deviceId, "debug");
                    return [4 /*yield*/, adapter.$setState(deviceId + ".rssi", peripheral.rssi, true)];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    context = plugin.createContext(peripheral);
                    objects = plugin.defineObjects(context);
                    values = plugin.getValues(context);
                    // We can't do anything without objects
                    if (objects == null)
                        return [2 /*return*/];
                    // Ensure the device object exists
                    return [4 /*yield*/, iobroker_objects_1.extendDevice(deviceId, peripheral, objects.device)];
                case 5:
                    // Ensure the device object exists
                    _c.sent();
                    if (!(objects.channels != null && objects.channels.length > 0)) return [3 /*break*/, 7];
                    return [4 /*yield*/, Promise.all(objects.channels.map(function (c) { return iobroker_objects_1.extendChannel(deviceId + "." + c.id, c); }))];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7: 
                // Ensure the state objects exist. These might change in every advertisement frame
                return [4 /*yield*/, Promise.all(objects.states.map(function (s) { return iobroker_objects_1.extendState(deviceId + "." + s.id, s); }))];
                case 8:
                    // Ensure the state objects exist. These might change in every advertisement frame
                    _c.sent();
                    if (!(values != null)) return [3 /*break*/, 15];
                    global_1.Global.log(deviceId + " > got values: " + JSON.stringify(values), "debug");
                    _a = 0, _b = Object.keys(values);
                    _c.label = 9;
                case 9:
                    if (!(_a < _b.length)) return [3 /*break*/, 14];
                    stateId = _b[_a];
                    iobStateId = adapter.namespace + "." + deviceId + "." + stateId;
                    return [4 /*yield*/, adapter.$getObject(iobStateId)];
                case 10:
                    if (!((_c.sent()) != null)) return [3 /*break*/, 12];
                    global_1.Global.log("setting state " + iobStateId, "debug");
                    return [4 /*yield*/, adapter.$setStateChanged(iobStateId, values[stateId], true)];
                case 11:
                    _c.sent();
                    return [3 /*break*/, 13];
                case 12:
                    global_1.Global.log("skipping state " + iobStateId + " because the object does not exist", "warn");
                    _c.label = 13;
                case 13:
                    _a++;
                    return [3 /*break*/, 9];
                case 14: return [3 /*break*/, 16];
                case 15:
                    global_1.Global.log(deviceId + " > got no values", "debug");
                    _c.label = 16;
                case 16: return [2 /*return*/];
            }
        });
    });
}
var isScanning = false;
function startScanning() {
    if (isScanning)
        return;
    adapter.setState("info.connection", true, true);
    noble.on("discover", onDiscover);
    global_1.Global.log("starting scan for services " + JSON.stringify(services));
    noble.startScanning(services, true);
    isScanning = true;
}
function stopScanning() {
    if (!isScanning)
        return;
    noble.removeAllListeners("discover");
    global_1.Global.log("stopping scan");
    noble.stopScanning();
    adapter.setState("info.connection", false, true);
    isScanning = false;
}
// Unbehandelte Fehler tracen
process.on("unhandledRejection", function (r) {
    adapter.log.error("unhandled promise rejection: " + r);
});
process.on("uncaughtException", function (err) {
    adapter.log.error("unhandled exception:" + err.message);
    adapter.log.error("> stack: " + err.stack);
    process.exit(1);
});
