const nacl = require('libsodium-wrappers')
const Encryptor = require('./Encryptor')
const Decryptor = require('./Decryptor')

module.exports = async (peer = null) => {
  await nacl.ready
  const keyPair = nacl.crypto_kx_keypair()
  const sk = keyPair.privateKey
  let encryptor, decryptor
  getServerKeyPair = function (server, client) {
    return nacl.crypto_kx_server_session_keys(
      server.publicKey,
      sk,
      client.publicKey
    )
  }
  getClientKeyPair = function (server, client) {
    return nacl.crypto_kx_client_session_keys(
      client.publicKey,
      sk,
      server.publicKey
    )
  }
  class SecureSessionPeer {
    constructor() {
      this.publicKey = keyPair.publicKey
      this.privateKey
    }
    encrypt(msg) {
      const nonce = nacl.randombytes_buf(nacl.crypto_secretbox_NONCEBYTES)
      const ciphertext = encryptor.encrypt(msg, nonce)
      return { ciphertext, nonce }
    }
    decrypt(ciphertext, nonce) {
      decryptor.decrypt(ciphertext, nonce)
    }
    send(peerMsg) {}
    receive() {}
    async pair(current, other) {
      let key
      if (peer) {
        // if peer is given, this instance is server
        key = getClientKeyPair(other, current)
        encryptor = await Encryptor(key.sharedTx)
        decryptor = await Decryptor(key.sharedRx)
      } else {
        // instance is client
        key = getServerKeyPair(current, other)
        encryptor = await Encryptor(key.sharedTx)
        decryptor = await Decryptor(key.sharedRx)
      }
    }
  }

  let secureSessionPeerInstance = new SecureSessionPeer()

  if (peer) {
    await secureSessionPeerInstance.pair(secureSessionPeerInstance, peer)
    await peer.pair(peer, secureSessionPeerInstance)
  }

  return Object.freeze(secureSessionPeerInstance)
}
