export const All = Symbol('ALL_FLOWS');
export const Incoming = Symbol('INCOMING_FLOW');
export const Outgoing = Symbol('OUTGOING_FLOW');

const AVAILABLE_FLOW_TYPES = [
  [All, 'All'],
  [Incoming, 'Incoming'],
  [Outgoing, 'Outgoing'],
];

export const FLOW_TYPES = AVAILABLE_FLOW_TYPES.map(([type]) => type);
export const FLOW_TYPES_LABELS = AVAILABLE_FLOW_TYPES.map(([_, label]) => label);
