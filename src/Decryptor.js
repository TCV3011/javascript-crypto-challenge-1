const nacl = require('libsodium-wrappers')

module.exports = async (key) => {
  await nacl.ready

  if (!key) throw 'no key'

  return Object.freeze({
    decrypt: (ciphertext, nonce) => {
      if (!ciphertext || !nonce) throw 'one or more arguments are undefined'

      return nacl.crypto_secretbox_open_easy(ciphertext, nonce, key)
    }
  })
}
