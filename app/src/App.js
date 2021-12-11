import { useAragonApi } from '@aragon/api-react';
import { Header, Main, SyncIndicator, Text, textStyle } from '@aragon/ui';
import React from 'react';

function App() {
  const { appState, network } = useAragonApi();
  const { isSyncing } = appState;
  console.log(appState);
  return (
    <Main>
      {isSyncing && <SyncIndicator />}
      <Header
        primary="Flow Finance"
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
  );
}

export default App;
