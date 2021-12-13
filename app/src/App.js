import { useAragonApi } from '@aragon/api-react';
import { Button, GU, Header, IconAdd, IconArrowDown, Main, SyncIndicator } from '@aragon/ui';
import React from 'react';
import { useAppLogic } from './app-logic';
import { NewDeposit, CreateFlow } from './components/SidePanels';
import { IdentityProvider } from './providers/IdentityManager';

function App() {
  const { guiStyle, appState } = useAragonApi();
  const { superTokens } = appState;
  const { actions, isSyncing, newFlowPanel, newDepositPanel } = useAppLogic();
  const { updateFlow } = actions;
  const { appearance } = guiStyle;

  console.log(appState);

  return (
    <Main theme={appearance} assetsUrl="./aragon-ui">
      <IdentityProvider>
        <SyncIndicator visible={isSyncing} shift={50} />
        <Header
          primary="Flow Finance"
          secondary={
            <div
              css={`
                display: flex;
                gap: ${3 * GU}px;
              `}
            >
              <Button
                mode="strong"
                onClick={newDepositPanel.requestOpen}
                label="Deposit"
                icon={<IconArrowDown />}
              />
              <Button
                mode="strong"
                onClick={newFlowPanel.requestOpen}
                label="Create Flow"
                icon={<IconAdd />}
              />
            </div>
          }
        />
        <NewDeposit panelState={newDepositPanel} />
        <CreateFlow panelState={newFlowPanel} superTokens={superTokens} onCreateFlow={updateFlow} />
      </IdentityProvider>
    </Main>
  );
}

export default App;
