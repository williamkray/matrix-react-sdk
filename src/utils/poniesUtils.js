/*
Copyright 2019 ponies.im

Licensed under the Cooperative Software License (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License with this software or at

    http://coinsh.red/csl/csl.txt

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

import { ColorAdjuster } from "./color";
import SettingsStore from "../settings/SettingsStore";

let colorAdjuster = {};

function getColorAdjuster(base) {
	if (!colorAdjuster[base]) {
		colorAdjuster[base] = new ColorAdjuster(base, 1);
	}
	return colorAdjuster[base];
}

export function discordColorToCss(color) {
	const colorHex = color.toString(16);
	const pad = "#000000";
	const htmlColor = pad.substring(0, pad.length - colorHex.length) + colorHex;
	return htmlColor;
}

export function discordColorToCssAdjust(color, base) {
	const c = discordColorToCss(color);
	if (SettingsStore.isFeatureEnabled("feature_no_colour_adjust")) {
		return c;
	}
	const adjuster = getColorAdjuster(base.toLowerCase());
	const res = adjuster.process(c);
	if (res === null) {
		return color;
	}
	return res;
}
