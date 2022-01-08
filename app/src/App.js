import { useAragonApi } from '@aragon/api-react';
import { Button, GU, Header, IconAdd, IconCoin, IconSwap, Main, SyncIndicator } from '@aragon/ui';
import React from 'react';
import { useAppLogic } from './app-logic';
import Balances from './components/Balances';
import Flows from './components/Flows';
import GlobalErrorHandler from './components/GlobalErrorHandler';
import { Convert, UpdateFlow, Transfer } from './components/SidePanels';
import { IdentityProvider } from './providers/IdentityManager';

function App() {
  const { appState, guiStyle } = useAragonApi();
  const { superTokens, flows } = appState;
  const { actions, cfa, isSyncing, convertPanel, createFlowPanel, transferPanel } = useAppLogic();
  const { convertTokens, deleteFlow, deposit, updateFlow } = actions;
  const { appearance } = guiStyle;

  return (
    <Main theme={appearance} assetsUrl="./aragon-ui">
      <GlobalErrorHandler>
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
                      gap: ${2 * GU}px;
                    `}
                  >
                    <Button
                      label="Convert"
                      icon={<IconCoin />}
                      onClick={convertPanel.requestOpen}
                    />
                    <Button
                      icon={<IconSwap />}
                      label="Transfer"
                      onClick={transferPanel.requestOpen}
                    />
                    <Button
                      mode="strong"
                      onClick={createFlowPanel.requestOpen}
                      label="Create Flow"
                      icon={<IconAdd />}
                    />
                  </div>
                }
              />

              <Balances superTokens={superTokens} />
              <Flows
                flows={flows}
                tokens={superTokens}
                onUpdateFlow={createFlowPanel.requestOpen}
                onDeleteFlow={deleteFlow}
              />
              <Convert
                panelState={convertPanel}
                superTokens={superTokens}
                onConvert={convertTokens}
              />
              <UpdateFlow
                cfa={cfa}
                flows={flows}
                panelState={createFlowPanel}
                superTokens={superTokens}
                onUpdateFlow={updateFlow}
              />
              <Transfer panelState={transferPanel} superTokens={superTokens} onDeposit={deposit} />
            </React.Fragment>
          }
        </IdentityProvider>
      </GlobalErrorHandler>
    </Main>
  );
}

export default App;
