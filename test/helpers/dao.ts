import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { getEvents } from '.';
import { ACL, DAOFactory, Kernel } from '../../typechain';

export const newDaoFactory = async (): Promise<DAOFactory> => {
  const Kernel = await ethers.getContractFactory('Kernel');
  const ACL = await ethers.getContractFactory('ACL');
  const EVMScriptRegistryFactory = await ethers.getContractFactory('EVMScriptRegistryFactory');
  const DAOFactory = await ethers.getContractFactory('DAOFactory');

  const kernelBase = await Kernel.deploy(true);
  const aclBase = await ACL.deploy();
  const registryFactory = await EVMScriptRegistryFactory.deploy();

  return await DAOFactory.deploy(kernelBase.address, aclBase.address, registryFactory.address);
};

export const newDao = async (
  root: SignerWithAddress,
  daoFactory: DAOFactory
): Promise<[Kernel, ACL]> => {
  const rootAddress = await root.getAddress();

  const receipt = await (await daoFactory.newDAO(rootAddress)).wait();
  const [event] = await getEvents(daoFactory, 'DeployDAO', receipt.blockNumber);

  const kernel = await ethers.getContractAt('Kernel', event.args.dao, root);
  const APP_MANAGER_ROLE = await kernel.APP_MANAGER_ROLE();
  const acl = await ethers.getContractAt('ACL', await kernel.acl());

  // Grant the root account permission to install apps in the DAO
  await acl.createPermission(rootAddress, kernel.address, APP_MANAGER_ROLE, rootAddress);

  return [kernel, acl];
};
