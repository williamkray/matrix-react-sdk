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
import ReactDOM from "react-dom";
import PropTypes from 'prop-types';
import classNames from 'classnames';

import sdk from '../../../index';
import MatrixClientPeg from '../../../MatrixClientPeg';
import { _t } from '../../../languageHandler';
import Modal from '../../../Modal';

export default class EmotesPanel extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.emotes = {};

        this._unmounted = false;
        this._loadEmotes = this._loadEmotes.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._addEmote = this._addEmote.bind(this);
        this._onFileSelected = this._onFileSelected.bind(this);
        this._tryUpdate = this._tryUpdate.bind(this);
    }

    componentWillUnmount() {
        this._unmounted = true;
    }

    componentDidMount() {
        this._loadEmotes();
    }

    _tryUpdate() {
        return MatrixClientPeg.get().setAccountData('im.ponies.user_emotes', this.emotes).catch((e) => {
            console.error("Failed setting emotes");
            throw new Error("Failed to set emotes");
        });
    }

    _loadEmotes() {
        const event = MatrixClientPeg.get().getAccountData('im.ponies.user_emotes');
        if (event && !event.error && event.event.type == 'im.ponies.user_emotes' && event.event.content) {
            this.emotes = event.event.content;
        }
    }

    _updateEmotesFromDOM() {
        const node = ReactDOM.findDOMNode(this);
        const shortEmotes = {};
        Array.from(node.getElementsByClassName("mx_EmotesPanel_entry")).forEach((n) => {
            const name = n
                .getElementsByClassName("mx_EmotesPanel_name")[0]
                .getElementsByClassName("mx_EditableText")[0].textContent;
            if (name) {
                const mxc = n
                .getElementsByClassName("mx_EmotesPanel_mxc")[0]
                .getElementsByClassName("mx_EditableText")[0].textContent;
                shortEmotes[name] = mxc;
            }
        });
        this.emotes.short = shortEmotes;
    }

    _onSubmit() {
        this._updateEmotesFromDOM();
        return this._tryUpdate().then(() => {
            this.forceUpdate();
        });
    }

    _addEmote() {
        this._updateEmotesFromDOM();
        this.emotes.short[""] = "";
        return this._tryUpdate().then(() => {
            this.forceUpdate();
        });
    }

    _onFileSelected(emote) {
        return (ev) => {
            const file = ev.target.files[0];
            
            return MatrixClientPeg.get().uploadContent(file).then((url) => {
                this._updateEmotesFromDOM();
                console.log(url);
                this.emotes.short[emote] = url;
                return this._tryUpdate();
            }).then(() => {
                this.forceUpdate();
            });
        }
    }

    render() {
        this._loadEmotes();
        const EditableTextContainer = sdk.getComponent('elements.EditableTextContainer');
        const Emote = sdk.getComponent('elements.Emote');
        const emoteEntries = [];
        const click = (id) => {
            return () => {
                document.getElementById(id).click();
            };
        };
        if (this.emotes && this.emotes.short) {
            for (const emote of Object.keys(this.emotes.short)) {
                let i = 0;
                emoteEntries.push(
                    <tr className="mx_EmotesPanel_entry" key={emote}>
                        <td className="mx_EmotesPanel_name" key={i++}>
                            <EditableTextContainer
                                initialValue={emote}
                                onSubmit={this._onSubmit}
                                blurToSubmit={true}
                                key={i} />
                        </td>
                        <td className="mx_EmotesPanel_mxc" key={i++}>
                            <EditableTextContainer
                                initialValue={this.emotes.short[emote]}
                                onSubmit={this._onSubmit}
                                blurToSubmit={true}
                                key={i} />
                        </td>
                        <td className="mx_EmotesPanel_file" key={i++}>
                            <button className="mx_textButton mx_AccessibleButton" onClick={click("mx_EmotesPanel_entry_file_"+emote)}>{"Chose File"}</button>
                            <input
                                id={"mx_EmotesPanel_entry_file_"+emote}
                                type="file"
                                accept="image/*"
                                onChange={this._onFileSelected(emote)} />
                        </td>
                        <td key={i++}>
                            <Emote url={this.emotes.short[emote]} alt={emote} key={i} />
                        </td>
                    </tr>
                );
            }
        }

        return (
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>{ _t('Emote Name') }</th>
                            <th>{ _t('Emote MXC URL') }</th>
                            <th></th>
                            <th>{ _t('Emote Preview') }</th>
                        </tr>
                    </thead>
                    <tbody>
                        { emoteEntries }
                    </tbody>
                </table>
                <button key="addEmote" onClick={this._addEmote} className="mx_textButton mx_AccessibleButton">{ _t("Add Emote") }</button>
            </div>
        );
    }
}
