import React, {useCallback, useMemo} from 'react'
import {StyleProp, TextStyle, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgent} from '#/state/session'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import * as TempDmChatDefs from '#/temp/dm/defs'

export function MessageItem({
  item,
  next,
}: {
  item: TempDmChatDefs.MessageView
  next: TempDmChatDefs.MessageView | TempDmChatDefs.DeletedMessage | null
}) {
  const t = useTheme()
  const {getAgent} = useAgent()

  const isFromSelf = item.sender?.did === getAgent().session?.did

  const isNextFromSelf =
    TempDmChatDefs.isMessageView(next) &&
    next.sender?.did === getAgent().session?.did

  const isLastInGroup = useMemo(() => {
    // if the next message is from a different sender, then it's the last in the group
    if (isFromSelf ? !isNextFromSelf : isNextFromSelf) {
      return true
    }

    // or, if there's a 10 minute gap between this message and the next
    if (TempDmChatDefs.isMessageView(next)) {
      const thisDate = new Date(item.sentAt)
      const nextDate = new Date(next.sentAt)

      const diff = nextDate.getTime() - thisDate.getTime()

      // 10 minutes
      return diff > 10 * 60 * 1000
    }

    return true
  }, [item, next, isFromSelf, isNextFromSelf])

  return (
    <View>
      <View
        style={[
          a.py_sm,
          a.px_lg,
          a.my_2xs,
          a.rounded_md,
          isFromSelf ? a.self_end : a.self_start,
          {
            maxWidth: '65%',
            backgroundColor: isFromSelf
              ? t.palette.primary_500
              : t.palette.contrast_50,
            borderRadius: 17,
          },
          isFromSelf
            ? {borderBottomRightRadius: isLastInGroup ? 2 : 17}
            : {borderBottomLeftRadius: isLastInGroup ? 2 : 17},
        ]}>
        <Text
          style={[
            a.text_md,
            a.leading_snug,
            isFromSelf && {color: t.palette.white},
          ]}>
          {item.text}
        </Text>
      </View>
      <Metadata
        message={item}
        isLastInGroup={isLastInGroup}
        style={isFromSelf ? a.text_right : a.text_left}
      />
    </View>
  )
}

function Metadata({
  message,
  isLastInGroup,
  style,
}: {
  message: TempDmChatDefs.MessageView
  isLastInGroup: boolean
  style: StyleProp<TextStyle>
}) {
  const t = useTheme()
  const {_} = useLingui()

  const relativeTimestamp = useCallback(
    (timestamp: string) => {
      const date = new Date(timestamp)
      const now = new Date()

      const time = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date)

      const diff = now.getTime() - date.getTime()

      // under 1 minute
      if (diff < 1000 * 60) {
        return _(msg`Now`)
      }

      // in the last day
      if (now.getDate() === date.getDate()) {
        return time
      }

      // if yesterday
      if (diff < 24 * 60 * 60 * 1000 && now.getDate() - date.getDate() === 1) {
        return _(msg`Yesterday, ${time}`)
      }

      return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      }).format(date)
    },
    [_],
  )

  if (!isLastInGroup) {
    return null
  }

  return (
    <TimeElapsed timestamp={message.sentAt} timeToString={relativeTimestamp}>
      {({timeElapsed}) => (
        <Text
          style={[
            t.atoms.text_contrast_medium,
            a.text_xs,
            a.mt_xs,
            a.mb_lg,
            style,
          ]}>
          {timeElapsed}
        </Text>
      )}
    </TimeElapsed>
  )
}
