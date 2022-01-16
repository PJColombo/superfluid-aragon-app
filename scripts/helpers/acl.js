module.exports.ANY_ENTITY = '0x' + 'F'.repeat(40);

module.exports.createAppPermission = (acl, appAddress, appPermission) =>
  acl.createPermission(this.ANY_ENTITY, appAddress, appPermission, this.ANY_ENTITY);
