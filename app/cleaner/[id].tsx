{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\froman\fcharset0 Times-Roman;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;}
{\*\expandedcolortbl;;\cssrgb\c0\c0\c0;}
\paperw5760\paperh8640\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs24 \cf0 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 \
import \{ View, Text \} from 'react-native';\
import \{ useLocalSearchParams \} from 'expo-router';\
\
export default function CleanerDetail() \{\
  const \{ id \} = useLocalSearchParams();\
  return (\
    <View style=\{\{ flex: 1, justifyContent: 'center', alignItems: 'center' \}\}>\
      <Text>Cleaner Details for ID: \{id\}</Text>\
    </View>\
  );\
\}}