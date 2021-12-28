export const All = Symbol('ALL_FLOWS');

// FLow states
export const Open = Symbol('OPEN_FLOW');
export const Close = Symbol('CLOSE_FLOW');

const AVAILABLE_FLOW_STATES = [
  [All, 'All'],
  [Open, 'Open'],
  [Close, 'Close'],
];

export const FLOW_STATES = AVAILABLE_FLOW_STATES.map(([state]) => state);
export const FLOW_STATES_LABELS = AVAILABLE_FLOW_STATES.map(([_, label]) => label);

// Flow types
export const Incoming = Symbol('INCOMING_FLOW');
export const Outgoing = Symbol('OUTGOING_FLOW');

const AVAILABLE_FLOW_TYPES = [
  [All, 'All'],
  [Incoming, 'Incoming'],
  [Outgoing, 'Outgoing'],
];

export const FLOW_TYPES = AVAILABLE_FLOW_TYPES.map(([type]) => type);
export const FLOW_TYPES_LABELS = AVAILABLE_FLOW_TYPES.map(([_, label]) => label);
