/*
Copyright 2020 Tulir Asokan <tulir@maunium.net>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from "react";
import { _td } from "../../../languageHandler";
import * as sdk from "../../../index";
import MImageBody from './MImageBody';
import MFileBody from "./MFileBody";

export default class MImageReplyBody extends MImageBody {
    onClick(ev) {
        ev.preventDefault();
    }

    wrapImage(contentUrl, children) {
        return children;
    }

    // Don't show "Download this_file.png ..."
    getFileBody() {
        return MFileBody.prototype.presentableTextForFile.call(this, this.props.mxEvent.getContent());
    }

    render() {
        if (this.state.error !== null) {
            return super.render();
        }

        const content = this.props.mxEvent.getContent();

        const contentUrl = this._getContentUrl();
        const thumbnail = this._messageContent(contentUrl, this._getThumbUrl(), content);
        const fileBody = this.getFileBody();
        const SenderProfile = sdk.getComponent('messages.SenderProfile');
        const sender = <SenderProfile onClick={this.onSenderProfileClick}
                                      mxEvent={this.props.mxEvent}
                                      enableFlair={false}
                                      text={_td('%(senderName)s sent an image')} />;

        return <div className="mx_MImageReplyBody">
            <div className="mx_MImageReplyBody_thumbnail">{ thumbnail }</div>
            <div className="mx_MImageReplyBody_sender">{ sender }</div>
            <div className="mx_MImageReplyBody_filename">{ fileBody }</div>
        </div>;
    }
}
