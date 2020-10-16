const nacl = require('libsodium-wrappers')

module.exports = async (key) => {
  await nacl.ready

  if (!key) throw 'no key'

  return Object.freeze({
    encrypt: (msg, nonce) => {
      if (!msg || !nonce) throw 'one or more arguments are undefined'

      return nacl.crypto_secretbox_easy(msg, nonce, key)
    }
  })
}
