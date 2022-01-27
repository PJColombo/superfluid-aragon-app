import { useAragonApi } from '@aragon/api-react';
import { Button, GU, Header, IconAdd, IconCoin, IconSwap, Main, SyncIndicator } from '@aragon/ui';
import React from 'react';
import { useAppLogic } from './app-logic';
import SuperTokens from './components/SuperTokens';
import Flows from './components/Flows';
import GlobalErrorHandler from './components/GlobalErrorHandler';
import IncomingFlowsWarnings from './components/IncomingFlowsWarnings';
import { Convert, UpdateFlow, Transfer } from './components/SidePanels';
import { IdentityProvider } from './providers/IdentityManager';

function App() {
  const { appState, connectedAccount, guiStyle } = useAragonApi();
  const { flows, sendersSuperTokens, superTokens, isSyncing } = appState;
  const { actions, convertPanel, createFlowPanel, transferPanel } = useAppLogic();
  const { convertTokens, deleteFlow, deposit, updateFlow, withdraw } = actions;
  const { appearance } = guiStyle;
  const senderSuperTokens = sendersSuperTokens[connectedAccount];

  return (
    <Main theme={appearance} assetsUrl="./aragon-ui">
      <GlobalErrorHandler>
        <IdentityProvider>
          <SyncIndicator visible={isSyncing} shift={50} />
          <Header
            primary="Superfluid"
            secondary={
              <div
                css={`
                  display: flex;
                  gap: ${2 * GU}px;
                `}
              >
                <Button label="Convert" icon={<IconCoin />} onClick={convertPanel.requestOpen} />
                <Button label="Transfer" icon={<IconSwap />} onClick={transferPanel.requestOpen} />
                <Button
                  mode="strong"
                  label="Create Flow"
                  icon={<IconAdd />}
                  onClick={createFlowPanel.requestOpen}
                />
              </div>
            }
          />
          {Boolean(senderSuperTokens && senderSuperTokens.length) && (
            <IncomingFlowsWarnings
              incomingFlowTokens={senderSuperTokens}
              superTokens={superTokens}
            />
          )}
          <SuperTokens superTokens={superTokens} onDeposit={transferPanel.requestOpen} />
          <Flows
            flows={flows}
            tokens={superTokens}
            onUpdateFlow={createFlowPanel.requestOpen}
            onDeleteFlow={deleteFlow}
          />
          <Convert panelState={convertPanel} superTokens={superTokens} onConvert={convertTokens} />
          <UpdateFlow
            flows={flows}
            panelState={createFlowPanel}
            superTokens={superTokens}
            onUpdateFlow={updateFlow}
          />
          <Transfer
            panelState={transferPanel}
            superTokens={superTokens}
            onDeposit={deposit}
            onWithdraw={withdraw}
          />
        </IdentityProvider>
      </GlobalErrorHandler>
    </Main>
  );
}

export default App;
