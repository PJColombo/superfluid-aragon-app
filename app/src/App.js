import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Header, Main, SyncIndicator, Text, textStyle } from '@aragon/ui'

function App() {
  const { appState } = useAragonApi()
  const { isSyncing } = appState

  return (
    <Main>
      {isSyncing && <SyncIndicator />}
      <Header
        primary="Superfluid Finance"
        secondary={
          <Text
            css={`
              ${textStyle('title2')}
            `}
          >
            Secondary text
          </Text>
        }
      />
    </Main>
  )
}

export default App
