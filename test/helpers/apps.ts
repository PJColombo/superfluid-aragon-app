import { Kernel } from '../../typechain';
import { getEvents } from './events';

export const installNewApp = async (
  dao: Kernel,
  appId: string,
  baseAppAddress: string
): Promise<string> => {
  const receipt = await (
    await dao['newAppInstance(bytes32,address,bytes,bool)'](appId, baseAppAddress, '0x', false)
  ).wait();
  const [event] = await getEvents(dao, 'NewAppProxy', receipt.blockNumber);

  return event.args.proxy;
};
