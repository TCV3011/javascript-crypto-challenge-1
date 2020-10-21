const nacl = require('libsodium-wrappers')
const Encryptor = require('./Encryptor')
const Decryptor = require('./Decryptor')

let SecureSessionPeer = async (peer = null) => {
  // wait until nacl (libsodium) is ready
  await nacl.ready

  // declare variables
  let currentPeer = {}
  let otherPeer = {}
  let encryptor, decryptor
  global.message = {}
  const { publicKey, privateKey } = nacl.crypto_kx_keypair()

  // set publicKey of current peer
  currentPeer.publicKey = publicKey

  if (peer) {
    // if peer is given, current peer is server
    // and other peer is client
    otherPeer = peer
    // generate server session keys
    sharedKeys = nacl.crypto_kx_server_session_keys(
      publicKey,
      privateKey,
      otherPeer.publicKey
    )
    // initialize encryptor & decryptor
    encryptor = await Encryptor(sharedKeys.sharedTx)
    decryptor = await Decryptor(sharedKeys.sharedRx)

    // generate client session keys
    await otherPeer.createClientKeys(publicKey)
  }

  // encrypt function
  currentPeer.encrypt = (msg) => {
    const nonce = nacl.randombytes_buf(nacl.crypto_secretbox_NONCEBYTES)
    const ciphertext = encryptor.encrypt(msg, nonce)
    return { ciphertext, nonce }
  }

  // decrypt function
  currentPeer.decrypt = (ciphertext, nonce) => {
    return decryptor.decrypt(ciphertext, nonce)
  }

  // send function
  currentPeer.send = (msg) => {
    global.message = currentPeer.encrypt(msg)
  }

  // receive function
  currentPeer.receive = () => {
    return currentPeer.decrypt(global.message.ciphertext, global.message.nonce)
  }

  // function to create client session keys
  currentPeer.createClientKeys = async (serverPublicKey) => {
    // generate client session keys
    sharedKeys = nacl.crypto_kx_client_session_keys(
      publicKey,
      privateKey,
      serverPublicKey
    )
    // initialize encryptor & decryptor
    encryptor = await Encryptor(sharedKeys.sharedTx)
    decryptor = await Decryptor(sharedKeys.sharedRx)
  }

  // prevents the modification of existing property attributes and values,
  // and prevents the addition of new properties.
  return Object.freeze(currentPeer)
}
// export the secureSessionPeer object
module.exports = SecureSessionPeer
