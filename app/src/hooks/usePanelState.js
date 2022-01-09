import { noop } from '@aragon/ui';
import { useCallback, useMemo, useState } from 'react';

// Handles the state of a panel.
// Pass `onTransitionEnd` to the same SidePanel prop.
export default function usePanelState({ onDidOpen = noop, onDidClose = noop } = {}) {
  const [visible, setVisible] = useState(false);
  const [presetParams, setPresetParams] = useState();
  const [waitTxPanel, setWaitTxPanel] = useState(false);

  // `didOpen` is set to `true` when the opening transition of the panel has
  // ended, `false` otherwise. This is useful to know when to start inner
  // transitions in the panel content.
  const [didOpen, setDidOpen] = useState(false);

  const requestOpen = useCallback(
    params => {
      setVisible(true);
      setDidOpen(false);
      if (params) {
        setPresetParams(params);
      }
    },
    [setVisible, setDidOpen]
  );

  const requestClose = useCallback(() => {
    setVisible(false);
    setWaitTxPanel(false);
    // Wait a little bit for the side panel close animation to end
    setTimeout(() => setPresetParams({}), 1000);
  }, [setVisible]);

  // To be passed to the onTransitionEnd prop of SidePanel.
  const onTransitionEnd = useCallback(
    opened => {
      if (opened) {
        onDidOpen();
        setDidOpen(true);
      } else {
        onDidClose();
        setDidOpen(false);
      }
    },
    [onDidClose, onDidOpen, setDidOpen]
  );

  const requestTransaction = useCallback((fn, params) => {
    setWaitTxPanel(true);
    fn(...params)
      .then(() => setWaitTxPanel(false))
      .catch(() => setWaitTxPanel(false));
  }, []);

  return useMemo(
    () => ({
      presetParams,
      requestOpen,
      requestClose,
      requestTransaction,
      visible,
      didOpen,
      waitTxPanel,
      onTransitionEnd,
    }),
    [
      presetParams,
      requestOpen,
      requestClose,
      requestTransaction,
      visible,
      didOpen,
      waitTxPanel,
      onTransitionEnd,
    ]
  );
}
