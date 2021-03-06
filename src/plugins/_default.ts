﻿import { Global as _ } from "../lib/global";
import { ChannelObjectDefinition, DeviceObjectDefinition, PeripheralObjectStructure, Plugin, StateObjectDefinition } from "./plugin";

function parseData(raw: Buffer): string | number {
	if (raw.length === 1) {
		// single byte
		return raw[0];
	} else {
		// Output hex value
		return raw.toString("hex");
	}
}

const plugin: Plugin = {
	name: "_default",
	description: "Handles all peripherals that are not handled by other plugins",

	// Just handle all services we receive already
	advertisedServices: [],
	isHandling: (p) => true,

	// No special context necessary. Return the peripheral, so it gets passed to the other methods.
	createContext: (peripheral: BLE.Peripheral) => peripheral,

	defineObjects: (peripheral: BLE.Peripheral): PeripheralObjectStructure => {

		const deviceObject: DeviceObjectDefinition = { // no special definitions neccessary
			common: null,
			native: null,
		};

		const channelId = `services`;
		const channelObject: ChannelObjectDefinition = {
			id: channelId,
			common: {
				// common
				name: "Advertised services",
				role: "info",
			},
			native: null,
		};

		const stateObjects: StateObjectDefinition[] = [];
		for (const entry of peripheral.advertisement.serviceData) {
			const uuid = entry.uuid;
			const stateId = `${channelId}.${uuid}`;

			stateObjects.push({
				id: stateId,
				common: {
					role: "value",
					name: "Advertised service " + uuid, // TODO: create readable names
					desc: "",
					type: "mixed",
					read: true,
					write: false,
				},
				native: null,
			});
		}

		return {
			device: deviceObject,
			channels: [channelObject],
			states: stateObjects,
		};

	},

	getValues: (peripheral: BLE.Peripheral) => {
		const ret = {};
		for (const entry of peripheral.advertisement.serviceData) {
			const uuid = entry.uuid;
			const stateId = `services.${uuid}`;
			// remember the transmitted data
			ret[stateId] = parseData(entry.data);
			_.log(`_default: ${peripheral.address} > got data ${ret[stateId]} for ${uuid}`, "debug");
		}

		return ret;
	},
};

export = plugin;
