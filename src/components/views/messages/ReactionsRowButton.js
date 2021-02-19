/*
Copyright 2019 New Vector Ltd
Copyright 2019 ponies.im

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Additionally, original modifications by ponies.im are licensed under the CSL.
See https://coinsh.red/csl/csl.txt or the provided CSL.txt for additional information.
These modifications may only be redistributed and used within the terms of 
the Cooperative Software License as distributed with this project.
*/

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {MatrixClientPeg} from '../../../MatrixClientPeg';
import * as sdk from '../../../index';
import { _t } from '../../../languageHandler';
import { formatCommaSeparatedList } from '../../../utils/FormattingUtils';
import dis from "../../../dispatcher/dispatcher";

export default class ReactionsRowButton extends React.PureComponent {
    static propTypes = {
        // The event we're displaying reactions for
        mxEvent: PropTypes.object.isRequired,
        // The reaction content / key / emoji
        content: PropTypes.string.isRequired,
        // The count of votes for this key
        count: PropTypes.number.isRequired,
        // A Set of Martix reaction events for this key
        reactionEvents: PropTypes.object.isRequired,
        // A possible Matrix event if the current user has voted for this type
        myReactionEvent: PropTypes.object,
    }

    constructor(props) {
        super(props);

        this.state = {
            tooltipVisible: false,
        };
    }

    onClick = (ev) => {
        const { mxEvent, myReactionEvent, content } = this.props;
        if (myReactionEvent) {
            MatrixClientPeg.get().redactEvent(
                mxEvent.getRoomId(),
                myReactionEvent.getId(),
            );
        } else {
            MatrixClientPeg.get().sendEvent(mxEvent.getRoomId(), "m.reaction", {
                "m.relates_to": {
                    "rel_type": "m.annotation",
                    "event_id": mxEvent.getId(),
                    "key": content,
                },
            });
            dis.dispatch({action: "message_sent"});
        }
    };

    onMouseOver = () => {
        this.setState({
            // To avoid littering the DOM with a tooltip for every reaction,
            // only render it on first use.
            tooltipRendered: true,
            tooltipVisible: true,
        });
    }

    onMouseLeave = () => {
        this.setState({
            tooltipVisible: false,
        });
    }

    render() {
        const ReactionsRowButtonTooltip =
            sdk.getComponent('messages.ReactionsRowButtonTooltip');
        const { mxEvent, content, count, reactionEvents, myReactionEvent } = this.props;

        let contentElem = content;
        if (content.startsWith("mxc://")) {
            const size = 18;
            const url = MatrixClientPeg.get().mxcUrlToHttp(
                content,
                200,
                size,
                "scale",
            );
            contentElem = <img
                src={url}
                height={size}
            />;
        }

        const classes = classNames({
            mx_ReactionsRowButton: true,
            mx_ReactionsRowButton_selected: !!myReactionEvent,
        });

        let tooltip;
        if (this.state.tooltipRendered) {
            tooltip = <ReactionsRowButtonTooltip
                mxEvent={this.props.mxEvent}
                content={content}
                reactionEvents={reactionEvents}
                visible={this.state.tooltipVisible}
            />;
        }

        const room = MatrixClientPeg.get().getRoom(mxEvent.getRoomId());
        let label;
        if (room) {
            const senders = [];
            for (const reactionEvent of reactionEvents) {
                const member = room.getMember(reactionEvent.getSender());
                const name = member ? member.name : reactionEvent.getSender();
                senders.push(name);
            }
            label = _t(
                "<reactors/><reactedWith> reacted with %(content)s</reactedWith>",
                {
                    content,
                },
                {
                    reactors: () => {
                        return formatCommaSeparatedList(senders, 6);
                    },
                    reactedWith: (sub) => {
                        if (!content) {
                            return null;
                        }
                        return sub;
                    },
                },
            );
        }

        const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
        return <AccessibleButton
            className={classes}
            aria-label={label}
            onClick={this.onClick}
            onMouseOver={this.onMouseOver}
            onMouseLeave={this.onMouseLeave}
        >
            <span className="mx_ReactionsRowButton_content" aria-hidden="true">
                {contentElem}
            </span>
            <span className="mx_ReactionsRowButton_count" aria-hidden="true">
                {count}
            </span>
            {tooltip}
        </AccessibleButton>;
    }
}
