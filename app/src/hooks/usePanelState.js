import { noop } from '@aragon/ui';
import { useCallback, useMemo, useState } from 'react';

// Handles the state of a panel.
// Pass `onTransitionEnd` to the same SidePanel prop.
export default function usePanelState({ onDidOpen = noop, onDidClose = noop } = {}) {
  const [visible, setVisible] = useState(false);
  const [params, setParams] = useState();

  // `didOpen` is set to `true` when the opening transition of the panel has
  // ended, `false` otherwise. This is useful to know when to start inner
  // transitions in the panel content.
  const [didOpen, setDidOpen] = useState(false);

  const requestOpen = useCallback(
    params => {
      setVisible(true);
      setDidOpen(false);
      if (params) {
        setParams(params);
      }
    },
    [setVisible, setDidOpen]
  );

  const requestClose = useCallback(() => {
    setVisible(false);
    setParams({});
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

  return useMemo(() => ({ params, requestOpen, requestClose, visible, didOpen, onTransitionEnd }), [
    params,
    requestOpen,
    requestClose,
    visible,
    didOpen,
    onTransitionEnd,
  ]);
}
