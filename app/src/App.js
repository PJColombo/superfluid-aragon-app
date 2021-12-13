import { useAragonApi } from '@aragon/api-react';
import { Button, GU, Header, IconAdd, IconArrowDown, Main, SyncIndicator } from '@aragon/ui';
import React from 'react';
import { useAppLogic } from './app-logic';
import Balances from './components/Balances';
import { CreateFlow } from './components/SidePanels';
import { IdentityProvider } from './providers/IdentityManager';

function App() {
  const { guiStyle, appState } = useAragonApi();
  const { superTokens } = appState;
  const { actions, isSyncing, newFlowPanel, newDepositPanel } = useAppLogic();
  const { updateFlow } = actions;
  const { appearance } = guiStyle;

  return (
    <Main theme={appearance} assetsUrl="./aragon-ui">
      <IdentityProvider>
        <SyncIndicator visible={isSyncing} shift={50} />
        {!isSyncing && (
          <React.Fragment>
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
            <Balances superTokens={superTokens} />
            <CreateFlow
              panelState={newFlowPanel}
              superTokens={superTokens}
              onCreateFlow={updateFlow}
            />
          </React.Fragment>
        )}
      </IdentityProvider>
    </Main>
  );
}

export default App;
