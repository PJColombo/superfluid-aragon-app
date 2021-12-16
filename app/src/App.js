import { useAragonApi } from '@aragon/api-react';
import { Bar, Button, GU, Header, IconAdd, IconCoin, Main, SyncIndicator } from '@aragon/ui';
import React from 'react';
import { useAppLogic } from './app-logic';
import Balances from './components/Balances';
import { Convert, CreateFlow, Transfer } from './components/SidePanels';
import { IdentityProvider } from './providers/IdentityManager';

function App() {
  const { guiStyle, appState } = useAragonApi();
  const { superTokens, inFlows, outFlows } = appState;
  const { actions, isSyncing, convertPanel, createFlowPanel, transferPanel } = useAppLogic();
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
                    onClick={createFlowPanel.requestOpen}
                    label="Create Flow"
                    icon={<IconAdd />}
                  />
                </div>
              }
            />
            <Bar
              primary={
                <Button
                  label="Convert Tokens"
                  icon={<IconCoin />}
                  display="label"
                  onClick={convertPanel.requestOpen}
                />
              }
              secondary={<Button label="Transfer" onClick={transferPanel.requestOpen} />}
            />
            <Balances superTokens={superTokens} />
            <Convert panelState={convertPanel} superTokens={superTokens} onConvert={() => {}} />
            <CreateFlow
              panelState={createFlowPanel}
              superTokens={superTokens}
              onCreateFlow={updateFlow}
            />
            <Transfer panelState={transferPanel} superTokens={superTokens} />
          </React.Fragment>
        )}
      </IdentityProvider>
    </Main>
  );
}

export default App;
