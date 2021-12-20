import { useAragonApi } from '@aragon/api-react';
import { Bar, Button, GU, Header, IconAdd, IconCoin, Main, SyncIndicator } from '@aragon/ui';
import React from 'react';
import { useAppLogic } from './app-logic';
import Balances from './components/Balances';
import Flows from './components/Flows';
import { Convert, UpdateFlow, Transfer } from './components/SidePanels';
import { IdentityProvider } from './providers/IdentityManager';

function App() {
  const { guiStyle, appState } = useAragonApi();
  const { superTokens, flows } = appState;
  const { actions, isSyncing, convertPanel, createFlowPanel, transferPanel } = useAppLogic();
  const { deleteFlow, updateFlow } = actions;
  const { appearance } = guiStyle;
  const disableButtons = isSyncing;

  return (
    <Main theme={appearance} assetsUrl="./aragon-ui">
      <IdentityProvider>
        <SyncIndicator visible={isSyncing} shift={50} />
        {
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
                    disabled={disableButtons}
                  />
                </div>
              }
            />
            <div
              css={`
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: ${3 * GU}px;
              `}
            >
              <Button
                label="Convert Tokens"
                icon={<IconCoin />}
                display="label"
                onClick={convertPanel.requestOpen}
                disabled={disableButtons}
              />
              <Button
                label="Transfer"
                onClick={transferPanel.requestOpen}
                disabled={disableButtons}
              />
            </div>

            <Balances superTokens={superTokens} />
            <Flows
              flows={flows}
              tokens={superTokens}
              onUpdateFlow={createFlowPanel.requestOpen}
              onDeleteFlow={deleteFlow}
            />
            <Convert panelState={convertPanel} superTokens={superTokens} onConvert={() => {}} />
            <UpdateFlow
              panelState={createFlowPanel}
              superTokens={superTokens}
              onUpdateFlow={updateFlow}
            />
            <Transfer panelState={transferPanel} superTokens={superTokens} />
          </React.Fragment>
        }
      </IdentityProvider>
    </Main>
  );
}

export default App;
