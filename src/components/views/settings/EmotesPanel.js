/*
Copyright 2018 ponies.im

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

import React from 'react';

import * as sdk from '../../../index';
import {MatrixClientPeg} from '../../../MatrixClientPeg';
import { _t } from '../../../languageHandler';
import Field from "../elements/Field";
import AccessibleButton from "../elements/AccessibleButton";

export default class EmotesPanel extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            "emotes": {},
            "saving": false,
        }
        this.emoteIndex = 0;

        this._unmounted = false;
        this._loadEmotes = this._loadEmotes.bind(this);
        this._saveEmotes = this._saveEmotes.bind(this);
        this._addEmote = this._addEmote.bind(this);
        this._removeEmote = this._removeEmote.bind(this);
        this._onTextChange = this._onTextChange.bind(this);
        this._onFileSelected = this._onFileSelected.bind(this);
    }

    componentWillUnmount() {
        this._unmounted = true;
    }

    componentDidMount() {
        this._loadEmotes();
    }

    _saveEmotes() {
        this.setState({"saving": true});

        // Extract emotes from state
        let emotes = {
            short: {}
        };

        for (const emoteIndex in Object.keys(this.state.emotes)) {
            const emote = this.state.emotes[emoteIndex];

            // Strip any empty emotes
            if (emote.short == "" && emote.url == "") {
                continue;
            }

            // Re-add the colons to the shortcode
            let fullShortCode = this._addColonsToEmoteName(emote.short);
            emotes.short[fullShortCode] = emote.url;
        }

        console.log("Saving emotes:", emotes);

        MatrixClientPeg.get().setAccountData('im.ponies.user_emotes', emotes).catch((e) => {
            console.error("Failed setting emotes:", e);
            this.setState({"saving": false});
            throw e;
        });

        // Saving emotes is too fast, so pad this out a bit for a nicer UX
        setTimeout(() => {
            this.setState({"saving": false})
        }, 750);

        return ;
    }

    _loadEmotes() {
        // Load user's emotes from their server account data
        const event = MatrixClientPeg.get().getAccountData('im.ponies.user_emotes');
        if (event && !event.error && event.event.type == 'im.ponies.user_emotes' && event.event.content) {
            const emotes = event.event.content;

            console.log("Got emotes from account data:", emotes)

            // Check if there are any existing emotes
            if (!emotes || !emotes.short) {
                return;
            }

            // Build a new map of emotes to put in state
            //
            // We can't use the emote shortcode as a key as it can change,
            // instead we assign boring old increasing ints
            //
            // Example resulting form of `this.state.emotes`:
            // {
            //  0: {"short": "foo", "url": "mxc://a/b"},
            //  1: {"short": "bar", "url": "mxc://a/c"},
            //  ...
            // }
            let cleanEmotes = {};
            Object.keys(emotes.short).forEach((emoteShortcode) => {
                // Remove the : from each emote name
                // We don't want users to have to type `:` before and after
                // their shortcuts when setting them
                const cleanShortcode = this._removeColonsFromEmoteName(emoteShortcode)

                cleanEmotes[this.emoteIndex++] = {
                    "short": cleanShortcode,
                    "url": emotes.short[emoteShortcode],
                };
            });

            this.setState({"emotes": cleanEmotes})
            console.log("this.state.emotes set up as:", this.state.emotes)
        }
    }

    _removeColonsFromEmoteName(emoteName) {
        return emoteName.substring(1, emoteName.length - 1);
    }

    _addColonsToEmoteName(emoteName) {
        return ":" + emoteName + ":";
    }

    _addEmote() {
        // Check whether there's already an available empty emote
        for (const emote in Object.values(this.state.emotes)) {
            if (emote.short == "" && emote.url == "") {
                return;
            }
        }

        // Create a new, empty emote
        let emotes = this.state.emotes;
        emotes[this.emoteIndex++] = {
            "short": "",
            "url": "",
        };

        this.setState({"emotes": emotes});
    }

    _removeEmote(emoteIndex) {
        // Delete an emote
        let emotes = this.state.emotes;
        delete emotes[emoteIndex];

        this.setState({"emotes": emotes});
    }

    _onTextChange(type, emoteIndex, ev) {
        let emotes = this.state.emotes;
        emotes[emoteIndex][type] = ev.target.value;

        this.setState({"emotes": emotes});
    }

    _onFileSelected(emoteIndex) {
        // Upload a selected file and set the returned URL as
        // an MXC URL
        return (ev) => {
            const file = ev.target.files[0];
            
            return MatrixClientPeg.get().uploadContent(file).then((url) => {
                let emotes = this.state.emotes;
                emotes[emoteIndex].url = url;

                return this.setState({"emotes": emotes});
            });
        }
    }

    render() {
        const Emote = sdk.getComponent('elements.Emote');
        const emoteRows = [];
        const click = (id) => {
            return () => {
                document.getElementById(id).click();
            };
        };
        for (const emoteIndex of Object.keys(this.state.emotes)) {
            let emote = this.state.emotes[emoteIndex];
            let i = 0;
            emoteRows.push(
                <tr className="mx_EmotesPanel_entry" key={emoteIndex}>
                    <td className="mx_EmotesPanel_name" key={i++}>
                        <Field value={emote.short}
                            key={i}
                            onChange={this._onTextChange.bind(this, "short", emoteIndex)}
                        />
                    </td>
                    <td className="mx_EmotesPanel_mxc" key={i++}>
                        <Field value={emote.url}
                            key={i}
                            onChange={this._onTextChange.bind(this, "mxc", emoteIndex)}
                        />
                    </td>
                    <td key={i++}>
                        <Emote url={emote.url} alt={emote.short} key={i} />
                    </td>
                    <td className="mx_EmotesPanel_file" key={i++}>
                        <button className="mx_textButton mx_AccessibleButton"
                            onClick={click("mx_EmotesPanel_entry_file_"+emote.short)}>
                                { _t("Upload Image") }
                        </button>
                        <input
                            id={"mx_EmotesPanel_entry_file_"+emote.short}
                            type="file"
                            accept="image/*"
                            onChange={this._onFileSelected(emoteIndex)} />
                    </td>
                    <td key={i++}>
                        <div onClick={this._removeEmote.bind(this, emoteIndex)}
                            className="mx_EditableItem_delete"
                            title={ _t("Remove") }
                            role="button" />
                    </td>
                </tr>
            );
        }

        return (
            <div className="mx_SettingsTab mx_EmotesUserSettingsTab">
                <div className="mx_SettingsTab_heading">{ _t("Emotes") }</div>
                <div>
                    <p>
                        { _t(`Add a new emote with 'New Emote'. Use the 'Upload Image' button to set emote images.
                        You can use emotes in a room by typing a ':' and then typing in the emote name.`) }
                    </p>
                    <table>
                        <thead>
                            <tr>
                                <th>{ _t('Name') }</th>
                                <th>{ _t('Image URL') }</th>
                                <th>{ _t('Preview') }</th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            { emoteRows }
                        </tbody>
                    </table>
                    <AccessibleButton onClick={this._saveEmotes} kind="primary"
                                      disabled={this.state.saving}>
                        { this.state.saving ? _t("Saving") : _t("Save") }
                    </AccessibleButton>
                    <AccessibleButton onClick={this._addEmote} kind="primary">
                        { _t("New Emote") }
                    </AccessibleButton>
                </div>
            </div>
        );
    }
}
