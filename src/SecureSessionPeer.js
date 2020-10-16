const nacl = require('libsodium-wrappers')

module.exports = async (peer) => {
  await nacl.ready
}
