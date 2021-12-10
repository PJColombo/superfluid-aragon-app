import { BlockTag } from '@ethersproject/abstract-provider';
import { Contract, Event } from '@ethersproject/contracts';
import isEqual from 'lodash.isequal';

export const getEvents = async (
  contract: Contract,
  eventName: string,
  blockNumber?: BlockTag | string,
  topicFilters: any[] = []
): Promise<Event[]> => {
  const filterFn = contract.filters[eventName];

  if (!filterFn) {
    throw new Error(`Event ${eventName} not found in contract`);
  }

  const filters = filterFn(...topicFilters);
  const events = await contract.queryFilter(filters, blockNumber, blockNumber);

  if (!events.length) {
    throw new Error(`Event ${eventName} not found ${blockNumber ? `in block ${blockNumber}` : ''}`);
  }

  return events;
};

export const getEventsByArgs = async (
  contract: Contract,
  eventName: string,
  argValues: any[],
  blockNumber?: BlockTag | string
): Promise<Event[]> => {
  const events = await getEvents(contract, eventName, blockNumber);

  return events.filter((event) => isEqual(event.args.slice(0, argValues.length), argValues));
};
